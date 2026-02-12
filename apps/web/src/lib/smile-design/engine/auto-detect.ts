// ============================================================
// Auto-Landmark Detection via MediaPipe Face Mesh
// ============================================================
//
// Uses MediaPipe FaceLandmarker to detect 478 facial landmarks,
// then maps relevant indices to our DSD landmark types.
// Dental landmarks are estimated from mouth geometry.
// ============================================================

import type { LandmarkPoint, LandmarkType } from '../types';

// MediaPipe Face Mesh landmark indices (0-based)
// Reference: https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
const MP = {
  // Facial
  GLABELLA: 9,        // Between eyebrows
  NASION: 6,          // Bridge of nose
  SUBNASALE: 2,       // Base of nose
  PHILTRUM_MID: 0,    // Center of upper lip (nose tip / philtrum)
  POGONION: 152,      // Chin point
  // Eyes (iris center landmarks from 478-model)
  PUPIL_LEFT: 468,    // Left iris center
  PUPIL_RIGHT: 473,   // Right iris center
  // Mouth corners
  COMMISSURE_LEFT: 61,
  COMMISSURE_RIGHT: 291,
  // Mouth geometry for dental estimation
  UPPER_LIP_CENTER: 13,
  LOWER_LIP_CENTER: 14,
  UPPER_LIP_LEFT: 39,
  UPPER_LIP_RIGHT: 269,
  // Upper teeth visible edge
  MOUTH_LEFT_INNER: 78,
  MOUTH_RIGHT_INNER: 308,
  MOUTH_TOP_INNER: 13,
  MOUTH_BOTTOM_INNER: 14,
} as const;

interface FaceLandmark3D {
  x: number; // 0-1 normalized
  y: number;
  z: number;
}

let faceLandmarkerInstance: unknown = null;
let initPromise: Promise<void> | null = null;

async function ensureModel() {
  if (faceLandmarkerInstance) return;
  if (initPromise) { await initPromise; return; }

  initPromise = (async () => {
    // Dynamic import to avoid SSR issues
    const vision = await import('@mediapipe/tasks-vision');
    const { FaceLandmarker, FilesetResolver } = vision;

    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  })();

  await initPromise;
}

/**
 * Detect all DSD landmarks from a smile photo automatically.
 * Returns normalized 0-1 coordinates for all detected landmarks.
 */
export type DetectMode = 'both' | 'facial' | 'dental';

