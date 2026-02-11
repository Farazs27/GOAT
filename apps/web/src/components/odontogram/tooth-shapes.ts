// Tooth shape definitions - SVG path data for each tooth type
// Each tooth has 5 surface zones within a 40x40 viewBox
// Surfaces: M (mesial), D (distal), O (occlusal/incisal), B (buccal), L (lingual)

export type SurfaceKey = 'M' | 'D' | 'O' | 'B' | 'L';

export interface ToothShape {
  outline: string;       // Full tooth outline path
  surfaces: Record<SurfaceKey, string>; // Clickable surface paths
}

// Helper: creates a standard 5-surface tooth with given proportions
function createMolarShape(w: number, h: number): ToothShape {
  const cx = w / 2;
  const cy = h / 2;
  const iw = w * 0.35; // inner rect half-width
  const ih = h * 0.35; // inner rect half-height

  return {
    outline: `M2,2 L${w-2},2 L${w-2},${h-2} L2,${h-2} Z`,
    surfaces: {
      // Occlusal = center rectangle
      O: `M${cx-iw},${cy-ih} L${cx+iw},${cy-ih} L${cx+iw},${cy+ih} L${cx-iw},${cy+ih} Z`,
      // Buccal = top trapezoid (toward cheek - top of chart for upper, bottom for lower)
      B: `M2,2 L${w-2},2 L${cx+iw},${cy-ih} L${cx-iw},${cy-ih} Z`,
      // Lingual = bottom trapezoid
      L: `M${cx-iw},${cy+ih} L${cx+iw},${cy+ih} L${w-2},${h-2} L2,${h-2} Z`,
      // Mesial = left trapezoid
      M: `M2,2 L${cx-iw},${cy-ih} L${cx-iw},${cy+ih} L2,${h-2} Z`,
      // Distal = right trapezoid
      D: `M${cx+iw},${cy-ih} L${w-2},2 L${w-2},${h-2} L${cx+iw},${cy+ih} Z`,
    },
  };
}

function createPremolarShape(w: number, h: number): ToothShape {
  const cx = w / 2;
  const cy = h / 2;
  const iw = w * 0.3;
  const ih = h * 0.3;

  return {
    outline: `M4,3 L${w-4},3 L${w-3},${h-3} L3,${h-3} Z`,
    surfaces: {
      O: `M${cx-iw},${cy-ih} L${cx+iw},${cy-ih} L${cx+iw},${cy+ih} L${cx-iw},${cy+ih} Z`,
      B: `M4,3 L${w-4},3 L${cx+iw},${cy-ih} L${cx-iw},${cy-ih} Z`,
      L: `M${cx-iw},${cy+ih} L${cx+iw},${cy+ih} L${w-3},${h-3} L3,${h-3} Z`,
      M: `M4,3 L${cx-iw},${cy-ih} L${cx-iw},${cy+ih} L3,${h-3} Z`,
      D: `M${cx+iw},${cy-ih} L${w-4},3 L${w-3},${h-3} L${cx+iw},${cy+ih} Z`,
    },
  };
}

function createCanineShape(w: number, h: number): ToothShape {
  const cx = w / 2;
  const cy = h / 2;
  const iw = w * 0.28;
  const ih = h * 0.28;

  // Slightly pointed/diamond shape
  return {
    outline: `M${cx},1 L${w-3},${cy*0.6} L${w-2},${h-2} L2,${h-2} L3,${cy*0.6} Z`,
    surfaces: {
      O: `M${cx-iw},${cy-ih} L${cx+iw},${cy-ih} L${cx+iw},${cy+ih} L${cx-iw},${cy+ih} Z`,
      B: `M${cx},1 L${w-3},${cy*0.6} L${cx+iw},${cy-ih} L${cx-iw},${cy-ih} L3,${cy*0.6} Z`,
      L: `M${cx-iw},${cy+ih} L${cx+iw},${cy+ih} L${w-2},${h-2} L2,${h-2} Z`,
      M: `M${cx},1 L${cx-iw},${cy-ih} L${cx-iw},${cy+ih} L2,${h-2} L3,${cy*0.6} Z`,
      D: `M${cx},1 L${w-3},${cy*0.6} L${w-2},${h-2} L${cx+iw},${cy+ih} L${cx+iw},${cy-ih} Z`,
    },
  };
}

function createIncisorShape(w: number, h: number): ToothShape {
  const cx = w / 2;
  const cy = h / 2;
  const iw = w * 0.26;
  const ih = h * 0.26;

  // Rounded rectangle, narrower
  return {
    outline: `M5,2 L${w-5},2 Q${w-2},2 ${w-2},5 L${w-2},${h-3} L2,${h-3} L2,5 Q2,2 5,2 Z`,
    surfaces: {
      O: `M${cx-iw},${cy-ih} L${cx+iw},${cy-ih} L${cx+iw},${cy+ih} L${cx-iw},${cy+ih} Z`,
      B: `M5,2 L${w-5},2 Q${w-2},2 ${w-2},5 L${cx+iw},${cy-ih} L${cx-iw},${cy-ih} L2,5 Q2,2 5,2 Z`,
      L: `M${cx-iw},${cy+ih} L${cx+iw},${cy+ih} L${w-2},${h-3} L2,${h-3} Z`,
      M: `M5,2 L${cx-iw},${cy-ih} L${cx-iw},${cy+ih} L2,${h-3} L2,5 Q2,2 5,2 Z`,
      D: `M${w-5},2 Q${w-2},2 ${w-2},5 L${w-2},${h-3} L${cx+iw},${cy+ih} L${cx+iw},${cy-ih} Z`,
    },
  };
}

