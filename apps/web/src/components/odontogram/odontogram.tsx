'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getToothShape, getToothDimensions, shouldMirrorMesialDistal, type SurfaceKey } from './tooth-shapes';
import ToothDetailPanel from './tooth-detail-panel';
import './odontogram.css';

// ======= Types =======
export interface ToothData {
  id: string;
  toothNumber: number;
  status: string; // PRESENT, MISSING, CROWN, IMPLANT
  isPrimary: boolean;
  notes: string | null;
}

export interface SurfaceData {
  id: string;
  toothNumber: number;
  surface: SurfaceKey;
  condition: string; // HEALTHY, CARIES, FILLING, FILLING_PLANNED, CROWN, ENDO, MISSING, IMPLANT
  material?: string | null;
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
  }) => void;
  readOnly?: boolean;
}

// ======= Constants =======
const CONDITION_COLORS: Record<string, string> = {
  HEALTHY: 'transparent',
  CARIES: '#ef4444',
  FILLING: '#3b82f6',
  FILLING_PLANNED: 'rgba(59, 130, 246, 0.5)',
  CROWN: '#f59e0b',
  MISSING: '#6b7280',
  IMPLANT: '#8b5cf6',
  ENDO: '#f97316',
};

// Upper jaw: 18-11 (right to left anatomically = left to right on screen), then 21-28
const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
// Lower jaw: 48-41, then 31-38
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Treatment context menu definitions
const TREATMENT_CATEGORIES = [
  {
    label: 'Vulling',
    items: [
      { label: '1 vlak', type: 'FILLING', code: 'V21' },
      { label: '2 vlakken', type: 'FILLING', code: 'V22' },
      { label: '3 vlakken', type: 'FILLING', code: 'V23' },
      { label: '4+ vlakken', type: 'FILLING', code: 'V24' },
    ],
  },
  {
    label: 'Kroon',
    items: [
      { label: 'Metaalkeramisch', type: 'CROWN', code: 'R01' },
      { label: 'Volkeramisch', type: 'CROWN', code: 'R02' },
    ],
  },
  {
    label: 'Endo',
    items: [
      { label: '1 kanaal', type: 'ENDO', code: 'E02' },
      { label: '2 kanalen', type: 'ENDO', code: 'E03' },
      { label: '3+ kanalen', type: 'ENDO', code: 'E04' },
    ],
  },
  {
    label: 'Extractie',
    items: [
      { label: 'Eenvoudig', type: 'EXTRACTION', code: 'X30' },
      { label: 'Moeilijk', type: 'EXTRACTION', code: 'X31' },
      { label: 'Chirurgisch', type: 'EXTRACTION', code: 'X33' },
    ],
  },
  {
    label: 'Implantaat',
    items: [
      { label: 'Plaatsen implantaat', type: 'IMPLANT', code: 'I01' },
    ],
  },
];

// ======= Context Menu =======
interface ContextMenuState {
  x: number;
  y: number;
  toothNumber: number;
}

