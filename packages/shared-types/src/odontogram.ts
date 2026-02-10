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
}

export interface ToothSurfaceDto {
  id: string;
  surface: string;
  condition: SurfaceCondition;
  material: string | null;
  recordedAt: Date;
}

export enum SurfaceCondition {
  HEALTHY = 'HEALTHY',
  CARIES = 'CARIES',
  FILLING = 'FILLING',
  FRACTURE = 'FRACTURE',
  DECAY = 'DECAY',
}

export interface UpdateToothStatusDto {
  status: ToothStatus;
  notes?: string;
}

export interface RecordSurfaceFindingDto {
  surface: string;
  condition: SurfaceCondition;
  material?: string;
}
