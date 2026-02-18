'use client';

import React, { useEffect, useState } from 'react';

interface PerioKeypadProps {
  onDigit: (n: number) => void;
  onBOP: (val: boolean) => void;
  onPlaque: (val: boolean) => void;
  onUndo: () => void;
  awaitingBOP: boolean;
  bopValue?: boolean;
  plaqueValue?: boolean;
}

export default function PerioKeypad({ onDigit, onBOP, onPlaque, onUndo, awaitingBOP, bopValue = false, plaqueValue = false }: PerioKeypadProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouchDevice) return null;

  const digitButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="mt-4 bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
      <div className="grid grid-cols-5 gap-2 mb-3">
        {digitButtons.map((n) => (
          <button
            key={n}
            onClick={() => onDigit(n)}
            disabled={awaitingBOP}
            className="h-12 rounded-xl bg-slate-700/60 text-white font-bold text-lg hover:bg-slate-600/80 active:bg-slate-500/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onBOP(!bopValue)}
          className={`h-12 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
            bopValue
              ? 'bg-red-500/30 text-red-300 border border-red-500/40'
              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/80'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-red-500" />
          BOP
        </button>
        <button
          onClick={() => onPlaque(!plaqueValue)}
          className={`h-12 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
            plaqueValue
              ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/80'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Plaque
        </button>
        <button
          onClick={onUndo}
          className="h-12 rounded-xl bg-slate-700/60 text-slate-300 font-semibold text-sm hover:bg-slate-600/80 active:bg-slate-500/80 transition-colors"
        >
          Ongedaan
        </button>
      </div>
    </div>
  );
}
