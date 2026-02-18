'use client';

import React from 'react';
import type { PerioToothData } from '@/../../packages/shared-types/src/odontogram';

interface PerioLineGraphProps {
  teeth: number[];
  perioData: Record<string, PerioToothData>;
  side: 'buccal' | 'palatal';
  previousData?: Record<string, PerioToothData>;
  toothWidth?: number;
}

const GRAPH_HEIGHT = 80;
const MAX_SCALE = 12; // mm

function depthToY(depth: number): number {
  return (depth / MAX_SCALE) * GRAPH_HEIGHT;
}

function getDepthColor(depth: number): string {
  if (depth <= 3) return '#34d399'; // emerald-400
  if (depth <= 5) return '#fbbf24'; // amber-400
  return '#f87171'; // red-400
}

/** Simple implant icon SVG */
function ImplantIcon({ x, height }: { x: number; height: number }) {
  const cy = height / 2;
  return (
    <g>
      {/* Threaded screw body */}
      <line x1={x} y1={cy - 16} x2={x} y2={cy + 16} stroke="#94a3b8" strokeWidth={2} />
      <line x1={x} y1={cy - 16} x2={x} y2={cy - 12} stroke="#64748b" strokeWidth={4} strokeLinecap="round" />
      {/* Hash marks for threads */}
      {[-10, -4, 2, 8, 14].map((offset) => (
        <line
          key={offset}
          x1={x - 4}
          y1={cy + offset}
          x2={x + 4}
          y2={cy + offset}
          stroke="#94a3b8"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}

export default function PerioLineGraph({
  teeth,
  perioData,
  side,
  previousData,
  toothWidth = 42,
}: PerioLineGraphProps) {
  const totalWidth = teeth.length * toothWidth;

  // Build points for current data
  const currentPoints: Array<{ x: number; y: number; depth: number } | null> = [];
  const prevPoints: Array<{ x: number; y: number; depth: number } | null> = [];
  const missingIndices: number[] = [];
  const implantIndices: number[] = [];

  teeth.forEach((fdi, toothIdx) => {
    const data = perioData[String(fdi)];
    const isMissing = data?.missing === true;
    const isImplant = data?.implant === true;

    if (isMissing) {
      missingIndices.push(toothIdx);
      currentPoints.push(null, null, null);
    } else {
      if (isImplant) implantIndices.push(toothIdx);
      const depths = data?.[side]?.probingDepth ?? [0, 0, 0];
      depths.forEach((d, siteIdx) => {
        const x = toothIdx * toothWidth + siteIdx * (toothWidth / 3) + toothWidth / 6;
        currentPoints.push({ x, y: depthToY(d), depth: d });
      });
    }

    // Previous data
    if (previousData) {
      const prevData = previousData[String(fdi)];
      if (isMissing || !prevData) {
        prevPoints.push(null, null, null);
      } else {
        const depths = prevData[side]?.probingDepth ?? [0, 0, 0];
        depths.forEach((d, siteIdx) => {
          const x = toothIdx * toothWidth + siteIdx * (toothWidth / 3) + toothWidth / 6;
          prevPoints.push({ x, y: depthToY(d), depth: d });
        });
      }
    }
  });

  // Build polyline string (skip nulls = gaps)
  function buildPolyline(points: Array<{ x: number; y: number; depth: number } | null>): string[] {
    const segments: string[] = [];
    let current = '';
    for (const pt of points) {
      if (!pt) {
        if (current) { segments.push(current); current = ''; }
      } else {
        current += `${pt.x},${pt.y} `;
      }
    }
    if (current) segments.push(current);
    return segments;
  }

  // Build fill polygon (close to bottom)
  function buildFillPath(points: Array<{ x: number; y: number; depth: number } | null>): string[] {
    const paths: string[] = [];
    let segment: Array<{ x: number; y: number }> = [];
    for (const pt of points) {
      if (!pt) {
        if (segment.length > 0) {
          const first = segment[0];
          const last = segment[segment.length - 1];
          let d = `M ${first.x},${GRAPH_HEIGHT}`;
          segment.forEach((p) => { d += ` L ${p.x},${p.y}`; });
          d += ` L ${last.x},${GRAPH_HEIGHT} Z`;
          paths.push(d);
          segment = [];
        }
      } else {
        segment.push(pt);
      }
    }
    if (segment.length > 0) {
      const first = segment[0];
      const last = segment[segment.length - 1];
      let d = `M ${first.x},${GRAPH_HEIGHT}`;
      segment.forEach((p) => { d += ` L ${p.x},${p.y}`; });
      d += ` L ${last.x},${GRAPH_HEIGHT} Z`;
      paths.push(d);
    }
    return paths;
  }

  const currentSegments = buildPolyline(currentPoints);
  const currentFills = buildFillPath(currentPoints);
  const prevSegments = previousData ? buildPolyline(prevPoints) : [];

  // Average color for current line
  const validPoints = currentPoints.filter((p): p is NonNullable<typeof p> => p !== null);
  const avgDepth = validPoints.length > 0
    ? validPoints.reduce((s, p) => s + p.depth, 0) / validPoints.length
    : 0;
  const lineColor = getDepthColor(avgDepth);

  return (
    <div className="flex items-center">
      <span className="w-20 shrink-0" />
      <svg
        width={totalWidth}
        height={GRAPH_HEIGHT}
        className="block"
        style={{ minWidth: totalWidth }}
      >
        {/* Severity zone backgrounds */}
        <rect x={0} y={0} width={totalWidth} height={depthToY(3)} fill="#34d399" opacity={0.06} />
        <rect x={0} y={depthToY(3)} width={totalWidth} height={depthToY(5) - depthToY(3)} fill="#fbbf24" opacity={0.06} />
        <rect x={0} y={depthToY(5)} width={totalWidth} height={GRAPH_HEIGHT - depthToY(5)} fill="#f87171" opacity={0.06} />

        {/* Zone threshold lines */}
        <line x1={0} y1={depthToY(3)} x2={totalWidth} y2={depthToY(3)} stroke="#34d399" strokeWidth={0.5} opacity={0.3} />
        <line x1={0} y1={depthToY(5)} x2={totalWidth} y2={depthToY(5)} stroke="#fbbf24" strokeWidth={0.5} opacity={0.3} />

        {/* Missing tooth zones */}
        {missingIndices.map((idx) => (
          <rect
            key={`missing-${idx}`}
            x={idx * toothWidth}
            y={0}
            width={toothWidth}
            height={GRAPH_HEIGHT}
            fill="#475569"
            opacity={0.15}
            strokeDasharray="4 2"
            stroke="#64748b"
            strokeWidth={0.5}
          />
        ))}

        {/* Implant icons */}
        {implantIndices.map((idx) => (
          <ImplantIcon
            key={`implant-${idx}`}
            x={idx * toothWidth + toothWidth / 2}
            height={GRAPH_HEIGHT}
          />
        ))}

        {/* Previous data (dashed, lower opacity) */}
        {prevSegments.map((seg, i) => (
          <polyline
            key={`prev-${i}`}
            points={seg}
            fill="none"
            stroke="#93c5fd"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.4}
          />
        ))}

        {/* Current data fill */}
        {currentFills.map((d, i) => (
          <path
            key={`fill-${i}`}
            d={d}
            fill={lineColor}
            opacity={0.15}
          />
        ))}

        {/* Current data line */}
        {currentSegments.map((seg, i) => (
          <polyline
            key={`line-${i}`}
            points={seg}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Data points */}
        {validPoints.map((pt, i) => (
          <circle
            key={`pt-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={2}
            fill={getDepthColor(pt.depth)}
            opacity={0.8}
          />
        ))}
      </svg>
    </div>
  );
}
