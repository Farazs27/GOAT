// Anatomically realistic tooth SVG path data for dental charting
// Each tooth type has side view (profile) and occlusal view (top-down)
// All paths use cubic bezier curves for smooth, organic shapes

export type SurfaceKey = 'M' | 'D' | 'O' | 'B' | 'L';
export type ExtendedSurfaceKey = SurfaceKey | 'CB' | 'CP' | 'BC' | 'PC' | 'BS' | 'PS';

export interface ToothSideView {
  outline: string;       // Full tooth profile path
  root: string;          // Root path(s) - below cervical line
  crown: string;         // Crown path - above cervical line
  cervicalLine: string;  // The gum line position on this tooth
  enamel: string;        // Enamel boundary
}

export interface ToothOcclusalView {
  outline: string;                        // Outer tooth boundary
  surfaces: Record<SurfaceKey, string>;   // 5 surface zone paths
  fissures?: string;                      // Fissure lines (for molars/premolars)
}

export interface ToothPaths {
  sideView: ToothSideView;
  occlusalView: ToothOcclusalView;
  sideViewBox: { width: number; height: number };
  occlusalViewBox: { width: number; height: number };
  cervicalY: number;   // Y position of cervical line in side view
  rootCount: number;   // Number of roots (1, 2, or 3)
}

export type ToothType =
  | 'central-incisor'
  | 'lateral-incisor'
  | 'canine'
  | 'premolar-1'
  | 'premolar-2'
  | 'molar-1'
  | 'molar-2'
  | 'molar-3';

// ---------------------------------------------------------------------------
// Side view paths (upper orientation: root UP, crown DOWN)
// Lower teeth are vertically mirrored at render time
// ---------------------------------------------------------------------------

// Central Incisor: Shovel-shaped crown, single straight conical root
// Crown is distinctly wider than root, flat incisal edge, slight labial convexity
const centralIncisorSide: ToothSideView = {
  outline:
    // Root apex - narrow, tapers to a point
    'M15,1 C14,1.5 13,3 12.5,5 C12,8 11.5,12 11,16 ' +
    'C10.5,20 10,24 9.8,28 C9.6,31 9.5,34 9.5,36 ' +
    // Cervical constriction - neck narrows then widens for crown
    'C9.5,37.5 9,38.5 8.5,39 C7.8,39.8 7,40.5 6.5,41.5 ' +
    // Crown labial surface - convex bulge
    'C6,42.5 5.5,44.5 5.5,47 C5.5,50 5.8,53 6,56 ' +
    'C6.2,59 6.5,62 7,65 C7.3,67 7.8,69 8.5,71 ' +
    // Incisal edge - flat with rounded corners
    'C9,72 9.8,73 11,73.5 C12.5,74 14,74.2 15,74.2 ' +
    'C16,74.2 17.5,74 19,73.5 C20.2,73 21,72 21.5,71 ' +
    // Crown lingual surface - concave (cingulum area)
    'C22.2,69 22.5,67 23,65 C23.5,62 24,59 24.2,56 ' +
    'C24.5,53 24.5,50 24.5,47 C24.5,44.5 24.2,42.5 23.5,41.5 ' +
    'C23,40.5 22.2,39.8 21.5,39 C21,38.5 20.5,37.5 20.5,36 ' +
    // Back up root - lingual side
    'C20.5,34 20.4,31 20.2,28 C20,24 19.5,20 19,16 ' +
    'C18.5,12 18,8 17.5,5 C17,3 16,1.5 15,1 Z',
  root:
    'M15,1 C14,1.5 13,3 12.5,5 C12,8 11.5,12 11,16 ' +
    'C10.5,20 10,24 9.8,28 C9.6,31 9.5,34 9.5,36 ' +
    'C9.5,37.5 9,38.5 8.5,39 L21.5,39 ' +
    'C21,38.5 20.5,37.5 20.5,36 C20.5,34 20.4,31 20.2,28 ' +
    'C20,24 19.5,20 19,16 C18.5,12 18,8 17.5,5 C17,3 16,1.5 15,1 Z',
  crown:
    'M8.5,39 C7.8,39.8 7,40.5 6.5,41.5 C6,42.5 5.5,44.5 5.5,47 ' +
    'C5.5,50 5.8,53 6,56 C6.2,59 6.5,62 7,65 C7.3,67 7.8,69 8.5,71 ' +
    'C9,72 9.8,73 11,73.5 C12.5,74 14,74.2 15,74.2 ' +
    'C16,74.2 17.5,74 19,73.5 C20.2,73 21,72 21.5,71 ' +
    'C22.2,69 22.5,67 23,65 C23.5,62 24,59 24.2,56 ' +
    'C24.5,53 24.5,50 24.5,47 C24.5,44.5 24.2,42.5 23.5,41.5 ' +
    'C23,40.5 22.2,39.8 21.5,39 L8.5,39 Z',
  cervicalLine:
    'M8.5,39 C10,40.5 12.5,41 15,41 C17.5,41 20,40.5 21.5,39',
  enamel:
    'M7.5,50 C7.5,53 7.8,56 8,59 C8.2,62 8.5,65 9,68 ' +
    'C9.5,70 10.5,72 11.5,73 C13,73.8 14.5,74.2 15,74.2 ' +
    'C15.5,74.2 17,73.8 18.5,73 C19.5,72 20.5,70 21,68 ' +
    'C21.5,65 21.8,62 22,59 C22.2,56 22.5,53 22.5,50 ' +
    'L7.5,50 Z',
};

