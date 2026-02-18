'use client';

import React from 'react';
import type { PerioSiteData } from './perio-summary';

// ── Static color maps ──────────────────────────────────────

const stageColors: Record<string, string> = {
  'Gezond': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'Stage I': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  'Stage II': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Stage III': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'Stage IV': 'bg-red-500/20 text-red-300 border-red-500/40',
};

const gradeColors: Record<string, string> = {
  'Grade A': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'Grade B': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Grade C': 'bg-red-500/20 text-red-300 border-red-500/40',
};

// ── Classification logic (EFP/AAP 2017 World Workshop) ─────

/**
 * Stage calculation (simplified clinical proxy):
 * - Stage I: PD 1-4mm, no tooth loss due to perio
 * - Stage II: PD <=5mm, no tooth loss
 * - Stage III: PD >=6mm, tooth loss <=4 teeth
 * - Stage IV: PD >=6mm, tooth loss >=5 teeth OR need complex rehab
 */
export function calculateStage(
  maxPD: number,
  teethLostDueToPerio: number = 0
): string {
  if (teethLostDueToPerio >= 5 || maxPD >= 8) return 'Stage IV';
  if (maxPD >= 6 || teethLostDueToPerio >= 1) return 'Stage III';
  if (maxPD >= 4) return 'Stage II';
  if (maxPD >= 1) return 'Stage I';
  return 'Gezond';
}

/**
 * Grade calculation:
 * - Grade A: No evidence of progression (default when no data)
 * - Grade B: Moderate progression (default)
 * - Grade C: Rapid progression (smoking, diabetes, high bone loss rate)
 */
export function calculateGrade(
  options?: { boneLossRate?: number; isSmoker?: boolean; hasDiabetes?: boolean }
): string {
  const { boneLossRate = 0.5, isSmoker = false, hasDiabetes = false } = options ?? {};
  if (boneLossRate > 1.0 || isSmoker || hasDiabetes) return 'Grade C';
  if (boneLossRate < 0.25) return 'Grade A';
  return 'Grade B';
}

/**
 * Derive classification from raw site data.
 */
export function classifyFromSites(
  sites: PerioSiteData[],
  teethLostDueToPerio: number = 0,
  gradeOptions?: { boneLossRate?: number; isSmoker?: boolean; hasDiabetes?: boolean }
) {
  const maxPD = sites.length > 0 ? Math.max(...sites.map((s) => s.probingDepth), 0) : 0;
  return {
    stage: calculateStage(maxPD, teethLostDueToPerio),
    grade: calculateGrade(gradeOptions),
    maxPD,
  };
}

// ── Component ──────────────────────────────────────────────

interface PerioClassificationProps {
  sites: PerioSiteData[];
  teethLostDueToPerio?: number;
  gradeOptions?: { boneLossRate?: number; isSmoker?: boolean; hasDiabetes?: boolean };
}

export default function PerioClassification({
  sites,
  teethLostDueToPerio = 0,
  gradeOptions,
}: PerioClassificationProps) {
  const { stage, grade } = classifyFromSites(sites, teethLostDueToPerio, gradeOptions);

  const stageColor = stageColors[stage] ?? stageColors['Gezond'];
  const gradeColor = gradeColors[grade] ?? gradeColors['Grade B'];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-medium">EFP/AAP:</span>
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stageColor}`}
      >
        {stage}
      </span>
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${gradeColor}`}
      >
        {grade}
      </span>
    </div>
  );
}
