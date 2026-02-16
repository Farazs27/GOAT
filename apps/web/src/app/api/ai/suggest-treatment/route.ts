import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { assertNoPII } from '@/lib/ai/pii-guard';
import { callGemini, parseGeminiJson } from '@/lib/ai/gemini-client';

interface AiTreatmentSuggestion {
  toothNumber: number;
  description: string;
  nzaCode: string;
  reasoning: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AiSuggestionResponse {
  title: string;
  treatments: AiTreatmentSuggestion[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId } = body;

    if (!patientId || typeof patientId !== 'string') {
      throw new ApiError('patientId is vereist', 400);
    }

    // Verify patient belongs to user's practice
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
      select: { id: true },
    });

    if (!patient) {
      throw new ApiError('Patient niet gevonden', 404);
    }

    // Query teeth with non-healthy conditions
    const teeth = await prisma.tooth.findMany({
      where: { patientId, practiceId: user.practiceId },
      include: {
        surfaces: {
          select: {
            surface: true,
            condition: true,
            material: true,
            restorationType: true,
          },
        },
      },
    });

    const affectedTeeth = teeth.filter(
      (t) =>
        t.status !== 'PRESENT' ||
        t.surfaces.some((s) => s.condition !== 'HEALTHY')
    );

    if (affectedTeeth.length === 0) {
      return Response.json({
        suggestion: {
          title: 'Geen behandeling nodig',
          treatments: [],
        },
        aiGenerated: true,
      });
    }

    // Query recent treatments (last 6 months) to avoid re-suggesting
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTreatments = await prisma.treatment.findMany({
      where: {
        patientId,
        practiceId: user.practiceId,
        createdAt: { gte: sixMonthsAgo },
      },
      include: {
        tooth: { select: { toothNumber: true } },
        nzaCode: { select: { code: true, descriptionNl: true } },
      },
    });

    // Build odontogram summary
    const odontogramSummary = affectedTeeth
      .map((t) => {
        const surfaceDetails = t.surfaces
          .filter((s) => s.condition !== 'HEALTHY')
          .map((s) => `${s.surface}: ${s.condition}${s.material ? ` (${s.material})` : ''}`)
          .join(', ');
        return `Element ${t.toothNumber} (${t.status}): ${surfaceDetails || 'geen oppervlakdetails'}`;
      })
      .join('\n');

    // Build recent treatments summary
    const recentSummary = recentTreatments.length > 0
      ? recentTreatments
          .map((t) => {
            const tooth = t.tooth?.toothNumber ? `element ${t.tooth.toothNumber}` : 'algemeen';
            const code = t.nzaCode?.code || 'geen code';
            return `${tooth}: ${t.description} (${code})`;
          })
          .join('\n')
      : 'Geen recente behandelingen';

    // PII check — only tooth numbers and conditions, no patient identifiers
    assertNoPII(odontogramSummary);
    assertNoPII(recentSummary);

    const prompt = `Je bent een expert Nederlands tandarts die behandelplannen opstelt. Analyseer de volgende gebitsgegevens en stel een behandelplan voor.

GEBITSTATUS:
${odontogramSummary}

RECENTE BEHANDELINGEN (NIET opnieuw voorstellen):
${recentSummary}

INSTRUCTIES:
1. Stel behandelingen voor op basis van de gevonden aandoeningen
2. Gebruik NZa prestatiecodes (bijv. V92, E13, H11, etc.)
3. Geef prioriteit aan: HIGH (pijn/infectie), MEDIUM (progressieve aandoening), LOW (preventief/cosmetisch)
4. Geef per behandeling een korte redenering in het Nederlands
5. Stel GEEN behandelingen voor die recent al zijn uitgevoerd

Retourneer JSON:
{
  "title": "Behandelvoorstel op basis van gebitstatus",
  "treatments": [
    {
      "toothNumber": 36,
      "description": "Korte beschrijving van de behandeling",
      "nzaCode": "V92",
      "reasoning": "Waarom deze behandeling nodig is",
      "priority": "HIGH"
    }
  ]
}`;

    const responseText = await callGemini(prompt);
    const aiResult = parseGeminiJson<AiSuggestionResponse>(responseText);

    // Validate NZa codes against DB
    const activeCodes = await prisma.nzaCode.findMany({
      where: { isActive: true },
      select: { code: true, descriptionNl: true, maxTariff: true },
    });
    const codeMap = new Map(activeCodes.map((c) => [c.code, c]));

    const validatedTreatments = aiResult.treatments
      .filter((t) => codeMap.has(t.nzaCode))
      .map((t) => {
        const nza = codeMap.get(t.nzaCode)!;
        return {
          ...t,
          nzaDescription: nza.descriptionNl,
          tariff: String(nza.maxTariff),
        };
      });

    return Response.json({
      suggestion: {
        title: aiResult.title || 'Behandelvoorstel',
        treatments: validatedTreatments,
      },
      aiGenerated: true,
    });
  } catch (error) {
    return handleError(error);
  }
}