// Lateral Incisor: Narrower, slightly shorter than central, more rounded incisal corners
const lateralIncisorSide: ToothSideView = {
  outline:
    // Root - slender, tapers to point
    'M14,1 C13,1.5 12,3 11.5,5.5 C11,8.5 10.5,12 10.2,16 ' +
    'C9.9,20 9.7,24 9.5,27 C9.4,30 9.3,33 9.3,35 ' +
    // Cervical constriction
    'C9.3,36.5 8.8,37.5 8.3,38 C7.6,38.8 7,39.5 6.5,40.5 ' +
    // Crown labial surface
    'C6,41.5 5.8,43.5 5.8,46 C5.8,49 6,51.5 6.2,54 ' +
    'C6.5,57 6.8,59.5 7.2,62 C7.5,63.5 8,65 8.8,66.5 ' +
    // Incisal edge - more rounded than central
    'C9.5,67.5 10.5,68.5 11.5,69 C12.5,69.5 13.5,69.5 14,69.5 ' +
    'C14.5,69.5 15.5,69.5 16.5,69 C17.5,68.5 18.5,67.5 19.2,66.5 ' +
    // Crown lingual surface
    'C20,65 20.5,63.5 20.8,62 C21.2,59.5 21.5,57 21.8,54 ' +
    'C22,51.5 22.2,49 22.2,46 C22.2,43.5 22,41.5 21.5,40.5 ' +
    'C21,39.5 20.4,38.8 19.7,38 C19.2,37.5 18.7,36.5 18.7,35 ' +
    // Root lingual side
    'C18.7,33 18.6,30 18.5,27 C18.3,24 18.1,20 17.8,16 ' +
    'C17.5,12 17,8.5 16.5,5.5 C16,3 15,1.5 14,1 Z',
  root:
    'M14,1 C13,1.5 12,3 11.5,5.5 C11,8.5 10.5,12 10.2,16 ' +
    'C9.9,20 9.7,24 9.5,27 C9.4,30 9.3,33 9.3,35 ' +
    'C9.3,36.5 8.8,37.5 8.3,38 L19.7,38 ' +
    'C19.2,37.5 18.7,36.5 18.7,35 C18.7,33 18.6,30 18.5,27 ' +
    'C18.3,24 18.1,20 17.8,16 C17.5,12 17,8.5 16.5,5.5 ' +
    'C16,3 15,1.5 14,1 Z',
  crown:
    'M8.3,38 C7.6,38.8 7,39.5 6.5,40.5 C6,41.5 5.8,43.5 5.8,46 ' +
    'C5.8,49 6,51.5 6.2,54 C6.5,57 6.8,59.5 7.2,62 ' +
    'C7.5,63.5 8,65 8.8,66.5 C9.5,67.5 10.5,68.5 11.5,69 ' +
    'C12.5,69.5 13.5,69.5 14,69.5 C14.5,69.5 15.5,69.5 16.5,69 ' +
    'C17.5,68.5 18.5,67.5 19.2,66.5 C20,65 20.5,63.5 20.8,62 ' +
    'C21.2,59.5 21.5,57 21.8,54 C22,51.5 22.2,49 22.2,46 ' +
    'C22.2,43.5 22,41.5 21.5,40.5 C21,39.5 20.4,38.8 19.7,38 L8.3,38 Z',
  cervicalLine:
    'M8.3,38 C9.8,39.5 12,40 14,40 C16,40 18.2,39.5 19.7,38',
  enamel:
    'M7,48 C7,51 7.2,54 7.5,57 C7.8,59.5 8.2,62 8.8,64 ' +
    'C9.5,66 10.5,67.5 12,68.5 C13,69 13.8,69.5 14,69.5 ' +
    'C14.2,69.5 15,69 16,68.5 C17.5,67.5 18.5,66 19.2,64 ' +
    'C19.8,62 20.2,59.5 20.5,57 C20.8,54 21,51 21,48 L7,48 Z',
};

// Canine: Long thick root (longest of all), prominent pointed cusp, labial ridge
const canineSide: ToothSideView = {
  outline:
    // Root apex - thick, long, tapers to point
    'M16,1 C14.5,1.5 13,4 12,7.5 C11,11.5 10.2,16 9.5,21 ' +
    'C8.8,26 8.3,31 8,35 C7.8,38 7.5,40 7.5,42 ' +
    // Cervical constriction
    'C7.5,43.5 7,44.5 6.5,45 C5.8,45.8 5,46.5 4.5,47.5 ' +
    // Crown labial surface with distinctive ridge
    'C4,48.5 3.5,50.5 3.5,53 C3.5,55.5 3.8,58 4.2,61 ' +
    'C4.5,63.5 5,66 5.8,69 C6.5,71.5 7.5,74 9,77 ' +
    'C10,79 11.5,81 13,83 ' +
    // Pointed cusp tip - prominent
    'C14.5,85 15.5,86.5 16,87 ' +
    'C16.5,86.5 17.5,85 19,83 ' +
    // Crown lingual surface - shorter drop from cusp
    'C20.5,81 22,79 23,77 C24.5,74 25.5,71.5 26.2,69 ' +
    'C27,66 27.5,63.5 27.8,61 C28.2,58 28.5,55.5 28.5,53 ' +
    'C28.5,50.5 28,48.5 27.5,47.5 C27,46.5 26.2,45.8 25.5,45 ' +
    'C25,44.5 24.5,43.5 24.5,42 ' +
    // Root lingual side
    'C24.5,40 24.2,38 24,35 C23.7,31 23.2,26 22.5,21 ' +
    'C21.8,16 21,11.5 20,7.5 C19,4 17.5,1.5 16,1 Z',
  root:
    'M16,1 C14.5,1.5 13,4 12,7.5 C11,11.5 10.2,16 9.5,21 ' +
    'C8.8,26 8.3,31 8,35 C7.8,38 7.5,40 7.5,42 ' +
    'C7.5,43.5 7,44.5 6.5,45 L25.5,45 ' +
    'C25,44.5 24.5,43.5 24.5,42 C24.5,40 24.2,38 24,35 ' +
    'C23.7,31 23.2,26 22.5,21 C21.8,16 21,11.5 20,7.5 ' +
    'C19,4 17.5,1.5 16,1 Z',
  crown:
    'M6.5,45 C5.8,45.8 5,46.5 4.5,47.5 C4,48.5 3.5,50.5 3.5,53 ' +
    'C3.5,55.5 3.8,58 4.2,61 C4.5,63.5 5,66 5.8,69 ' +
    'C6.5,71.5 7.5,74 9,77 C10,79 11.5,81 13,83 ' +
    'C14.5,85 15.5,86.5 16,87 C16.5,86.5 17.5,85 19,83 ' +
    'C20.5,81 22,79 23,77 C24.5,74 25.5,71.5 26.2,69 ' +
    'C27,66 27.5,63.5 27.8,61 C28.2,58 28.5,55.5 28.5,53 ' +
    'C28.5,50.5 28,48.5 27.5,47.5 C27,46.5 26.2,45.8 25.5,45 L6.5,45 Z',
  cervicalLine:
    'M6.5,45 C9,46.5 12.5,47 16,47 C19.5,47 23,46.5 25.5,45',
  enamel:
    'M5.5,56 C5.5,59 6,62 6.5,65 C7,68 8,71 9.5,74 ' +
    'C11,77 12.5,80 14,83 C15,85 15.8,86.5 16,87 ' +
    'C16.2,86.5 17,85 18,83 C19.5,80 21,77 22.5,74 ' +
    'C24,71 25,68 25.5,65 C26,62 26.5,59 26.5,56 L5.5,56 Z',
};

