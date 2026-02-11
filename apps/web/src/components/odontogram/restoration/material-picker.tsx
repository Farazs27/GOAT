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
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Materiaal</p>
      <div className="grid grid-cols-3 gap-1.5">
        {MATERIALS.map(({ key, label, color }) => {
          const isActive = selectedMaterial === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectMaterial(key)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span
                className="h-5 w-5 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="leading-tight text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
