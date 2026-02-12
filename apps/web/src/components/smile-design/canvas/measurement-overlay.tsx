'use client';

import { Text } from 'react-konva';
import { useDsdStore } from '@/lib/smile-design/store';

interface Props {
  displayWidth: number;
  displayHeight: number;
}

export function MeasurementOverlay({ displayWidth, displayHeight }: Props) {
  const measurements = useDsdStore((s) => s.measurements);
  const derived = useDsdStore((s) => s.derivedStructures);
  const zoom = useDsdStore((s) => s.zoom);

  if (!measurements || !derived) return null;

  const fontSize = 10 / zoom;
  const labels: Array<{ text: string; x: number; y: number }> = [];

  // Midline deviation near dental midline
  if (measurements.midlineDeviationMm !== null && derived.dentalMidline) {
    const mid = derived.dentalMidline.start;
    labels.push({
      text: `Δ ${measurements.midlineDeviationMm.toFixed(1)} mm`,
      x: mid.x * displayWidth + 10 / zoom,
      y: mid.y * displayHeight,
    });
  }

  // Incisal plane angle near incisal plane
  if (measurements.incisalPlaneAngleDeg !== null && derived.incisalPlane) {
    const mid = {
      x: (derived.incisalPlane.start.x + derived.incisalPlane.end.x) / 2,
      y: (derived.incisalPlane.start.y + derived.incisalPlane.end.y) / 2,
    };
    labels.push({
      text: `${measurements.incisalPlaneAngleDeg.toFixed(1)}°`,
      x: mid.x * displayWidth + 10 / zoom,
      y: mid.y * displayHeight - fontSize * 2,
    });
  }

  return (
    <>
      {labels.map((label, i) => (
        <Text
          key={i}
          x={label.x}
          y={label.y}
          text={label.text}
          fontSize={fontSize}
          fill="black"
          opacity={0.9}
          shadowColor="white"
          shadowBlur={2}
          shadowOpacity={0.4}
          listening={false}
        />
      ))}
    </>
  );
}