// Premolar 1: Two clearly separated roots (buccal longer, palatal shorter)
// Crown has two cusps - buccal taller, palatal shorter, clear groove between
const premolar1Side: ToothSideView = {
  outline:
    // Buccal root - longer, starts from left
    'M9,2 C7.5,3 6,6 5.5,10 C5,14 4.5,18 4,22 ' +
    'C3.5,25 3.2,28 3.5,30 ' +
    // Furcation area - roots diverge
    'C4,32 5,33.5 6.5,34 C7.5,34.5 8.5,34.5 9.5,34 ' +
    // Inter-root gap (furcation clearly visible)
    'C10.5,33.5 11.5,32.5 12.5,31 ' +
    // Palatal root - shorter, diverges right
    'C13.5,29 14.5,26 15.5,22 C16.5,18 17.5,14 18.5,10 ' +
    'C19.5,6 21,3 23,2 C24,1.5 25,2 26,3 ' +
    'C27,5 27.5,8 28,12 C28.5,16 28.5,20 28.5,24 ' +
    'C28.5,28 28,31 27.5,33 ' +
    // Cervical area palatal side
    'C27,35 26,36.5 25,37 C24,37.5 23.5,38.5 23.5,40 ' +
    // Crown - palatal cusp (shorter)
    'C23.5,42 23,44.5 22.5,47.5 C22,50 21.5,53 21,55.5 ' +
    'C20.5,57.5 20,59 19.5,60 ' +
    // Groove between cusps
    'C18.5,61.5 17.5,60.5 16.5,61 ' +
    // Crown - buccal cusp (taller)
    'C15,62 13.5,61 12,60 C10.5,58.5 9.5,56.5 8.5,54 ' +
    'C7.5,51 6.5,48 6,45 C5.5,43 5.5,41 5.5,40 ' +
    'C5.5,38.5 5,37.5 4.5,37 C3.5,36.5 3,35 3,33 ' +
    'C3,31 3.2,29 3.5,30 Z',
  root:
    // Buccal root
    'M9,2 C7.5,3 6,6 5.5,10 C5,14 4.5,18 4,22 ' +
    'C3.5,25 3.2,28 3.5,30 C4,32 5,33.5 6.5,34 ' +
    'C7.5,34.5 8.5,34.5 9.5,34 C10.5,33.5 11.5,32.5 12.5,31 ' +
    'C13.5,29 14.5,26 15.5,22 C16.5,18 17.5,14 18.5,10 ' +
    'C19.5,6 21,3 23,2 C24,1.5 25,2 26,3 ' +
    'C27,5 27.5,8 28,12 C28.5,16 28.5,20 28.5,24 ' +
    'C28.5,28 28,31 27.5,33 C27,35 26,36.5 25,37 ' +
    'L4.5,37 C3.5,36.5 3,35 3,33 C3,31 3.2,28 3.5,30 Z',
  crown:
    'M4.5,37 C5,37.5 5.5,38.5 5.5,40 C5.5,41 5.5,43 6,45 ' +
    'C6.5,48 7.5,51 8.5,54 C9.5,56.5 10.5,58.5 12,60 ' +
    'C13.5,61 15,62 16.5,61 C17.5,60.5 18.5,61.5 19.5,60 ' +
    'C20,59 20.5,57.5 21,55.5 C21.5,53 22,50 22.5,47.5 ' +
    'C23,44.5 23.5,42 23.5,40 C23.5,38.5 24,37.5 25,37 L4.5,37 Z',
  cervicalLine:
    'M3.5,36 C6,38 10,39 14.5,39 C19,39 23,38 26,36',
  enamel:
    'M7,48 C7.5,51 8.5,54 9.5,56.5 C10.5,58.5 12,60 13.5,61 ' +
    'C15,62 16.5,61 17.5,60.5 C18.5,61.5 19.5,60 20,59 ' +
    'C20.5,57.5 21,55.5 21.5,53 C22,50 22.5,48 22.5,45 ' +
    'L7,45 C7,46 7,47 7,48 Z',
};

// Premolar 2: Single conical root, two cusps of nearly equal height
const premolar2Side: ToothSideView = {
  outline:
    // Root - single, conical, tapers to point
    'M15,1 C13.5,1.5 12,4 11,7.5 C10,11.5 9.2,16 8.5,21 ' +
    'C7.8,25.5 7.3,29.5 7,33 C6.8,35 7,36.5 7.5,37.5 ' +
    // Cervical constriction
    'C7.8,38.2 7.2,38.8 6.5,39.5 C5.8,40.2 5.2,41 5,42 ' +
    // Crown buccal surface
    'C4.8,43 4.5,45 4.5,47.5 C4.5,50 5,52.5 5.5,55 ' +
    'C6,57 6.5,59 7.5,61 ' +
    // Buccal cusp
    'C8.5,63 10,64.5 11.5,65.5 C12.5,66 13.5,66.2 14,66 ' +
    // Central groove
    'C14.5,65.5 15,65 15.5,65.5 ' +
    // Palatal cusp (nearly equal height)
    'C16,66.2 17,66 18.5,65.5 C20,64.5 21.5,63 22.5,61 ' +
    // Crown lingual surface
    'C23.5,59 24,57 24.5,55 C25,52.5 25.5,50 25.5,47.5 ' +
    'C25.5,45 25.2,43 25,42 C24.8,41 24.2,40.2 23.5,39.5 ' +
    'C22.8,38.8 22.2,38.2 22.5,37.5 ' +
    // Root lingual side
    'C23,36.5 23.2,35 23,33 C22.7,29.5 22.2,25.5 21.5,21 ' +
    'C20.8,16 20,11.5 19,7.5 C18,4 16.5,1.5 15,1 Z',
  root:
    'M15,1 C13.5,1.5 12,4 11,7.5 C10,11.5 9.2,16 8.5,21 ' +
    'C7.8,25.5 7.3,29.5 7,33 C6.8,35 7,36.5 7.5,37.5 ' +
    'C7.8,38.2 7.2,38.8 6.5,39.5 L23.5,39.5 ' +
    'C22.8,38.8 22.2,38.2 22.5,37.5 C23,36.5 23.2,35 23,33 ' +
    'C22.7,29.5 22.2,25.5 21.5,21 C20.8,16 20,11.5 19,7.5 ' +
    'C18,4 16.5,1.5 15,1 Z',
  crown:
    'M6.5,39.5 C5.8,40.2 5.2,41 5,42 C4.8,43 4.5,45 4.5,47.5 ' +
    'C4.5,50 5,52.5 5.5,55 C6,57 6.5,59 7.5,61 ' +
    'C8.5,63 10,64.5 11.5,65.5 C12.5,66 13.5,66.2 14,66 ' +
    'C14.5,65.5 15,65 15.5,65.5 C16,66.2 17,66 18.5,65.5 ' +
    'C20,64.5 21.5,63 22.5,61 C23.5,59 24,57 24.5,55 ' +
    'C25,52.5 25.5,50 25.5,47.5 C25.5,45 25.2,43 25,42 ' +
    'C24.8,41 24.2,40.2 23.5,39.5 L6.5,39.5 Z',
  cervicalLine:
    'M6.5,39.5 C9,41 12,41.5 15,41.5 C18,41.5 21,41 23.5,39.5',
  enamel:
    'M6,50 C6.5,53 7,55.5 8,58 C9,60.5 10.5,63 12,64.5 ' +
    'C13,65.5 14,66 14.5,65.5 C15,65 15.5,65.5 16,66 ' +
    'C17,65.5 18.5,64.5 20,63 C21.5,60.5 22.5,58 23,55.5 ' +
    'C23.5,53 24,50 24,48 L6,48 C6,49 6,49.5 6,50 Z',
};