function TreatmentContextMenu({
  x,
  y,
  toothNumber,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  toothNumber: number;
  onSelect: (toothNumber: number, type: string, code: string) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  // Adjust position to stay on screen
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="odonto-context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="odonto-context-header">Tand {toothNumber}</div>
      {TREATMENT_CATEGORIES.map((cat) => (
        <div
          key={cat.label}
          className="odonto-context-category"
          onMouseEnter={() => setOpenCategory(cat.label)}
          onMouseLeave={() => setOpenCategory(null)}
        >
          <div className="odonto-context-category-label">
            {cat.label}
            <span className="odonto-context-arrow">&rsaquo;</span>
          </div>
          {openCategory === cat.label && (
            <div className="odonto-context-submenu">
              {cat.items.map((item) => (
                <div
                  key={item.code}
                  className="odonto-context-item"
                  onClick={() => {
                    onSelect(toothNumber, item.type, item.code);
                    onClose();
                  }}
                >
                  <span className="odonto-context-item-label">{item.label}</span>
                  <span className="odonto-context-item-code">{item.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ======= Single Tooth SVG =======
interface ToothSVGProps {
  toothNumber: number;
  toothData?: ToothData;
  surfaceData: SurfaceData[];
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  readOnly: boolean;
}

function ToothSVG({
  toothNumber,
  toothData,
  surfaceData,
  isSelected,
  onClick,
  onContextMenu,
  readOnly,
}: ToothSVGProps) {
  const shape = getToothShape(toothNumber);
  const dims = getToothDimensions(toothNumber);
  const status = toothData?.status || 'PRESENT';
  const isMissing = status === 'MISSING';
  const mirror = shouldMirrorMesialDistal(toothNumber);

  const getSurfaceColor = (key: SurfaceKey): string => {
    // Swap M/D for mirrored teeth
    let lookupKey = key;
    if (mirror) {
      if (key === 'M') lookupKey = 'D';
      else if (key === 'D') lookupKey = 'M';
    }
    const sd = surfaceData.find((s) => s.surface === lookupKey);
    if (!sd) return 'transparent';
    return CONDITION_COLORS[sd.condition] || 'transparent';
  };

  const viewW = dims.w + 4;
  const viewH = dims.h + 4;

  const surfaceKeys: SurfaceKey[] = ['O', 'B', 'L', 'M', 'D'];

  return (
    <div className={`odonto-tooth-wrapper ${isSelected ? 'odonto-tooth-wrapper--selected' : ''}`}>
      <svg
        viewBox={`-2 -2 ${viewW} ${viewH}`}
        className={`odonto-tooth-svg ${isMissing ? 'odonto-tooth-svg--missing' : ''}`}
        onClick={onClick}
        onContextMenu={onContextMenu}
        width={dims.w + 8}
        height={dims.h + 8}
      >
        {/* Tooth outline */}
        <path d={shape.outline} className="odonto-tooth-outline" />

        {/* Surface areas */}
        {surfaceKeys.map((key) => (
          <path
            key={key}
            d={shape.surfaces[key]}
            fill={getSurfaceColor(key)}
            className="odonto-tooth-surface"
            data-surface={key}
          />
        ))}

        {/* Crown overlay */}
        {status === 'CROWN' && (
          <circle
            cx={dims.w / 2}
            cy={dims.h / 2}
            r={Math.min(dims.w, dims.h) / 2 - 2}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            className="odonto-crown-ring"
          />
        )}

        {/* Implant overlay */}
        {status === 'IMPLANT' && (
          <>
            <circle
              cx={dims.w / 2}
              cy={dims.h / 2}
              r={Math.min(dims.w, dims.h) / 2 - 3}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
            />
            <line
              x1={dims.w / 2 - 4}
              y1={dims.h / 2}
              x2={dims.w / 2 + 4}
              y2={dims.h / 2}
              stroke="#8b5cf6"
              strokeWidth="2"
            />
            <line
              x1={dims.w / 2}
              y1={dims.h / 2 - 4}
              x2={dims.w / 2}
              y2={dims.h / 2 + 4}
              stroke="#8b5cf6"
              strokeWidth="2"
            />
          </>
        )}

        {/* Missing X pattern */}
        {isMissing && (
          <g className="odonto-missing-x">
            <line x1="3" y1="3" x2={dims.w - 3} y2={dims.h - 3} stroke="#6b7280" strokeWidth="2" />
            <line x1={dims.w - 3} y1="3" x2="3" y2={dims.h - 3} stroke="#6b7280" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ======= Main Odontogram =======
export default function Odontogram({
  patientId,
  practiceId,
  appointmentId,
  teeth,
  surfaces,
  onToothSelect,
  onTreatmentApply,
  readOnly = false,
}: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [detailPanelTooth, setDetailPanelTooth] = useState<number | null>(null);
  const [treatmentHistory, setTreatmentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch treatment history when detail panel opens
  useEffect(() => {
    if (detailPanelTooth === null) return;
    setHistoryLoading(true);
    setTreatmentHistory([]);
    // Try to fetch from API - gracefully handle if endpoint doesn't exist
    fetch(`/api/patients/${patientId}/teeth/${detailPanelTooth}/treatments`)
      .then((r) => (r.ok ? r.json() : { treatments: [] }))
      .then((data) => setTreatmentHistory(data.treatments || []))
      .catch(() => setTreatmentHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [detailPanelTooth, patientId]);

  const handleToothClick = useCallback(
    (toothNum: number) => {
      setSelectedTooth(toothNum);
      setDetailPanelTooth(toothNum);
      onToothSelect?.(toothNum);
    },
    [onToothSelect]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, toothNum: number) => {
      if (readOnly) return;
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, toothNumber: toothNum });
    },
    [readOnly]
  );

  const handleTreatmentSelect = useCallback(
    (toothNumber: number, treatmentType: string, nzaCode: string) => {
      onTreatmentApply?.({ toothNumber, treatmentType, nzaCode });
    },
    [onTreatmentApply]
  );

  const getToothData = (num: number) => teeth.find((t) => t.toothNumber === num);
  const getToothSurfaces = (num: number) => surfaces.filter((s) => s.toothNumber === num);

  const renderRow = (row: number[], isUpper: boolean) => {
    const leftHalf = row.slice(0, 8);
    const rightHalf = row.slice(8);

    return (
      <div className="odonto-jaw-row">
        {/* Quadrant label */}
        <div className="odonto-side-label">Rechts</div>

        <div className="odonto-teeth-half">
          {leftHalf.map((num) => (
            <div key={num} className="odonto-tooth-col">
              {isUpper && <span className="odonto-tooth-number odonto-tooth-number--upper">{num}</span>}
              <ToothSVG
                toothNumber={num}
                toothData={getToothData(num)}
                surfaceData={getToothSurfaces(num)}
                isSelected={selectedTooth === num}
                onClick={() => handleToothClick(num)}
                onContextMenu={(e) => handleContextMenu(e, num)}
                readOnly={readOnly}
              />
              {!isUpper && <span className="odonto-tooth-number odonto-tooth-number--lower">{num}</span>}
            </div>
          ))}
        </div>

        <div className="odonto-midline" />

        <div className="odonto-teeth-half">
          {rightHalf.map((num) => (
            <div key={num} className="odonto-tooth-col">
              {isUpper && <span className="odonto-tooth-number odonto-tooth-number--upper">{num}</span>}
              <ToothSVG
                toothNumber={num}
                toothData={getToothData(num)}
                surfaceData={getToothSurfaces(num)}
                isSelected={selectedTooth === num}
                onClick={() => handleToothClick(num)}
                onContextMenu={(e) => handleContextMenu(e, num)}
                readOnly={readOnly}
              />
              {!isUpper && <span className="odonto-tooth-number odonto-tooth-number--lower">{num}</span>}
            </div>
          ))}
        </div>

        <div className="odonto-side-label">Links</div>
      </div>
    );
  };

  const selectedToothData = detailPanelTooth !== null ? getToothData(detailPanelTooth) : undefined;
  const selectedToothSurfaces = detailPanelTooth !== null ? getToothSurfaces(detailPanelTooth) : [];

  return (
    <div className="odonto-root">
      <div className={`odonto-chart-area ${detailPanelTooth !== null ? 'odonto-chart-area--with-panel' : ''}`}>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="odonto-title">Gebitsoverzicht (FDI-notatie)</h3>

          {/* Upper jaw */}
          <div className="odonto-jaw odonto-jaw--upper">
            <div className="odonto-jaw-label">Bovenkaak</div>
            {renderRow(UPPER_ROW, true)}
          </div>

          {/* Divider */}
          <div className="odonto-jaw-divider" />

          {/* Lower jaw */}
          <div className="odonto-jaw odonto-jaw--lower">
            {renderRow(LOWER_ROW, false)}
            <div className="odonto-jaw-label">Onderkaak</div>
          </div>

          {/* Legend */}
          <div className="odonto-legend">
            <div className="odonto-legend-item">
              <span className="odonto-legend-swatch" style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color-strong)' }} />
              <span>Gezond</span>
            </div>
            <div className="odonto-legend-item">
              <span className="odonto-legend-swatch" style={{ backgroundColor: '#ef4444' }} />
              <span>Caries</span>
            </div>
            <div className="odonto-legend-item">
              <span className="odonto-legend-swatch" style={{ backgroundColor: '#3b82f6' }} />
              <span>Vulling</span>
            </div>
            <div className="odonto-legend-item">
              <span className="odonto-legend-swatch" style={{ backgroundColor: '#f59e0b' }} />
              <span>Kroon</span>
            </div>
            <div className="odonto-legend-item">
              <span className="odonto-legend-swatch" style={{ backgroundColor: '#f97316' }} />
              <span>Endo</span>
            </div>
            <div className="odonto-legend-item">
              <span className="odonto-legend-swatch" style={{ backgroundColor: '#8b5cf6' }} />
              <span>Implantaat</span>
            </div>
            <div className="odonto-legend-item">
              <span className="odonto-legend-swatch odonto-legend-swatch--missing" />
              <span>Afwezig</span>
            </div>
            {!readOnly && (
              <div className="odonto-legend-hint">
                Rechtermuisknop op tand voor behandelopties
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {detailPanelTooth !== null && (
        <ToothDetailPanel
          toothNumber={detailPanelTooth}
          status={selectedToothData?.status || 'PRESENT'}
          surfaces={selectedToothSurfaces.map((s) => ({
            surface: s.surface,
            condition: s.condition,
            material: s.material || undefined,
          }))}
          treatmentHistory={treatmentHistory}
          onClose={() => {
            setDetailPanelTooth(null);
            setSelectedTooth(null);
          }}
          readOnly={readOnly}
          loading={historyLoading}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <TreatmentContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          toothNumber={contextMenu.toothNumber}
          onSelect={handleTreatmentSelect}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
