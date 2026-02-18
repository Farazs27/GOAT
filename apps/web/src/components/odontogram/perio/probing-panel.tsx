'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Droplets, Circle, Zap, Layers, Ban, Wrench } from 'lucide-react';
import type { PerioToothData } from '@/../../packages/shared-types/src/odontogram';

interface ProbingPanelProps {
  toothNumber: number;
  perioData: PerioToothData;
  onDataChange: (data: PerioToothData) => void;
  onNextTooth: () => void;
  onPrevTooth: () => void;
  onClose: () => void;
}

type InputMode = 'probingDepth' | 'gingivalMargin' | 'mucogingivalJunction' | 'keratinizedTissueWidth';

const POINT_LABELS = [
  ['Disto Palataal', 'Palataal', 'Mesio Palataal'],
  ['Disto Buccaal', 'Buccaal', 'Mesio Buccaal'],
] as const;

const POINT_SHORT = [
  ['DP', 'P', 'MP'],
  ['DB', 'B', 'MB'],
] as const;

const POINT_SIDES: Array<'palatal' | 'buccal'> = ['palatal', 'buccal'];

function getDepthColor(value: number): string {
  if (value <= 3) return 'text-emerald-400';
  if (value <= 5) return 'text-amber-400';
  return 'text-red-400';
}

function getDepthBg(value: number, isActive: boolean): string {
  if (isActive) return 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-400/40';
  if (value <= 3) return 'bg-slate-800/60 border-slate-600/50 hover:border-emerald-500/40';
  if (value <= 5) return 'bg-slate-800/60 border-amber-500/30 hover:border-amber-500/50';
  return 'bg-slate-800/60 border-red-500/30 hover:border-red-500/50';
}

const NUMPAD_COLORS: Record<string, string> = {
  green: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 active:bg-emerald-500/35',
  amber: 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 active:bg-amber-500/35',
  red: 'bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25 active:bg-red-500/35',
};

function getNumpadColor(val: number): string {
  if (val <= 3) return NUMPAD_COLORS.green;
  if (val <= 5) return NUMPAD_COLORS.amber;
  return NUMPAD_COLORS.red;
}

const INPUT_MODE_LABELS: Record<InputMode, string> = {
  probingDepth: 'POCKETDIEPTE',
  gingivalMargin: 'GINGIVALE MARGE',
  mucogingivalJunction: 'MGJ',
  keratinizedTissueWidth: 'KTW',
};