// Molar 1: Three distinct roots - mesiobuccal (longer), distobuccal (shorter), palatal (thick, divergent)
// Wide crown with 4-5 cusps, clear furcation
const molar1Side: ToothSideView = {
  outline:
    // Mesiobuccal root - longest, leftmost
    'M7,1 C5.5,2.5 4,6 3.5,10 C3,14.5 2.5,19 2.5,23 ' +
    'C2.5,26 2.8,28.5 3.5,30 ' +
    // Furcation between mesiobuccal and distobuccal roots
    'C4.5,31.5 6,32.5 7.5,32.5 C8.5,32.5 9.5,32 10,31 ' +
    // Distobuccal root - shorter
    'C10.5,29.5 11,27 11.5,24 C12,21 12.5,17.5 13.5,14 ' +
    'C14.5,10.5 16,7 18,5 ' +
    // Connection to palatal root
    'C19.5,3.5 21.5,2.5 23.5,2 C25.5,1.5 27.5,2 29,3.5 ' +
    // Palatal root - thick, divergent
    'C31,5.5 32.5,9 33.5,13 C34.5,17.5 35,22 35,26 ' +
    'C35,29 34.5,32 34,34 ' +
    // Cervical area
    'C33.5,36 32.5,37.5 31,38 C30,38.5 29.5,39.5 29.5,41 ' +
    // Crown - distal surface
    'C29.5,43 29,46 28,49.5 C27,53 26,56 25,58.5 ' +
    // Distolingual cusp
    'C24,60.5 23,62 22,63 ' +
    // Oblique ridge / fissure
    'C21,63.5 20,63 19.5,63.5 ' +
    // Distobuccal cusp
    'C18.5,64 17,63 16,62 ' +
    // Central fissure
    'C15,61 14.5,62 14,62.5 ' +
    // Mesiolingual cusp
    'C13,63 12,62.5 11.5,63.5 ' +
    // Between ML and MB
    'C10.5,63 10,62 9.5,63 ' +
    // Mesiobuccal cusp (tallest)
    'C8.5,64 7,63 5.5,61 ' +
    'C4,59 3.5,56 3.5,53 C3.5,50 4,47 4.5,44 ' +
    'C5,42 5.5,40.5 5.5,39.5 ' +
    // Back to cervical
    'C5.5,38.5 5,37.5 4,37 C3,36 2,34.5 2,32 ' +
    'C2,30 2.5,27 2.5,23 Z',
  root:
    'M7,1 C5.5,2.5 4,6 3.5,10 C3,14.5 2.5,19 2.5,23 ' +
    'C2.5,26 2.8,28.5 3.5,30 C4.5,31.5 6,32.5 7.5,32.5 ' +
    'C8.5,32.5 9.5,32 10,31 C10.5,29.5 11,27 11.5,24 ' +
    'C12,21 12.5,17.5 13.5,14 C14.5,10.5 16,7 18,5 ' +
    'C19.5,3.5 21.5,2.5 23.5,2 C25.5,1.5 27.5,2 29,3.5 ' +
    'C31,5.5 32.5,9 33.5,13 C34.5,17.5 35,22 35,26 ' +
    'C35,29 34.5,32 34,34 C33.5,36 32.5,37.5 31,38 ' +
    'L4,37 C3,36 2,34.5 2,32 C2,30 2.5,27 2.5,23 Z',
  crown:
    'M4,37 C5,37.5 5.5,38.5 5.5,39.5 C5.5,40.5 5,42 4.5,44 ' +
    'C4,47 3.5,50 3.5,53 C3.5,56 4,59 5.5,61 ' +
    'C7,63 8.5,64 9.5,63 C10,62 10.5,63 11.5,63.5 ' +
    'C12,62.5 13,63 14,62.5 C14.5,62 15,61 16,62 ' +
    'C17,63 18.5,64 19.5,63.5 C20,63 21,63.5 22,63 ' +
    'C23,62 24,60.5 25,58.5 C26,56 27,53 28,49.5 ' +
    'C29,46 29.5,43 29.5,41 C29.5,39.5 30,38.5 31,38 L4,37 Z',
  cervicalLine:
    'M4,37 C7,39 12,40 18,40 C24,40 29,39 31,37',
  enamel:
    'M5,48 C4.5,51 4.5,54 5.5,57 C6.5,60 8,62.5 9.5,63 ' +
    'C10,62 10.5,63 11.5,63.5 C12,62.5 13,63 14,62.5 ' +
    'C14.5,62 15,61 16,62 C17,63 18.5,64 19.5,63.5 ' +
    'C20,63 21,63.5 22,63 C23,62 24,60.5 25,58.5 ' +
    'C26,56 27,53 27.5,50 C28,48 28.5,45 28.5,43 ' +
    'L5.5,43 C5.5,44 5.2,46 5,48 Z',
};

