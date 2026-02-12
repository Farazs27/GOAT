'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type Konva from 'konva';
import { useDsdStore } from '@/lib/smile-design/store';
import { DsdCanvas } from './canvas/dsd-canvas';
import { LandmarkPanel } from './panels/landmark-panel';
import { MeasurementPanel } from './panels/measurement-panel';
import { CalibrationPanel } from './panels/calibration-panel';
import { VersionHistoryPanel } from './panels/version-history-panel';
import { ExportPanel } from './panels/export-panel';
import { CanvasToolbar } from './toolbar/canvas-toolbar';
import {
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Image, Box, ChevronDown, ChevronRight, HelpCircle, Send,
  Landmark, Crosshair, Ruler, Clock, Download, Sparkles,
} from 'lucide-react';

const StlViewer = dynamic(
  () => import('./three/stl-viewer').then((m) => ({ default: m.StlViewer })),
  { ssr: false },
);

interface DsdWorkspaceProps {
  designTitle?: string;
  patientName?: string;
}

/* ── Collapsible Section ── */
function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)] flex-1 text-left">{title}</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        }
      </button>
      {open && <div className="px-2 pb-3 overflow-hidden w-full">{children}</div>}
    </div>
  );
}

/* ── Guide Panel (inline) ── */
function GuideContent() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  const sections = [
    {
      key: 'workflow',
      title: 'Werkwijze',
      items: [
        { num: '1', title: 'Foto uploaden', desc: 'Upload een frontale smile-foto van de patiënt.' },
        { num: '2', title: 'Auto-detectie', desc: 'Klik "Auto-detectie" in het Landmarks-paneel. AI plaatst alle punten automatisch.' },
        { num: '3', title: 'Fijn-afstemmen', desc: 'Versleep landmarks handmatig voor nauwkeurigheid.' },
        { num: '4', title: 'Kalibratie', desc: 'Stel een bekende afstand in (bv. tandbreedte) voor mm-metingen.' },
        { num: '5', title: 'Analyseren', desc: 'Bekijk automatische metingen, proporties en afwijkingen.' },
        { num: '6', title: 'Exporteren', desc: 'Sla op als PNG, PDF of JSON. Versiegeschiedenis wordt bewaard.' },
      ],
    },
    {
      key: 'tools',
      title: 'Toolbar functies',
      items: [
        { icon: '✋', title: 'Verschuiven', desc: 'Sleep de foto om te pannen. Standaard modus.' },
        { icon: '🎯', title: 'Landmarks', desc: 'Selecteer een landmark-type en klik op de foto om te plaatsen.' },
        { icon: '⊕', title: 'Kalibratie', desc: 'Klik twee punten met bekende afstand voor mm-schaal.' },
        { icon: '🔍', title: 'Zoom', desc: 'Gebruik + / − knoppen of scroll om in/uit te zoomen.' },
        { icon: '↺', title: 'Reset', desc: 'Zet zoom en positie terug naar standaard.' },
      ],
    },
    {
      key: 'landmarks',
      title: 'Landmarks uitleg',
      items: [
        { color: '#3b82f6', title: 'Faciaal (blauw)', desc: 'Glabella, Nasion, Subnasale, Philtrum, Pogonion, Pupillen, Mondhoeken.' },
        { color: '#22c55e', title: 'Dentaal (groen)', desc: 'Incisale randen, Gingivale margins, Contact punt, Cuspidaat tips.' },
      ],
    },
    {
      key: 'measurements',
      title: 'Metingen uitleg',
      items: [
        { title: 'Middellijn deviatie', desc: 'Hoek en mm-verschil tussen faciale en dentale middellijn.' },
        { title: 'Incisaal vlak', desc: 'Hoek van het incisale vlak t.o.v. de interpupillaire lijn.' },
        { title: 'Breedte ratio 11:21', desc: 'Verhouding van de twee centrale snijtanden.' },
        { title: 'Centrale dominantie', desc: 'Percentage dat de centralen breder zijn dan lateralen.' },
        { title: 'RED proportie', desc: 'Recurring Esthetic Dental ratio (ideaal ≈70%).' },
        { title: 'Gouden snede', desc: 'Afwijking t.o.v. de ideale φ = 1.618 verhouding.' },
      ],
    },
    {
      key: 'layers',
      title: 'Lagen & Weergave',
      items: [
        { icon: '🔵', title: 'Landmarks', desc: 'Toon/verberg de landmark-punten op de foto.' },
        { icon: '🔷', title: 'Afgeleide lijnen', desc: 'Middellijn, interpupillaire lijn, smile-boog, etc.' },
        { icon: '🟢', title: 'Metingen', desc: 'Toon/verberg de meting-labels op de foto.' },
      ],
    },
    {
      key: 'shortcuts',
      title: 'Bediening',
      items: [
        { icon: '🖱️', title: 'Scrollen', desc: 'Zoomen (in/uit)' },
        { icon: '👆', title: 'Slepen', desc: 'Foto verplaatsen (pan-modus)' },
        { icon: '📍', title: 'Klikken', desc: 'Landmark plaatsen (landmark-modus)' },
        { icon: '↔️', title: 'Landmark slepen', desc: 'Versleep een punt om positie aan te passen' },
      ],
    },
  ];

  return (
    <div className="space-y-1">
      {sections.map((section) => {
        const isOpen = openSection === section.key;
        return (
          <div key={section.key}>
            <button
              onClick={() => toggle(section.key)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-all"
            >
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{section.title}</span>
              <ChevronDown className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {isOpen && (
              <div className="px-2 pb-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                  >
                    {'num' in item ? (
                      <span className="flex-shrink-0 w-4.5 h-4.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-[9px] font-bold flex items-center justify-center mt-0.5 w-[18px] h-[18px]">
                        {item.num}
                      </span>
                    ) : 'color' in item ? (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: item.color }} />
                    ) : 'icon' in item ? (
                      <span className="flex-shrink-0 text-[10px] mt-0.5">{item.icon}</span>
                    ) : (
                      <span className="flex-shrink-0 w-1 h-1 rounded-full bg-[var(--text-tertiary)] mt-2" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-[var(--text-primary)] leading-tight">{item.title}</p>
                      <p className="text-[9px] text-[var(--text-tertiary)] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── AI Chat Bar ── */
function AiChatBar() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: message.trim() }]);
    setMessage('');
    // AI backend will be connected later
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: 'AI-analyse wordt binnenkort beschikbaar.' }]);
    }, 500);
  };

  return (
    <div className="px-4 pb-3 pt-2">
      {/* Messages */}
      {messages.length > 0 && (
        <div className="mb-2 max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-[11px] px-3 py-1.5 rounded-xl max-w-[85%] ${
                msg.role === 'user'
                  ? 'ml-auto bg-[var(--accent-primary)]/15 text-[var(--text-primary)]'
                  : 'mr-auto bg-white/[0.04] text-[var(--text-secondary)]'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Vraag aan AI over dit ontwerp..."
            className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/40 focus:ring-1 focus:ring-[var(--accent-primary)]/20 transition-all"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--accent-primary)]/40" />
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-2.5 rounded-xl btn-liquid-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Main Workspace ── */
export default function DsdWorkspace({ designTitle = '', patientName = '' }: DsdWorkspaceProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [stlUrl, setStlUrl] = useState<string | null>(null);
  const [stlFileName, setStlFileName] = useState<string | null>(null);
  const canvasStageRef = useRef<Konva.Stage>(null);

  const designId = useDsdStore((s) => s.designId);

  const handleStlUploaded = useCallback((url: string, fileName: string) => {
    setStlUrl(url);
    setStlFileName(fileName);
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ═══ LEFT PANEL ═══ */}
      {leftOpen && (
        <div className="w-56 flex-shrink-0 h-full border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-y-auto overflow-x-hidden min-w-0">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Ontwerp</span>
            <button
              onClick={() => setLeftOpen(false)}
              className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <PanelLeftClose className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <Section title="Handleiding" icon={HelpCircle} defaultOpen={true}>
            <GuideContent />
          </Section>

          <Section title="Landmarks" icon={Landmark} defaultOpen={true}>
            <LandmarkPanel />
          </Section>
        </div>
      )}

      {/* ═══ CENTER ═══ */}
      <div className="flex-1 relative bg-[var(--bg-primary)] flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top controls */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          {/* Left panel toggle */}
          {!leftOpen && (
            <button
              onClick={() => setLeftOpen(true)}
              className="p-2 rounded-xl glass-light border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          )}

          {/* View mode */}
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl glass-light border border-white/[0.08]">
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === '2d'
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              2D Foto
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D STL
            </button>
          </div>
        </div>

        {/* Right panel toggle */}
        {!rightOpen && (
          <button
            onClick={() => setRightOpen(true)}
            className="absolute top-3 right-3 z-10 p-2 rounded-xl glass-light border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
          >
            <PanelRightOpen className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        )}

        {/* Canvas / 3D Viewer */}
        <div className="flex-1 relative min-h-0">
          {viewMode === '2d' ? (
            <DsdCanvas externalStageRef={canvasStageRef} />
          ) : (
            designId && (
              <StlViewer
                stlUrl={stlUrl}
                designId={designId}
                onStlUploaded={handleStlUploaded}
              />
            )
          )}
        </div>

        {/* Bottom area: Toolbar + AI Chat */}
        <div className="relative z-10 flex-shrink-0">
          {/* Toolbar */}
          {viewMode === '2d' && (
            <div className="flex justify-center py-2">
              <CanvasToolbar />
            </div>
          )}

          {/* AI Chat Bar */}
          <div className="border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
            <AiChatBar />
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      {rightOpen && (
        <div className="w-56 flex-shrink-0 h-full border-l border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-y-auto overflow-x-hidden min-w-0">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Analyse</span>
            <button
              onClick={() => setRightOpen(false)}
              className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <PanelRightClose className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <Section title="Kalibratie" icon={Crosshair} defaultOpen={false}>
            <CalibrationPanel />
          </Section>

          <Section title="Metingen" icon={Ruler} defaultOpen={true}>
            <MeasurementPanel />
          </Section>

          <Section title="Versies" icon={Clock} defaultOpen={false}>
            <VersionHistoryPanel />
          </Section>

          <Section title="Export" icon={Download} defaultOpen={false}>
            <ExportPanel stageRef={canvasStageRef} designTitle={designTitle} patientName={patientName} />
          </Section>
        </div>
      )}
    </div>
  );
}
