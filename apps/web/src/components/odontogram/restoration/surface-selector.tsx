'use client';

import React from 'react';

interface SurfaceSelectorProps {
  toothNumber: number;
  selectedSurfaces: string[];
  onToggleSurface: (surface: string) => void;
}


export default function SurfaceSelector({
  toothNumber: _toothNumber,
  selectedSurfaces,
  onToggleSurface,
}: SurfaceSelectorProps) {
  const isActive = (key: string) => selectedSurfaces.includes(key);

  const btnClass = (key: string) =>
    isActive(key)
      ? 'bg-blue-500/30 text-blue-300 border-blue-400/40 ring-1 ring-blue-400/30 backdrop-blur-xl shadow-lg shadow-blue-500/10'
      : 'bg-white/[0.04] text-gray-400 border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-gray-300 backdrop-blur-xl';

  const btn = (key: string, label: string, className?: string) => (
    <button
      key={key}
      type="button"
      onClick={() => onToggleSurface(key)}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${btnClass(key)} ${className ?? ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vlakken</p>
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