export async function autoDetectLandmarks(imageUrl: string, mode: DetectMode = 'both'): Promise<LandmarkPoint[]> {
  await ensureModel();

  // Load image
  const img = await loadImage(imageUrl);

  // Run detection
  const landmarker = faceLandmarkerInstance as {
    detect: (image: HTMLImageElement) => {
      faceLandmarks: Array<FaceLandmark3D[]>;
    };
  };
  const result = landmarker.detect(img);

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    throw new Error('Geen gezicht gedetecteerd in de afbeelding');
  }

  const face = result.faceLandmarks[0];
  const points: LandmarkPoint[] = [];

  // --- Facial landmarks (direct mapping) ---
  if (mode === 'both' || mode === 'facial') {
  const facialMappings: Array<{ type: LandmarkType; index: number }> = [
    { type: 'GLABELLA', index: MP.GLABELLA },
    { type: 'NASION', index: MP.NASION },
    { type: 'SUBNASALE', index: MP.SUBNASALE },
    { type: 'PHILTRUM_MID', index: MP.PHILTRUM_MID },
    { type: 'POGONION', index: MP.POGONION },
    { type: 'COMMISSURE_LEFT', index: MP.COMMISSURE_LEFT },
    { type: 'COMMISSURE_RIGHT', index: MP.COMMISSURE_RIGHT },
  ];

  // Use iris landmarks if available (478 model), fallback to eye center
  if (face.length > 473) {
    facialMappings.push(
      { type: 'PUPIL_LEFT', index: MP.PUPIL_LEFT },
      { type: 'PUPIL_RIGHT', index: MP.PUPIL_RIGHT },
    );
  } else {
    // Fallback: average of eye corners
    const leftEye = averagePoints(face, [33, 133]);
    const rightEye = averagePoints(face, [362, 263]);
    points.push({ type: 'PUPIL_LEFT', x: leftEye.x, y: leftEye.y });
    points.push({ type: 'PUPIL_RIGHT', x: rightEye.x, y: rightEye.y });
  }

  for (const { type, index } of facialMappings) {
    if (face[index]) {
      points.push({ type, x: face[index].x, y: face[index].y });
    }
  }
  } // end facial

  // --- Dental landmarks (estimated from mouth geometry) ---
  if (mode === 'both' || mode === 'dental') {
  const upperLip = face[MP.UPPER_LIP_CENTER];
  const lowerLip = face[MP.LOWER_LIP_CENTER];
  const mouthLeft = face[MP.MOUTH_LEFT_INNER];
  const mouthRight = face[MP.MOUTH_RIGHT_INNER];

  if (upperLip && lowerLip && mouthLeft && mouthRight) {
    const midX = (upperLip.x + lowerLip.x) / 2;
    const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
    const mouthHeight = Math.abs(lowerLip.y - upperLip.y);

    // Tooth widths (proportional to mouth width)
    const centralW = mouthWidth * 0.115;  // Central incisor width
    const lateralW = mouthWidth * 0.08;   // Lateral incisor width
    const canineW = mouthWidth * 0.09;    // Canine width

    const incisalY = upperLip.y + mouthHeight * 0.45;
    const gingivalY = upperLip.y + mouthHeight * 0.05;
    const contactY = upperLip.y + mouthHeight * 0.15;
    const lateralIncisalY = upperLip.y + mouthHeight * 0.40;
    const canineY = upperLip.y + mouthHeight * 0.35;

    // Central incisors (11 and 21)
    points.push({ type: 'INCISAL_11_LEFT', x: midX - centralW, y: incisalY });
    points.push({ type: 'INCISAL_11_RIGHT', x: midX, y: incisalY });
    points.push({ type: 'INCISAL_21_LEFT', x: midX, y: incisalY });
    points.push({ type: 'INCISAL_21_RIGHT', x: midX + centralW, y: incisalY });

    // Gingival margins - centrals
    points.push({ type: 'GINGIVAL_11', x: midX - centralW * 0.5, y: gingivalY });
    points.push({ type: 'GINGIVAL_21', x: midX + centralW * 0.5, y: gingivalY });

    // Contact points
    points.push({ type: 'CONTACT_11_21', x: midX, y: contactY });
    points.push({ type: 'CONTACT_11_12', x: midX - centralW, y: contactY + mouthHeight * 0.03 });
    points.push({ type: 'CONTACT_21_22', x: midX + centralW, y: contactY + mouthHeight * 0.03 });

    // Lateral incisors (12 and 22)
    const lat12X = midX - centralW - lateralW * 0.5;
    const lat22X = midX + centralW + lateralW * 0.5;
    points.push({ type: 'INCISAL_12', x: lat12X, y: lateralIncisalY });
    points.push({ type: 'INCISAL_22', x: lat22X, y: lateralIncisalY });
    points.push({ type: 'GINGIVAL_12', x: lat12X, y: gingivalY + mouthHeight * 0.02 });
    points.push({ type: 'GINGIVAL_22', x: lat22X, y: gingivalY + mouthHeight * 0.02 });

    // Canines (13 and 23)
    const canineOffset = centralW + lateralW + canineW * 0.5;
    points.push({ type: 'CUSP_13', x: midX - canineOffset, y: canineY });
    points.push({ type: 'CUSP_23', x: midX + canineOffset, y: canineY });
    points.push({ type: 'GINGIVAL_13', x: midX - canineOffset, y: gingivalY - mouthHeight * 0.01 });
    points.push({ type: 'GINGIVAL_23', x: midX + canineOffset, y: gingivalY - mouthHeight * 0.01 });
  }
  } // end dental

  return points;
}

function averagePoints(face: FaceLandmark3D[], indices: number[]): { x: number; y: number } {
  let x = 0, y = 0;
  for (const i of indices) {
    x += face[i].x;
    y += face[i].y;
  }
  return { x: x / indices.length, y: y / indices.length };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Kan afbeelding niet laden'));
    img.src = url;
  });
}
