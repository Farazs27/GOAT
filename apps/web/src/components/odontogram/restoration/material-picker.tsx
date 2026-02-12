'use client';

import React from 'react';

interface MaterialPickerProps {
  selectedMaterial: string | null;
  onSelectMaterial: (material: string) => void;
}

const MATERIALS: Array<{ key: string; label: string; color: string }> = [
  { key: 'COMPOSITE', label: 'Composiet', color: '#9333ea' },
  { key: 'CERAMIC', label: 'Keramiek', color: '#93c5fd' },
  { key: 'AMALGAM', label: 'Amalgaam', color: '#6b7280' },
  { key: 'GOLD', label: 'Goud', color: '#eab308' },
  { key: 'NON_PRECIOUS_METAL', label: 'Onedel Metaal', color: '#a1a1aa' },
  { key: 'TEMPORARY', label: 'Tijdelijk', color: '#fbbf24' },
];

export default function MaterialPicker({
  selectedMaterial,
  onSelectMaterial,
}: MaterialPickerProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Materiaal</p>
      <div className="grid grid-cols-3 gap-1.5">
        {MATERIALS.map(({ key, label, color }) => {
          const isActive = selectedMaterial === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectMaterial(key)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/[0.10] text-white border-white/[0.20] ring-1 ring-white/[0.15] backdrop-blur-xl shadow-lg'
                  : 'bg-white/[0.04] text-gray-400 border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-gray-300 backdrop-blur-xl'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full border transition-all duration-200 ${
                  isActive ? 'border-white/30 scale-110 shadow-lg' : 'border-white/[0.12]'
                }`}
                style={{ backgroundColor: color, boxShadow: isActive ? `0 0 12px ${color}50` : undefined }}
              />
              <span className="leading-tight text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
