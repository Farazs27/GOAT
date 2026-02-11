/**
 * AI Health Analysis for Patient Portal
 *
 * Generates structured prompts for Gemini AI to analyze patient dental health data
 * and provide personalized insights and recommendations.
 */

export interface PeriodontalData {
  chartData: {
    teeth?: Array<{
      toothNumber: number;
      pocketDepths?: number[];
      bleedingPoints?: boolean[];
      recession?: number[];
    }>;
    bleedingIndex?: {
      score: number;
      percentage: number;
    };
    probingDepths?: {
      average: number;
      max: number;
      sitesOver5mm: number;
    };
  };
  createdAt: string;
}

export interface ClinicalNoteData {
  content: string;
  createdAt: string;
  noteType: string;
}

export interface HealthAnalysisInput {
  periodontalCharts: PeriodontalData[];
  clinicalNotes: ClinicalNoteData[];
  lastVisitDate?: string;
}

export interface HealthInsight {
  overallScore: number; // 1-100
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  keyFindings: string[];
  personalizedTips: {
    icon: string;
    title: string;
    description: string;
  }[];
  areasNeedingAttention: string[];
  analyzedAt: string;
}

export function buildHealthAnalysisPrompt(input: HealthAnalysisInput): string {
  const { periodontalCharts, clinicalNotes, lastVisitDate } = input;

  // Extract latest periodontal data
  const latestChart = periodontalCharts[0];
  const chartSummary = latestChart
    ? analyzePeriodontalChart(latestChart)
    : null;

  // Extract relevant clinical note content
  const recentNotes = clinicalNotes
    .slice(0, 5)
    .map((n) => `[${n.noteType}]: ${n.content}`)
    .join("\n");

  return `Je bent een deskundige tandheelkundige AI-assistent gespecialiseerd in parodontale gezondheidsanalyse. Analyseer de onderstaande patiëntgegevens en geef een begrijpelijke, bemoedigende maar eerlijke beoordeling van de mondgezondheid.

PATIENTGEGEVENS:
${
  chartSummary
    ? `
PARODONTALE STATUS (laatste meting: ${new Date(latestChart.createdAt).toLocaleDateString("nl-NL")}):
- Bleeding Index: ${chartSummary.bleedingPercentage}% van de pocketdieptes bloedde bij onderzoek
- Gemiddelde pocketdiepte: ${chartSummary.averagePocketDepth}mm
- Maximale pocketdiepte: ${chartSummary.maxPocketDepth}mm
- Aantal locaties >5mm: ${chartSummary.sitesOver5mm}
- Aantal tanden gemeten: ${chartSummary.teethCount}
`
    : "Geen parodontale metingen beschikbaar"
}

${lastVisitDate ? `Laatste tandartsbezoek: ${new Date(lastVisitDate).toLocaleDateString("nl-NL")}` : ""}

RECENTE KLINISCHE NOTITIES:
${recentNotes || "Geen recente notities beschikbaar"}

ANALYSE-INSTRUCTIES:
1. Bereken een algehele mondgezondheidsscore (1-100) gebaseerd op:
   - Parodontale gezondheid (pocketdieptes, bloeding)
   - Recent tandartsbezoek
   - Klinische bevindingen uit notities

2. Bepaal het risiconiveau:
   - LOW: Score 75-100, weinig tot geen parodontale problemen
   - MEDIUM: Score 50-74, enkele aandachtspunten
   - HIGH: Score 0-49, ernstige parodontale problemen of lang geen controle

3. Identificeer 3-4 belangrijkste bevindingen

4. Geef 3-5 concrete, haalbare tips voor thuis

5. Benoem specifieke aandachtsgebieden

SCORINGSRICHTLIJNEN:
- Score 90-100: Uitstekende mondgezondheid, regelmatige controles
- Score 75-89: Goede mondgezondheid, kleine verbeterpunten mogelijk
- Score 50-74: Matige gezondheid, aandacht nodig voor specifieke gebieden
- Score 25-49: Voldoende gezondheid, duidelijke verbeterpunten
- Score 0-24: Aandacht vereist, professionele zorg noodzakelijk

Retourneer ALLEEN een JSON object met dit exacte formaat:
{
  "overallScore": <number 1-100>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "keyFindings": ["string", "string", "string", "string"],
  "personalizedTips": [
    {
      "icon": "ShieldCheck|Heart|Sparkles|Target|Clock|AlertCircle",
      "title": "Korte titel in het Nederlands",
      "description": "Beschrijving van de tip"
    }
  ],
  "areasNeedingAttention": ["string", "string"]
}

BELANGRIJK:
- Gebruik alleen informatie uit de beschikbare gegevens
- Als er geen parodontale data is, baseer de analyse op klinische notities en laatste bezoek
- Formuleer tips positief en bemoedigend
- Gebruik medische terminologie alleen wanneer nodig, leg uit in begrijpelijke taal
- Als er geen data is, geef dan een neutrale score van 50 met algemene tips`;
}

function analyzePeriodontalChart(chart: PeriodontalData) {
  const data = chart.chartData;
  const teeth = data.teeth || [];

  let totalPocketDepth = 0;
  let pocketDepthCount = 0;
  let maxPocketDepth = 0;
  let sitesOver5mm = 0;
  let bleedingCount = 0;
  let bleedingTotal = 0;

  for (const tooth of teeth) {
    if (tooth.pocketDepths) {
      for (const depth of tooth.pocketDepths) {
        totalPocketDepth += depth;
        pocketDepthCount++;
        maxPocketDepth = Math.max(maxPocketDepth, depth);
        if (depth > 5) sitesOver5mm++;
      }
    }

    if (tooth.bleedingPoints) {
      bleedingTotal += tooth.bleedingPoints.length;
      bleedingCount += tooth.bleedingPoints.filter((b) => b).length;
    }
  }

  return {
    teethCount: teeth.length,
    averagePocketDepth:
      pocketDepthCount > 0
        ? Math.round((totalPocketDepth / pocketDepthCount) * 10) / 10
        : 0,
    maxPocketDepth,
    sitesOver5mm,
    bleedingPercentage:
      bleedingTotal > 0 ? Math.round((bleedingCount / bleedingTotal) * 100) : 0,
  };
}

export function parseHealthAnalysisResponse(
  responseText: string,
): HealthInsight | null {
  try {
    const parsed = JSON.parse(responseText);

    // Validate required fields
    if (typeof parsed.overallScore !== "number") return null;
    if (!["LOW", "MEDIUM", "HIGH"].includes(parsed.riskLevel)) return null;
    if (!Array.isArray(parsed.keyFindings)) return null;
    if (!Array.isArray(parsed.personalizedTips)) return null;
    if (!Array.isArray(parsed.areasNeedingAttention)) return null;

    return {
      overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore))),
      riskLevel: parsed.riskLevel,
      keyFindings: parsed.keyFindings.slice(0, 4),
      personalizedTips: parsed.personalizedTips.slice(0, 5),
      areasNeedingAttention: parsed.areasNeedingAttention.slice(0, 3),
      analyzedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Cache key generator for health insights
export function getHealthInsightsCacheKey(patientId: string): string {
  return `health-insights:${patientId}`;
}

// Check if cached insights are still valid (24 hours)
export function isCacheValid(cachedAt: string): boolean {
  const cacheTime = new Date(cachedAt).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return now - cacheTime < twentyFourHours;
}