export default function ProbingPanel({
  toothNumber,
  perioData,
  onDataChange,
  onNextTooth,
  onPrevTooth,
  onClose,
}: ProbingPanelProps) {
  const [inputMode, setInputMode] = useState<InputMode>('probingDepth');
  const [activePoint, setActivePoint] = useState<[number, number]>([0, 0]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isMissing = perioData.missing ?? false;
  const isImplant = perioData.implant ?? false;

  useEffect(() => {
    setActivePoint([0, 0]);
  }, [toothNumber]);

  const advancePoint = useCallback(() => {
    setActivePoint(([row, col]) => {
      if (col < 2) return [row, col + 1];
      if (row < 1) return [row + 1, 0];
      return [1, 2];
    });
  }, []);

  const handleNumpadClick = useCallback(
    (value: number) => {
      if (isMissing) return;
      const [row, col] = activePoint;
      const side = POINT_SIDES[row];

      const newData = structuredClone(perioData);

      if (inputMode === 'probingDepth' || inputMode === 'gingivalMargin') {
        newData[side][inputMode][col] = value;
      } else if (inputMode === 'mucogingivalJunction') {
        if (!newData.mucogingivalJunction) {
          newData.mucogingivalJunction = { buccal: [0, 0, 0], palatal: [0, 0, 0] };
        }
        newData.mucogingivalJunction[side][col] = value;
      } else if (inputMode === 'keratinizedTissueWidth') {
        if (!newData.keratinizedTissueWidth) {
          newData.keratinizedTissueWidth = { buccal: [0, 0, 0], palatal: [0, 0, 0] };
        }
        newData.keratinizedTissueWidth[side][col] = value;
      }

      onDataChange(newData);
      advancePoint();
    },
    [activePoint, inputMode, perioData, onDataChange, advancePoint, isMissing]
  );

  const handleToggle = useCallback(
    (field: 'bleeding' | 'plaque' | 'pus' | 'tartar') => {
      if (isMissing) return;
      const [row, col] = activePoint;
      const side = POINT_SIDES[row];
      const newData = structuredClone(perioData);
      newData[side][field][col] = !newData[side][field][col];
      onDataChange(newData);
    },
    [activePoint, perioData, onDataChange, isMissing]
  );

  const handleSuppurationToggle = useCallback(() => {
    if (isMissing) return;
    const [row, col] = activePoint;
    const side = POINT_SIDES[row];
    const newData = structuredClone(perioData);
    if (!newData.suppuration) {
      newData.suppuration = { buccal: [false, false, false], palatal: [false, false, false] };
    }
    newData.suppuration[side][col] = !newData.suppuration[side][col];
    onDataChange(newData);
  }, [activePoint, perioData, onDataChange, isMissing]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 0 && num <= 9) {
        handleNumpadClick(num);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNumpadClick]);

  // CAL calculation
  const calValues = {
    palatal: perioData.palatal.probingDepth.map((pd, i) =>
      pd + Math.abs(perioData.palatal.gingivalMargin[i])
    ) as [number, number, number],
    buccal: perioData.buccal.probingDepth.map((pd, i) =>
      pd + Math.abs(perioData.buccal.gingivalMargin[i])
    ) as [number, number, number],
  };

  const numpadValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 13];

  const toggleItems = [
    { field: 'bleeding' as const, label: 'Bloeding', icon: Droplets, activeColor: 'bg-red-500', borderColor: 'border-l-red-500', textColor: 'text-red-400', ringColor: 'ring-red-500/30' },
    { field: 'plaque' as const, label: 'Tandplak', icon: Circle, activeColor: 'bg-blue-500', borderColor: 'border-l-blue-500', textColor: 'text-blue-400', ringColor: 'ring-blue-500/30' },
    { field: 'pus' as const, label: 'Pus', icon: Zap, activeColor: 'bg-yellow-500', borderColor: 'border-l-yellow-500', textColor: 'text-yellow-400', ringColor: 'ring-yellow-500/30' },
    { field: 'tartar' as const, label: 'Tandsteen', icon: Layers, activeColor: 'bg-slate-400', borderColor: 'border-l-slate-400', textColor: 'text-slate-300', ringColor: 'ring-slate-400/30' },
  ];

  const suppurationOn = (() => {
    const [row, col] = activePoint;
    const side = POINT_SIDES[row];
    return perioData.suppuration?.[side]?.[col] ?? false;
  })();

  return (
    <div className={`w-80 bg-slate-900/80 backdrop-blur-sm border-l border-slate-700/50 flex flex-col h-full overflow-y-auto ${isMissing ? 'opacity-60' : ''}`}>
      {/* Header with tooth number */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <button
          onClick={onPrevTooth}
          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Tand</span>
          <span className="text-2xl font-bold text-white leading-tight">{toothNumber}</span>
          <div className="flex gap-2 mt-1">
            {isImplant && (
              <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-semibold">IMPLANTAAT</span>
            )}
            {isMissing && (
              <span className="text-[8px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full font-semibold">AFWEZIG</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNextTooth}
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Implant / Missing toggles */}
      <div className="px-4 pt-3 pb-2 flex gap-2">
        <button
          onClick={() => {
            const newData = structuredClone(perioData);
            newData.implant = !(newData.implant ?? false);
            onDataChange(newData);
          }}
          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
            isImplant
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Implantaat
        </button>
        <button
          onClick={() => {
            const newData = structuredClone(perioData);
            newData.missing = !(newData.missing ?? false);
            onDataChange(newData);
          }}
          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
            isMissing
              ? 'bg-red-500/20 border-red-500/40 text-red-300'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          Afwezig
        </button>
      </div>

      {isMissing && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-red-400/80 text-center">Tand is gemarkeerd als afwezig. Invoer uitgeschakeld.</p>
        </div>
      )}

      {/* Tooth measurement visualization */}
      <div className="px-4 pt-1 pb-2">
        <div className="flex items-center justify-center gap-1 mb-1">
          {POINT_SHORT[0].map((label, colIdx) => {
            const isActive = activePoint[0] === 0 && activePoint[1] === colIdx;
            return (
              <button
                key={label}
                onClick={() => setActivePoint([0, colIdx])}
                className={`w-8 h-5 rounded text-[9px] font-bold transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center">
          <div className="w-16 h-8 rounded-lg bg-slate-800/80 border border-slate-600/50 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-300">{toothNumber}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mt-1">
          {POINT_SHORT[1].map((label, colIdx) => {
            const isActive = activePoint[0] === 1 && activePoint[1] === colIdx;
            return (
              <button
                key={label}
                onClick={() => setActivePoint([1, colIdx])}
                className={`w-8 h-5 rounded text-[9px] font-bold transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2x3 Measurement grid */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Palataal</span>
          <div className="flex-1 h-px bg-slate-700/50" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {POINT_LABELS[0].map((label, colIdx) => {
            const isActive = activePoint[0] === 0 && activePoint[1] === colIdx;
            const depth = perioData.palatal.probingDepth[colIdx];
            const margin = perioData.palatal.gingivalMargin[colIdx];

            return (
              <button
                key={label}
                onClick={() => setActivePoint([0, colIdx])}
                className={`flex flex-col items-center p-2 rounded-lg border transition-all ${getDepthBg(depth, isActive)}`}
              >
                <span className="text-[8px] text-slate-500 leading-tight font-medium">
                  {label.split(' ').pop()}
                </span>
                <span className={`text-2xl font-bold leading-tight ${getDepthColor(depth)}`}>
                  {depth}
                </span>
                <span className="text-[9px] text-slate-500 leading-tight">
                  GM {margin}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-2 mb-1">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Buccaal</span>
          <div className="flex-1 h-px bg-slate-700/50" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {POINT_LABELS[1].map((label, colIdx) => {
            const isActive = activePoint[0] === 1 && activePoint[1] === colIdx;
            const depth = perioData.buccal.probingDepth[colIdx];
            const margin = perioData.buccal.gingivalMargin[colIdx];

            return (
              <button
                key={label}
                onClick={() => setActivePoint([1, colIdx])}
                className={`flex flex-col items-center p-2 rounded-lg border transition-all ${getDepthBg(depth, isActive)}`}
              >
                <span className="text-[8px] text-slate-500 leading-tight font-medium">
                  {label.split(' ').pop()}
                </span>
                <span className={`text-2xl font-bold leading-tight ${getDepthColor(depth)}`}>
                  {depth}
                </span>
                <span className="text-[9px] text-slate-500 leading-tight">
                  GM {margin}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CAL Display */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-semibold text-cyan-400/70 uppercase tracking-wider">CAL (berekend)</span>
          <div className="flex-1 h-px bg-cyan-700/30" />
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[8px] text-slate-500 font-semibold">Palataal</span>
              <div className="flex gap-1 mt-0.5">
                {calValues.palatal.map((v, i) => (
                  <span key={i} className={`text-xs font-bold w-6 text-center rounded ${getDepthColor(v)}`}>{v}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-semibold">Buccaal</span>
              <div className="flex gap-1 mt-0.5">
                {calValues.buccal.map((v, i) => (
                  <span key={i} className={`text-xs font-bold w-6 text-center rounded ${getDepthColor(v)}`}>{v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-800/50 p-1">
          {(['probingDepth', 'gingivalMargin'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setInputMode(mode)}
              className={`py-1.5 text-[10px] font-semibold transition-all rounded ${
                inputMode === mode
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {INPUT_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* Numpad */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-1.5">
          {numpadValues.map((val) => (
            <button
              key={val}
              onClick={() => handleNumpadClick(val)}
              disabled={isMissing}
              className={`py-3 rounded-lg text-sm font-bold border transition-all ${isMissing ? 'opacity-40 cursor-not-allowed' : ''} ${getNumpadColor(val)}`}
            >
              {val > 12 ? '>12' : val}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle buttons - Basic */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-1.5">
          {toggleItems.map(({ field, label, icon: Icon, activeColor, borderColor, textColor, ringColor }) => {
            const [row, col] = activePoint;
            const side = POINT_SIDES[row];
            const isOn = perioData[side][field][col];
            return (
              <button
                key={field}
                onClick={() => handleToggle(field)}
                disabled={isMissing}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-l-[3px] border border-slate-700/50 text-xs font-semibold transition-all ${isMissing ? 'opacity-40 cursor-not-allowed' : ''} ${
                  isOn
                    ? `${borderColor} ${ringColor} ring-1 bg-slate-800/80 ${textColor}`
                    : `border-l-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300`
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    isOn ? activeColor : 'bg-slate-700'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5 text-white" />
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobility & Furcation */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Mobiliteit</label>
            <div className="flex gap-1 mt-1">
              {[0, 1, 2, 3].map((v) => (
                <button
                  key={v}
                  disabled={isMissing}
                  onClick={() => {
                    const newData = structuredClone(perioData);
                    newData.mobility = v;
                    onDataChange(newData);
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${isMissing ? 'opacity-40 cursor-not-allowed' : ''} ${
                    perioData.mobility === v
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Furcatie</label>
            <div className="flex gap-1 mt-1">
              {[0, 1, 2, 3].map((v) => (
                <button
                  key={v}
                  disabled={isMissing}
                  onClick={() => {
                    const newData = structuredClone(perioData);
                    newData.furcation = v;
                    onDataChange(newData);
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${isMissing ? 'opacity-40 cursor-not-allowed' : ''} ${
                    perioData.furcation === v
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced section (collapsible) */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center justify-between w-full py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
        >
          <span>Geavanceerd</span>
          {advancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {advancedOpen && (
          <div className="space-y-3 pt-1">
            {/* Suppuration toggle */}
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Suppuratie</label>
              <button
                onClick={handleSuppurationToggle}
                disabled={isMissing}
                className={`mt-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-l-[3px] border border-slate-700/50 text-xs font-semibold transition-all w-full ${isMissing ? 'opacity-40 cursor-not-allowed' : ''} ${
                  suppurationOn
                    ? 'border-l-orange-500 ring-orange-500/30 ring-1 bg-slate-800/80 text-orange-400'
                    : 'border-l-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${suppurationOn ? 'bg-orange-500' : 'bg-slate-700'}`}>
                  <Droplets className="w-2.5 h-2.5 text-white" />
                </span>
                Suppuratie ({POINT_SHORT[activePoint[0]][activePoint[1]]})
              </button>
            </div>

            {/* MGJ & KTW input mode buttons */}
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 block">Mucogingival / Keratinized</label>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-700/50 bg-slate-800/50 p-1">
                {(['mucogingivalJunction', 'keratinizedTissueWidth'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    className={`py-1.5 text-[10px] font-semibold transition-all rounded ${
                      inputMode === mode
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    {INPUT_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
              {/* Current values display */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[8px] text-slate-500 font-semibold">MGJ</span>
                  <div className="flex gap-1 mt-0.5">
                    {(() => {
                      const side = POINT_SIDES[activePoint[0]];
                      const vals = perioData.mucogingivalJunction?.[side] ?? [0, 0, 0];
                      return vals.map((v: number, i: number) => (
                        <span key={i} className="text-[10px] font-bold w-5 text-center text-slate-300 bg-slate-800/60 rounded">{v}</span>
                      ));
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-semibold">KTW</span>
                  <div className="flex gap-1 mt-0.5">
                    {(() => {
                      const side = POINT_SIDES[activePoint[0]];
                      const vals = perioData.keratinizedTissueWidth?.[side] ?? [0, 0, 0];
                      return vals.map((v: number, i: number) => (
                        <span key={i} className="text-[10px] font-bold w-5 text-center text-slate-300 bg-slate-800/60 rounded">{v}</span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next tooth button */}
      <div className="px-4 pb-4 mt-auto">
        <button
          onClick={onNextTooth}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
        >
          VOLGENDE TAND
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
