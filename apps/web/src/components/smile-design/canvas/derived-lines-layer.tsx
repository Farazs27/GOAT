'use client';

import { Line } from 'react-konva';
import { useDsdStore } from '@/lib/smile-design/store';
import type { Line as LineType, Point } from '@/lib/smile-design/types';

interface Props {
  displayWidth: number;
  displayHeight: number;
}

function toPixel(p: Point, w: number, h: number): [number, number] {
  return [p.x * w, p.y * h];
}

/** Extend a line to span the full image width or height */
function extendLineFull(line: LineType, w: number, h: number): number[] {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;

  // Near-vertical line — extend to full height
  if (Math.abs(dx) < 0.001) {
    const avgX = (line.start.x + line.end.x) / 2;
    return [avgX * w, 0, avgX * w, h];
  }

  // Extend to x=0 and x=1 (full width)
  const slope = dy / dx;
  const y0 = line.start.y + slope * (0 - line.start.x);
  const y1 = line.start.y + slope * (1 - line.start.x);
  return [0, y0 * h, w, y1 * h];
}

function linePoints(line: LineType, w: number, h: number): number[] {
  const [x1, y1] = toPixel(line.start, w, h);
  const [x2, y2] = toPixel(line.end, w, h);
  return [x1, y1, x2, y2];
}

function splinePoints(points: Point[], w: number, h: number): number[] {
  return points.flatMap(p => [p.x * w, p.y * h]);
}

export function DerivedLinesLayer({ displayWidth, displayHeight }: Props) {
  const derived = useDsdStore((s) => s.derivedStructures);
  const zoom = useDsdStore((s) => s.zoom);

  if (!derived) return null;

  const w = displayWidth;
  const h = displayHeight;
  const thin = 0.7 / zoom;
  const medium = 1 / zoom;

  return (
    <>
      {/* ── FACIAL LINES ── */}

      {/* Facial midline — black, full height */}
      {derived.facialMidline && (
        <Line
          points={extendLineFull(derived.facialMidline, w, h)}
          stroke="black"
          strokeWidth={thin}
          opacity={0.7}
          listening={false}
        />
      )}

      {/* Interpupillary line — dark red, full width */}
      {derived.interpupillaryLine && (
        <Line
          points={extendLineFull(derived.interpupillaryLine, w, h)}
          stroke="#dc2626"
          strokeWidth={thin}
          opacity={0.6}
          listening={false}
        />
      )}

      {/* Commissure line — dark red, full width */}
      {derived.commissureLine && (
        <Line
          points={extendLineFull(derived.commissureLine, w, h)}
          stroke="#dc2626"
          strokeWidth={thin}
          opacity={0.45}
          listening={false}
        />
      )}

      {/* ── DENTAL LINES ── */}

      {/* Dental midline — black, extends through teeth area */}
      {derived.dentalMidline && (
        <Line
          points={linePoints(derived.dentalMidline, w, h)}
          stroke="black"
          strokeWidth={medium}
          opacity={0.8}
          listening={false}
        />
      )}

      {/* Incisal plane — dark yellow/gold */}
      {derived.incisalPlane && (
        <Line
          points={extendLineFull(derived.incisalPlane, w, h)}
          stroke="#a16207"
          strokeWidth={thin}
          opacity={0.5}
          listening={false}
        />
      )}

      {/* Smile arc — black smooth curve */}
      {derived.smileArc && derived.smileArc.length > 1 && (
        <Line
          points={splinePoints(derived.smileArc, w, h)}
          stroke="black"
          strokeWidth={medium}
          opacity={0.7}
          tension={0}
          listening={false}
        />
      )}

      {/* Gingival curve — black smooth curve */}
      {derived.gingivalCurve && derived.gingivalCurve.length > 1 && (
        <Line
          points={splinePoints(derived.gingivalCurve, w, h)}
          stroke="black"
          strokeWidth={thin}
          opacity={0.6}
          tension={0}
          listening={false}
        />
      )}

      {/* ── TOOTH OUTLINES (egg-shaped contours) ── */}
      {derived.toothOutlines && derived.toothOutlines.map((outline, i) => (
        <Line
          key={`tooth-outline-${i}`}
          points={splinePoints(outline, w, h)}
          stroke="black"
          strokeWidth={thin}
          opacity={0.6}
          tension={0}
          closed
          listening={false}
        />
      ))}

      {/* ── HORIZONTAL CONTACT LINES ── */}
      {derived.contactLines && derived.contactLines.map((cl, i) => (
        <Line
          key={`contact-line-${i}`}
          points={[cl.start.x * w, cl.start.y * h, cl.end.x * w, cl.end.y * h]}
          stroke="black"
          strokeWidth={medium}
          opacity={0.7}
          listening={false}
        />
      ))}

      {/* ── INTERPROXIMAL LINES (vertical lines between teeth) ── */}
      <InterproximalLines w={w} h={h} strokeWidth={thin} />
    </>
  );
}

/** Vertical dashed lines from gingival to incisal for each tooth boundary */
function InterproximalLines({ w, h, strokeWidth }: { w: number; h: number; strokeWidth: number }) {
  const landmarks = useDsdStore((s) => s.landmarks);

  // Draw vertical lines at tooth boundaries (contact points and outer edges)
  const boundaryTypes = [
    'CONTACT_11_21', 'CONTACT_11_12', 'CONTACT_21_22',
    'INCISAL_11_LEFT', 'INCISAL_21_RIGHT',
    'CUSP_13', 'CUSP_23',
  ];

  const dentalLandmarks = landmarks.filter(lm => boundaryTypes.includes(lm.type));
  if (dentalLandmarks.length < 2) return null;

  // Find gingival and incisal y bounds
  const gingivalTypes = ['GINGIVAL_11', 'GINGIVAL_21', 'GINGIVAL_12', 'GINGIVAL_22', 'GINGIVAL_13', 'GINGIVAL_23'];
  const incisalTypes = ['INCISAL_11_LEFT', 'INCISAL_11_RIGHT', 'INCISAL_21_LEFT', 'INCISAL_21_RIGHT', 'INCISAL_12', 'INCISAL_22', 'CUSP_13', 'CUSP_23'];
  const gLandmarks = landmarks.filter(lm => gingivalTypes.includes(lm.type));
  const iLandmarks = landmarks.filter(lm => incisalTypes.includes(lm.type));

  if (gLandmarks.length === 0 || iLandmarks.length === 0) return null;

  const topY = Math.min(...gLandmarks.map(l => l.y)) - 0.01;
  const bottomY = Math.max(...iLandmarks.map(l => l.y)) + 0.01;

  // Get unique x positions for vertical lines
  const xPositions = [...new Set(dentalLandmarks.map(l => l.x))].sort();

  return (
    <>
      {xPositions.map((x, i) => (
        <Line
          key={i}
          points={[x * w, topY * h, x * w, bottomY * h]}
          stroke="black"
          strokeWidth={strokeWidth * 0.7}
          dash={[3 / strokeWidth, 3 / strokeWidth]}
          opacity={0.5}
          listening={false}
        />
      ))}
    </>
  );
}
