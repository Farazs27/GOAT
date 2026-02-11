'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import ToothRenderer, { CONDITION_COLORS, MATERIAL_COLORS } from '../svg/tooth-renderer';

const DentalArch3D = dynamic(() => import('../three/dental-arch-3d'), { ssr: false });
const ToothDetail3D = dynamic(() => import('../three/tooth-detail-3d'), { ssr: false });

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const OCCLUSAL_HEIGHT = 44;
const TOOTH_WIDTH = 48;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OverviewModeProps {
  teeth: Array<{ toothNumber: number; status: string; notes?: string | null }>;
  surfaces: Array<{ toothNumber: number; surface: string; condition: string; material?: string | null }>;
  selectedTooth: number | null;
  onToothSelect: (toothNumber: number) => void;
  onContextMenu: (e: React.MouseEvent, toothNumber: number) => void;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToothStatus(toothNumber: number, teeth: OverviewModeProps['teeth']): string {
  const t = teeth.find((t) => t.toothNumber === toothNumber);
  return t?.status ?? 'PRESENT';
}

function getSurfaceConditions(
  toothNumber: number,
  surfaces: OverviewModeProps['surfaces']
): Record<string, { condition: string; material?: string }> | undefined {
  const matching = surfaces.filter((s) => s.toothNumber === toothNumber);
  if (matching.length === 0) return undefined;
  const map: Record<string, { condition: string; material?: string }> = {};
  for (const s of matching) {
    map[s.surface] = { condition: s.condition, material: s.material ?? undefined };
  }
  return map;
}

// ---------------------------------------------------------------------------
// Occlusal row (SVG teeth — top-down view)
// ---------------------------------------------------------------------------

function OcclusalRow({
  row,
  teeth,
  surfaces,
  selectedTooth,
  onToothSelect,
  onContextMenu,
}: {
  row: number[];
  teeth: OverviewModeProps['teeth'];
  surfaces: OverviewModeProps['surfaces'];
  selectedTooth: number | null;
  onToothSelect: (n: number) => void;
  onContextMenu: (e: React.MouseEvent, n: number) => void;
}) {
  return (
    <div className="flex justify-center">
      {row.map((fdi) => {
        const status = getToothStatus(fdi, teeth);
        const sc = getSurfaceConditions(fdi, surfaces);
        const isSelected = selectedTooth === fdi;

        return (
          <div
            key={fdi}
            className={`relative flex items-center justify-center transition-transform duration-150 hover:scale-105 ${
              isSelected ? 'z-10 scale-110' : ''
            }`}
            style={{ width: TOOTH_WIDTH, height: OCCLUSAL_HEIGHT }}
          >
            {isSelected && (
              <div className="absolute inset-0 rounded-lg border-2 border-blue-400 bg-blue-50/20 pointer-events-none z-20" />
            )}
            <ToothRenderer
              fdi={fdi}
              view="occlusal"
              status={status}
              surfaceConditions={sc}
              isSelected={isSelected}
              onClick={() => onToothSelect(fdi)}
              onContextMenu={(e) => onContextMenu(e, fdi)}
              width={TOOTH_WIDTH - 6}
              height={OCCLUSAL_HEIGHT - 6}
            />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tooth numbers
// ---------------------------------------------------------------------------

function ToothNumbers({ row }: { row: number[] }) {
  return (
    <div className="flex justify-center">
      {row.map((fdi) => (
        <div
          key={fdi}
          className="text-center text-[11px] font-semibold text-gray-500 tabular-nums select-none"
          style={{ width: TOOTH_WIDTH }}
        >
          {fdi}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

const LEGEND_ITEMS: Array<{ label: string; color: string }> = [
  { label: 'Cariës', color: CONDITION_COLORS.CARIES },
  { label: 'Vulling', color: CONDITION_COLORS.FILLING },
  { label: 'Kroon', color: CONDITION_COLORS.CROWN },
  { label: 'Endo', color: CONDITION_COLORS.ENDO },
  { label: 'Implantaat', color: CONDITION_COLORS.IMPLANT },
  { label: 'Afwezig', color: CONDITION_COLORS.MISSING },
  { label: 'Composiet', color: MATERIAL_COLORS.COMPOSITE },
  { label: 'Keramiek', color: MATERIAL_COLORS.CERAMIC },
  { label: 'Amalgaam', color: MATERIAL_COLORS.AMALGAM },
  { label: 'Goud', color: MATERIAL_COLORS.GOLD },
];

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-4 px-4">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="inline-block w-3 h-3 rounded-sm border border-gray-300/50"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OverviewMode({
  teeth,
  surfaces,
  selectedTooth,
  onToothSelect,
  onContextMenu,
  readOnly = false,
}: OverviewModeProps) {
  const [detailTooth, setDetailTooth] = useState<number | null>(null);

  const handleSelect = readOnly ? () => {} : onToothSelect;
  const handleContext = readOnly
    ? (e: React.MouseEvent, _n: number) => e.preventDefault()
    : onContextMenu;

  const handleArchToothClick = (fdi: number) => {
    setDetailTooth(fdi);
    handleSelect(fdi);
  };

  const detailStatus = detailTooth !== null
    ? getToothStatus(detailTooth, teeth)
    : 'PRESENT';
  const detailSurfaces = detailTooth !== null
    ? getSurfaceConditions(detailTooth, surfaces)
    : undefined;

  return (
    <div className="space-y-4">
      {/* 3D Section */}
      {detailTooth !== null ? (
        <ToothDetail3D
          fdi={detailTooth}
          status={detailStatus}
          surfaceConditions={detailSurfaces}
          onClose={() => setDetailTooth(null)}
        />
      ) : (
        <>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              Klik op een tand om in te zoomen &mdash; sleep om te draaien
            </p>
          </div>
          <DentalArch3D
            teeth={teeth}
            surfaces={surfaces}
            selectedTooth={selectedTooth}
            onToothSelect={handleArchToothClick}
          />
        </>
      )}

      {/* Occlusal views (SVG) — always visible for quick reference */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rechts</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bovenkaak</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Links</span>
        </div>
        <ToothNumbers row={UPPER_ROW} />
        <OcclusalRow
          row={UPPER_ROW}
          teeth={teeth}
          surfaces={surfaces}
          selectedTooth={selectedTooth}
          onToothSelect={handleSelect}
          onContextMenu={handleContext}
        />

        <div className="flex items-center my-2">
          <div className="flex-1 h-px bg-gray-700/30" />
          <div className="mx-3 text-[9px] font-semibold text-gray-500 uppercase tracking-widest">Middenlijn</div>
          <div className="flex-1 h-px bg-gray-700/30" />
        </div>

        <OcclusalRow
          row={LOWER_ROW}
          teeth={teeth}
          surfaces={surfaces}
          selectedTooth={selectedTooth}
          onToothSelect={handleSelect}
          onContextMenu={handleContext}
        />
        <ToothNumbers row={LOWER_ROW} />
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rechts</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Onderkaak</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Links</span>
        </div>
      </div>

      <Legend />
    </div>
  );
}
