'use client';

import { useCallback, useState } from 'react';
import { Circle, Line, Text } from 'react-konva';
import type Konva from 'konva';
import { useDsdStore } from '@/lib/smile-design/store';
import { computeMmPerPixel } from '@/lib/smile-design/engine/calibration';
import { distance } from '@/lib/smile-design/engine/geometry';

interface Props {
  displayWidth: number;
  displayHeight: number;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function CalibrationLayer({ displayWidth, displayHeight, stageRef }: Props) {
  const canvasMode = useDsdStore((s) => s.canvasMode);
  const calibration = useDsdStore((s) => s.calibration);
  const setCalibration = useDsdStore((s) => s.setCalibration);
  const imageNaturalSize = useDsdStore((s) => s.imageNaturalSize);
  const zoom = useDsdStore((s) => s.zoom);
  const panOffset = useDsdStore((s) => s.panOffset);

  const [calPoints, setCalPoints] = useState<Array<{ x: number; y: number }>>([]);

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'calibration' || !imageNaturalSize) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const imageX = (pointer.x - panOffset.x) / zoom;
    const imageY = (pointer.y - panOffset.y) / zoom;

    const nx = imageX / displayWidth;
    const ny = imageY / displayHeight;

    if (calPoints.length === 0) {
      setCalPoints([{ x: nx, y: ny }]);
    } else if (calPoints.length === 1) {
      const p1 = calPoints[0];
      const p2 = { x: nx, y: ny };

      // Prompt for known distance
      const input = window.prompt('Bekende afstand in mm (bijv. breedte centrale snijtand):');
      if (input) {
        const knownMm = parseFloat(input);
        if (!isNaN(knownMm) && knownMm > 0) {
          const mmPerPixel = computeMmPerPixel(p1, p2, knownMm, imageNaturalSize.width);
          setCalibration({
            point1: p1,
            point2: p2,
            knownDistanceMm: knownMm,
            mmPerPixel,
          });
        }
      }
      setCalPoints([]);
    }
  }, [canvasMode, calPoints, displayWidth, displayHeight, imageNaturalSize, zoom, panOffset, stageRef, setCalibration]);

  // Attach click to parent Stage via effect — actually we render invisible rect
  // Instead, render calibration points and existing calibration line

  const radius = 5 / zoom;
  const fontSize = 11 / zoom;

  return (
    <>
      {/* Show existing calibration */}
      {calibration && (
        <>
          <Circle
            x={calibration.point1.x * displayWidth}
            y={calibration.point1.y * displayHeight}
            radius={radius}
            fill="#f59e0b"
            stroke="white"
            strokeWidth={1}
            listening={false}
          />
          <Circle
            x={calibration.point2.x * displayWidth}
            y={calibration.point2.y * displayHeight}
            radius={radius}
            fill="#f59e0b"
            stroke="white"
            strokeWidth={1}
            listening={false}
          />
          <Line
            points={[
              calibration.point1.x * displayWidth,
              calibration.point1.y * displayHeight,
              calibration.point2.x * displayWidth,
              calibration.point2.y * displayHeight,
            ]}
            stroke="#f59e0b"
            strokeWidth={1.5}
            dash={[4, 4]}
            opacity={0.8}
            listening={false}
          />
          <Text
            x={(calibration.point1.x + calibration.point2.x) / 2 * displayWidth}
            y={(calibration.point1.y + calibration.point2.y) / 2 * displayHeight - fontSize * 1.5}
            text={`${calibration.knownDistanceMm.toFixed(1)} mm`}
            fontSize={fontSize}
            fill="#f59e0b"
            align="center"
            listening={false}
          />
        </>
      )}

      {/* Temporary first calibration point */}
      {canvasMode === 'calibration' && calPoints.length === 1 && (
        <Circle
          x={calPoints[0].x * displayWidth}
          y={calPoints[0].y * displayHeight}
          radius={radius}
          fill="#f59e0b"
          stroke="white"
          strokeWidth={1}
          listening={false}
        />
      )}

      {/* Invisible click area for calibration mode */}
      {canvasMode === 'calibration' && (
        <Line
          points={[0, 0, 0, 0]}
          onClick={handleClick}
          listening={false}
        />
      )}
    </>
  );
}
