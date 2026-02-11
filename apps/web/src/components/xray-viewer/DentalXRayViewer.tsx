'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Hand,
  Ruler,
  Triangle,
  ArrowUpRight,
  Type,
  Pencil,
  Sun,
  Contrast as ContrastIcon,
  Gauge,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Crosshair,
  Download,
  SlidersHorizontal,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import {
  type ViewerTool,
  type ImageFilters,
  type ViewTransform,
  type Point,
  type MeasurementLine,
  type Annotation,
  type CalibrationData,
  type PatientImageData,
  DEFAULT_FILTERS,
  DEFAULT_TRANSFORM,
  buildFilterString,
} from './types';

interface DentalXRayViewerProps {
  images: PatientImageData[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function angleBetween(p1: Point, vertex: Point, p2: Point): number {
  const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
  const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
  let angle = Math.abs((a1 - a2) * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export default function DentalXRayViewer({
  images,
  initialIndex,
  onClose,
  onDelete,
}: DentalXRayViewerProps) {
  // State
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [tool, setTool] = useState<ViewerTool>('pan');
  const [filters, setFilters] = useState<ImageFilters>({ ...DEFAULT_FILTERS });
  const [transform, setTransform] = useState<ViewTransform>({ ...DEFAULT_TRANSFORM });
  const [measurements, setMeasurements] = useState<Map<string, MeasurementLine[]>>(new Map());
  const [annotations, setAnnotations] = useState<Map<string, Annotation[]>>(new Map());
  const [calibration, setCalibration] = useState<CalibrationData>({
    pixelDistance: 10,
    realDistanceMm: 1,
    pixelsPerMm: 10, // Default ~10px/mm, typical for dental x-rays. Use calibration tool to refine.
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [textInputPos, setTextInputPos] = useState<Point | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Drawing state
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // Undo history: stores { type: 'measurement' | 'annotation', imageId: string, id: string }
  const undoStackRef = useRef<{ type: 'measurement' | 'annotation'; imageId: string; id: string }[]>([]);

  const currentImage = images[currentIndex];
  const currentImageId = currentImage?.id ?? '';

  const currentMeasurements = useMemo(
    () => measurements.get(currentImageId) ?? [],
    [measurements, currentImageId]
  );
  const currentAnnotations = useMemo(
    () => annotations.get(currentImageId) ?? [],
    [annotations, currentImageId]
  );

  const activeTool = spaceHeld ? 'pan' : tool;

  // -- Coordinate transforms --
  const screenToImage = useCallback(
    (sx: number, sy: number): Point => {
      if (!containerRef.current) return { x: sx, y: sy };
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      let x = sx - rect.left;
      let y = sy - rect.top;

      // Remove pan
      x -= transform.panX;
      y -= transform.panY;

      // Translate to center origin
      x -= cx;
      y -= cy;

      // Reverse rotation
      const rad = -(transform.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;

      // Reverse scale
      const ix = rx / transform.scale + (naturalSize.w / 2);
      const iy = ry / transform.scale + (naturalSize.h / 2);

      return { x: ix, y: iy };
    },
    [transform, naturalSize]
  );

  const imageToScreen = useCallback(
    (ix: number, iy: number): Point => {
      if (!containerRef.current) return { x: ix, y: iy };
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      let x = (ix - naturalSize.w / 2) * transform.scale;
      let y = (iy - naturalSize.h / 2) * transform.scale;

      // Apply rotation
      const rad = (transform.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;

      return {
        x: rx + cx + transform.panX,
        y: ry + cy + transform.panY,
      };
    },
    [transform, naturalSize]
  );

  // -- Canvas drawing --
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const toScreen = (p: Point) => imageToScreen(p.x, p.y);

    // Draw measurements
    for (const m of currentMeasurements) {
      if (m.type === 'ruler' && m.points.length >= 2) {
        const p1 = toScreen(m.points[0]);
        const p2 = toScreen(m.points[1]);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Endpoints
        for (const ep of [p1, p2]) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(m.valueDisplay, midX + 8, midY - 8);
        ctx.fillText(m.valueDisplay, midX + 8, midY - 8);
      }

      if (m.type === 'angle' && m.points.length >= 3) {
        const sp1 = toScreen(m.points[0]);
        const sv = toScreen(m.points[1]);
        const sp2 = toScreen(m.points[2]);

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sp1.x, sp1.y);
        ctx.lineTo(sv.x, sv.y);
        ctx.lineTo(sp2.x, sp2.y);
        ctx.stroke();

        // Endpoints
        for (const ep of [sp1, sv, sp2]) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Arc
        const a1 = Math.atan2(sp1.y - sv.y, sp1.x - sv.x);
        const a2 = Math.atan2(sp2.y - sv.y, sp2.x - sv.x);
        ctx.beginPath();
        ctx.arc(sv.x, sv.y, 25, a1, a2, false);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        const labelAngle = (a1 + a2) / 2;
        const lx = sv.x + 35 * Math.cos(labelAngle);
        const ly = sv.y + 35 * Math.sin(labelAngle);
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(m.valueDisplay, lx, ly);
        ctx.fillText(m.valueDisplay, lx, ly);
      }
    }

    // Draw annotations
    for (const a of currentAnnotations) {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = 2;

      if (a.type === 'arrow' && a.points.length >= 2) {
        const s = toScreen(a.points[0]);
        const e = toScreen(a.points[1]);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(e.y - s.y, e.x - s.x);
        const headLen = 14;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(
          e.x - headLen * Math.cos(angle - Math.PI / 6),
          e.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          e.x - headLen * Math.cos(angle + Math.PI / 6),
          e.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }

      if (a.type === 'freehand' && a.points.length >= 2) {
        ctx.beginPath();
        const first = toScreen(a.points[0]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < a.points.length; i++) {
          const p = toScreen(a.points[i]);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      if (a.type === 'text' && a.points.length >= 1) {
        const p = toScreen(a.points[0]);
        ctx.font = '14px Inter, sans-serif';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(a.text ?? '', p.x, p.y);
        ctx.fillStyle = a.color;
        ctx.fillText(a.text ?? '', p.x, p.y);
      }
    }

    // Draw temp points (in-progress measurement/annotation)
    if (tempPoints.length > 0 && mousePos) {
      const screenTempPoints = tempPoints.map((p) => toScreen(p));
      const mp = mousePos; // already in screen space

      if (activeTool === 'ruler' || (isCalibrating && tempPoints.length === 1)) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(screenTempPoints[0].x, screenTempPoints[0].y);
        ctx.lineTo(mp.x, mp.y);
        ctx.stroke();
        ctx.setLineDash([]);

        for (const ep of screenTempPoints) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (activeTool === 'angle') {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        if (tempPoints.length === 1) {
          ctx.beginPath();
          ctx.moveTo(screenTempPoints[0].x, screenTempPoints[0].y);
          ctx.lineTo(mp.x, mp.y);
          ctx.stroke();
        } else if (tempPoints.length === 2) {
          ctx.beginPath();
          ctx.moveTo(screenTempPoints[0].x, screenTempPoints[0].y);
          ctx.lineTo(screenTempPoints[1].x, screenTempPoints[1].y);
          ctx.lineTo(mp.x, mp.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        for (const ep of screenTempPoints) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Temp arrow
    if (isDrawingArrow && tempPoints.length === 1 && mousePos) {
      const s = toScreen(tempPoints[0]);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Temp freehand
    if (isDrawingFreehand && tempPoints.length >= 2) {
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      const first = toScreen(tempPoints[0]);
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < tempPoints.length; i++) {
        const p = toScreen(tempPoints[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }, [
    currentMeasurements,
    currentAnnotations,
    tempPoints,
    mousePos,
    imageToScreen,
    activeTool,
    isCalibrating,
    isDrawingArrow,
    isDrawingFreehand,
  ]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      drawCanvas();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawCanvas]);

  // Lock body scroll when viewer is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // -- Helpers to add measurement/annotation --
  const addMeasurement = useCallback(
    (m: MeasurementLine) => {
      setMeasurements((prev) => {
        const next = new Map(prev);
        const arr = [...(next.get(currentImageId) ?? []), m];
        next.set(currentImageId, arr);
        return next;
      });
      undoStackRef.current.push({ type: 'measurement', imageId: currentImageId, id: m.id });
    },
    [currentImageId]
  );

  const addAnnotation = useCallback(
    (a: Annotation) => {
      setAnnotations((prev) => {
        const next = new Map(prev);
        const arr = [...(next.get(currentImageId) ?? []), a];
        next.set(currentImageId, arr);
        return next;
      });
      undoStackRef.current.push({ type: 'annotation', imageId: currentImageId, id: a.id });
    },
    [currentImageId]
  );

  const undo = useCallback(() => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    if (entry.type === 'measurement') {
      setMeasurements((prev) => {
        const next = new Map(prev);
        const arr = (next.get(entry.imageId) ?? []).filter((m) => m.id !== entry.id);
        next.set(entry.imageId, arr);
        return next;
      });
    } else {
      setAnnotations((prev) => {
        const next = new Map(prev);
        const arr = (next.get(entry.imageId) ?? []).filter((a) => a.id !== entry.id);
        next.set(entry.imageId, arr);
        return next;
      });
    }
  }, []);

  // -- Zoom --
  const zoomTo = useCallback((newScale: number) => {
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.1, Math.min(10, newScale)),
    }));
  }, []);

  const fitToWindow = useCallback(() => {
    if (!containerRef.current || !naturalSize.w || !naturalSize.h) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isRotated = transform.rotation === 90 || transform.rotation === 270;
    const iw = isRotated ? naturalSize.h : naturalSize.w;
    const ih = isRotated ? naturalSize.w : naturalSize.h;
    const scale = Math.min(rect.width / iw, rect.height / ih) * 0.98;
    setTransform({ scale, rotation: transform.rotation, panX: 0, panY: 0 });
  }, [naturalSize, transform.rotation]);

  const rotate90 = useCallback(() => {
    setTransform((t) => ({ ...t, rotation: ((t.rotation + 90) % 360) as 0 | 90 | 180 | 270 }));
  }, []);

  // -- Fullscreen --
  const toggleFullscreen = useCallback(() => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // -- Navigation --
  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= images.length) return;
      setCurrentIndex(idx);
      // Don't reset transform here — handleImageLoad will auto-fit
      setFilters({ ...DEFAULT_FILTERS });
      setTempPoints([]);
      setMousePos(null);
      setTextInputPos(null);
      setIsDrawingFreehand(false);
      setIsDrawingArrow(false);
    },
    [images.length]
  );

  // -- Wheel zoom --
  // Use native event listener to get { passive: false } for preventDefault
  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.metaKey) {
        const delta = e.deltaY < 0 ? 5 : -5;
        setFilters((f) => ({ ...f, brightness: Math.max(-100, Math.min(100, f.brightness + delta)) }));
        return;
      }
      if (e.ctrlKey) {
        const delta = e.deltaY < 0 ? 5 : -5;
        setFilters((f) => ({ ...f, contrast: Math.max(-100, Math.min(100, f.contrast + delta)) }));
        return;
      }
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoomTo(transform.scale * factor);
    };
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, [transform.scale, zoomTo]);


  // -- Mouse events on canvas --
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const sx = e.clientX;
      const sy = e.clientY;
      const imgPt = screenToImage(sx, sy);

      if (activeTool === 'pan') {
        setIsPanning(true);
        panStartRef.current = { x: sx, y: sy, panX: transform.panX, panY: transform.panY };
        return;
      }

      if (isCalibrating) {
        if (tempPoints.length === 0) {
          setTempPoints([imgPt]);
        } else {
          // Finish calibration line
          const p1 = tempPoints[0];
          const dist = distance(p1, imgPt);
          const mmStr = prompt('Voer de bekende afstand in mm in:');
          if (mmStr) {
            const mm = parseFloat(mmStr);
            if (!isNaN(mm) && mm > 0) {
              setCalibration({ pixelDistance: dist, realDistanceMm: mm, pixelsPerMm: dist / mm });
            }
          }
          setTempPoints([]);
          setIsCalibrating(false);
        }
        return;
      }

      if (activeTool === 'ruler') {
        if (tempPoints.length === 0) {
          setTempPoints([imgPt]);
        } else {
          const p1 = tempPoints[0];
          const dist = distance(p1, imgPt);
          const display = `${(dist / calibration.pixelsPerMm).toFixed(1)} mm`;
          addMeasurement({
            id: generateId(),
            type: 'ruler',
            points: [p1, imgPt],
            valueDisplay: display,
          });
          setTempPoints([]);
        }
        return;
      }

      if (activeTool === 'angle') {
        const next = [...tempPoints, imgPt];
        if (next.length < 3) {
          setTempPoints(next);
        } else {
          const deg = angleBetween(next[0], next[1], next[2]);
          addMeasurement({
            id: generateId(),
            type: 'angle',
            points: next,
            valueDisplay: `${deg.toFixed(1)}°`,
          });
          setTempPoints([]);
        }
        return;
      }

      if (activeTool === 'arrow') {
        setIsDrawingArrow(true);
        setTempPoints([imgPt]);
        return;
      }

      if (activeTool === 'text') {
        setTextInputPos({ x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
        setTextInputValue('');
        setTimeout(() => textInputRef.current?.focus(), 0);
        return;
      }

      if (activeTool === 'freehand') {
        setIsDrawingFreehand(true);
        setTempPoints([imgPt]);
        return;
      }
    },
    [activeTool, transform, screenToImage, tempPoints, calibration, addMeasurement, isCalibrating]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const sx = e.clientX;
      const sy = e.clientY;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMousePos({ x: sx - rect.left, y: sy - rect.top });

      if (isPanning && panStartRef.current) {
        const start = panStartRef.current;
        const dx = sx - start.x;
        const dy = sy - start.y;
        setTransform((t) => ({
          ...t,
          panX: start.panX + dx,
          panY: start.panY + dy,
        }));
        return;
      }

      if (isDrawingFreehand) {
        const imgPt = screenToImage(sx, sy);
        setTempPoints((prev) => [...prev, imgPt]);
        return;
      }
    },
    [isPanning, isDrawingFreehand, screenToImage]
  );

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        return;
      }

      if (isDrawingArrow && tempPoints.length === 1) {
        const imgPt = screenToImage(e.clientX, e.clientY);
        addAnnotation({
          id: generateId(),
          type: 'arrow',
          points: [tempPoints[0], imgPt],
          color: '#67e8f9',
        });
        setTempPoints([]);
        setIsDrawingArrow(false);
        return;
      }

      if (isDrawingFreehand && tempPoints.length >= 2) {
        addAnnotation({
          id: generateId(),
          type: 'freehand',
          points: [...tempPoints],
          color: '#67e8f9',
        });
        setTempPoints([]);
        setIsDrawingFreehand(false);
        return;
      }
    },
    [isPanning, isDrawingArrow, isDrawingFreehand, tempPoints, screenToImage, addAnnotation]
  );

  // Text input submit
  const submitTextAnnotation = useCallback(() => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const imgPt = screenToImage(textInputPos.x + rect.left, textInputPos.y + rect.top);
    addAnnotation({
      id: generateId(),
      type: 'text',
      points: [imgPt],
      text: textInputValue.trim(),
      color: '#67e8f9',
    });
    setTextInputPos(null);
    setTextInputValue('');
  }, [textInputPos, textInputValue, screenToImage, addAnnotation]);

