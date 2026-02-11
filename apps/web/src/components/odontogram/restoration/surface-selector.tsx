'use client';

import React from 'react';

interface SurfaceSelectorProps {
  toothNumber: number;
  selectedSurfaces: string[];
  onToggleSurface: (surface: string) => void;
}

const SURFACES = [
  { key: 'CB', label: 'Cervicaal Buccaal' },
  { key: 'B', label: 'Buccaal' },
  { key: 'M', label: 'Mesiaal' },
  { key: 'O', label: 'Occlusaal' },
  { key: 'D', label: 'Distaal' },
  { key: 'P', label: 'Palatinaal' },
  { key: 'CP', label: 'Cervicaal Palatinaal' },
  { key: 'BC', label: 'Buccaal Knobbel' },
  { key: 'PC', label: 'Palatinaal Knobbel' },
  { key: 'BS', label: 'Buccaal Oppervlak' },
  { key: 'PS', label: 'Palatinaal Oppervlak' },
] as const;

export default function SurfaceSelector({
  toothNumber: _toothNumber,
  selectedSurfaces,
  onToggleSurface,
}: SurfaceSelectorProps) {
  const isActive = (key: string) => selectedSurfaces.includes(key);

  const btnClass = (key: string) =>
    isActive(key)
      ? 'bg-blue-500 text-white border-blue-600 ring-1 ring-blue-400'
      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';

  const btn = (key: string, label: string, className?: string) => (
    <button
      key={key}
      type="button"
      onClick={() => onToggleSurface(key)}
      className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${btnClass(key)} ${className ?? ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vlakken</p>
      <div className="flex flex-col items-center gap-1.5">
        {/* Row 1: Cervicaal Buccaal */}
        <div className="flex justify-center">
          {btn('CB', 'Cervicaal Buccaal')}
        </div>
        {/* Row 2: Buccaal */}
        <div className="flex justify-center">
          {btn('B', 'Buccaal', 'min-w-[80px]')}
        </div>
        {/* Row 3: Mesiaal - Occlusaal - Distaal */}
        <div className="flex gap-1.5 justify-center">
          {btn('M', 'Mesiaal')}
          {btn('O', 'Occlusaal')}
          {btn('D', 'Distaal')}
        </div>
        {/* Row 4: Palatinaal */}
        <div className="flex justify-center">
          {btn('P', 'Palatinaal', 'min-w-[80px]')}
        </div>
        {/* Row 5: Cervicaal Palatinaal */}
        <div className="flex justify-center">
          {btn('CP', 'Cervicaal Palatinaal')}
        </div>
        {/* Row 6: Cusps */}
        <div className="flex gap-1.5 justify-center">
          {btn('BC', 'Buccaal Knobbel')}
          {btn('PC', 'Palatinaal Knobbel')}
        </div>
        {/* Row 7: Oppervlakken */}
        <div className="flex gap-1.5 justify-center">
          {btn('BS', 'Buccaal Oppervlak')}
          {btn('PS', 'Palatinaal Oppervlak')}
        </div>
      </div>
    </div>
  );
}