// Molar 2: Similar to molar 1 but slightly smaller, roots closer together
const molar2Side: ToothSideView = {
  outline:
    // Mesiobuccal root
    'M8,2 C6.5,3.5 5,7 4.5,11 C4,15 3.5,19 3.5,23 ' +
    'C3.5,25.5 3.8,28 4.5,29.5 ' +
    // Furcation
    'C5.5,31 7,31.5 8.5,31.5 C9.5,31.5 10.5,31 11,30 ' +
    // Distobuccal root - closer to mesiobuccal
    'C11.5,28.5 12,26 12.5,23 C13,20 13.5,16.5 14.5,13 ' +
    'C15.5,9.5 17,6.5 19,4.5 ' +
    // Connection to palatal root
    'C20.5,3 22,2 24,2 C26,2 28,3 29.5,5 ' +
    // Palatal root
    'C31,7.5 32,11 32.5,15 C33,19 33,23 33,26 ' +
    'C33,29 32.5,31.5 32,33.5 ' +
    // Cervical area
    'C31.5,35 30.5,36.5 29.5,37 C28.5,37.5 28,38.5 28,40 ' +
    // Crown distal
    'C28,42 27.5,44.5 26.5,48 C25.5,51 24.5,54 23.5,56.5 ' +
    // Distolingual cusp
    'C22.5,58.5 21.5,60 20.5,61 ' +
    // Fissure
    'C19.5,61.5 18.5,61 18,61.5 ' +
    // Distobuccal cusp
    'C17,62 15.5,61 14.5,60 ' +
    // Central fissure
    'C13.5,59 13,60 12.5,60.5 ' +
    // Mesiobuccal cusp
    'C11,61 9.5,60 8,58 ' +
    'C6.5,56 5.5,53 5,50 C4.5,47.5 4.5,45 4.5,43 ' +
    'C4.5,41.5 4.5,40 4.5,39 ' +
    // Back to cervical
    'C4.5,38 4,37 3.5,36.5 C3,36 2.5,34.5 2.8,32.5 ' +
    'C3,30.5 3.5,27 3.5,23 Z',
  root:
    'M8,2 C6.5,3.5 5,7 4.5,11 C4,15 3.5,19 3.5,23 ' +
    'C3.5,25.5 3.8,28 4.5,29.5 C5.5,31 7,31.5 8.5,31.5 ' +
    'C9.5,31.5 10.5,31 11,30 C11.5,28.5 12,26 12.5,23 ' +
    'C13,20 13.5,16.5 14.5,13 C15.5,9.5 17,6.5 19,4.5 ' +
    'C20.5,3 22,2 24,2 C26,2 28,3 29.5,5 ' +
    'C31,7.5 32,11 32.5,15 C33,19 33,23 33,26 ' +
    'C33,29 32.5,31.5 32,33.5 C31.5,35 30.5,36.5 29.5,37 ' +
    'L3.5,36.5 C3,36 2.5,34.5 2.8,32.5 C3,30.5 3.5,27 3.5,23 Z',
  crown:
    'M3.5,36.5 C4,37 4.5,38 4.5,39 C4.5,40 4.5,41.5 4.5,43 ' +
    'C4.5,45 4.5,47.5 5,50 C5.5,53 6.5,56 8,58 ' +
    'C9.5,60 11,61 12.5,60.5 C13,60 13.5,59 14.5,60 ' +
    'C15.5,61 17,62 18,61.5 C18.5,61 19.5,61.5 20.5,61 ' +
    'C21.5,60 22.5,58.5 23.5,56.5 C24.5,54 25.5,51 26.5,48 ' +
    'C27.5,44.5 28,42 28,40 C28,38.5 28.5,37.5 29.5,37 L3.5,36.5 Z',
  cervicalLine:
    'M3.5,36.5 C6,38 10.5,39 17,39 C23.5,39 28,38 29.5,37',
  enamel:
    'M5.5,48 C6,51 7,54 8.5,57 C9.5,59 11,60.5 12.5,60.5 ' +
    'C13,60 13.5,59 14.5,60 C15.5,61 17,62 18,61.5 ' +
    'C18.5,61 19.5,61.5 20.5,61 C21.5,60 22.5,58.5 23.5,56.5 ' +
    'C24.5,54 25.5,51 26,48 C26.5,46 27,44 27,42 ' +
    'L5,42 C5,44 5.2,46 5.5,48 Z',
};

// Molar 3 (wisdom): Smallest molar, roots often fused/irregular, crown rounded, fewer cusps
const molar3Side: ToothSideView = {
  outline:
    // Fused/irregular roots
    'M14,1 C12,2 10,5 9,9 C8,13 7.5,17 7,21 ' +
    'C6.5,24 6.2,27 6.5,29 ' +
    // Partial furcation hint (roots partially fused)
    'C7,30.5 8,31.5 9.5,31.5 C10.5,31.5 11.5,31 12,30 ' +
    'C12.5,29 13,27 14,24 C15,21 16,17.5 17,13 ' +
    'C18,9 19.5,5 21,3 C22,2 23.5,1.5 25,2 ' +
    'C26.5,2.5 27.5,5 28,9 C28.5,13 28.5,17 28.5,21 ' +
    'C28.5,24.5 28.2,27.5 27.5,30 ' +
    // Cervical area
    'C27,32 26,33.5 25,34 C24,34.5 23.5,35.5 23.5,37 ' +
    // Crown - fewer defined cusps, more rounded
    'C23.5,39 23,41 22.5,43.5 C22,46 21.5,48 21,50 ' +
    // Distal cusp (rounded)
    'C20.5,51.5 19.5,53 18.5,53.5 ' +
    // Shallow groove
    'C17.5,54 16.5,53.5 16,54 ' +
    // Mesial cusp (rounded)
    'C15,54.5 13.5,53.5 12.5,52 ' +
    'C11.5,50.5 10.5,48.5 10,46 C9.5,44 9,42 9,40 ' +
    'C9,38.5 9,37 8.5,36 C8,35 7,34 6.5,33 ' +
    'C6,32 5.8,30.5 6.5,29 Z',
  root:
    'M14,1 C12,2 10,5 9,9 C8,13 7.5,17 7,21 ' +
    'C6.5,24 6.2,27 6.5,29 C7,30.5 8,31.5 9.5,31.5 ' +
    'C10.5,31.5 11.5,31 12,30 C12.5,29 13,27 14,24 ' +
    'C15,21 16,17.5 17,13 C18,9 19.5,5 21,3 ' +
    'C22,2 23.5,1.5 25,2 C26.5,2.5 27.5,5 28,9 ' +
    'C28.5,13 28.5,17 28.5,21 C28.5,24.5 28.2,27.5 27.5,30 ' +
    'C27,32 26,33.5 25,34 L8.5,36 ' +
    'C8,35 7,34 6.5,33 C6,32 5.8,30.5 6.5,29 Z',
  crown:
    'M8.5,36 C9,37 9,38.5 9,40 C9,42 9.5,44 10,46 ' +
    'C10.5,48.5 11.5,50.5 12.5,52 C13.5,53.5 15,54.5 16,54 ' +
    'C16.5,53.5 17.5,54 18.5,53.5 C19.5,53 20.5,51.5 21,50 ' +
    'C21.5,48 22,46 22.5,43.5 C23,41 23.5,39 23.5,37 ' +
    'C23.5,35.5 24,34.5 25,34 L8.5,36 Z',
  cervicalLine:
    'M8.5,36 C10,37 13,37.5 17,37.5 C21,37.5 24,37 25,34',
  enamel:
    'M10,44 C10.5,47 11.5,49.5 12.5,51.5 C13.5,53 15,54.5 16,54 ' +
    'C16.5,53.5 17.5,54 18.5,53.5 C19.5,53 20.5,51.5 21,50 ' +
    'C21.5,48 22,46 22.5,44 L10,44 Z',
};

// ---------------------------------------------------------------------------
// Occlusal view paths (top-down / biting surface)
// ---------------------------------------------------------------------------

