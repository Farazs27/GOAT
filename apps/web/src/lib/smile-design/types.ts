// ============================================================
// Digital Smile Design — Domain Types
// ============================================================

// --- Landmark Types ---

export type FacialLandmark =
  | 'GLABELLA'
  | 'NASION'
  | 'SUBNASALE'
  | 'PHILTRUM_MID'
  | 'POGONION'
  | 'PUPIL_LEFT'
  | 'PUPIL_RIGHT'
  | 'COMMISSURE_LEFT'
  | 'COMMISSURE_RIGHT';

export type DentalLandmark =
  | 'INCISAL_11_LEFT'
  | 'INCISAL_11_RIGHT'
  | 'INCISAL_21_LEFT'
  | 'INCISAL_21_RIGHT'
  | 'INCISAL_12'
  | 'INCISAL_22'
  | 'GINGIVAL_11'
  | 'GINGIVAL_21'
  | 'GINGIVAL_12'
  | 'GINGIVAL_22'
  | 'GINGIVAL_13'
  | 'GINGIVAL_23'
  | 'CONTACT_11_21'
  | 'CONTACT_11_12'
  | 'CONTACT_21_22'
  | 'CUSP_13'
  | 'CUSP_23';

export type LandmarkType = FacialLandmark | DentalLandmark;

export const FACIAL_LANDMARKS: FacialLandmark[] = [
  'GLABELLA', 'NASION', 'SUBNASALE', 'PHILTRUM_MID', 'POGONION',
  'PUPIL_LEFT', 'PUPIL_RIGHT', 'COMMISSURE_LEFT', 'COMMISSURE_RIGHT',
];

export const DENTAL_LANDMARKS: DentalLandmark[] = [
  'INCISAL_11_LEFT', 'INCISAL_11_RIGHT', 'INCISAL_21_LEFT', 'INCISAL_21_RIGHT',
  'INCISAL_12', 'INCISAL_22',
  'GINGIVAL_11', 'GINGIVAL_21', 'GINGIVAL_12', 'GINGIVAL_22', 'GINGIVAL_13', 'GINGIVAL_23',
  'CONTACT_11_21', 'CONTACT_11_12', 'CONTACT_21_22',
  'CUSP_13', 'CUSP_23',
];

export const ALL_LANDMARKS: LandmarkType[] = [...FACIAL_LANDMARKS, ...DENTAL_LANDMARKS];

export const LANDMARK_LABELS: Record<LandmarkType, string> = {
  GLABELLA: 'Glabella',
  NASION: 'Nasion',
  SUBNASALE: 'Subnasale',
  PHILTRUM_MID: 'Philtrum Mid',
  POGONION: 'Pogonion',
  PUPIL_LEFT: 'Left Pupil',
  PUPIL_RIGHT: 'Right Pupil',
  COMMISSURE_LEFT: 'Left Commissure',
  COMMISSURE_RIGHT: 'Right Commissure',
  INCISAL_11_LEFT: 'Incisal 11L',
  INCISAL_11_RIGHT: 'Incisal 11R',
  INCISAL_21_LEFT: 'Incisal 21L',
  INCISAL_21_RIGHT: 'Incisal 21R',
  INCISAL_12: 'Incisal 12',
  INCISAL_22: 'Incisal 22',
  GINGIVAL_11: 'Gingival 11',
  GINGIVAL_21: 'Gingival 21',
  GINGIVAL_12: 'Gingival 12',
  GINGIVAL_22: 'Gingival 22',
  GINGIVAL_13: 'Gingival 13',
  GINGIVAL_23: 'Gingival 23',
  CONTACT_11_21: 'Contact 11-21',
  CONTACT_11_12: 'Contact 11-12',
  CONTACT_21_22: 'Contact 21-22',
  CUSP_13: 'Cusp 13',
  CUSP_23: 'Cusp 23',
};

export const LANDMARK_COLORS: Record<'facial' | 'dental', string> = {
  facial: '#3b82f6',  // blue
  dental: '#22c55e',  // green
};

export function isFacialLandmark(type: LandmarkType): type is FacialLandmark {
  return FACIAL_LANDMARKS.includes(type as FacialLandmark);
}

// --- Geometry Primitives ---

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  start: Point;
  end: Point;
}

// --- Landmark Data ---

export interface LandmarkPoint {
  type: LandmarkType;
  x: number; // 0–1 normalized to image natural dimensions
  y: number;
}

// --- Calibration ---

export interface CalibrationData {
  point1: Point;
  point2: Point;
  knownDistanceMm: number;
  mmPerPixel: number;
}

// --- Derived Structures ---

export interface DerivedStructures {
  facialMidline: Line | null;
  interpupillaryLine: Line | null;
  commissureLine: Line | null;
  dentalMidline: Line | null;
  incisalPlane: Line | null;
  smileArc: Point[] | null;
  gingivalCurve: Point[] | null;
  toothOutlines: Point[][] | null;       // closed curves per tooth
  contactLines: Line[] | null;           // short horizontal lines at contact points
}

// --- Measurements ---

export interface Measurements {
  midlineDeviationMm: number | null;
  midlineDeviationDeg: number | null;
  incisalPlaneAngleDeg: number | null;
  widthRatios: {
    r11_12: number | null;
    r12_13: number | null;
  };
  centralDominance: number | null;
  redProportion: number | null;
  goldenProportionDeviation: number | null;
}

// --- Canvas State ---

export type CanvasMode = 'pan' | 'landmark' | 'calibration';

export interface LayerVisibility {
  landmarks: boolean;
  derivedLines: boolean;
  measurements: boolean;
  goldenOverlay: boolean;
}

// --- Version Data (what gets saved/loaded) ---

export interface VersionData {
  landmarks: LandmarkPoint[];
  calibration: CalibrationData | null;
  measurements: Measurements | null;
  derivedLines: DerivedStructures | null;
}