function createLateralIncisorShape(w: number, h: number): ToothShape {
  const cx = w / 2;
  const cy = h / 2;
  const iw = w * 0.24;
  const ih = h * 0.24;

  return {
    outline: `M6,2 L${w-6},2 Q${w-3},2 ${w-3},5 L${w-3},${h-3} L3,${h-3} L3,5 Q3,2 6,2 Z`,
    surfaces: {
      O: `M${cx-iw},${cy-ih} L${cx+iw},${cy-ih} L${cx+iw},${cy+ih} L${cx-iw},${cy+ih} Z`,
      B: `M6,2 L${w-6},2 Q${w-3},2 ${w-3},5 L${cx+iw},${cy-ih} L${cx-iw},${cy-ih} L3,5 Q3,2 6,2 Z`,
      L: `M${cx-iw},${cy+ih} L${cx+iw},${cy+ih} L${w-3},${h-3} L3,${h-3} Z`,
      M: `M6,2 L${cx-iw},${cy-ih} L${cx-iw},${cy+ih} L3,${h-3} L3,5 Q3,2 6,2 Z`,
      D: `M${w-6},2 Q${w-3},2 ${w-3},5 L${w-3},${h-3} L${cx+iw},${cy+ih} L${cx+iw},${cy-ih} Z`,
    },
  };
}

// Tooth type definitions
export type ToothType = 'central-incisor' | 'lateral-incisor' | 'canine' | 'premolar-1' | 'premolar-2' | 'molar-1' | 'molar-2' | 'molar-3';

// Map FDI tooth numbers to tooth types
export function getToothType(fdi: number): ToothType {
  const tooth = fdi % 10; // last digit = tooth position in quadrant
  switch (tooth) {
    case 1: return 'central-incisor';
    case 2: return 'lateral-incisor';
    case 3: return 'canine';
    case 4: return 'premolar-1';
    case 5: return 'premolar-2';
    case 6: return 'molar-1';
    case 7: return 'molar-2';
    case 8: return 'molar-3';
    default: return 'molar-1';
  }
}

// Get tooth type display name
export function getToothTypeName(fdi: number): string {
  const names: Record<ToothType, string> = {
    'central-incisor': 'Centrale snijtand',
    'lateral-incisor': 'Laterale snijtand',
    'canine': 'Hoektand',
    'premolar-1': 'Eerste premolaar',
    'premolar-2': 'Tweede premolaar',
    'molar-1': 'Eerste molaar',
    'molar-2': 'Tweede molaar',
    'molar-3': 'Verstandskies',
  };
  return names[getToothType(fdi)];
}

// Get surface label names for display
export function getSurfaceLabel(key: SurfaceKey, fdi: number): string {
  const quadrant = Math.floor(fdi / 10);
  const labels: Record<SurfaceKey, string> = {
    M: 'Mesiaal',
    D: 'Distaal',
    O: fdi % 10 <= 3 ? 'Incisaal' : 'Occlusaal',
    B: quadrant <= 2 ? 'Vestibulair' : 'Vestibulair',
    L: quadrant <= 2 ? 'Palatinaal' : 'Linguaal',
  };
  return labels[key];
}

// Molar sizes: wider/taller for molars, narrower for incisors
const TOOTH_DIMENSIONS: Record<ToothType, { w: number; h: number }> = {
  'central-incisor': { w: 32, h: 36 },
  'lateral-incisor': { w: 28, h: 34 },
  'canine': { w: 30, h: 38 },
  'premolar-1': { w: 32, h: 36 },
  'premolar-2': { w: 32, h: 36 },
  'molar-1': { w: 40, h: 40 },
  'molar-2': { w: 38, h: 38 },
  'molar-3': { w: 36, h: 36 },
};

export function getToothDimensions(fdi: number): { w: number; h: number } {
  return TOOTH_DIMENSIONS[getToothType(fdi)];
}

export function getToothShape(fdi: number): ToothShape {
  const type = getToothType(fdi);
  const { w, h } = TOOTH_DIMENSIONS[type];

  switch (type) {
    case 'central-incisor':
      return createIncisorShape(w, h);
    case 'lateral-incisor':
      return createLateralIncisorShape(w, h);
    case 'canine':
      return createCanineShape(w, h);
    case 'premolar-1':
    case 'premolar-2':
      return createPremolarShape(w, h);
    case 'molar-1':
      return createMolarShape(w, h);
    case 'molar-2':
      return createMolarShape(w, h);
    case 'molar-3':
      return createMolarShape(w, h);
    default:
      return createMolarShape(40, 40);
  }
}

// For mesial/distal: need to mirror based on quadrant position
// In Q1 (upper right) and Q4 (lower right): mesial = toward midline = right side
// In Q2 (upper left) and Q3 (lower left): mesial = toward midline = left side
export function shouldMirrorMesialDistal(fdi: number): boolean {
  const quadrant = Math.floor(fdi / 10);
  return quadrant === 1 || quadrant === 4;
}