// Central Incisor occlusal: Elongated shovel shape
const centralIncisorOcclusal: ToothOcclusalView = {
  outline:
    'M3,5 C4,2.5 8,1 15,1 C22,1 26,2.5 27,5 ' +
    'C28,7 28,10 27,13 C25.5,16 22,18 18,19 ' +
    'C15.5,19.5 14.5,19.5 12,19 C8,18 4.5,16 3,13 C2,10 2,7 3,5 Z',
  surfaces: {
    M: 'M3,5 C4,2.5 8,1 15,1 L15,10 L6,10 L3,13 C2,10 2,7 3,5 Z',
    D: 'M15,1 C22,1 26,2.5 27,5 C28,7 28,10 27,13 L24,10 L15,10 L15,1 Z',
    O: 'M6,10 L24,10 L22,14.5 C20,15.5 17.5,16 15,16 C12.5,16 10,15.5 8,14.5 L6,10 Z',
    B: 'M6,10 L8,14.5 C10,15.5 12.5,16 15,16 C17.5,16 20,15.5 22,14.5 L24,10 L27,13 ' +
       'C25.5,16 22,18 18,19 C15.5,19.5 14.5,19.5 12,19 C8,18 4.5,16 3,13 L6,10 Z',
    L: 'M6,10 L3,13 C2,10 2,7 3,5 C4,2.5 8,1 15,1 ' +
       'C22,1 26,2.5 27,5 C28,7 28,10 27,13 L24,10 L6,10 Z',
  },
};

// Lateral Incisor occlusal: Narrower elongated oval
const lateralIncisorOcclusal: ToothOcclusalView = {
  outline:
    'M3.5,4.5 C5,2 9,1 13,1 C17,1 21,2 22.5,4.5 ' +
    'C24,7 24,9.5 23,12 C21.5,14.5 19,16 16,17 ' +
    'C14,17.5 12,17.5 10,17 C7,16 4.5,14.5 3,12 C2,9.5 2,7 3.5,4.5 Z',
  surfaces: {
    M: 'M3.5,4.5 C5,2 9,1 13,1 L13,9 L5.5,9 L3,12 C2,9.5 2,7 3.5,4.5 Z',
    D: 'M13,1 C17,1 21,2 22.5,4.5 C24,7 24,9.5 23,12 L20.5,9 L13,9 L13,1 Z',
    O: 'M5.5,9 L20.5,9 L19,13 C17.5,14 15.5,14.5 13,14.5 C10.5,14.5 8.5,14 7,13 L5.5,9 Z',
    B: 'M5.5,9 L7,13 C8.5,14 10.5,14.5 13,14.5 C15.5,14.5 17.5,14 19,13 L20.5,9 L23,12 ' +
       'C21.5,14.5 19,16 16,17 C14,17.5 12,17.5 10,17 C7,16 4.5,14.5 3,12 L5.5,9 Z',
    L: 'M5.5,9 L3,12 C2,9.5 2,7 3.5,4.5 C5,2 9,1 13,1 ' +
       'C17,1 21,2 22.5,4.5 C24,7 24,9.5 23,12 L20.5,9 L5.5,9 Z',
  },
};

// Canine occlusal: Diamond/pointed oval shape
const canineOcclusal: ToothOcclusalView = {
  outline:
    'M4,4 C6,1.5 10,0.5 15,0.5 C20,0.5 24,1.5 26,4 ' +
    'C28,6.5 28.5,9.5 27,13 C25.5,16 22,19 18.5,20.5 ' +
    'C16,21.5 14,21.5 11.5,20.5 C8,19 4.5,16 3,13 C1.5,9.5 2,6.5 4,4 Z',
  surfaces: {
    M: 'M4,4 C6,1.5 10,0.5 15,0.5 L15,11 L6.5,9.5 L3,13 C1.5,9.5 2,6.5 4,4 Z',
    D: 'M15,0.5 C20,0.5 24,1.5 26,4 C28,6.5 28.5,9.5 27,13 L23.5,9.5 L15,11 L15,0.5 Z',
    O: 'M6.5,9.5 L23.5,9.5 L21,14.5 C19,16 17,17 15,17 C13,17 11,16 9,14.5 L6.5,9.5 Z',
    B: 'M6.5,9.5 L9,14.5 C11,16 13,17 15,17 C17,17 19,16 21,14.5 L23.5,9.5 L27,13 ' +
       'C25.5,16 22,19 18.5,20.5 C16,21.5 14,21.5 11.5,20.5 C8,19 4.5,16 3,13 L6.5,9.5 Z',
    L: 'M6.5,9.5 L3,13 C1.5,9.5 2,6.5 4,4 C6,1.5 10,0.5 15,0.5 ' +
       'C20,0.5 24,1.5 26,4 C28,6.5 28.5,9.5 27,13 L23.5,9.5 L6.5,9.5 Z',
  },
};

// Premolar 1 occlusal: Oval with two cusps and central fissure
const premolar1Occlusal: ToothOcclusalView = {
  outline:
    'M4,6 C6,2.5 11,1 16,1 C21,1 26,2.5 28,6 ' +
    'C30,9.5 30,15 29,20 C28,24.5 25,28 21,29.5 ' +
    'C18,30.5 14,30.5 11,29.5 C7,28 4,24.5 3,20 C2,15 2,9.5 4,6 Z',
  surfaces: {
    M: 'M4,6 C6,2.5 11,1 16,1 L16,10 L7,10 L3,16 C2,12 2,9.5 4,6 Z',
    D: 'M16,1 C21,1 26,2.5 28,6 C30,9.5 30,15 29,16 L25,10 L16,10 L16,1 Z',
    O: 'M7,10 L25,10 L24,18 C22,20.5 19.5,22 16,22 C12.5,22 10,20.5 8,18 L7,10 Z',
    B: 'M7,10 L8,18 C10,20.5 12.5,22 16,22 C19.5,22 22,20.5 24,18 L25,10 L29,16 ' +
       'C28,24.5 25,28 21,29.5 C18,30.5 14,30.5 11,29.5 C7,28 4,24.5 3,20 L7,10 Z',
    L: 'M7,10 L3,16 C2,12 2,9.5 4,6 C6,2.5 11,1 16,1 ' +
       'C21,1 26,2.5 28,6 C30,9.5 30,15 29,16 L25,10 L7,10 Z',
  },
  fissures:
    'M10,15 C12,16.5 14,17 16,17 C18,17 20,16.5 22,15',
};

// Premolar 2 occlusal: Oval with two nearly equal cusps
const premolar2Occlusal: ToothOcclusalView = {
  outline:
    'M4,5.5 C6,2.5 10,1 15,1 C20,1 24,2.5 26,5.5 ' +
    'C28,8.5 28,13 27,18 C26,22.5 23,26 20,27.5 ' +
    'C17,28.5 13,28.5 10,27.5 C7,26 4,22.5 3,18 C2,13 2,8.5 4,5.5 Z',
  surfaces: {
    M: 'M4,5.5 C6,2.5 10,1 15,1 L15,9 L6.5,9 L3,15 C2,11 2,8.5 4,5.5 Z',
    D: 'M15,1 C20,1 24,2.5 26,5.5 C28,8.5 28,13 27,15 L23.5,9 L15,9 L15,1 Z',
    O: 'M6.5,9 L23.5,9 L22.5,17 C20.5,19 18,20 15,20 C12,20 9.5,19 7.5,17 L6.5,9 Z',
    B: 'M6.5,9 L7.5,17 C9.5,19 12,20 15,20 C18,20 20.5,19 22.5,17 L23.5,9 L27,15 ' +
       'C26,22.5 23,26 20,27.5 C17,28.5 13,28.5 10,27.5 C7,26 4,22.5 3,18 L6.5,9 Z',
    L: 'M6.5,9 L3,15 C2,11 2,8.5 4,5.5 C6,2.5 10,1 15,1 ' +
       'C20,1 24,2.5 26,5.5 C28,8.5 28,13 27,15 L23.5,9 L6.5,9 Z',
  },
  fissures:
    'M9,13.5 C11,14.5 13,15 15,15 C17,15 19,14.5 21,13.5',
};

