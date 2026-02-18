'use client';

import React from 'react';

// ── Types ──────────────────────────────────────────────────

export interface PerioSiteData {
  toothNumber: number;
  surface: string;
  sitePosition: string;
  probingDepth: number;
  gingivalMargin: number;
  bleeding: boolean;
  plaque: boolean;
  suppuration: boolean;
  mobility?: number | null;
  furcationGrade?: number | null;
  isImplant?: boolean;
  toothNote?: string | null;
  keratinizedWidth?: number | null;
}

// ── Color maps (static Tailwind classes — no dynamic interpolation) ──

const bopColors = {
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
} as const;

const riskColors = {
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  High: 'bg-red-500/20 text-red-300 border-red-500/40',
} as const;

// ── Helpers ────────────────────────────────────────────────

function getThresholdColor(value: number, greenMax: number, yellowMax: number) {
  if (value <= greenMax) return bopColors.green;
  if (value <= yellowMax) return bopColors.yellow;
  return bopColors.red;
}

function countColor(value: number) {
  if (value === 0) return bopColors.green;
  if (value <= 5) return bopColors.yellow;
  return bopColors.red;
}

// ── Stats calculation ──────────────────────────────────────

export function calculatePerioStats(sites: PerioSiteData[]) {
  if (sites.length === 0) {
    return {
      bopPercent: 0,
      plaquePercent: 0,
      meanPD: 0,
      sitesGte6: 0,
      totalTeeth: 0,
      totalSites: 0,
      suppurationCount: 0,
      maxPD: 0,
    };
  }

  const totalSites = sites.length;
  const bleedingSites = sites.filter((s) => s.bleeding).length;
  const plaqueSites = sites.filter((s) => s.plaque).length;
  const sitesGte6 = sites.filter((s) => s.probingDepth >= 6).length;
  const sumPD = sites.reduce((acc, s) => acc + s.probingDepth, 0);
  const maxPD = Math.max(...sites.map((s) => s.probingDepth), 0);

  // Unique teeth with suppuration
  const teethWithSuppuration = new Set(
    sites.filter((s) => s.suppuration).map((s) => s.toothNumber)
  );

  // Unique teeth charted
  const uniqueTeeth = new Set(sites.map((s) => s.toothNumber));

  return {
    bopPercent: Math.round((bleedingSites / totalSites) * 100),
    plaquePercent: Math.round((plaqueSites / totalSites) * 100),
    meanPD: Math.round((sumPD / totalSites) * 10) / 10,
    sitesGte6,
    totalTeeth: uniqueTeeth.size,
    totalSites,
    suppurationCount: teethWithSuppuration.size,
    maxPD,
  };
}

// ── Risk score ─────────────────────────────────────────────

export function calculateRiskScore(
  bopPercent: number,
  maxPD: number,
  stage: string
): 'High' | 'Medium' | 'Low' {
  if (
    stage === 'Stage III' ||
    stage === 'Stage IV' ||
    bopPercent > 30 ||
    maxPD >= 7
  ) {
    return 'High';
  }
  if (
    stage === 'Stage II' ||
    (bopPercent >= 10 && bopPercent <= 30) ||
    (maxPD >= 5 && maxPD < 7)
  ) {
    return 'Medium';
  }
  return 'Low';
}

// ── Component ──────────────────────────────────────────────

interface PerioSummaryProps {
  sites: PerioSiteData[];
  stage: string;
  grade: string;
}

export default function PerioSummary({ sites, stage, grade }: PerioSummaryProps) {
  const stats = calculatePerioStats(sites);
  const risk = calculateRiskScore(stats.bopPercent, stats.maxPD, stage);

  const cards = [
    {
      label: 'BOP%',
      value: `${stats.bopPercent}%`,
      color: getThresholdColor(stats.bopPercent, 10, 30),
    },
    {
      label: "Plaque% (O'Leary)",
      value: `${stats.plaquePercent}%`,
      color: getThresholdColor(stats.plaquePercent, 10, 30),
    },
    {
      label: 'Mean PD',
      value: `${stats.meanPD}mm`,
      color: getThresholdColor(stats.meanPD, 3.5, 5),
    },
    {
      label: 'Sites >=6mm',
      value: String(stats.sitesGte6),
      color: countColor(stats.sitesGte6),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Risk badge */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${riskColors[risk]}`}
        >
          Risk: {risk}
        </span>
        <span className="text-xs text-slate-400">
          {stats.totalTeeth} teeth | {stats.totalSites} sites |{' '}
          {stats.suppurationCount} suppuration
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-3 text-center ${card.color}`}
          >
            <div className="text-lg font-bold">{card.value}</div>
            <div className="text-xs opacity-80">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
