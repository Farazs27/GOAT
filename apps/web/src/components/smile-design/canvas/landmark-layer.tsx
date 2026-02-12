'use client';

import { Circle, Text } from 'react-konva';
import { useDsdStore } from '@/lib/smile-design/store';
import { isFacialLandmark, LANDMARK_COLORS, LANDMARK_LABELS } from '@/lib/smile-design/types';
import type { LandmarkType } from '@/lib/smile-design/types';

interface Props {
  displayWidth: number;
  displayHeight: number;
}

export function LandmarkLayer({ displayWidth, displayHeight }: Props) {
  const landmarks = useDsdStore((s) => s.landmarks);
  const selectedLandmark = useDsdStore((s) => s.selectedLandmark);
  const setSelectedLandmark = useDsdStore((s) => s.setSelectedLandmark);
  const moveLandmark = useDsdStore((s) => s.moveLandmark);
  const zoom = useDsdStore((s) => s.zoom);

  const dotRadius = 2 / zoom;
  const fontSize = 7 / zoom;

  return (
    <>
      {landmarks.map((lm) => {
        const cx = lm.x * displayWidth;
        const cy = lm.y * displayHeight;
        const color = isFacialLandmark(lm.type) ? LANDMARK_COLORS.facial : LANDMARK_COLORS.dental;
        const isSelected = selectedLandmark === lm.type;

        return (
          <LandmarkDot
            key={lm.type}
            x={cx}
            y={cy}
            radius={dotRadius}
            fontSize={fontSize}
            color={color}
            label={LANDMARK_LABELS[lm.type]}
            isSelected={isSelected}
            onSelect={() => setSelectedLandmark(lm.type)}
            onDragEnd={(x, y) => {
              const nx = x / displayWidth;
              const ny = y / displayHeight;
              if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
                moveLandmark(lm.type as LandmarkType, nx, ny);
              }
            }}
          />
        );
      })}
    </>
  );
}

function LandmarkDot({
  x, y, radius, fontSize, color, label, isSelected, onSelect, onDragEnd,
}: {
  x: number; y: number; radius: number; fontSize: number;
  color: string; label: string; isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  return (
    <>
      {/* Selection ring */}
      {isSelected && (
        <Circle
          x={x} y={y}
          radius={radius * 2.5}
          stroke={color}
          strokeWidth={0.4 / (radius / 2.5)}
          opacity={0.7}
          listening={false}
        />
      )}
      {/* Dot — small and clean */}
      <Circle
        x={x} y={y}
        radius={radius}
        fill={color}
        stroke="black"
        strokeWidth={0.4 / (radius / 2.5)}
        opacity={0.9}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
        hitStrokeWidth={radius * 5}
      />
      {/* Label — only show when selected */}
      {isSelected && (
        <Text
          x={x + radius * 2}
          y={y - fontSize / 2}
          text={label}
          fontSize={fontSize}
          fill="black"
          opacity={0.9}
          shadowColor="white"
          shadowBlur={2}
          shadowOpacity={0.6}
          listening={false}
        />
      )}
    </>
  );
}
