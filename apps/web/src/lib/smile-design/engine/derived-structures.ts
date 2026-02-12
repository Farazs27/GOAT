import type { LandmarkPoint, DerivedStructures, Point, Line } from '../types';
import { lineFromPoints, midpoint, leastSquaresLine, catmullRomSpline } from './geometry';

function findLandmark(landmarks: LandmarkPoint[], type: string): Point | null {
  const lm = landmarks.find(l => l.type === type);
  return lm ? { x: lm.x, y: lm.y } : null;
}

export function computeDerivedStructures(landmarks: LandmarkPoint[]): DerivedStructures {
  const result: DerivedStructures = {
    facialMidline: null,
    interpupillaryLine: null,
    commissureLine: null,
    dentalMidline: null,
    incisalPlane: null,
    smileArc: null,
    gingivalCurve: null,
    toothOutlines: null,
    contactLines: null,
  };

  // --- Facial midline: best-fit through GLABELLA, NASION, SUBNASALE, PHILTRUM_MID, POGONION ---
  const midlinePoints = ['GLABELLA', 'NASION', 'SUBNASALE', 'PHILTRUM_MID', 'POGONION']
    .map(t => findLandmark(landmarks, t))
    .filter((p): p is Point => p !== null);

  if (midlinePoints.length >= 2) {
    result.facialMidline = leastSquaresLine(midlinePoints);
  }

  // --- Interpupillary line ---
  const pupilL = findLandmark(landmarks, 'PUPIL_LEFT');
  const pupilR = findLandmark(landmarks, 'PUPIL_RIGHT');
  if (pupilL && pupilR) {
    result.interpupillaryLine = lineFromPoints(pupilL, pupilR);
  }

  // --- Commissure line ---
  const commL = findLandmark(landmarks, 'COMMISSURE_LEFT');
  const commR = findLandmark(landmarks, 'COMMISSURE_RIGHT');
  if (commL && commR) {
    result.commissureLine = lineFromPoints(commL, commR);
  }

  // --- Incisal plane: regression through all incisal edge points ---
  const incisalPoints = [
    'INCISAL_11_LEFT', 'INCISAL_11_RIGHT', 'INCISAL_21_LEFT', 'INCISAL_21_RIGHT',
    'INCISAL_12', 'INCISAL_22',
  ]
    .map(t => findLandmark(landmarks, t))
    .filter((p): p is Point => p !== null);

  if (incisalPoints.length >= 2) {
    result.incisalPlane = leastSquaresLine(incisalPoints);
  }

  // --- Dental midline: vertical line through CONTACT_11_21 ---
  const contact = findLandmark(landmarks, 'CONTACT_11_21');
  if (contact) {
    if (result.incisalPlane) {
      const ip = result.incisalPlane;
      const dx = ip.end.x - ip.start.x;
      const dy = ip.end.y - ip.start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const nx = -dy / len;
        const ny = dx / len;
        const ext = 0.15;
        result.dentalMidline = {
          start: { x: contact.x - nx * ext, y: contact.y - ny * ext },
          end: { x: contact.x + nx * ext, y: contact.y + ny * ext },
        };
      }
    } else {
      result.dentalMidline = {
        start: { x: contact.x, y: contact.y - 0.15 },
        end: { x: contact.x, y: contact.y + 0.15 },
      };
    }
  }

  // --- Smile arc: Catmull-Rom through EXACT landmark positions ---
  const cusp13 = findLandmark(landmarks, 'CUSP_13');
  const cusp23 = findLandmark(landmarks, 'CUSP_23');
  const i12 = findLandmark(landmarks, 'INCISAL_12');
  const i22 = findLandmark(landmarks, 'INCISAL_22');
  const i11l = findLandmark(landmarks, 'INCISAL_11_LEFT');
  const i11r = findLandmark(landmarks, 'INCISAL_11_RIGHT');
  const i21l = findLandmark(landmarks, 'INCISAL_21_LEFT');
  const i21r = findLandmark(landmarks, 'INCISAL_21_RIGHT');

  // Use every actual dot — no midpoints
  const smilePoints: Point[] = [];
  if (commL) smilePoints.push(commL);
  if (cusp13) smilePoints.push(cusp13);
  if (i12) smilePoints.push(i12);
  if (i11l) smilePoints.push(i11l);
  if (i11r) smilePoints.push(i11r);
  if (i21l) smilePoints.push(i21l);
  if (i21r) smilePoints.push(i21r);
  if (i22) smilePoints.push(i22);
  if (cusp23) smilePoints.push(cusp23);
  if (commR) smilePoints.push(commR);

  smilePoints.sort((a, b) => a.x - b.x);

  if (smilePoints.length >= 3) {
    result.smileArc = catmullRomSpline(smilePoints, 40);
  }

  // --- Gingival curve: only actual landmark dots, no synthetic points ---
  const g13 = findLandmark(landmarks, 'GINGIVAL_13');
  const g12 = findLandmark(landmarks, 'GINGIVAL_12');
  const g11 = findLandmark(landmarks, 'GINGIVAL_11');
  const g21 = findLandmark(landmarks, 'GINGIVAL_21');
  const g22 = findLandmark(landmarks, 'GINGIVAL_22');
  const g23 = findLandmark(landmarks, 'GINGIVAL_23');
  const c1112 = findLandmark(landmarks, 'CONTACT_11_12');
  const c1121 = findLandmark(landmarks, 'CONTACT_11_21');
  const c2122 = findLandmark(landmarks, 'CONTACT_21_22');

  // Only use actual placed landmarks — curve passes through every dot exactly
  const scallopPoints: Point[] = [];
  if (g13) scallopPoints.push(g13);
  if (c1112) scallopPoints.push(c1112);
  if (g12) scallopPoints.push(g12);
  if (g11) scallopPoints.push(g11);
  if (c1121) scallopPoints.push(c1121);
  if (g21) scallopPoints.push(g21);
  if (g22) scallopPoints.push(g22);
  if (c2122) scallopPoints.push(c2122);
  if (g23) scallopPoints.push(g23);

  scallopPoints.sort((a, b) => a.x - b.x);

  if (scallopPoints.length >= 3) {
    result.gingivalCurve = catmullRomSpline(scallopPoints, 50);
  }

  // --- Tooth outlines: pass through actual landmark dots ---
  // For each tooth, the outline passes through: gingival (top), contact points (sides), incisal (bottom)
  const toothOutlines: Point[][] = [];

  // Helper: build closed outline through actual landmark positions
  function buildToothOutline(
    gin: Point,
    incPoints: Point[], // incisal edge points (1 or 2)
    leftContact: Point | null,
    rightContact: Point | null,
  ): Point[] {
    // Determine tooth width from available points
    const incMid = incPoints.length === 2
      ? midpoint(incPoints[0], incPoints[1])
      : incPoints[0];
    const centerX = (gin.x + incMid.x) / 2;
    const halfH = Math.abs(incMid.y - gin.y) / 2;
    const midY = (gin.y + incMid.y) / 2;

    // Use actual contact points for side positions, estimate if missing
    let halfW: number;
    if (leftContact && rightContact) {
      halfW = Math.abs(rightContact.x - leftContact.x) / 2;
    } else if (incPoints.length === 2) {
      halfW = Math.abs(incPoints[1].x - incPoints[0].x) / 2 * 1.1;
    } else {
      halfW = halfH * 0.5;
    }

    // Build control points passing through actual dots
    const pts: Point[] = [];

    // Top: gingival dot (exact)
    pts.push(gin);

    // Upper right: between gingival and right contact
    if (rightContact) {
      pts.push({ x: rightContact.x, y: gin.y + (rightContact.y - gin.y) * 0.4 });
      pts.push(rightContact); // exact contact dot
      pts.push({ x: rightContact.x, y: rightContact.y + (incMid.y - rightContact.y) * 0.5 });
    } else {
      pts.push({ x: centerX + halfW, y: gin.y + halfH * 0.5 });
      pts.push({ x: centerX + halfW * 1.05, y: midY });
      pts.push({ x: centerX + halfW, y: midY + halfH * 0.5 });
    }

    // Bottom: incisal dots (exact)
    if (incPoints.length === 2) {
      // Right incisal edge, then left
      pts.push(incPoints[1]); // right incisal (exact)
      pts.push(incPoints[0]); // left incisal (exact)
    } else {
      pts.push(incMid); // single incisal dot (exact)
    }

    // Lower left → upper left
    if (leftContact) {
      pts.push({ x: leftContact.x, y: leftContact.y + (incMid.y - leftContact.y) * 0.5 });
      pts.push(leftContact); // exact contact dot
      pts.push({ x: leftContact.x, y: gin.y + (leftContact.y - gin.y) * 0.4 });
    } else {
      pts.push({ x: centerX - halfW, y: midY + halfH * 0.5 });
      pts.push({ x: centerX - halfW * 1.05, y: midY });
      pts.push({ x: centerX - halfW, y: gin.y + halfH * 0.5 });
    }

    // Close back to gingival
    pts.push(gin);

    return catmullRomSpline(pts, 40);
  }

  // Tooth 13 (right canine)
  if (g13 && cusp13) {
    toothOutlines.push(buildToothOutline(g13, [cusp13], null, c1112));
  }
  // Tooth 12 (right lateral)
  if (g12 && i12) {
    toothOutlines.push(buildToothOutline(g12, [i12], c1112, null));
  }
  // Tooth 11 (right central)
  if (g11 && i11l && i11r) {
    toothOutlines.push(buildToothOutline(g11, [i11l, i11r], c1121, c1112));
  }
  // Tooth 21 (left central)
  if (g21 && i21l && i21r) {
    toothOutlines.push(buildToothOutline(g21, [i21l, i21r], c1121, c2122));
  }
  // Tooth 22 (left lateral)
  if (g22 && i22) {
    toothOutlines.push(buildToothOutline(g22, [i22], null, c2122));
  }
  // Tooth 23 (left canine)
  if (g23 && cusp23) {
    toothOutlines.push(buildToothOutline(g23, [cusp23], c2122, null));
  }

  if (toothOutlines.length > 0) {
    result.toothOutlines = toothOutlines;
  }

  // --- Horizontal contact lines through exact contact dots ---
  const contactDefs = ['CONTACT_11_21', 'CONTACT_11_12', 'CONTACT_21_22'];
  const contactLineList: Array<{ start: Point; end: Point }> = [];

  for (const ct of contactDefs) {
    const cp = findLandmark(landmarks, ct);
    if (!cp) continue;
    const hw = 0.008;
    contactLineList.push({
      start: { x: cp.x - hw, y: cp.y },
      end: { x: cp.x + hw, y: cp.y },
    });
  }

  if (contactLineList.length > 0) {
    result.contactLines = contactLineList;
  }

  return result;
}
