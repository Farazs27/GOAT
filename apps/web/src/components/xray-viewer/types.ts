export type ViewerTool = 'pan' | 'ruler' | 'angle' | 'arrow' | 'text' | 'freehand';

export interface ImageFilters {
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  gamma: number;       // 0.2 to 5
  invert: boolean;
  sharpen: boolean;
}

export interface ViewTransform {
  scale: number;
  rotation: number; // 0, 90, 180, 270
  panX: number;
  panY: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface MeasurementLine {
  id: string;
  type: 'ruler' | 'angle';
  points: Point[]; // 2 for ruler, 3 for angle (vertex in middle)
  valueDisplay: string; // "12.5 mm" or "45.2°"
}

export interface Annotation {
  id: string;
  type: 'arrow' | 'text' | 'freehand';
  points: Point[];
  text?: string;
  color: string;
}

export interface CalibrationData {
  pixelDistance: number;
  realDistanceMm: number;
  pixelsPerMm: number;
}

export interface PatientImageData {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  imageType: string;
  notes: string | null;
  createdAt: string;
}

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 0,
  contrast: 0,
  gamma: 1,
  invert: false,
  sharpen: false,
};

export const DEFAULT_TRANSFORM: ViewTransform = {
  scale: 1,
  rotation: 0,
  panX: 0,
  panY: 0,
};

export function buildFilterString(f: ImageFilters): string {
  const parts: string[] = [];
  parts.push(`brightness(${1 + f.brightness / 100})`);
  parts.push(`contrast(${1 + f.contrast / 100})`);
  if (f.gamma !== 1) parts.push(`brightness(${f.gamma})`);
  if (f.invert) parts.push('invert(1)');
  if (f.sharpen) parts.push('url(#xray-sharpen)');
  return parts.join(' ');
}
