'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PerioToothData } from '@/../../packages/shared-types/src/odontogram';
import IndicatorRows from '../perio/indicator-rows';
import ProbingPanel from '../perio/probing-panel';
import VoiceInputButton from '../perio/voice-input';
import PerioLineGraph from '../perio/line-graph';
import { getPerioSummary } from '../perio/perio-classification';

const Tooth3D = dynamic(() => import('../three/tooth-3d'), { ssr: false });

interface PerioModeProps {
  teeth: Array<{ toothNumber: number; status: string }>;
  perioData: Record<string, PerioToothData>;
  onPerioDataChange: (toothNumber: number, data: PerioToothData) => void;
  selectedTooth: number | null;
  onToothSelect: (toothNumber: number) => void;
  patientId?: string;
  sessionNote?: string;
  onSessionNoteChange?: (note: string) => void;
}

interface HistoricalChart {
  id: string;
  chartData: { teeth: Record<string, PerioToothData> };
  sessionNote: string | null;
  createdAt: string;
  authorName: string;
}

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const UPPER_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT];
const LOWER_TEETH = [...LOWER_RIGHT, ...LOWER_LEFT];
const ALL_TEETH_ORDER = [...UPPER_TEETH, ...LOWER_TEETH];

function createEmptyPerioData(): PerioToothData {
  const emptySide = () => ({
    probingDepth: [0, 0, 0] as [number, number, number],
    gingivalMargin: [0, 0, 0] as [number, number, number],
    bleeding: [false, false, false] as [boolean, boolean, boolean],
    plaque: [false, false, false] as [boolean, boolean, boolean],
    pus: [false, false, false] as [boolean, boolean, boolean],
    tartar: [false, false, false] as [boolean, boolean, boolean],
  });
  return {
    buccal: emptySide(),
    palatal: emptySide(),
    mobility: 0,
    furcation: 0,
  };
}

const DEPTH_COLOR_MAP: Record<string, string> = {
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
};

const DEPTH_BG_MAP: Record<string, string> = {
  green: 'bg-emerald-500/20',
  amber: 'bg-amber-500/20',
  red: 'bg-red-500/20',
};

const STAGE_COLOR_MAP: Record<string, string> = {
  'Gezond': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Stage I': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Stage II': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Stage III': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Stage IV': 'bg-red-500/20 text-red-400 border-red-500/30',
};

function getDepthLevel(d: number): string {
  if (d <= 3) return 'green';
  if (d <= 5) return 'amber';
  return 'red';
}

