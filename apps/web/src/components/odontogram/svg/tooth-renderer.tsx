'use client';

import React from 'react';
import { getToothPaths, type SurfaceKey } from './tooth-paths';

// ---------------------------------------------------------------------------
// Color mappings
// ---------------------------------------------------------------------------

export const MATERIAL_COLORS: Record<string, string> = {
  COMPOSITE: '#9333ea',
  CERAMIC: '#93c5fd',
  AMALGAM: '#6b7280',
  GOLD: '#eab308',
  NON_PRECIOUS_METAL: '#a1a1aa',
  TEMPORARY: '#fbbf24',
};

export const CONDITION_COLORS: Record<string, string> = {
  HEALTHY: 'transparent',
  CARIES: '#ef4444',
  FILLING: '#3b82f6',
  FILLING_PLANNED: 'rgba(59, 130, 246, 0.4)',
  CROWN: '#f59e0b',
  ENDO: '#f97316',
  MISSING: '#6b7280',
  IMPLANT: '#8b5cf6',
  VENEER: '#67e8f9',
  INLAY: '#c084fc',
  ONLAY: '#a78bfa',
  PARTIAL_CROWN: '#fbbf24',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ToothRendererProps {
  fdi: number;
  view: 'side' | 'occlusal';
  status: string;
  surfaceConditions?: Record<string, { condition: string; material?: string }>;
  isSelected?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Gradient defs — reusable per SVG
// ---------------------------------------------------------------------------

function ToothGradients({ id, isLower, cervicalY, viewBoxHeight }: {
  id: string;
  isLower: boolean;
  cervicalY: number;
  viewBoxHeight: number;
}) {
  const cervicalPct = ((cervicalY / viewBoxHeight) * 100).toFixed(0);
  return (
    <defs>
      {/* Root gradient — warm yellowish-beige with depth */}
      <linearGradient id={`root-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#c4956a" stopOpacity={0.9} />
        <stop offset="30%" stopColor="#e8c9a0" />
        <stop offset="50%" stopColor="#f0d8b4" />
        <stop offset="70%" stopColor="#e8c9a0" />
        <stop offset="100%" stopColor="#c4956a" stopOpacity={0.9} />
      </linearGradient>
      {/* Crown gradient — white with 3D shading */}
      <linearGradient id={`crown-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#a0a8b8" stopOpacity={0.6} />
        <stop offset="20%" stopColor="#dce3ec" />
        <stop offset="40%" stopColor="#f5f7fa" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#f5f7fa" />
        <stop offset="80%" stopColor="#dce3ec" />
        <stop offset="100%" stopColor="#a0a8b8" stopOpacity={0.6} />
      </linearGradient>
      {/* Enamel translucent overlay */}
      <linearGradient id={`enamel-${id}`} x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0} />
        <stop offset="40%" stopColor="white" stopOpacity={0.15} />
        <stop offset="100%" stopColor="#e8f0fe" stopOpacity={0.35} />
      </linearGradient>
      {/* Implant metallic gradient */}
      <linearGradient id={`implant-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#78909c" />
        <stop offset="25%" stopColor="#b0bec5" />
        <stop offset="50%" stopColor="#cfd8dc" />
        <stop offset="75%" stopColor="#b0bec5" />
        <stop offset="100%" stopColor="#78909c" />
      </linearGradient>
      {/* Occlusal base gradient */}
      <radialGradient id={`occ-base-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="60%" stopColor="#e8ecf0" />
        <stop offset="100%" stopColor="#c0c8d4" />
      </radialGradient>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Implant screw SVG
// ---------------------------------------------------------------------------

function ImplantScrew({
  id,
  viewBoxWidth,
  viewBoxHeight,
  cervicalY,
  isLower,
}: {
  id: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  cervicalY: number;
  isLower: boolean;
}) {
  const cx = viewBoxWidth / 2;
  const screwTop = isLower ? cervicalY + 2 : 4;
  const screwBottom = isLower ? viewBoxHeight - 4 : cervicalY - 2;
  const topWidth = viewBoxWidth * 0.3;
  const bottomWidth = viewBoxWidth * 0.1;
  const top = Math.min(screwTop, screwBottom);
  const bottom = Math.max(screwTop, screwBottom);
  const threadCount = Math.max(4, Math.floor(Math.abs(bottom - top) / 4));
  const threads: React.ReactNode[] = [];

  for (let i = 0; i < threadCount; i++) {
    const t = (i + 0.5) / threadCount;
    const y = top + t * (bottom - top);
    const halfW = topWidth - t * (topWidth - bottomWidth);
    threads.push(
      <line key={i} x1={cx - halfW} y1={y} x2={cx + halfW} y2={y} stroke="#90a4ae" strokeWidth={0.7} />
    );
  }

  return (
    <g>
      <path
        d={`M${cx - topWidth},${top} L${cx + topWidth},${top} L${cx + bottomWidth},${bottom} L${cx - bottomWidth},${bottom} Z`}
        fill={`url(#implant-${id})`}
        stroke="#607d8b"
        strokeWidth={0.5}
      />
      {threads}
      <rect
        x={cx - topWidth * 0.7}
        y={isLower ? cervicalY - 1 : cervicalY - 1}
        width={topWidth * 1.4}
        height={2.5}
        rx={0.5}
        fill="#78909c"
        stroke="#546e7a"
        strokeWidth={0.4}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ToothRenderer({
  fdi,
  view,
  status,
  surfaceConditions,
  isSelected = false,
  onClick,
  onContextMenu,
  className = '',
  width,
  height,
}: ToothRendererProps) {
  const paths = getToothPaths(fdi);
  const quadrant = Math.floor(fdi / 10);
  const isLower = quadrant === 3 || quadrant === 4;
  const id = `t${fdi}-${view}`;

  if (view === 'side') {
    return renderSideView(paths, id, fdi, status, surfaceConditions, isSelected, isLower, onClick, onContextMenu, className, width, height);
  }
  return renderOcclusalView(paths, id, fdi, status, surfaceConditions, isSelected, onClick, onContextMenu, className, width, height);
}

// ---------------------------------------------------------------------------
// Side view rendering — 3D realistic
// ---------------------------------------------------------------------------

function renderSideView(
  paths: ReturnType<typeof getToothPaths>,
  id: string,
  fdi: number,
  status: string,
  surfaceConditions: ToothRendererProps['surfaceConditions'],
  isSelected: boolean,
  isLower: boolean,
  onClick?: () => void,
  onContextMenu?: (e: React.MouseEvent) => void,
  className = '',
  width?: number,
  height?: number,
) {
  const { sideView, sideViewBox, cervicalY } = paths;
  const vb = `0 0 ${sideViewBox.width} ${sideViewBox.height}`;
  const isMissing = status === 'MISSING';
  const isImplant = status === 'IMPLANT';

  return (
    <svg
      viewBox={vb}
      width={width}
      height={height}
      className={`${className}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ cursor: onClick ? 'pointer' : 'default', overflow: 'visible' }}
    >
      <ToothGradients id={id} isLower={isLower} cervicalY={cervicalY} viewBoxHeight={sideViewBox.height} />

      {isMissing ? (
        <path
          d={sideView.outline}
          fill="none"
          stroke="#4b5563"
          strokeWidth={0.7}
          strokeDasharray="2,2"
          opacity={0.4}
        />
      ) : isImplant ? (
        <>
          <ImplantScrew
            id={id}
            viewBoxWidth={sideViewBox.width}
            viewBoxHeight={sideViewBox.height}
            cervicalY={cervicalY}
            isLower={isLower}
          />
          <path d={sideView.crown} fill={`url(#crown-${id})`} stroke="#546e7a" strokeWidth={0.5} />
          <path d={sideView.crown} fill={CONDITION_COLORS.IMPLANT} opacity={0.12} />
        </>
      ) : (
        <>
          {/* Root with gradient */}
          <path d={sideView.root} fill={`url(#root-${id})`} stroke="#b8865a" strokeWidth={0.4} />
          {/* Crown with 3D gradient */}
          <path d={sideView.crown} fill={`url(#crown-${id})`} stroke="#8090a0" strokeWidth={0.5} />
          {/* Enamel translucent overlay */}
          <path d={sideView.enamel} fill={`url(#enamel-${id})`} stroke="none" />
          {/* Cervical line */}
          <path
            d={sideView.cervicalLine}
            fill="none"
            stroke="#b8865a"
            strokeWidth={0.5}
            opacity={0.7}
          />
          {/* Status overlays */}
          {status === 'CROWN' && (
            <path d={sideView.crown} fill={CONDITION_COLORS.CROWN} opacity={0.3} stroke={CONDITION_COLORS.CROWN} strokeWidth={0.6} />
          )}
          {status === 'ENDO' && (
            <path d={sideView.root} fill={CONDITION_COLORS.ENDO} opacity={0.25} />
          )}
          {/* Surface condition overlays on crown */}
          {surfaceConditions && renderSideConditions(sideView, surfaceConditions)}
        </>
      )}
      {/* Selection glow */}
      {isSelected && (
        <>
          <path d={sideView.outline} fill="none" stroke="#60a5fa" strokeWidth={1.5} opacity={0.9} />
          <path d={sideView.outline} fill="rgba(96, 165, 250, 0.08)" stroke="none" />
        </>
      )}
    </svg>
  );
}

function renderSideConditions(
  sideView: ReturnType<typeof getToothPaths>['sideView'],
  conditions: Record<string, { condition: string; material?: string }>,
) {
  const hasCondition = Object.values(conditions).some((c) => c.condition !== 'HEALTHY');
  if (!hasCondition) return null;

  const priority = ['CARIES', 'ENDO', 'CROWN', 'FILLING', 'INLAY', 'ONLAY', 'VENEER'];
  let mainCondition = '';
  let mainMaterial = '';
  for (const p of priority) {
    const found = Object.values(conditions).find((c) => c.condition === p);
    if (found) {
      mainCondition = p;
      mainMaterial = found.material || '';
      break;
    }
  }
  if (!mainCondition) return null;

  // Use material color if available, otherwise condition color
  const color = mainMaterial && MATERIAL_COLORS[mainMaterial]
    ? MATERIAL_COLORS[mainMaterial]
    : CONDITION_COLORS[mainCondition] || 'transparent';
  if (color === 'transparent') return null;

  return (
    <path d={sideView.crown} fill={color} opacity={0.35} />
  );
}

// ---------------------------------------------------------------------------
// Occlusal view rendering — 3D realistic
// ---------------------------------------------------------------------------

function renderOcclusalView(
  paths: ReturnType<typeof getToothPaths>,
  id: string,
  fdi: number,
  status: string,
  surfaceConditions: ToothRendererProps['surfaceConditions'],
  isSelected: boolean,
  onClick?: () => void,
  onContextMenu?: (e: React.MouseEvent) => void,
  className = '',
  width?: number,
  height?: number,
) {
  const { occlusalView, occlusalViewBox, cervicalY, sideViewBox } = paths;
  const vb = `0 0 ${occlusalViewBox.width} ${occlusalViewBox.height}`;
  const isMissing = status === 'MISSING';
  const surfaceKeys: SurfaceKey[] = ['M', 'D', 'O', 'B', 'L'];

  return (
    <svg
      viewBox={vb}
      width={width}
      height={height}
      className={`${className}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <ToothGradients id={id} isLower={false} cervicalY={cervicalY} viewBoxHeight={sideViewBox.height} />

      {isMissing ? (
        <path
          d={occlusalView.outline}
          fill="none"
          stroke="#4b5563"
          strokeWidth={0.5}
          strokeDasharray="2,2"
          opacity={0.35}
        />
      ) : (
        <>
          {/* Base with radial gradient for 3D depth */}
          <path d={occlusalView.outline} fill={`url(#occ-base-${id})`} stroke="#7a8694" strokeWidth={0.5} />

          {/* Individual surface fills */}
          {surfaceKeys.map((key) => {
            const surfacePath = occlusalView.surfaces[key];
            if (!surfacePath) return null;

            const condition = surfaceConditions?.[key];
            let fillColor = 'transparent';
            let fillOpacity = 0;

            if (condition) {
              if (condition.material && MATERIAL_COLORS[condition.material]) {
                fillColor = MATERIAL_COLORS[condition.material];
                fillOpacity = 0.7;
              } else if (condition.condition && CONDITION_COLORS[condition.condition]) {
                fillColor = CONDITION_COLORS[condition.condition];
                fillOpacity = condition.condition === 'HEALTHY' ? 0 : 0.55;
              }
            }

            return (
              <path
                key={key}
                d={surfacePath}
                fill={fillColor}
                fillOpacity={fillOpacity}
                stroke="#9ca3af"
                strokeWidth={0.25}
                strokeOpacity={0.6}
              />
            );
          })}

          {/* Fissure lines */}
          {occlusalView.fissures && (
            <path
              d={occlusalView.fissures}
              fill="none"
              stroke="#7a8694"
              strokeWidth={0.4}
              strokeLinecap="round"
              opacity={0.7}
            />
          )}

          {/* Crown/Implant overlay */}
          {status === 'CROWN' && (
            <path d={occlusalView.outline} fill={CONDITION_COLORS.CROWN} opacity={0.25} stroke={CONDITION_COLORS.CROWN} strokeWidth={0.6} />
          )}
          {status === 'IMPLANT' && (
            <>
              <path d={occlusalView.outline} fill={CONDITION_COLORS.IMPLANT} opacity={0.2} />
              <circle
                cx={occlusalViewBox.width / 2}
                cy={occlusalViewBox.height / 2}
                r={Math.min(occlusalViewBox.width, occlusalViewBox.height) * 0.15}
                fill="none"
                stroke="#7c3aed"
                strokeWidth={0.5}
              />
            </>
          )}
        </>
      )}
      {/* Selection glow */}
      {isSelected && (
        <>
          <path d={occlusalView.outline} fill="none" stroke="#60a5fa" strokeWidth={1} opacity={0.9} />
          <path d={occlusalView.outline} fill="rgba(96, 165, 250, 0.08)" stroke="none" />
        </>
      )}
    </svg>
  );
}
