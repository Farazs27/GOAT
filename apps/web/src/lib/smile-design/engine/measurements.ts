import type { LandmarkPoint, DerivedStructures, CalibrationData, Measurements, Point } from '../types';
import { distance, angleBetweenLines, perpendicularDistance } from './geometry';
import { normalizedToMm } from './calibration';

function findLandmark(landmarks: LandmarkPoint[], type: string): Point | null {
  const lm = landmarks.find(l => l.type === type);
  return lm ? { x: lm.x, y: lm.y } : null;
}

function toMm(normalizedDist: number, cal: CalibrationData | null, imageWidth: number): number | null {
  if (!cal || !imageWidth) return null;
  return normalizedToMm(normalizedDist, imageWidth, cal.mmPerPixel);
}

export function computeMeasurements(
  landmarks: LandmarkPoint[],
  derived: DerivedStructures,
  calibration: CalibrationData | null,
  imageWidth: number = 1,
): Measurements {
  const result: Measurements = {
    midlineDeviationMm: null,
    midlineDeviationDeg: null,
    incisalPlaneAngleDeg: null,
    widthRatios: { r11_12: null, r12_13: null },
    centralDominance: null,
    redProportion: null,
    goldenProportionDeviation: null,
  };

  // --- Midline deviation ---
  if (derived.facialMidline && derived.dentalMidline) {
    // Measure deviation at the dental midline start point
    const dentalMid = derived.dentalMidline.start;
    const normalizedDev = perpendicularDistance(dentalMid, derived.facialMidline);
    result.midlineDeviationMm = toMm(normalizedDev, calibration, imageWidth);

    // Angular deviation between the two midlines
    result.midlineDeviationDeg = angleBetweenLines(derived.facialMidline, derived.dentalMidline);
  }

  // --- Incisal plane angle vs interpupillary ---
  if (derived.incisalPlane && derived.interpupillaryLine) {
    result.incisalPlaneAngleDeg = angleBetweenLines(derived.incisalPlane, derived.interpupillaryLine);
  }

  // --- Tooth width ratios ---
  // Width of tooth 11: distance from INCISAL_11_LEFT to INCISAL_11_RIGHT
  const i11l = findLandmark(landmarks, 'INCISAL_11_LEFT');
  const i11r = findLandmark(landmarks, 'INCISAL_11_RIGHT');
  const i21l = findLandmark(landmarks, 'INCISAL_21_LEFT');
  const i21r = findLandmark(landmarks, 'INCISAL_21_RIGHT');
  const cusp13 = findLandmark(landmarks, 'CUSP_13');
  const cusp23 = findLandmark(landmarks, 'CUSP_23');

  const w11 = i11l && i11r ? distance(i11l, i11r) : null;
  const w21 = i21l && i21r ? distance(i21l, i21r) : null;

  // Width of tooth 12 approximated: from INCISAL_11_RIGHT to midpoint between 11_RIGHT and CUSP_13
  // This is a simplification — full accuracy requires 12 landmarks
  // For now, compute intercanine and derive
  const intercanine = cusp13 && cusp23 ? distance(cusp13, cusp23) : null;

  // Central dominance: width of central / intercanine width
  if (w11 && intercanine && intercanine > 0) {
    result.centralDominance = Math.round((w11 / intercanine) * 100) / 100;
  }

  // Width ratios (11:21 symmetry as proxy for 11:12)
  if (w11 && w21 && w21 > 0) {
    result.widthRatios.r11_12 = Math.round((w11 / w21) * 100) / 100;
  }

  // RED proportion: lateral/central width ratio (target ~0.70)
  // Approximate lateral width as (intercanine - 2 * central) / 2
  if (w11 && intercanine) {
    const avgCentral = w21 ? (w11 + w21) / 2 : w11;
    const lateralApprox = (intercanine - 2 * avgCentral) / 2;
    if (avgCentral > 0 && lateralApprox > 0) {
      result.redProportion = Math.round((lateralApprox / avgCentral) * 100) / 100;
    }
  }

  // Golden proportion deviation: ideal lateral/central = 0.618
  if (result.redProportion !== null) {
    result.goldenProportionDeviation = Math.round((result.redProportion - 0.618) * 1000) / 1000;
  }

  return result;
}
