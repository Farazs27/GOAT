'use client';

import React, { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { PerioToothData } from '@/../../packages/shared-types/src/odontogram';
import IndicatorRows from '../perio/indicator-rows';
import ProbingPanel from '../perio/probing-panel';
import VoiceInputButton from '../perio/voice-input';

const Tooth3D = dynamic(() => import('../three/tooth-3d'), { ssr: false });

interface PerioModeProps {
  teeth: Array<{ toothNumber: number; status: string }>;
  perioData: Record<string, PerioToothData>;
  onPerioDataChange: (toothNumber: number, data: PerioToothData) => void;
  selectedTooth: number | null;
  onToothSelect: (toothNumber: number) => void;
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
  selectedTooth,
  onToothSelect,
}: {
  teeth: number[];
  allTeeth: Array<{ toothNumber: number; status: string }>;
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

export default function PerioMode({
  teeth,
  perioData,
  onPerioDataChange,
  selectedTooth,
  onToothSelect,
}: PerioModeProps) {
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
      // Select the tooth
      onToothSelect(tooth);
      // Build data: first 3 = buccal probing depths, last 3 = palatal probing depths
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
    <div className="flex h-full bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Main chart area */}
      <div className={`flex-1 overflow-x-auto px-5 py-4 ${!selectedTooth ? 'flex flex-col items-center' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
              Parodontale Sondering
            </h2>
          </div>
          {/* Voice input */}
          <VoiceInputButton onResult={handleVoiceResult} />
          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-500">0-3 mm</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-500">4-5 mm</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-slate-500">6+ mm</span>
            </span>
          </div>
        </div>

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

            {/* Upper teeth */}
            <TeethRow
              teeth={UPPER_TEETH}
              allTeeth={teeth}
              selectedTooth={selectedTooth}
              onToothSelect={onToothSelect}
            />

            {/* Tooth numbers */}
            <ToothNumberRow teeth={UPPER_TEETH} selectedTooth={selectedTooth} />

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

            {/* Tooth numbers */}
            <ToothNumberRow teeth={LOWER_TEETH} selectedTooth={selectedTooth} />

            {/* Lower teeth */}
            <TeethRow
              teeth={LOWER_TEETH}
              allTeeth={teeth}
              selectedTooth={selectedTooth}
              onToothSelect={onToothSelect}
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
      </div>

      {/* Right side probing panel */}
      {selectedTooth && selectedData && (
        <ProbingPanel
          toothNumber={selectedTooth}
          perioData={selectedData}
          onDataChange={handleDataChange}
          onNextTooth={() => navigateTooth(1)}
          onPrevTooth={() => navigateTooth(-1)}
          onClose={() => onToothSelect(selectedTooth)}
        />
      )}
    </div>
  );
}