function ProbingDepthRow({
  teeth,
  perioData,
  side,
  selectedTooth,
}: {
  teeth: number[];
  perioData: Record<string, PerioToothData>;
  side: 'buccal' | 'palatal';
  selectedTooth: number | null;
}) {
  return (
    <div className="flex items-center">
      <span className="w-20 text-[10px] font-semibold text-slate-500 text-right pr-3 shrink-0 uppercase tracking-wider">
        Diepte
      </span>
      <div className="flex">
        {teeth.map((fdi) => {
          const data = perioData[String(fdi)];
          const depths = data?.[side]?.probingDepth ?? [0, 0, 0];
          const isSelected = selectedTooth === fdi;
          return (
            <div
              key={fdi}
              className={`flex items-center justify-center gap-[2px] py-0.5 ${
                isSelected ? 'bg-blue-500/10 rounded' : ''
              }`}
              style={{ width: 42 }}
            >
              {depths.map((d: number, i: number) => {
                const level = getDepthLevel(d);
                const colorClass = DEPTH_COLOR_MAP[level];
                const bgClass = d > 0 ? DEPTH_BG_MAP[level] : '';
                return (
                  <span
                    key={i}
                    className={`text-[10px] font-bold w-3.5 text-center rounded-sm ${colorClass} ${bgClass}`}
                  >
                    {d}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeethRow({
  teeth,
  allTeeth,
  perioData,
  selectedTooth,
  onToothSelect,
}: {
  teeth: number[];
  allTeeth: Array<{ toothNumber: number; status: string }>;
  perioData: Record<string, PerioToothData>;
  selectedTooth: number | null;
  onToothSelect: (fdi: number) => void;
}) {
  const statusMap = useMemo(() => {
    const m: Record<number, string> = {};
    allTeeth.forEach((t) => (m[t.toothNumber] = t.status));
    return m;
  }, [allTeeth]);

  return (
    <div className="flex items-center">
      <span className="w-20 shrink-0" />
      <div className="flex">
        {teeth.map((fdi) => {
          const isSelected = selectedTooth === fdi;
          const data = perioData[String(fdi)];
          const isMissing = data?.missing === true;
          const isImplant = data?.implant === true;

          if (isMissing) {
            return (
              <div
                key={fdi}
                className="flex flex-col items-center justify-center"
                style={{ width: 42, height: 60 }}
              >
                <div className="w-8 h-12 border border-dashed border-slate-600/40 rounded-md" />
              </div>
            );
          }

          if (isImplant) {
            return (
              <div
                key={fdi}
                className={`flex flex-col items-center cursor-pointer transition-all duration-150 rounded-md ${
                  isSelected
                    ? 'bg-blue-500/20 ring-1 ring-blue-400/50 scale-105'
                    : 'hover:bg-slate-700/30'
                }`}
                style={{ width: 42 }}
                onClick={() => onToothSelect(fdi)}
              >
                <svg width={38} height={60} viewBox="0 0 38 60">
                  {/* Implant crown */}
                  <rect x={10} y={2} width={18} height={16} rx={3} fill="#94a3b8" opacity={0.5} />
                  {/* Abutment */}
                  <rect x={14} y={18} width={10} height={6} fill="#64748b" opacity={0.6} />
                  {/* Screw body */}
                  <line x1={19} y1={24} x2={19} y2={56} stroke="#64748b" strokeWidth={3} />
                  {/* Thread marks */}
                  {[28, 33, 38, 43, 48].map((y) => (
                    <line key={y} x1={14} y1={y} x2={24} y2={y} stroke="#94a3b8" strokeWidth={1} />
                  ))}
                </svg>
              </div>
            );
          }

          return (
            <div
              key={fdi}
              className={`flex flex-col items-center cursor-pointer transition-all duration-150 rounded-md ${
                isSelected
                  ? 'bg-blue-500/20 ring-1 ring-blue-400/50 scale-105'
                  : 'hover:bg-slate-700/30'
              }`}
              style={{ width: 42 }}
              onClick={() => onToothSelect(fdi)}
            >
              <Tooth3D
                fdi={fdi}
                view="side"
                status={statusMap[fdi] || 'PRESENT'}
                isSelected={isSelected}
                onClick={() => onToothSelect(fdi)}
                width={38}
                height={60}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToothNumberRow({
  teeth,
  selectedTooth,
}: {
  teeth: number[];
  selectedTooth: number | null;
}) {
  return (
    <div className="flex items-center">
      <span className="w-20 shrink-0" />
      <div className="flex">
        {teeth.map((fdi) => {
          const isSelected = selectedTooth === fdi;
          return (
            <div
              key={fdi}
              className={`text-[11px] font-bold text-center transition-colors ${
                isSelected
                  ? 'text-blue-400'
                  : 'text-slate-400'
              }`}
              style={{ width: 42 }}
            >
              {fdi}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JawLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 ml-20">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {children}
      </span>
      <div className="flex-1 h-px bg-slate-700/50" />
    </div>
  );
}

function ClassificationBar({ perioData }: { perioData: Record<string, PerioToothData> }) {
  const summary = useMemo(() => getPerioSummary(perioData), [perioData]);
  const stageClass = STAGE_COLOR_MAP[summary.stage] || STAGE_COLOR_MAP['Gezond'];

  return (
    <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-3 mb-4 flex items-center gap-4 flex-wrap">
      <div className={`px-3 py-1 rounded-xl border text-xs font-bold ${stageClass}`}>
        {summary.stage}
      </div>
      <div className="px-3 py-1 rounded-xl border border-slate-500/30 bg-slate-500/10 text-slate-300 text-xs font-bold">
        {summary.grade}
      </div>
      <div className="text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">BOP:</span> {summary.bopPercent}%
      </div>
      <div className="text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">Gem. diepte:</span> {summary.avgProbing} mm
      </div>
      <div className="text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">Max:</span> {summary.maxProbing} mm
      </div>
    </div>
  );
}

export default function PerioMode({
  teeth,
  perioData,
  onPerioDataChange,
  selectedTooth,
  onToothSelect,
  patientId,
  sessionNote = '',
  onSessionNoteChange,
}: PerioModeProps) {
  const [historicalCharts, setHistoricalCharts] = useState<HistoricalChart[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch historical charts
  useEffect(() => {
    if (!patientId) return;
    setLoadingHistory(true);
    const token = localStorage.getItem('access_token');
    fetch(`/api/patients/${patientId}/periodontal`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: HistoricalChart[]) => setHistoricalCharts(data))
      .catch(() => setHistoricalCharts([]))
      .finally(() => setLoadingHistory(false));
  }, [patientId]);

  const previousData = useMemo(() => {
    if (!selectedHistoryId) return undefined;
    const chart = historicalCharts.find((c) => c.id === selectedHistoryId);
    if (!chart?.chartData?.teeth) return undefined;
    return chart.chartData.teeth;
  }, [selectedHistoryId, historicalCharts]);

  const selectedData = selectedTooth
    ? perioData[String(selectedTooth)] ?? createEmptyPerioData()
    : null;

  const handleDataChange = useCallback(
    (data: PerioToothData) => {
      if (selectedTooth) {
        onPerioDataChange(selectedTooth, data);
      }
    },
    [selectedTooth, onPerioDataChange]
  );

  const handleVoiceResult = useCallback(
    (result: { tooth: number; values: [number, number, number, number, number, number] }) => {
      const { tooth, values } = result;
      onToothSelect(tooth);
      const existing = perioData[String(tooth)] ?? createEmptyPerioData();
      const newData = structuredClone(existing);
      newData.buccal.probingDepth = [values[0], values[1], values[2]];
      newData.palatal.probingDepth = [values[3], values[4], values[5]];
      onPerioDataChange(tooth, newData);
    },
    [perioData, onToothSelect, onPerioDataChange]
  );

  const navigateTooth = useCallback(
    (direction: 1 | -1) => {
      if (!selectedTooth) {
        onToothSelect(ALL_TEETH_ORDER[0]);
        return;
      }
      const idx = ALL_TEETH_ORDER.indexOf(selectedTooth);
      const next = idx + direction;
      if (next >= 0 && next < ALL_TEETH_ORDER.length) {
        onToothSelect(ALL_TEETH_ORDER[next]);
      }
    },
    [selectedTooth, onToothSelect]
  );

  return (
    <div className="flex h-full bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden print:bg-white print:border-none print:rounded-none">
      {/* Main chart area */}
      <div className={`flex-1 overflow-x-auto px-5 py-4 ${!selectedTooth ? 'flex flex-col items-center' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 print:mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-blue-500 rounded-full print:hidden" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest print:text-black">
              Parodontale Sondering
            </h2>
          </div>
          {/* Voice input */}
          <div className="print:hidden">
            <VoiceInputButton onResult={handleVoiceResult} />
          </div>
          {/* Historical comparison + Print */}
          <div className="flex items-center gap-3 print:hidden">
            {patientId && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Vergelijk met:</label>
                <select
                  value={selectedHistoryId}
                  onChange={(e) => setSelectedHistoryId(e.target.value)}
                  className="bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-lg text-[11px] text-slate-300 px-2 py-1 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 outline-none"
                  disabled={loadingHistory}
                >
                  <option value="">Geen vergelijking</option>
                  {historicalCharts.map((chart) => (
                    <option key={chart.id} value={chart.id}>
                      {new Date(chart.createdAt).toLocaleDateString('nl-NL')} - {chart.authorName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] rounded-xl transition-all"
            >
              Afdrukken
            </button>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-500 print:text-gray-600">0-3 mm</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-500 print:text-gray-600">4-5 mm</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-slate-500 print:text-gray-600">6+ mm</span>
            </span>
            {previousData && (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0 border-t-2 border-dashed border-blue-300" />
                <span className="text-slate-500">Vorig</span>
              </span>
            )}
          </div>
        </div>

        {/* Classification summary */}
        <ClassificationBar perioData={perioData} />

        {/* Upper jaw */}
        <div className="mb-4">
          <JawLabel>Bovenkaak</JawLabel>

          <div className="space-y-0.5">
            {/* Palatal indicators */}
            <IndicatorRows
              teeth={UPPER_TEETH}
              perioData={perioData}
              side="palatal"
            />

            {/* Palatal probing depths */}
            <ProbingDepthRow
              teeth={UPPER_TEETH}
              perioData={perioData}
              side="palatal"
              selectedTooth={selectedTooth}
            />

            {/* Palatal line graph */}
            <PerioLineGraph
              teeth={UPPER_TEETH}
              perioData={perioData}
              side="palatal"
              previousData={previousData}
            />

            {/* Upper teeth */}
            <TeethRow
              teeth={UPPER_TEETH}
              allTeeth={teeth}
              perioData={perioData}
              selectedTooth={selectedTooth}
              onToothSelect={onToothSelect}
            />

            {/* Tooth numbers */}
            <ToothNumberRow teeth={UPPER_TEETH} selectedTooth={selectedTooth} />

            {/* Buccal line graph */}
            <PerioLineGraph
              teeth={UPPER_TEETH}
              perioData={perioData}
              side="buccal"
              previousData={previousData}
            />

            {/* Buccal probing depths */}
            <ProbingDepthRow
              teeth={UPPER_TEETH}
              perioData={perioData}
              side="buccal"
              selectedTooth={selectedTooth}
            />

            {/* Buccal indicators */}
            <IndicatorRows
              teeth={UPPER_TEETH}
              perioData={perioData}
              side="buccal"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </div>

        {/* Lower jaw */}
        <div>
          <JawLabel>Onderkaak</JawLabel>

          <div className="space-y-0.5">
            {/* Buccal indicators */}
            <IndicatorRows
              teeth={LOWER_TEETH}
              perioData={perioData}
              side="buccal"
            />

            {/* Buccal probing depths */}
            <ProbingDepthRow
              teeth={LOWER_TEETH}
              perioData={perioData}
              side="buccal"
              selectedTooth={selectedTooth}
            />

            {/* Buccal line graph */}
            <PerioLineGraph
              teeth={LOWER_TEETH}
              perioData={perioData}
              side="buccal"
              previousData={previousData}
            />

            {/* Tooth numbers */}
            <ToothNumberRow teeth={LOWER_TEETH} selectedTooth={selectedTooth} />

            {/* Lower teeth */}
            <TeethRow
              teeth={LOWER_TEETH}
              allTeeth={teeth}
              perioData={perioData}
              selectedTooth={selectedTooth}
              onToothSelect={onToothSelect}
            />

            {/* Lingual line graph */}
            <PerioLineGraph
              teeth={LOWER_TEETH}
              perioData={perioData}
              side="palatal"
              previousData={previousData}
            />

            {/* Lingual probing depths */}
            <ProbingDepthRow
              teeth={LOWER_TEETH}
              perioData={perioData}
              side="palatal"
              selectedTooth={selectedTooth}
            />

            {/* Lingual indicators */}
            <IndicatorRows
              teeth={LOWER_TEETH}
              perioData={perioData}
              side="palatal"
            />
          </div>
        </div>

        {/* Session note */}
        {onSessionNoteChange && (
          <div className="mt-6 print:mt-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
              Sessie Notitie
            </label>
            <textarea
              value={sessionNote}
              onChange={(e) => onSessionNoteChange(e.target.value)}
              placeholder="Voeg een sessie notitie toe..."
              rows={3}
              className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl text-sm text-slate-300 placeholder-slate-600 px-4 py-3 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 outline-none resize-none print:border-gray-300 print:text-black"
            />
          </div>
        )}
      </div>

      {/* Right side probing panel */}
      {selectedTooth && selectedData && (
        <div className="print:hidden">
          <ProbingPanel
            toothNumber={selectedTooth}
            perioData={selectedData}
            onDataChange={handleDataChange}
            onNextTooth={() => navigateTooth(1)}
            onPrevTooth={() => navigateTooth(-1)}
            onClose={() => onToothSelect(selectedTooth)}
          />
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:bg-white, .print\\:bg-white * { visibility: visible; }
          nav, aside, [class*="sidebar"] { display: none !important; }
          ::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
  );
}
