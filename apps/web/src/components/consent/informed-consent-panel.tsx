'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { CONSENT_TEMPLATES } from '@/lib/consent-templates';
import {
  FileCheck,
  Plus,
  ChevronLeft,
  Check,
  Clock,
  XCircle,
  PenLine,
  Eraser,
  Eye,
  X,
  Loader2,
} from 'lucide-react';

interface ConsentForm {
  id: string;
  treatmentType: string;
  title: string;
  content: string;
  status: string;
  signedAt: string | null;
  signedByName: string | null;
  signatureData: string | null;
  createdAt: string;
}

interface Props {
  patientId: string;
  patientName: string;
}

// Template display names in Dutch
const TEMPLATE_LABELS: Record<string, string> = {
  EXTRACTION: 'Extractie',
  ROOT_CANAL: 'Wortelkanaalbehandeling',
  CROWN: 'Kroonplaatsing',
  BRIDGE: 'Brugconstructie',
  IMPLANT: 'Implantaat',
  FILLING: 'Vulling',
  WHITENING: 'Tanden bleken',
  ORTHODONTICS: 'Orthodontie',
  PERIODONTAL: 'Parodontologie',
  SURGERY: 'Chirurgie',
  ANESTHESIA: 'Verdoving',
  GENERAL: 'Algemeen',
};

// ─── Signature Canvas ───

function SignatureCanvas({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCoords = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getCoords(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4a9ade';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">Teken de handtekening van de patiënt hieronder</p>
      <div className="relative rounded-xl border-2 border-dashed border-blue-400/30 overflow-hidden bg-white/[0.04]">
        <canvas
          ref={canvasRef}
          width={800}
          height={250}
          className="w-full touch-none cursor-crosshair"
          style={{ height: 160 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-white/15">
              <PenLine className="w-4 h-4" />
              <p className="text-sm select-none">Teken hier de handtekening</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.1] text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-all">
          <Eraser className="w-3.5 h-3.5" /> Wissen
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.1] text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-all">
          <X className="w-3.5 h-3.5" /> Annuleren
        </button>
        <button
          disabled={!hasDrawn}
          onClick={() => onSave(canvasRef.current!.toDataURL('image/png'))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-xs text-white font-medium shadow-lg shadow-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <PenLine className="w-3.5 h-3.5" /> Ondertekenen
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───

export function InformedConsentPanel({ patientId, patientName }: Props) {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'templates' | 'signing' | 'viewing'>('list');
  const [activeForm, setActiveForm] = useState<ConsentForm | null>(null);
  const [signedByName, setSignedByName] = useState(patientName);
  const [submitting, setSubmitting] = useState(false);

  const fetchForms = useCallback(async () => {
    try {
      const res = await authFetch(`/api/consent?patientId=${patientId}`);
      if (res.ok) setForms(await res.json());
    } catch {}
    setLoading(false);
  }, [patientId]);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  const createFromTemplate = async (treatmentType: string) => {
    try {
      const res = await authFetch('/api/consent', {
        method: 'POST',
        body: JSON.stringify({ patientId, treatmentType }),
      });
      if (res.ok) {
        const form = await res.json();
        setActiveForm(form);
        setSignedByName(patientName);
        setView('signing');
      }
    } catch {}
  };

  const handleSign = async (signatureData: string) => {
    if (!activeForm || submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/consent/${activeForm.id}/sign`, {
        method: 'PATCH',
        body: JSON.stringify({ signatureData, signedByName }),
      });
      if (res.ok) {
        setView('list');
        setActiveForm(null);
        fetchForms();
      }
    } catch {}
    setSubmitting(false);
  };

  const deleteForm = async (id: string) => {
    try {
      const res = await authFetch(`/api/consent/${id}`, { method: 'DELETE' });
      if (res.ok) setForms(prev => prev.filter(f => f.id !== id));
    } catch {}
  };

  // ── Template picker ──
  if (view === 'templates') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('list')}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold text-white/90">Kies formulier</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CONSENT_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => createFromTemplate(key)}
              className="text-left p-3 glass rounded-xl border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06] transition-all group"
            >
              <p className="text-xs font-medium text-white/80 group-hover:text-white truncate">
                {TEMPLATE_LABELS[key] || key}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5 truncate">{template.title}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Signing view ──
  if (view === 'signing' && activeForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => { setView('list'); setActiveForm(null); }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold text-white/90 truncate">{activeForm.title}</h3>
        </div>

        {/* Consent text */}
        <div className="glass-light rounded-xl p-4 max-h-[300px] overflow-y-auto">
          <pre className="text-xs text-white/70 whitespace-pre-wrap font-sans leading-relaxed">
            {activeForm.content}
          </pre>
        </div>

        {/* Name input */}
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Naam patiënt</label>
          <input
            type="text"
            value={signedByName}
            onChange={(e) => setSignedByName(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/30 transition-all"
            placeholder="Volledige naam"
          />
        </div>

        {/* Signature canvas */}
        {submitting ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          </div>
        ) : (
          <SignatureCanvas
            onSave={handleSign}
            onCancel={() => { setView('list'); setActiveForm(null); }}
          />
        )}
      </div>
    );
  }

  // ── View signature ──
  if (view === 'viewing' && activeForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => { setView('list'); setActiveForm(null); }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold text-white/90 truncate">{activeForm.title}</h3>
        </div>

        <div className="glass-light rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            <span>Ondertekend door {activeForm.signedByName}</span>
          </div>
          <p className="text-[10px] text-white/30">
            {activeForm.signedAt && new Date(activeForm.signedAt).toLocaleString('nl-NL', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {activeForm.signatureData && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2">
              <img src={activeForm.signatureData} alt="Handtekening" className="w-full h-auto max-h-[120px] object-contain" />
            </div>
          )}
        </div>

        <div className="glass-light rounded-xl p-4 max-h-[250px] overflow-y-auto">
          <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed">
            {activeForm.content}
          </pre>
        </div>
      </div>
    );
  }

  // ── List view (default) ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white/90">Informed Consent</h3>
        </div>
        <button
          onClick={() => setView('templates')}
          className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Nieuw
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="h-10 w-10 mx-auto mb-3 text-white/10" />
          <p className="text-sm text-white/30">Geen toestemmingsformulieren</p>
          <p className="text-xs text-white/20 mt-1">Klik op &quot;Nieuw&quot; om er een toe te voegen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => (
            <div
              key={form.id}
              className="glass-light rounded-xl p-3 flex items-center gap-3 group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                form.status === 'SIGNED' ? 'bg-emerald-500/15' : form.status === 'REVOKED' ? 'bg-red-500/15' : 'bg-amber-500/15'
              }`}>
                {form.status === 'SIGNED' ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : form.status === 'REVOKED' ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">{form.title}</p>
                <p className="text-[10px] text-white/30">
                  {form.status === 'SIGNED' && form.signedAt
                    ? `Ondertekend ${new Date(form.signedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : form.status === 'REVOKED'
                      ? 'Ingetrokken'
                      : `Aangemaakt ${new Date(form.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
                  }
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {form.status === 'SIGNED' ? (
                  <button
                    onClick={() => { setActiveForm(form); setView('viewing'); }}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
                    title="Bekijk handtekening"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                ) : form.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => { setActiveForm(form); setSignedByName(patientName); setView('signing'); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <PenLine className="h-3 w-3" /> Ondertekenen
                    </button>
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Verwijderen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
