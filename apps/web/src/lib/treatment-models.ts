/**
 * Maps treatment descriptions to 3D model paths for visual timeline.
 */

const IMPLANT_MODEL = '/models/treatments/implant/implant.glb';

export function getTreatmentModelPath(description: string, nzaCode?: string): string | null {
  const desc = (description || '').toLowerCase();
  const code = (nzaCode || '').toUpperCase();

  // Implant, crown, extraction, botopbouw — all part of implant workflow
  if (
    desc.includes('implant') || desc.includes('implantaat') ||
    desc.includes('kroon') || desc.includes('crown') ||
    desc.includes('abutment') || desc.includes('botopbouw') ||
    desc.includes('extractie') || desc.includes('wortelrest') ||
    code.startsWith('J') || code.startsWith('R')
  ) {
    return IMPLANT_MODEL;
  }

  return null;
}
