'use client';

import React from 'react';
import ToothSVG from './tooth-svg';
import type { PerioSiteData } from './perio-entry-panel';

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const DEPTH_BAR_COLORS: Record<string, string> = {
  green: '#10b981',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
};

function getDepthColorKey(d: number): string {
  if (d <= 3) return 'green';
  if (d <= 5) return 'yellow';
  if (d === 6) return 'orange';
  return 'red';
}

interface PerioChartProps {
  presentTeeth: number[];
  sites: PerioSiteData[];
  currentTooth?: number;
  currentSurface?: 'buccal' | 'lingual';
}

function getSiteValue(sites: PerioSiteData[], tooth: number, surface: string, position: string): PerioSiteData | undefined {
  return sites.find(
    (s) => s.toothNumber === tooth && s.surface === surface && s.sitePosition === position
  );
}

const POSITIONS = ['mesial', 'mid', 'distal'] as const;

function ToothColumn({
  tooth,
  sites,
  surface,
  isCurrentTooth,
  isCurrentSurface,
}: {
  tooth: number;
  sites: PerioSiteData[];
  surface: 'buccal' | 'lingual';
  isCurrentTooth: boolean;
  isCurrentSurface: boolean;
}) {
  const maxBarHeight = 40;
  const maxDepth = 10;

  return (
    <div className="flex flex-col items-center" style={{ width: 50 }}>
      {/* Depth bars */}
      <div className="flex items-end gap-px" style={{ height: maxBarHeight }}>
        {POSITIONS.map((pos) => {
          const site = getSiteValue(sites, tooth, surface, pos);
          const depth = site?.probingDepth ?? 0;
          const height = depth > 0 ? Math.max(4, (depth / maxDepth) * maxBarHeight) : 0;
          const colorKey = getDepthColorKey(depth);
          const color = DEPTH_BAR_COLORS[colorKey];

          return (
            <div key={pos} className="flex flex-col items-center gap-0.5">
              <div
                style={{
                  width: 10,
                  height,
                  backgroundColor: color,
                  borderRadius: 2,
                  transition: 'height 0.2s',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* BOP / Plaque indicators */}
      <div className="flex gap-0.5 mt-0.5">
        {POSITIONS.map((pos) => {
          const site = getSiteValue(sites, tooth, surface, pos);
          return (
            <div key={pos} className="flex flex-col items-center gap-0.5">
              {site?.bleeding && (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              )}
              {site?.plaque && (
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              )}
              {!site?.bleeding && !site?.plaque && (
                <span className="w-2 h-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Depth numbers */}
      <div className="flex gap-px mt-0.5">
        {POSITIONS.map((pos) => {
          const site = getSiteValue(sites, tooth, surface, pos);
          const depth = site?.probingDepth ?? 0;
          return (
            <span
              key={pos}
              className="text-[9px] font-bold text-center"
              style={{
                width: 12,
                color: depth > 0 ? DEPTH_BAR_COLORS[getDepthColorKey(depth)] : '#475569',
              }}
            >
              {depth > 0 ? depth : '-'}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TeethRow({
  teeth,
  presentTeeth,
  sites,
  surface,
  currentTooth,
  currentSurface,
  label,
}: {
  teeth: number[];
  presentTeeth: number[];
  sites: PerioSiteData[];
  surface: 'buccal' | 'lingual';
  currentTooth?: number;
  currentSurface?: 'buccal' | 'lingual';
  label: string;
}) {
  const present = teeth.filter((t) => presentTeeth.includes(t));

  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
        {label}
      </div>
      <div className="flex overflow-x-auto">
        {present.map((tooth) => {
          const isCurrentTooth = tooth === currentTooth;
          const isCurrentSurface = surface === currentSurface;

          return (
            <div
              key={tooth}
              className={`flex flex-col items-center transition-all ${
                isCurrentTooth && isCurrentSurface
                  ? 'bg-blue-500/10 rounded-xl ring-1 ring-blue-400/30'
                  : ''
              }`}
              style={{ width: 50 }}
            >
              <ToothColumn
                tooth={tooth}
                sites={sites}
                surface={surface}
                isCurrentTooth={isCurrentTooth}
                isCurrentSurface={isCurrentSurface}
              />
              <ToothSVG
                toothNumber={tooth}
                isSelected={isCurrentTooth && isCurrentSurface}
                width={40}
                height={50}
              />
              <span className={`text-[10px] font-bold mb-1 ${
                isCurrentTooth ? 'text-blue-400' : 'text-slate-500'
              }`}>
                {tooth}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PerioChart({ presentTeeth, sites, currentTooth, currentSurface }: PerioChartProps) {
  // Stats
  const totalSitesWithData = sites.filter((s) => s.probingDepth > 0).length;
  const bopCount = sites.filter((s) => s.bleeding).length;
  const bopPct = totalSitesWithData > 0 ? Math.round((bopCount / totalSitesWithData) * 100) : 0;
  const plaqueCount = sites.filter((s) => s.plaque).length;
  const plaquePct = totalSitesWithData > 0 ? Math.round((plaqueCount / totalSitesWithData) * 100) : 0;
  const depths = sites.filter((s) => s.probingDepth > 0).map((s) => s.probingDepth);
  const meanPD = depths.length > 0 ? (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1) : '-';
  const sitesGte6 = depths.filter((d) => d >= 6).length;

  return (
    <div className="flex flex-col h-full">
      {/* Summary stats */}
      <div className="flex items-center gap-4 flex-wrap mb-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-red-400">BOP:</span> {bopPct}%
        </div>
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-blue-400">Plaque:</span> {plaquePct}%
        </div>
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Gem. PD:</span> {meanPD} mm
        </div>
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-orange-400">&gt;=6mm:</span> {sitesGte6}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPTH_BAR_COLORS['green'] }} />
          <span className="text-slate-500">0-3mm</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPTH_BAR_COLORS['yellow'] }} />
          <span className="text-slate-500">4-5mm</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPTH_BAR_COLORS['orange'] }} />
          <span className="text-slate-500">6mm</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPTH_BAR_COLORS['red'] }} />
          <span className="text-slate-500">7+mm</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-500">BOP</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-500">Plaque</span>
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto">
        {/* Upper jaw - buccal */}
        <TeethRow
          teeth={UPPER_TEETH}
          presentTeeth={presentTeeth}
          sites={sites}
          surface="buccal"
          currentTooth={currentTooth}
          currentSurface={currentSurface}
          label="Bovenkaak - Buccaal"
        />

        {/* Upper jaw - lingual/palatal */}
        <TeethRow
          teeth={UPPER_TEETH}
          presentTeeth={presentTeeth}
          sites={sites}
          surface="lingual"
          currentTooth={currentTooth}
          currentSurface={currentSurface}
          label="Bovenkaak - Palatinaal"
        />

        {/* Divider */}
        <div className="my-3 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

        {/* Lower jaw - buccal */}
        <TeethRow
          teeth={LOWER_TEETH}
          presentTeeth={presentTeeth}
          sites={sites}
          surface="buccal"
          currentTooth={currentTooth}
          currentSurface={currentSurface}
          label="Onderkaak - Buccaal"
        />

        {/* Lower jaw - lingual */}
        <TeethRow
          teeth={LOWER_TEETH}
          presentTeeth={presentTeeth}
          sites={sites}
          surface="lingual"
          currentTooth={currentTooth}
          currentSurface={currentSurface}
          label="Onderkaak - Linguaal"
        />
      </div>
    </div>
  );
}
