'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { PerioToothData } from '@/../../packages/shared-types/src/odontogram';
import OverviewMode from './modes/overview-mode';
import PerioMode from './modes/perio-mode';
import QuickselectMode from './modes/quickselect-mode';
import RestorationPanel from './restoration/restoration-panel';
import { authFetch } from '@/lib/auth-fetch';
import './odontogram.css';

// ======= Types =======
export interface ToothData {
  id: string;
  toothNumber: number;
  status: string;
  isPrimary: boolean;
  notes: string | null;
}

export interface SurfaceData {
  id: string;
  toothNumber: number;
  surface: string;
  condition: string;
  material?: string | null;
  restorationType?: string | null;
  recordedAt?: string;
}

export interface OdontogramProps {
  patientId: string;
  practiceId?: string;
  appointmentId?: string;
  teeth: ToothData[];
  surfaces: SurfaceData[];
  onToothSelect?: (toothNumber: number) => void;
  onTreatmentApply?: (data: {
    toothNumber: number;
    treatmentType: string;
    nzaCode: string;
    surfaces?: string[];
    material?: string;
    restorationType?: string;
  }) => void;
  readOnly?: boolean;
}

type OdontogramMode = 'overview' | 'perio' | 'quickselect';

const MODE_TABS: { id: OdontogramMode; label: string }[] = [
  { id: 'overview', label: 'Overzicht' },
  { id: 'perio', label: 'Parodontologie' },
  { id: 'quickselect', label: 'Snelselectie' },
];

// ======= Main Odontogram =======
export default function Odontogram({
  patientId,
  teeth,
  surfaces,
  onToothSelect,
  onTreatmentApply,
  readOnly = false,
}: OdontogramProps) {
  const [mode, setMode] = useState<OdontogramMode>('overview');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [perioData, setPerioData] = useState<Record<string, PerioToothData>>({});
  const [treatmentHistory, setTreatmentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingRestoration, setPendingRestoration] = useState<{
    toothNumber: number;
    restorationType: string;
    surfaces: string[];
    statusChange?: string;
  } | null>(null);

  // Fetch treatment history when a tooth is selected in overview
  useEffect(() => {
    if (selectedTooth === null || mode !== 'overview') return;
    setHistoryLoading(true);
    setTreatmentHistory([]);
    authFetch(`/api/patients/${patientId}/teeth/${selectedTooth}/treatments`)
      .then((r) => (r.ok ? r.json() : { treatments: [] }))
      .then((data) => setTreatmentHistory(data.treatments || []))
      .catch(() => setTreatmentHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [selectedTooth, patientId, mode]);

  const handleToothSelect = useCallback(
    (toothNumber: number) => {
      setSelectedTooth(toothNumber);
      onToothSelect?.(toothNumber);
    },
    [onToothSelect]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, _toothNumber: number) => {
      e.preventDefault();
    },
    []
  );

  const handlePerioDataChange = useCallback(
    (toothNumber: number, data: PerioToothData) => {
      setPerioData((prev) => ({ ...prev, [toothNumber]: data }));
    },
    []
  );

  const handleBatchApply = useCallback(
    (data: { treatmentType: string; toothNumbers: number[]; condition: string }) => {
      // Call batch endpoint
      fetch(`/api/patients/${patientId}/odontogram/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify(data),
      }).catch(console.error);
    },
    [patientId]
  );

  const handleRestorationSave = useCallback(
    (data: { restorationType: string; surfaces: string[]; material: string; action: string; statusChange?: string }) => {
      if (selectedTooth === null) return;

      // Handle status change (Extractie / Implantaat / Endodontie)
      if (data.statusChange) {
        authFetch(`/api/patients/${patientId}/teeth/${selectedTooth}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: data.statusChange }),
        }).then(() => {
          // Trigger parent refresh for status-only changes
          if (!(data.surfaces.length > 0 && data.material)) {
            onTreatmentApply?.({
              toothNumber: selectedTooth!,
              treatmentType: data.statusChange!,
              nzaCode: '',
              restorationType: data.statusChange!,
            });
          }
        }).catch(console.error);
      }

      // Handle restoration (surfaces + material)
      if (data.surfaces.length > 0 && data.material) {
        onTreatmentApply?.({
          toothNumber: selectedTooth,
          treatmentType: data.restorationType,
          nzaCode: '',
          surfaces: data.surfaces,
          material: data.material,
          restorationType: data.restorationType,
        });
      }

      setPendingRestoration(null);
      setSelectedTooth(null);
    },
    [selectedTooth, onTreatmentApply, patientId]
  );

  const handleSelectionChange = useCallback(
    (data: { toothNumber: number; restorationType: string; surfaces: string[]; statusChange?: string }) => {
      setPendingRestoration(data.surfaces.length > 0 || data.statusChange ? data : null);
    },
    []
  );

  const selectedToothData = selectedTooth !== null ? teeth.find((t) => t.toothNumber === selectedTooth) : undefined;
  const selectedToothSurfaces = selectedTooth !== null ? surfaces.filter((s) => s.toothNumber === selectedTooth) : [];

  return (
    <div className="odonto-root">
      <div className="odonto-chart-area">
        {/* Mode tabs */}
        <div className="odonto-mode-tabs">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`odonto-mode-tab ${mode === tab.id ? 'odonto-mode-tab--active' : ''}`}
              onClick={() => {
                setMode(tab.id);
                setSelectedTooth(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mode content */}
        {mode === 'overview' && (
          <OverviewMode
            teeth={teeth}
            surfaces={surfaces}
            selectedTooth={selectedTooth}
            onToothSelect={handleToothSelect}
            onContextMenu={handleContextMenu}
            onDetailSave={handleRestorationSave}
            pendingRestoration={pendingRestoration}
            readOnly={readOnly}
          />
        )}

        {mode === 'perio' && (
          <PerioMode
            teeth={teeth}
            perioData={perioData}
            onPerioDataChange={handlePerioDataChange}
            selectedTooth={selectedTooth}
            onToothSelect={handleToothSelect}
          />
        )}

        {mode === 'quickselect' && (
          <QuickselectMode
            teeth={teeth}
            surfaces={surfaces}
            onBatchApply={handleBatchApply}
          />
        )}
      </div>

      {/* Restoration panel — rendered via portal to escape glass-card overflow */}
      {mode === 'overview' && selectedTooth !== null && typeof document !== 'undefined' &&
        createPortal(
          <RestorationPanel
            toothNumber={selectedTooth}
            status={selectedToothData?.status || 'PRESENT'}
            surfaces={selectedToothSurfaces.map((s) => ({
              surface: s.surface,
              condition: s.condition,
              material: s.material || undefined,
            }))}
            treatmentHistory={treatmentHistory}
            onClose={() => { setPendingRestoration(null); setSelectedTooth(null); }}
            onSave={handleRestorationSave}
            onSelectionChange={handleSelectionChange}
            readOnly={readOnly}
            loading={historyLoading}
          />,
          document.body
        )
      }
    </div>
  );
}
