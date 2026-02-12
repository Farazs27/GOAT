'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Clock, User, FileText, Save, Eye, Stethoscope } from 'lucide-react';
import ToothRenderer from '../svg/tooth-renderer';
import SurfaceSelector from './surface-selector';
import MaterialPicker from './material-picker';

const Tooth3D = dynamic(() => import('../three/tooth-3d'), { ssr: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RestorationPanelProps {
  toothNumber: number;
  status: string;
  surfaces: Array<{ surface: string; condition: string; material?: string | null }>;
  treatmentHistory: Array<{
    id: string;
    date: string;
    description: string;
    nzaCode: string;
    performedBy: string;
    surfaces?: string[];
  }>;
  onClose: () => void;
  onSave: (data: {
    restorationType: string;
    surfaces: string[];
    material: string;
    action: 'monitor' | 'treat' | 'save';
  }) => void;
  readOnly?: boolean;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Static maps (no dynamic Tailwind interpolation)
// ---------------------------------------------------------------------------

const RESTORATION_TYPES: Array<{ key: string; label: string }> = [
  { key: 'FILLING', label: 'Vulling' },
  { key: 'INLAY', label: 'Inlay' },
  { key: 'ONLAY', label: 'Onlay' },
  { key: 'VENEER', label: 'Veneer' },
  { key: 'PARTIAL_CROWN', label: 'Deelkroon' },
  { key: 'CROWN_RESTORATION', label: 'Kroon' },
];

const TOOTH_TYPE_LABELS: Record<string, string> = {
  '1': 'Centrale snijtand',
  '2': 'Laterale snijtand',
  '3': 'Hoektand',
  '4': 'Eerste premolaar',
  '5': 'Tweede premolaar',
  '6': 'Eerste molaar',
  '7': 'Tweede molaar',
  '8': 'Derde molaar',
};

const QUADRANT_LABELS: Record<string, string> = {
  '1': 'Rechtsboven',
  '2': 'Linksboven',
  '3': 'Linksonder',
  '4': 'Rechtsonder',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RestorationPanel({
  toothNumber,
  status,
  surfaces,
  treatmentHistory,
  onClose,
  onSave,
  readOnly = false,
  loading = false,
}: RestorationPanelProps) {
  const [restorationType, setRestorationType] = useState<string>('FILLING');
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  const quadrant = String(Math.floor(toothNumber / 10));
  const toothIndex = String(toothNumber % 10);

  const surfaceConditions: Record<string, { condition: string; material?: string }> = {};
  for (const s of surfaces) {
    surfaceConditions[s.surface] = {
      condition: s.condition,
      ...(s.material ? { material: s.material } : {}),
    };
  }

  const handleToggleSurface = (surface: string) => {
    setSelectedSurfaces((prev) =>
      prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface]
    );
  };

  const handleAction = (action: 'monitor' | 'treat' | 'save') => {
    if (!selectedMaterial || selectedSurfaces.length === 0) return;
    onSave({ restorationType, surfaces: selectedSurfaces, material: selectedMaterial, action });
  };

  const canSubmit = selectedMaterial !== null && selectedSurfaces.length > 0 && !readOnly && !loading;

  // Lock background page scroll while panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
    {/* Backdrop to block tooth number bleed-through */}
    <div className="fixed inset-0 z-[59]" style={{ pointerEvents: 'none' }} />
    <div
      className="fixed right-0 top-0 z-[60] h-screen w-[380px] animate-slide-in-right shadow-2xl border-l flex flex-col"
      style={{ background: '#0d1117', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white">Tand {toothNumber}</h2>
          <p className="text-xs text-gray-400">
            {TOOTH_TYPE_LABELS[toothIndex] ?? 'Tand'} &middot; {QUADRANT_LABELS[quadrant] ?? ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-gray-500 hover:bg-white/[0.06] hover:text-gray-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-scroll overscroll-contain px-4 py-4 space-y-5">
        {/* Tooth preview */}
        <div className="flex items-center justify-center gap-4 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
          <Tooth3D
            fdi={toothNumber}
            view="side"
            status={status}
            surfaceConditions={surfaceConditions}
            width={90}
            height={120}
          />
          <ToothRenderer
            fdi={toothNumber}
            view="occlusal"
            status={status}
            surfaceConditions={surfaceConditions}
            width={90}
            height={90}
          />
        </div>

        {/* Restoration type picker */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Type restauratie</p>
          <div className="grid grid-cols-3 gap-1.5">
            {RESTORATION_TYPES.map(({ key, label }) => {
              const isActive = restorationType === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setRestorationType(key)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-white/[0.08] bg-white/[0.04] text-gray-300 hover:border-white/[0.15] hover:bg-white/[0.06]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Surface selector */}
        <SurfaceSelector
          toothNumber={toothNumber}
          selectedSurfaces={selectedSurfaces}
          onToggleSurface={readOnly ? () => {} : handleToggleSurface}
        />

        {/* Material picker */}
        <MaterialPicker
          selectedMaterial={selectedMaterial}
          onSelectMaterial={readOnly ? () => {} : setSelectedMaterial}
        />

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* Treatment history */}
        {treatmentHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Behandelhistorie
            </p>
            <div className="space-y-2">
              {treatmentHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-300">
                      <Clock size={12} className="text-gray-500" />
                      {entry.date}
                    </span>
                    <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
                      {entry.nzaCode}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{entry.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {entry.performedBy}
                    </span>
                    {entry.surfaces && entry.surfaces.length > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText size={11} />
                        {entry.surfaces.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!readOnly && (
        <div className="shrink-0 border-t border-white/[0.08] px-4 py-3" style={{ background: '#0d1117' }}>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => handleAction('monitor')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye size={15} />
              Bewaken
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => handleAction('treat')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Stethoscope size={15} />
              Behandelen
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => handleAction('save')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={15} />
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
