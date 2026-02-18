export interface ToothDto {
  id: string;
  toothNumber: number;
  status: ToothStatus;
  isPrimary: boolean;
  notes: string | null;
  surfaces: ToothSurfaceDto[];
}

export enum ToothStatus {
  PRESENT = 'PRESENT',
  MISSING = 'MISSING',
  IMPLANT = 'IMPLANT',
  CROWN = 'CROWN',
  BRIDGE_ABUTMENT = 'BRIDGE_ABUTMENT',
  PONTIC = 'PONTIC',
  ROOT_REMNANT = 'ROOT_REMNANT',
}

export interface ToothSurfaceDto {
  id: string;
  surface: string;
  condition: SurfaceCondition;
  material: Material | null;
  restorationType: RestorationType | null;
  recordedAt: Date;
}

export enum SurfaceCondition {
  HEALTHY = 'HEALTHY',
  CARIES = 'CARIES',
  FILLING = 'FILLING',
  FRACTURE = 'FRACTURE',
  DECAY = 'DECAY',
  VENEER = 'VENEER',
  INLAY = 'INLAY',
  ONLAY = 'ONLAY',
  PARTIAL_CROWN = 'PARTIAL_CROWN',
}

export enum RestorationType {
  FILLING = 'FILLING',
  INLAY = 'INLAY',
  ONLAY = 'ONLAY',
  VENEER = 'VENEER',
  PARTIAL_CROWN = 'PARTIAL_CROWN',
  CROWN_RESTORATION = 'CROWN_RESTORATION',
}

export enum Material {
  COMPOSITE = 'COMPOSITE',
  CERAMIC = 'CERAMIC',
  AMALGAM = 'AMALGAM',
  GOLD = 'GOLD',
  NON_PRECIOUS_METAL = 'NON_PRECIOUS_METAL',
  TEMPORARY = 'TEMPORARY',
}

export interface UpdateToothStatusDto {
  status: ToothStatus;
  notes?: string;
}

export interface RecordSurfaceFindingDto {
  surface: string;
  condition: SurfaceCondition;
  material?: Material;
  restorationType?: RestorationType;
}

export interface PerioToothData {
  buccal: {
    probingDepth: [number, number, number]; // DB, B, MB
    gingivalMargin: [number, number, number];
    bleeding: [boolean, boolean, boolean];
    plaque: [boolean, boolean, boolean];
    pus: [boolean, boolean, boolean];
    tartar: [boolean, boolean, boolean];
  };
  palatal: {
    probingDepth: [number, number, number]; // DP, P, MP
    gingivalMargin: [number, number, number];
    bleeding: [boolean, boolean, boolean];
    plaque: [boolean, boolean, boolean];
    pus: [boolean, boolean, boolean];
    tartar: [boolean, boolean, boolean];
  };
  mobility: number;
  furcation: number;
  suppuration?: {
    buccal: [boolean, boolean, boolean];
    palatal: [boolean, boolean, boolean];
  };
  mucogingivalJunction?: {
    buccal: [number, number, number];
    palatal: [number, number, number];
  };
  keratinizedTissueWidth?: {
    buccal: [number, number, number];
    palatal: [number, number, number];
  };
  implant?: boolean;
  missing?: boolean;
}

export function calculateCAL(probingDepth: number, gingivalMargin: number): number {
  return probingDepth + Math.abs(gingivalMargin);
}

export interface PerioChartData {
  teeth: Record<string, PerioToothData>;
}

export interface BatchToothUpdateDto {
  teeth: Array<{
    toothNumber: number;
    status?: ToothStatus;
    surfaces?: RecordSurfaceFindingDto[];
  }>;
}
