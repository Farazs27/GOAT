import { create } from 'zustand';
import type {
  LandmarkPoint, LandmarkType, CalibrationData,
  DerivedStructures, Measurements, CanvasMode, LayerVisibility, VersionData,
} from './types';
import { computeDerivedStructures } from './engine/derived-structures';
import { computeMeasurements } from './engine/measurements';

interface DsdStore {
  // Design metadata
  designId: string | null;
  patientId: string | null;
  imageUrl: string | null;
  imageNaturalSize: { width: number; height: number } | null;

  // Canvas state
  canvasMode: CanvasMode;
  zoom: number;
  panOffset: { x: number; y: number };
  activeLandmarkType: LandmarkType | null;
  selectedLandmark: LandmarkType | null;

  // Data
  landmarks: LandmarkPoint[];
  calibration: CalibrationData | null;
  derivedStructures: DerivedStructures | null;
  measurements: Measurements | null;

  // UI
  layers: LayerVisibility;
  isDirty: boolean;
  isSaving: boolean;
  rightPanelTab: 'guide' | 'landmarks' | 'measurements' | 'calibration' | 'versions' | 'export';

  // Actions
  setDesign: (designId: string, patientId: string, imageUrl: string) => void;
  setImageNaturalSize: (size: { width: number; height: number }) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setActiveLandmarkType: (type: LandmarkType | null) => void;
  setSelectedLandmark: (type: LandmarkType | null) => void;
  placeLandmark: (point: LandmarkPoint) => void;
  removeLandmark: (type: LandmarkType) => void;
  moveLandmark: (type: LandmarkType, x: number, y: number) => void;
  setCalibration: (cal: CalibrationData) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setRightPanelTab: (tab: DsdStore['rightPanelTab']) => void;
  setSaving: (saving: boolean) => void;
  markClean: () => void;
  setAllLandmarks: (points: LandmarkPoint[]) => void;
  loadVersion: (data: VersionData) => void;
  reset: () => void;
}

function recompute(landmarks: LandmarkPoint[], calibration: CalibrationData | null, imageWidth: number) {
  const derivedStructures = computeDerivedStructures(landmarks);
  const measurements = computeMeasurements(landmarks, derivedStructures, calibration, imageWidth);
  return { derivedStructures, measurements };
}

export const useDsdStore = create<DsdStore>((set, get) => ({
  designId: null,
  patientId: null,
  imageUrl: null,
  imageNaturalSize: null,

  canvasMode: 'pan',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  activeLandmarkType: null,
  selectedLandmark: null,

  landmarks: [],
  calibration: null,
  derivedStructures: null,
  measurements: null,

  layers: { landmarks: true, derivedLines: true, measurements: true, goldenOverlay: false },
  isDirty: false,
  isSaving: false,
  rightPanelTab: 'guide',

  setDesign: (designId, patientId, imageUrl) => set({ designId, patientId, imageUrl }),
  setImageNaturalSize: (size) => set({ imageNaturalSize: size }),
  setCanvasMode: (canvasMode) => set({ canvasMode }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setActiveLandmarkType: (activeLandmarkType) => set({ activeLandmarkType }),
  setSelectedLandmark: (selectedLandmark) => set({ selectedLandmark }),

  placeLandmark: (point) => {
    const state = get();
    // Replace if same type exists
    const filtered = state.landmarks.filter(l => l.type !== point.type);
    const landmarks = [...filtered, point];
    const imageWidth = state.imageNaturalSize?.width ?? 1;
    const computed = recompute(landmarks, state.calibration, imageWidth);
    set({ landmarks, isDirty: true, ...computed });
  },

  removeLandmark: (type) => {
    const state = get();
    const landmarks = state.landmarks.filter(l => l.type !== type);
    const imageWidth = state.imageNaturalSize?.width ?? 1;
    const computed = recompute(landmarks, state.calibration, imageWidth);
    set({ landmarks, isDirty: true, ...computed });
  },

  moveLandmark: (type, x, y) => {
    const state = get();
    const landmarks = state.landmarks.map(l => l.type === type ? { ...l, x, y } : l);
    const imageWidth = state.imageNaturalSize?.width ?? 1;
    const computed = recompute(landmarks, state.calibration, imageWidth);
    set({ landmarks, isDirty: true, ...computed });
  },

  setCalibration: (calibration) => {
    const state = get();
    const imageWidth = state.imageNaturalSize?.width ?? 1;
    const computed = recompute(state.landmarks, calibration, imageWidth);
    set({ calibration, isDirty: true, ...computed });
  },

  toggleLayer: (layer) => set((s) => ({
    layers: { ...s.layers, [layer]: !s.layers[layer] },
  })),

  setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
  setSaving: (isSaving) => set({ isSaving }),
  markClean: () => set({ isDirty: false }),

  setAllLandmarks: (points) => {
    const state = get();
    const imageWidth = state.imageNaturalSize?.width ?? 1;
    const computed = recompute(points, state.calibration, imageWidth);
    set({ landmarks: points, isDirty: true, ...computed });
  },

  loadVersion: (data) => {
    const state = get();
    const imageWidth = state.imageNaturalSize?.width ?? 1;
    const computed = recompute(data.landmarks, data.calibration, imageWidth);
    set({
      landmarks: data.landmarks,
      calibration: data.calibration,
      isDirty: false,
      ...computed,
    });
  },

  reset: () => set({
    designId: null, patientId: null, imageUrl: null, imageNaturalSize: null,
    canvasMode: 'pan', zoom: 1, panOffset: { x: 0, y: 0 },
    activeLandmarkType: null, selectedLandmark: null,
    landmarks: [], calibration: null, derivedStructures: null, measurements: null,
    layers: { landmarks: true, derivedLines: true, measurements: true, goldenOverlay: false },
    isDirty: false, isSaving: false, rightPanelTab: 'guide',
  }),
}));
