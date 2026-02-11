// Gum line generator for dental charting
// Creates smooth bezier curves connecting cervical lines across teeth

export interface GumLineToothInfo {
  fdi: number;
  x: number;       // Center X position of this tooth in the row
  width: number;    // Width allocated for this tooth
  cervicalY: number; // Y position of cervical line for this tooth
  status: string;   // PRESENT, MISSING, IMPLANT, etc.
}

export interface GumLineConfig {
  teeth: GumLineToothInfo[];
  isUpper: boolean;
}

/**
 * Generates a smooth SVG path for the gum line across a row of teeth.
 *
 * The gum line follows the cervical line of each tooth and creates
 * the characteristic scalloped appearance of healthy gingiva:
 * - Dips between teeth at the interdental papilla points
 * - Flattens across gaps where teeth are missing
 * - Uses cubic bezier curves for smooth organic appearance
 */
export function generateGumLine(config: GumLineConfig): string {
  const { teeth, isUpper } = config;
  if (teeth.length === 0) return '';

  const points: Array<{ x: number; y: number }> = [];
  const papillaDepth = isUpper ? 4 : -4; // papilla dips toward the teeth

  for (let i = 0; i < teeth.length; i++) {
    const tooth = teeth[i];
    const isMissing = tooth.status === 'MISSING';
    const baseY = tooth.cervicalY;

    if (i > 0) {
      const prevTooth = teeth[i - 1];
      const gapX = (prevTooth.x + prevTooth.width / 2 + tooth.x - tooth.width / 2) / 2;

      // If both adjacent teeth are present, create papilla point
      const prevMissing = prevTooth.status === 'MISSING';
      if (!prevMissing && !isMissing) {
        const papillaY = (prevTooth.cervicalY + baseY) / 2 + papillaDepth;
        points.push({ x: gapX, y: papillaY });
      } else {
        // Flat ridge across missing tooth gap
        const avgY = (prevTooth.cervicalY + baseY) / 2;
        const flatOffset = isUpper ? -2 : 2; // ridge is further from teeth
        points.push({ x: gapX, y: avgY + flatOffset });
      }
    }

    // Tooth center cervical point
    if (!isMissing) {
      points.push({ x: tooth.x, y: baseY });
    } else {
      // Missing tooth: gum line is flat/receded
      const offset = isUpper ? -3 : 3;
      points.push({ x: tooth.x, y: baseY + offset });
    }
  }

  if (points.length < 2) {
    const p = points[0];
    return `M${p.x - 10},${p.y} L${p.x + 10},${p.y}`;
  }

  return buildSmoothPath(points);
}

/**
 * Generates the attachment level line, slightly offset from the gum line.
 * Used to show periodontal attachment level in clinical charting.
 *
 * @param offsets - Per-tooth offsets in mm (positive = deeper pocket)
 */
export function generateAttachmentLine(
  config: GumLineConfig,
  offsets?: Record<number, number>
): string {
  const { teeth, isUpper } = config;
  if (teeth.length === 0) return '';

  const defaultOffset = isUpper ? -2 : 2;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < teeth.length; i++) {
    const tooth = teeth[i];
    const toothOffset = offsets?.[tooth.fdi] ?? 0;
    const direction = isUpper ? -1 : 1;
    const y = tooth.cervicalY + defaultOffset + toothOffset * direction;

    if (i > 0) {
      const prevTooth = teeth[i - 1];
      const midX = (prevTooth.x + prevTooth.width / 2 + tooth.x - tooth.width / 2) / 2;
      const prevOffset = offsets?.[prevTooth.fdi] ?? 0;
      const midY =
        (prevTooth.cervicalY + tooth.cervicalY) / 2 +
        defaultOffset +
        ((prevOffset + toothOffset) / 2) * direction;
      points.push({ x: midX, y: midY });
    }

    points.push({ x: tooth.x, y });
  }

  if (points.length < 2) {
    const p = points[0];
    return `M${p.x - 10},${p.y} L${p.x + 10},${p.y}`;
  }

  return buildSmoothPath(points);
}

/**
 * Builds a smooth cubic bezier path through a series of points
 * using Catmull-Rom to Bezier conversion for natural curves.
 */
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return '';

  const tension = 0.3;
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to cubic bezier control points
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}
