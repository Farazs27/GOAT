import type { Point, Line } from '../types';

export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function lineFromPoints(a: Point, b: Point): Line {
  return { start: a, end: b };
}

/** Angle of a line relative to horizontal, in degrees (-180 to 180) */
export function lineAngle(line: Line): number {
  return Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * (180 / Math.PI);
}

/** Angle between two lines in degrees (0 to 90) */
export function angleBetweenLines(l1: Line, l2: Line): number {
  const a1 = lineAngle(l1) * (Math.PI / 180);
  const a2 = lineAngle(l2) * (Math.PI / 180);
  let diff = Math.abs(a1 - a2);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  if (diff > Math.PI / 2) diff = Math.PI - diff;
  return diff * (180 / Math.PI);
}

/** Perpendicular distance from a point to a line (in normalized coords) */
export function perpendicularDistance(point: Point, line: Line): number {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return distance(point, line.start);
  return Math.abs(dy * point.x - dx * point.y + line.end.x * line.start.y - line.end.y * line.start.x) / len;
}

/** Least-squares best-fit line through a set of points */
export function leastSquaresLine(points: Point[]): Line | null {
  if (points.length < 2) return null;

  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const denom = n * sumX2 - sumX * sumX;

  // Near-vertical line — fit x = f(y) instead
  if (Math.abs(denom) < 1e-10) {
    const avgX = sumX / n;
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    return { start: { x: avgX, y: minY }, end: { x: avgX, y: maxY } };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));

  return {
    start: { x: minX, y: slope * minX + intercept },
    end: { x: maxX, y: slope * maxX + intercept },
  };
}

/** Catmull-Rom spline interpolation through control points */
export function catmullRomSpline(points: Point[], segments: number = 20): Point[] {
  if (points.length < 2) return [...points];
  if (points.length === 2) return [...points];

  const result: Point[] = [];

  // Pad endpoints
  const padded = [
    { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y },
    ...points,
    {
      x: 2 * points[points.length - 1].x - points[points.length - 2].x,
      y: 2 * points[points.length - 1].y - points[points.length - 2].y,
    },
  ];

  for (let i = 1; i < padded.length - 2; i++) {
    const p0 = padded[i - 1];
    const p1 = padded[i];
    const p2 = padded[i + 1];
    const p3 = padded[i + 2];

    for (let t = 0; t <= 1; t += 1 / segments) {
      const t2 = t * t;
      const t3 = t2 * t;
      result.push({
        x:
          0.5 * (2 * p1.x + (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 * (2 * p1.y + (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }

  return result;
}

/** Extend a line segment beyond its endpoints for rendering */
export function extendLine(line: Line, extension: number): Line {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return line;
  const ux = dx / len;
  const uy = dy / len;
  return {
    start: { x: line.start.x - ux * extension, y: line.start.y - uy * extension },
    end: { x: line.end.x + ux * extension, y: line.end.y + uy * extension },
  };
}