// Molar 1 occlusal: Rectangular/rhomboid with cross-shaped fissure, 4-5 cusps
const molar1Occlusal: ToothOcclusalView = {
  outline:
    'M5,4 C8,1.5 14,0.5 20,0.5 C26,0.5 32,1.5 35,4 ' +
    'C38,7 38.5,13 37.5,20 C36.5,27 33.5,33 29,35.5 ' +
    'C25,37.5 16,37.5 12,35.5 C7.5,33 4.5,27 3.5,20 C2.5,13 3,7 5,4 Z',
  surfaces: {
    M: 'M5,4 C8,1.5 14,0.5 20,0.5 L20,11 L8,11 L3.5,18 C2.5,12 3,7 5,4 Z',
    D: 'M20,0.5 C26,0.5 32,1.5 35,4 C38,7 38.5,13 37.5,18 L32,11 L20,11 L20,0.5 Z',
    O: 'M8,11 L32,11 L30.5,22 C28.5,25 25,27 20,27 C15,27 11.5,25 9.5,22 L8,11 Z',
    B: 'M8,11 L9.5,22 C11.5,25 15,27 20,27 C25,27 28.5,25 30.5,22 L32,11 L37.5,18 ' +
       'C36.5,27 33.5,33 29,35.5 C25,37.5 16,37.5 12,35.5 C7.5,33 4.5,27 3.5,20 L8,11 Z',
    L: 'M8,11 L3.5,18 C2.5,12 3,7 5,4 C8,1.5 14,0.5 20,0.5 ' +
       'C26,0.5 32,1.5 35,4 C38,7 38.5,13 37.5,18 L32,11 L8,11 Z',
  },
  fissures:
    // Cross-shaped fissure pattern with oblique ridge
    'M12,16 C14,18 17,19 20,19 C23,19 26,18 28,16 ' +
    'M20,12 C20,15 20,18 20,23 ' +
    'M13,20 C15,22 17,23 19,23 ' +
    'M28,16 C26,19 24,21 22,22',
};

// Molar 2 occlusal: Slightly smaller rectangle, 4 cusps
const molar2Occlusal: ToothOcclusalView = {
  outline:
    'M5,4.5 C7.5,2 13,0.5 19,0.5 C25,0.5 30.5,2 33,4.5 ' +
    'C35.5,7.5 36,13 35,19 C34,25 31,30.5 27,32.5 ' +
    'C23.5,34 15,34 11,32.5 C7,30.5 4,25 3,19 C2,13 2.5,7.5 5,4.5 Z',
  surfaces: {
    M: 'M5,4.5 C7.5,2 13,0.5 19,0.5 L19,10 L8,10 L3,17 C2,11.5 2.5,7.5 5,4.5 Z',
    D: 'M19,0.5 C25,0.5 30.5,2 33,4.5 C35.5,7.5 36,13 35,17 L30,10 L19,10 L19,0.5 Z',
    O: 'M8,10 L30,10 L28.5,20 C26.5,23 23,24.5 19,24.5 C15,24.5 11.5,23 9.5,20 L8,10 Z',
    B: 'M8,10 L9.5,20 C11.5,23 15,24.5 19,24.5 C23,24.5 26.5,23 28.5,20 L30,10 L35,17 ' +
       'C34,25 31,30.5 27,32.5 C23.5,34 15,34 11,32.5 C7,30.5 4,25 3,19 L8,10 Z',
    L: 'M8,10 L3,17 C2,11.5 2.5,7.5 5,4.5 C7.5,2 13,0.5 19,0.5 ' +
       'C25,0.5 30.5,2 33,4.5 C35.5,7.5 36,13 35,17 L30,10 L8,10 Z',
  },
  fissures:
    'M12,15 C14,17 16.5,18 19,18 C21.5,18 24,17 26,15 ' +
    'M19,11 C19,14 19,17 19,21',
};

// Molar 3 occlusal: Smallest molar, more rounded, irregular
const molar3Occlusal: ToothOcclusalView = {
  outline:
    'M5.5,5 C7.5,2.5 12,1 17,1 C22,1 26.5,2.5 28.5,5 ' +
    'C30.5,7.5 31,12 30,17 C29,22 26.5,27 23,29 ' +
    'C20,30.5 14,30.5 11,29 C7.5,27 5,22 4,17 C3,12 3.5,7.5 5.5,5 Z',
  surfaces: {
    M: 'M5.5,5 C7.5,2.5 12,1 17,1 L17,9.5 L7.5,9.5 L4,15 C3,10.5 3.5,7.5 5.5,5 Z',
    D: 'M17,1 C22,1 26.5,2.5 28.5,5 C30.5,7.5 31,12 30,15 L26.5,9.5 L17,9.5 L17,1 Z',
    O: 'M7.5,9.5 L26.5,9.5 L25,18.5 C23.5,21 20.5,22 17,22 C13.5,22 10.5,21 9,18.5 L7.5,9.5 Z',
    B: 'M7.5,9.5 L9,18.5 C10.5,21 13.5,22 17,22 C20.5,22 23.5,21 25,18.5 L26.5,9.5 L30,15 ' +
       'C29,22 26.5,27 23,29 C20,30.5 14,30.5 11,29 C7.5,27 5,22 4,17 L7.5,9.5 Z',
    L: 'M7.5,9.5 L4,15 C3,10.5 3.5,7.5 5.5,5 C7.5,2.5 12,1 17,1 ' +
       'C22,1 26.5,2.5 28.5,5 C30.5,7.5 31,12 30,15 L26.5,9.5 L7.5,9.5 Z',
  },
  fissures:
    'M11,14 C13,16 15,16.5 17,16.5 C19,16.5 21,16 23,14 ' +
    'M17,10.5 C17,12.5 17,15 17,18.5',
};

// ---------------------------------------------------------------------------
// Complete tooth data by type
// ---------------------------------------------------------------------------

