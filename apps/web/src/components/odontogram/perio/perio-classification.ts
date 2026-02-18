import type { PerioToothData } from '@/../../packages/shared-types/src/odontogram';

/**
 * Classify periodontal stage per 2018 EFP/AAP criteria.
 * Based on interdental CAL at site of greatest loss and radiographic bone loss.
 * Simplified: uses max probing depth + teeth lost as proxy.
 */
export function classifyPeriodontalStage(
  maxProbingDepth: number,
  teethLostDueToPerio: number
): string {
  // Stage IV: >= 5 teeth lost due to perio OR very deep pockets
  if (teethLostDueToPerio >= 5 || maxProbingDepth >= 8) return 'Stage IV';
  // Stage III: CAL >= 5mm or deep pockets, < 5 teeth lost
  if (maxProbingDepth >= 6 || teethLostDueToPerio >= 1) return 'Stage III';
  // Stage II: CAL 3-4mm
  if (maxProbingDepth >= 4) return 'Stage II';
  // Stage I: CAL 1-2mm
  if (maxProbingDepth >= 1) return 'Stage I';
  return 'Gezond';
}

/**
 * Classify periodontal grade per 2018 EFP/AAP criteria.
 * Grade A: slow progression, Grade B: moderate, Grade C: rapid.
 */
export function classifyPeriodontalGrade(
  boneLossRate: number,
  isSmoker: boolean,
  hasDiabetes: boolean
): string {
  // Grade C: rapid progression or risk factors
  if (boneLossRate > 1.0 || isSmoker || hasDiabetes) return 'Grade C';
  // Grade A: slow
  if (boneLossRate < 0.25) return 'Grade A';
  // Grade B: moderate (default)
  return 'Grade B';
}

/**
 * Calculate BOP (Bleeding on Probing) percentage across all sites.
 */
export function calculateBOPPercentage(
  perioData: Record<string, PerioToothData>
): number {
  let bleedingSites = 0;
  let totalSites = 0;

  Object.values(perioData).forEach((tooth) => {
    if (tooth.missing) return;
    for (const side of ['buccal', 'palatal'] as const) {
      const bleeding = tooth[side]?.bleeding ?? [false, false, false];
      bleeding.forEach((b) => {
        totalSites++;
        if (b) bleedingSites++;
      });
    }
  });

  if (totalSites === 0) return 0;
  return Math.round((bleedingSites / totalSites) * 100);
}

/**
 * Calculate average probing depth across all sites.
 */
export function calculateAverageProbing(
  perioData: Record<string, PerioToothData>
): number {
  let sum = 0;
  let count = 0;

  Object.values(perioData).forEach((tooth) => {
    if (tooth.missing) return;
    for (const side of ['buccal', 'palatal'] as const) {
      const depths = tooth[side]?.probingDepth ?? [0, 0, 0];
      depths.forEach((d) => {
        sum += d;
        count++;
      });
    }
  });

  if (count === 0) return 0;
  return Math.round((sum / count) * 10) / 10;
}

/**
 * Get max probing depth across all teeth and sites.
 */
function getMaxProbingDepth(perioData: Record<string, PerioToothData>): number {
  let max = 0;
  Object.values(perioData).forEach((tooth) => {
    if (tooth.missing) return;
    for (const side of ['buccal', 'palatal'] as const) {
      const depths = tooth[side]?.probingDepth ?? [0, 0, 0];
      depths.forEach((d) => {
        if (d > max) max = d;
      });
    }
  });
  return max;
}

/**
 * Get full periodontal summary with stage, grade, BOP%, avg probing, max probing.
 */
export function getPerioSummary(
  perioData: Record<string, PerioToothData>,
  teethLost = 0,
  isSmoker = false,
  hasDiabetes = false
): {
  stage: string;
  grade: string;
  bopPercent: number;
  avgProbing: number;
  maxProbing: number;
} {
  const maxProbing = getMaxProbingDepth(perioData);
  const bopPercent = calculateBOPPercentage(perioData);
  const avgProbing = calculateAverageProbing(perioData);
  const stage = classifyPeriodontalStage(maxProbing, teethLost);
  // Default bone loss rate to 0.5 (moderate) when unknown
  const grade = classifyPeriodontalGrade(0.5, isSmoker, hasDiabetes);

  return { stage, grade, bopPercent, avgProbing, maxProbing };
}