  // -- Keyboard shortcuts --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textInputPos) {
        if (e.key === 'Escape') setTextInputPos(null);
        return; // don't handle shortcuts while typing
      }

      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey) {
        zoomTo(transform.scale * 1.2);
        return;
      }
      if (e.key === '-' && !e.ctrlKey) {
        zoomTo(transform.scale / 1.2);
        return;
      }
      if (e.key === '0') {
        fitToWindow();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        rotate90();
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        setFilters((f) => ({ ...f, invert: !f.invert }));
        return;
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === 'ArrowLeft') {
        goTo(currentIndex - 1);
        return;
      }
      if (e.key === 'ArrowRight') {
        goTo(currentIndex + 1);
        return;
      }
      const toolKeys: Record<string, ViewerTool> = {
        '1': 'pan',
        '2': 'ruler',
        '3': 'angle',
        '4': 'arrow',
        '5': 'text',
        '6': 'freehand',
      };
      if (e.key === '?') {
        setShowShortcuts((s) => !s);
        return;
      }
      if (toolKeys[e.key]) {
        setTool(toolKeys[e.key]);
        setTempPoints([]);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setSpaceHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onClose, zoomTo, transform.scale, fitToWindow, rotate90, undo, goTo, currentIndex, textInputPos]);

  // Auto-fit on image load
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      // Fit to window after size is known
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight) * 0.98;
      setTransform({ scale, rotation: 0, panX: 0, panY: 0 });
    },
    []
  );

  // Filter string
  const filterString = useMemo(() => buildFilterString(filters), [filters]);

  // Image transform CSS
  const imageTransformStyle = useMemo(
    () => ({
      filter: filterString,
      transform: `translate(${transform.panX}px, ${transform.panY}px) rotate(${transform.rotation}deg)`,
      transformOrigin: 'center center',
      width: naturalSize.w ? `${naturalSize.w * transform.scale}px` : 'auto',
      height: naturalSize.h ? `${naturalSize.h * transform.scale}px` : 'auto',
      maxWidth: 'none',
      maxHeight: 'none',
    }),
    [filterString, transform, naturalSize]
  );

  // Cursor
  const cursor = useMemo(() => {
    if (activeTool === 'pan') return isPanning ? 'grabbing' : 'grab';
    if (activeTool === 'ruler' || activeTool === 'angle') return 'crosshair';
    if (activeTool === 'arrow') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'freehand') return 'crosshair';
    return 'default';
  }, [activeTool, isPanning]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const strip = thumbnailStripRef.current;
    if (!strip) return;
    const active = strip.children[currentIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex]);

  // Tool button helper
  const ToolBtn = ({
    icon,
    label,
    active,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? 'bg-blue-500/30 text-blue-300'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );

  if (!currentImage) return null;

  return (
    <div
      ref={viewerRef}
      className="fixed inset-0 z-[9999] flex flex-col bg-black select-none overflow-hidden"
    >
      {/* SVG sharpen filter */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="xray-sharpen">
            <feConvolveMatrix
              order="3"
              kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"
              preserveAlpha="true"
            />
          </filter>
        </defs>
      </svg>

      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/80 backdrop-blur-xl border-b border-white/10 gap-2 flex-shrink-0">
        {/* Left: Tools */}
        <div className="flex items-center gap-1">
          <ToolBtn icon={<Hand size={18} />} label="Pan (1)" active={tool === 'pan'} onClick={() => { setTool('pan'); setTempPoints([]); }} />
          <ToolBtn icon={<Ruler size={18} />} label="Ruler (2)" active={tool === 'ruler'} onClick={() => { setTool('ruler'); setTempPoints([]); }} />
          <ToolBtn icon={<Triangle size={18} />} label="Angle (3)" active={tool === 'angle'} onClick={() => { setTool('angle'); setTempPoints([]); }} />
          <ToolBtn icon={<ArrowUpRight size={18} />} label="Arrow (4)" active={tool === 'arrow'} onClick={() => { setTool('arrow'); setTempPoints([]); }} />
          <ToolBtn icon={<Type size={18} />} label="Text (5)" active={tool === 'text'} onClick={() => { setTool('text'); setTempPoints([]); }} />
          <ToolBtn icon={<Pencil size={18} />} label="Freehand (6)" active={tool === 'freehand'} onClick={() => { setTool('freehand'); setTempPoints([]); }} />
          <div className="w-px h-6 bg-white/10 mx-1" />
          <ToolBtn
            icon={<Crosshair size={18} />}
            label="Calibrate"
            active={isCalibrating}
            onClick={() => {
              setIsCalibrating(!isCalibrating);
              setTempPoints([]);
            }}
          />
          <ToolBtn icon={<Undo2 size={18} />} label="Undo (Ctrl+Z)" onClick={undo} />
        </div>

        {/* Center: Adjust */}
        <div className="flex items-center gap-1">
          <ToolBtn
            icon={<SlidersHorizontal size={18} />}
            label="Adjust"
            active={showAdjustPanel}
            onClick={() => setShowAdjustPanel(!showAdjustPanel)}
          />
          <ToolBtn
            icon={<ContrastIcon size={18} />}
            label="Invert (I)"
            active={filters.invert}
            onClick={() => setFilters((f) => ({ ...f, invert: !f.invert }))}
          />
        </div>

        {/* Right: Zoom, Rotate, etc */}
        <div className="flex items-center gap-1">
          <ToolBtn icon={<ZoomOut size={18} />} label="Zoom Out (-)" onClick={() => zoomTo(transform.scale / 1.2)} />
          <span className="text-white/60 text-xs min-w-[40px] text-center font-mono">
            {Math.round(transform.scale * 100)}%
          </span>
          <ToolBtn icon={<ZoomIn size={18} />} label="Zoom In (+)" onClick={() => zoomTo(transform.scale * 1.2)} />
          <ToolBtn icon={<Maximize size={18} />} label="Fit (0)" onClick={fitToWindow} />
          <div className="w-px h-6 bg-white/10 mx-1" />
          <ToolBtn icon={<RotateCw size={18} />} label="Rotate (R)" onClick={rotate90} />
          <ToolBtn
            icon={isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            label="Fullscreen"
            onClick={toggleFullscreen}
          />
          {onDelete && (
            <ToolBtn
              icon={<Trash2 size={18} />}
              label="Delete"
              onClick={() => {
                if (confirm('Wilt u deze afbeelding verwijderen?')) onDelete(currentImage.id);
              }}
            />
          )}
          <div className="w-px h-6 bg-white/10 mx-1" />
          <ToolBtn
            icon={<HelpCircle size={18} />}
            label="Shortcuts (?)"
            active={showShortcuts}
            onClick={() => setShowShortcuts(!showShortcuts)}
          />
          <ToolBtn icon={<X size={18} />} label="Close (Esc)" onClick={onClose} />
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Adjust panel */}
        {showAdjustPanel && (
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 z-10 p-4 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-white text-sm font-semibold">Beeldaanpassingen</h3>

            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs flex items-center gap-1"><Sun size={14} /> Helderheid</span>
                <span className="text-white/60 text-xs font-mono">{filters.brightness}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={filters.brightness}
                onChange={(e) => setFilters((f) => ({ ...f, brightness: Number(e.target.value) }))}
                className="w-full accent-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs flex items-center gap-1"><ContrastIcon size={14} /> Contrast</span>
                <span className="text-white/60 text-xs font-mono">{filters.contrast}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={filters.contrast}
                onChange={(e) => setFilters((f) => ({ ...f, contrast: Number(e.target.value) }))}
                className="w-full accent-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs flex items-center gap-1"><Gauge size={14} /> Gamma</span>
                <span className="text-white/60 text-xs font-mono">{filters.gamma.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={5}
                step={0.1}
                value={filters.gamma}
                onChange={(e) => setFilters((f) => ({ ...f, gamma: Number(e.target.value) }))}
                className="w-full accent-blue-500"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, invert: !f.invert }))}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  filters.invert
                    ? 'bg-blue-500/30 text-blue-300'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Omkeren
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, sharpen: !f.sharpen }))}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  filters.sharpen
                    ? 'bg-blue-500/30 text-blue-300'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Verscherpen
              </button>
            </div>

            <button
              onClick={() => setFilters({ ...DEFAULT_FILTERS })}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} /> Alles resetten
            </button>

            <div className="text-xs text-white/40 mt-2">
              Kalibratie: {calibration.pixelsPerMm.toFixed(1)} px/mm
              <span className="text-white/20 ml-1">(gebruik kalibratie-tool om te verfijnen)</span>
            </div>
          </div>
        )}

        {/* Shortcuts panel */}
        {showShortcuts && (
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-black/95 backdrop-blur-xl border-l border-white/10 z-10 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-semibold">Sneltoetsen</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Gereedschappen</h4>
                <div className="space-y-1.5">
                  {[
                    ['1', 'Verplaatsen'],
                    ['2', 'Liniaal'],
                    ['3', 'Hoek meten'],
                    ['4', 'Pijl'],
                    ['5', 'Tekst'],
                    ['6', 'Vrij tekenen'],
                    ['Spatie', 'Vasthouden om te verplaatsen'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">{desc}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono min-w-[24px] text-center">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Weergave</h4>
                <div className="space-y-1.5">
                  {[
                    ['Scroll', 'In-/uitzoomen'],
                    ['+  /  −', 'In-/uitzoomen'],
                    ['0', 'Passend in venster'],
                    ['R', 'Roteren 90°'],
                    ['I', 'Kleuren omkeren'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">{desc}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono min-w-[24px] text-center">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Aanpassingen</h4>
                <div className="space-y-1.5">
                  {[
                    ['⌘ + Scroll', 'Helderheid'],
                    ['Ctrl + Scroll', 'Contrast'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">{desc}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono text-center">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Navigatie</h4>
                <div className="space-y-1.5">
                  {[
                    ['← →', 'Vorige / Volgende foto'],
                    ['⌘Z', 'Ongedaan maken'],
                    ['Esc', 'Sluiten'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">{desc}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono min-w-[24px] text-center">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image container */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden flex items-center justify-center"
          style={{ cursor }}
        >
          <img
            ref={imgRef}
            src={currentImage.filePath}
            alt={currentImage.fileName}
            onLoad={handleImageLoad}
            draggable={false}
            style={imageTransformStyle}
            className="pointer-events-none"
          />

          {/* Canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={() => {
              if (isPanning) {
                setIsPanning(false);
                panStartRef.current = null;
              }
            }}
          />

          {/* Text input overlay */}
          {textInputPos && (
            <input
              ref={textInputRef}
              type="text"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitTextAnnotation();
                if (e.key === 'Escape') setTextInputPos(null);
                e.stopPropagation();
              }}
              onBlur={submitTextAnnotation}
              className="absolute bg-black/80 border border-cyan-400/50 text-cyan-300 text-sm px-2 py-1 rounded outline-none min-w-[120px]"
              style={{ left: textInputPos.x, top: textInputPos.y }}
              placeholder="Type text..."
            />
          )}

          {/* Prev/Next arrows */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={() => goTo(currentIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white/60 hover:text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {currentIndex < images.length - 1 && (
                <button
                  onClick={() => goTo(currentIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white/60 hover:text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </>
          )}

          {/* Image info */}
          <div className="absolute bottom-3 left-3 text-white/40 text-xs">
            {currentImage.fileName} &middot; {currentImage.imageType} &middot;{' '}
            {(currentImage.fileSize / 1024).toFixed(0)} KB
            {currentIndex + 1 > 0 && ` \u00B7 ${currentIndex + 1} / ${images.length}`}
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="bg-black/80 border-t border-white/10 px-3 py-2 flex-shrink-0">
          <div
            ref={thumbnailStripRef}
            className="flex gap-2 overflow-x-auto items-center justify-center"
          >
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => goTo(idx)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  idx === currentIndex
                    ? 'border-blue-400'
                    : 'border-transparent hover:border-white/20'
                }`}
              >
                <img
                  src={img.filePath}
                  alt={img.fileName}
                  className="h-14 w-auto object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