const TOOTH_DATA: Record<ToothType, ToothPaths> = {
  'central-incisor': {
    sideView: centralIncisorSide,
    occlusalView: centralIncisorOcclusal,
    sideViewBox: { width: 30, height: 76 },
    occlusalViewBox: { width: 30, height: 20 },
    cervicalY: 39,
    rootCount: 1,
  },
  'lateral-incisor': {
    sideView: lateralIncisorSide,
    occlusalView: lateralIncisorOcclusal,
    sideViewBox: { width: 28, height: 71 },
    occlusalViewBox: { width: 26, height: 18 },
    cervicalY: 38,
    rootCount: 1,
  },
  'canine': {
    sideView: canineSide,
    occlusalView: canineOcclusal,
    sideViewBox: { width: 32, height: 88 },
    occlusalViewBox: { width: 30, height: 22 },
    cervicalY: 45,
    rootCount: 1,
  },
  'premolar-1': {
    sideView: premolar1Side,
    occlusalView: premolar1Occlusal,
    sideViewBox: { width: 32, height: 66 },
    occlusalViewBox: { width: 32, height: 31 },
    cervicalY: 37,
    rootCount: 2,
  },
  'premolar-2': {
    sideView: premolar2Side,
    occlusalView: premolar2Occlusal,
    sideViewBox: { width: 30, height: 68 },
    occlusalViewBox: { width: 30, height: 29 },
    cervicalY: 39,
    rootCount: 1,
  },
  'molar-1': {
    sideView: molar1Side,
    occlusalView: molar1Occlusal,
    sideViewBox: { width: 38, height: 66 },
    occlusalViewBox: { width: 40, height: 38 },
    cervicalY: 37,
    rootCount: 3,
  },
  'molar-2': {
    sideView: molar2Side,
    occlusalView: molar2Occlusal,
    sideViewBox: { width: 36, height: 64 },
    occlusalViewBox: { width: 38, height: 35 },
    cervicalY: 37,
    rootCount: 3,
  },
  'molar-3': {
    sideView: molar3Side,
    occlusalView: molar3Occlusal,
    sideViewBox: { width: 34, height: 56 },
    occlusalViewBox: { width: 34, height: 31 },
    cervicalY: 36,
    rootCount: 2,
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getToothType(fdi: number): ToothType {
  const tooth = fdi % 10;
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

export function getSurfaceLabel(key: SurfaceKey, fdi: number): string {
  const quadrant = Math.floor(fdi / 10);
  const labels: Record<SurfaceKey, string> = {
    M: 'Mesiaal',
    D: 'Distaal',
    O: fdi % 10 <= 3 ? 'Incisaal' : 'Occlusaal',
    B: 'Vestibulair',
    L: quadrant <= 2 ? 'Palatinaal' : 'Linguaal',
  };
  return labels[key];
}

// ---------------------------------------------------------------------------
// SVG path transformation utilities
// ---------------------------------------------------------------------------

/** Flip an SVG path vertically within a given height */
function flipPathVertically(path: string, height: number): string {
  return path.replace(
    /([MLCSQT])\s*([\d.,\s-]+)/gi,
    (_match, cmd: string, coords: string) => {
      const nums = coords.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      const flipped: number[] = [];
      for (let i = 0; i < nums.length; i++) {
        if (i % 2 === 1) {
          flipped.push(height - nums[i]);
        } else {
          flipped.push(nums[i]);
        }
      }
      return cmd + flipped.join(',');
    }
  );
}

/** Flip an SVG path horizontally within a given width */
function flipPathHorizontally(path: string, width: number): string {
  return path.replace(
    /([MLCSQT])\s*([\d.,\s-]+)/gi,
    (_match, cmd: string, coords: string) => {
      const nums = coords.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      const flipped: number[] = [];
      for (let i = 0; i < nums.length; i++) {
        if (i % 2 === 0) {
          flipped.push(width - nums[i]);
        } else {
          flipped.push(nums[i]);
        }
      }
      return cmd + flipped.join(',');
    }
  );
}

function transformSideView(
  view: ToothSideView,
  width: number,
  height: number,
  flipV: boolean,
  flipH: boolean
): ToothSideView {
  const transform = (p: string) => {
    let result = p;
    if (flipV) result = flipPathVertically(result, height);
    if (flipH) result = flipPathHorizontally(result, width);
    return result;
  };
  return {
    outline: transform(view.outline),
    root: transform(view.root),
    crown: transform(view.crown),
    cervicalLine: transform(view.cervicalLine),
    enamel: transform(view.enamel),
  };
}

function transformOcclusalView(
  view: ToothOcclusalView,
  width: number,
  _height: number,
  flipH: boolean
): ToothOcclusalView {
  const transform = (p: string) => {
    if (flipH) return flipPathHorizontally(p, width);
    return p;
  };
  const surfaces = { ...view.surfaces };
  if (flipH) {
    // When flipped horizontally, M and D swap
    const origM = view.surfaces.M;
    const origD = view.surfaces.D;
    surfaces.M = transform(origD);
    surfaces.D = transform(origM);
    surfaces.O = transform(view.surfaces.O);
    surfaces.B = transform(view.surfaces.B);
    surfaces.L = transform(view.surfaces.L);
  } else {
    surfaces.M = view.surfaces.M;
    surfaces.D = view.surfaces.D;
    surfaces.O = view.surfaces.O;
    surfaces.B = view.surfaces.B;
    surfaces.L = view.surfaces.L;
  }
  return {
    outline: transform(view.outline),
    surfaces,
    fissures: view.fissures ? transform(view.fissures) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Main export: get transformed tooth paths for a given FDI number
// ---------------------------------------------------------------------------

/**
 * Returns anatomically correct SVG paths for the given FDI tooth number.
 *
 * Orientation conventions:
 * - Upper teeth (Q1, Q2): root UP (low Y), crown DOWN (high Y) -- default orientation
 * - Lower teeth (Q3, Q4): root DOWN (high Y), crown UP (low Y) -- vertically flipped
 * - Q1 and Q4: horizontally mirrored (mesial/distal swap)
 */
export function getToothPaths(fdi: number): ToothPaths {
  const type = getToothType(fdi);
  const base = TOOTH_DATA[type];
  const quadrant = Math.floor(fdi / 10);

  const isLower = quadrant === 3 || quadrant === 4;
  const isMirrored = quadrant === 1 || quadrant === 4;

  const { width: sw, height: sh } = base.sideViewBox;
  const { width: ow, height: oh } = base.occlusalViewBox;

  const sideView = transformSideView(base.sideView, sw, sh, isLower, isMirrored);
  const occlusalView = transformOcclusalView(base.occlusalView, ow, oh, isMirrored);

  return {
    sideView,
    occlusalView,
    sideViewBox: base.sideViewBox,
    occlusalViewBox: base.occlusalViewBox,
    cervicalY: isLower ? sh - base.cervicalY : base.cervicalY,
    rootCount: base.rootCount,
  };
}

/** Check if mesial/distal should be swapped for this tooth's quadrant */
export function shouldMirrorMesialDistal(fdi: number): boolean {
  const quadrant = Math.floor(fdi / 10);
  return quadrant === 1 || quadrant === 4;
}
