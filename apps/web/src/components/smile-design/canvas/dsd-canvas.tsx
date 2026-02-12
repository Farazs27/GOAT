'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useDsdStore } from '@/lib/smile-design/store';
import { ImageLayer } from './image-layer';
import { LandmarkLayer } from './landmark-layer';
import { DerivedLinesLayer } from './derived-lines-layer';
import { CalibrationLayer } from './calibration-layer';
import { MeasurementOverlay } from './measurement-overlay';

interface DsdCanvasProps {
  externalStageRef?: React.RefObject<Konva.Stage | null>;
}

export function DsdCanvas({ externalStageRef }: DsdCanvasProps = {}) {
  const internalRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef ?? internalRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const {
    imageUrl, zoom, panOffset, canvasMode, setZoom, setPanOffset,
    activeLandmarkType, placeLandmark, imageNaturalSize, setImageNaturalSize,
    layers,
  } = useDsdStore();

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setStageSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Wheel zoom (zoom to cursor)
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.08;
    const newScale = direction > 0 ? oldScale * factor : oldScale / factor;
    const clampedScale = Math.max(0.1, Math.min(10, newScale));

    const mousePointTo = {
      x: (pointer.x - panOffset.x) / oldScale,
      y: (pointer.y - panOffset.y) / oldScale,
    };

    setPanOffset({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
    setZoom(clampedScale);
  }, [zoom, panOffset, setZoom, setPanOffset]);

  // Stage click for landmark placement
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (canvasMode !== 'landmark' || !activeLandmarkType || !imageNaturalSize) return;

    // Ignore clicks on draggable landmark circles (so we don't re-place when dragging)
    const className = e.target?.getClassName?.();
    if (className === 'Circle' || className === 'Text') return;

    const stage = stageRef.current;
    if (!stage) return;

    // getRelativePointerPosition accounts for stage transform (pan + zoom)
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;

    // Normalize to 0-1 based on displayed image size
    const dw = stageSize.width;
    const dh = imageNaturalSize.height * (dw / imageNaturalSize.width);

    const nx = pos.x / dw;
    const ny = pos.y / dh;

    // Allow clicking anywhere on the image area (with some margin)
    if (nx >= -0.05 && nx <= 1.05 && ny >= -0.05 && ny <= 1.05) {
      const clampedX = Math.max(0, Math.min(1, nx));
      const clampedY = Math.max(0, Math.min(1, ny));
      placeLandmark({ type: activeLandmarkType, x: clampedX, y: clampedY });
    }
  }, [canvasMode, activeLandmarkType, imageNaturalSize, stageSize.width, placeLandmark]);

  // Pan via drag
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target === stageRef.current) {
      setPanOffset({ x: e.target.x(), y: e.target.y() });
    }
  }, [setPanOffset]);

  // Compute display dimensions
  const displayWidth = stageSize.width;
  const displayHeight = imageNaturalSize
    ? imageNaturalSize.height * (displayWidth / imageNaturalSize.width)
    : stageSize.height;

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x}
        y={panOffset.y}
        draggable={canvasMode === 'pan'}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick as (e: Konva.KonvaEventObject<TouchEvent>) => void}
        onDragEnd={handleDragEnd}
        style={{ cursor: canvasMode === 'landmark' ? 'crosshair' : canvasMode === 'calibration' ? 'crosshair' : 'grab' }}
      >
        {/* Background image */}
        <Layer listening={false}>
          <ImageLayer
            imageUrl={imageUrl}
            displayWidth={displayWidth}
            onLoad={(w, h) => setImageNaturalSize({ width: w, height: h })}
          />
        </Layer>

        {/* Derived lines */}
        {layers.derivedLines && (
          <Layer listening={false}>
            <DerivedLinesLayer displayWidth={displayWidth} displayHeight={displayHeight} />
          </Layer>
        )}

        {/* Landmarks */}
        {layers.landmarks && (
          <Layer>
            <LandmarkLayer displayWidth={displayWidth} displayHeight={displayHeight} />
          </Layer>
        )}

        {/* Calibration */}
        <Layer>
          <CalibrationLayer
            displayWidth={displayWidth}
            displayHeight={displayHeight}
            stageRef={stageRef}
          />
        </Layer>

        {/* Measurement labels */}
        {layers.measurements && (
          <Layer listening={false}>
            <MeasurementOverlay displayWidth={displayWidth} displayHeight={displayHeight} />
          </Layer>
        )}
      </Stage>
    </div>
  );
}
