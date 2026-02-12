import type { Point } from '../types';
import { distance } from './geometry';

/**
 * Compute mm_per_pixel from two calibration points and a known real-world distance.
 * Points are in normalized 0–1 coords; imageWidth is the natural image width in pixels.
 */
export function computeMmPerPixel(
  p1: Point,
  p2: Point,
  knownDistanceMm: number,
  imageWidth: number,
): number {
  // Convert normalized coords to pixel coords
  const pixelDist = distance(
    { x: p1.x * imageWidth, y: p1.y * imageWidth },
    { x: p2.x * imageWidth, y: p2.y * imageWidth },
  );
  if (pixelDist === 0) return 0;
  return knownDistanceMm / pixelDist;
}

/** Convert a normalized distance to millimeters */
export function normalizedToMm(
  normalizedDist: number,
  imageWidth: number,
  mmPerPixel: number,
): number {
  return normalizedDist * imageWidth * mmPerPixel;
}

/** Convert pixel distance to mm */
export function pixelToMm(pixelDist: number, mmPerPixel: number): number {
  return pixelDist * mmPerPixel;
}
