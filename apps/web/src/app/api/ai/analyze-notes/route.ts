import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { buildFewShotPrompt, buildCompanionRulesPrompt, buildShorthandPrompt } from '@/lib/knmt-codebook';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface AiDetectedCode {
  code: string;
  description: string;
  toothNumber: string;
  quantity: string;
  reasoning: string;
}

function buildDentalPrompt(
  notes: { bevindingen: string; behandelplan: string; uitlegAfspraken: string; algemeen: string },
  codesReference: string
): string {
  const fewShot = buildFewShotPrompt();
  const companionRules = buildCompanionRulesPrompt();
  const shorthand = buildShorthandPrompt();

  return `Je bent een expert Nederlands tandheelkundig declaratiesysteem gespecialiseerd in NZa prestatiecode mondzorg. Je begrijpt alle KNMT-richtlijnen, afkortingen, en tandheelkundige terminologie. Analyseer de klinische notities en detecteer de juiste NZa-codes.

KLINISCHE NOTITIES:
---
Bevindingen: ${notes.bevindingen || '(leeg)'}
Behandelplan: ${notes.behandelplan || '(leeg)'}
Uitleg & Afspraken: ${notes.uitlegAfspraken || '(leeg)'}
Algemeen: ${notes.algemeen || '(leeg)'}
---

BESCHIKBARE NZA-CODES:
${codesReference}

AFKORTINGEN EN SHORTHAND:
Tandartsen gebruiken vaak afkortingen. Herken deze:
${shorthand}

BEGELEIDENDE CODES (companion rules):
${companionRules}

BESLISBOMEN:
- Vullingen: tel vlakken in de notatie (bijv. MOD = 3 vlakken → V23, OB = 2 vlakken → V22)
  1 vlak → V21, 2 vlakken → V22, 3 vlakken → V23, 4+ vlakken → V24
- Wortelkanaalbehandeling: tel kanalen
  1 kanaal → E02, 2 kanalen → E03, 3+ kanalen → E04
- Vlaknotatie: M=mesiaal, O=occlusaal, D=distaal, B=buccaal, V=vestibulair, L=linguaal, P=palataal
- Tandnummers: FDI-notatie (11-48 permanent, 51-85 melkgebit)
- Kwadrant: 1=rechtsboven, 2=linksboven, 3=linksonder, 4=rechtsonder

VOORBEELDEN:
${fewShot}

INSTRUCTIES:
1. Analyseer alle vier notitienvelden zorgvuldig op uitgevoerde of geplande verrichtingen
2. Herken afkortingen en shorthand (bijv. "comp" = composiet, "ext" = extractie, "wkb" = wortelkanaalbehandeling)
3. Tel vlakken nauwkeurig bij vullingen (MOD=3, MO=2, O=1, etc.)
4. Tel kanalen bij endodontische behandelingen
5. Detecteer ALLEEN verrichtingen die daadwerkelijk beschreven staan
6. Voeg verdoving (A01) toe wanneer expliciet vermeld OF wanneer een invasieve behandeling wordt beschreven (vulling, extractie, endo)
7. Voeg röntgenfoto's (X-codes) toe als vermeld (bw=bitewing, pano=panoramisch)
8. Let op preventieve codes: tandsteen (M01), fluoride (M05), sealing (M10), instructie (M02)
9. Bij parodontale behandelingen: DPSI score bepaalt de code (0-2=M30 screening, 3+=M30 intake)
10. Geef per verrichting het correcte FDI-tandnummer als van toepassing

Retourneer een JSON array met objecten:
[
  {
    "code": "NZA-code",
    "description": "Korte beschrijving van de verrichting",
    "toothNumber": "FDI-tandnummer of lege string als niet van toepassing",
    "quantity": "aantal (standaard 1)",
    "reasoning": "Korte uitleg waarom deze code is gedetecteerd"
  }
]

Retourneer een LEGE array [] als er geen verrichtingen gedetecteerd worden.
Retourneer ALLEEN geldige codes uit de bovenstaande lijst.
Retourneer GEEN dubbele codes voor hetzelfde element en dezelfde verrichting.`;
}

export async function POST(request: NextRequest) {
  try {
    await withAuth(request);
    const body = await request.json();
    const { bevindingen, behandelplan, uitlegAfspraken, algemeen } = body;

    if (!GEMINI_API_KEY) {
      throw new ApiError('Gemini API key niet geconfigureerd', 500);
    }

    // Skip if all notes are empty
    const combined = `${bevindingen || ''}${behandelplan || ''}${uitlegAfspraken || ''}${algemeen || ''}`.trim();
    if (combined.length < 3) {
      return Response.json({ detectedLines: [], source: 'ai' });
    }

    // Fetch all active NZA codes from DB
    const nzaCodes = await prisma.nzaCode.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    // Build a compact codes reference for the prompt
    const codesReference = nzaCodes.map(c =>
      `${c.code}: ${c.descriptionNl} (€${c.maxTariff}${c.requiresTooth ? ', per element' : ''}${c.requiresSurface ? ', per vlak' : ''})`
    ).join('\n');

    const prompt = buildDentalPrompt(
      { bevindingen, behandelplan, uitlegAfspraken, algemeen },
      codesReference
    );

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      throw new ApiError('AI analyse mislukt', 502);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return Response.json({ detectedLines: [], source: 'ai', error: 'no_response' });
    }

    // Parse the structured JSON response
    let aiResult: AiDetectedCode[];
    try {
      aiResult = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Gemini response:', responseText);
      return Response.json({ detectedLines: [], source: 'ai', error: 'parse_error' });
    }

    if (!Array.isArray(aiResult)) {
      return Response.json({ detectedLines: [], source: 'ai', error: 'invalid_format' });
    }

    // Map AI results to DetectedLine format, enriching with DB data
    const codeMap = new Map(nzaCodes.map(c => [c.code, c]));
    const seen = new Set<string>();
    const detectedLines = aiResult
      .filter(item => codeMap.has(item.code))
      .map(item => {
        const nza = codeMap.get(item.code)!;
        const toothNumber = item.toothNumber || '';
        const dedupeKey = `${item.code}:${toothNumber}`;

        // Skip duplicates
        if (seen.has(dedupeKey)) return null;
        seen.add(dedupeKey);

        return {
          code: item.code,
          nzaCodeId: nza.id,
          description: nza.descriptionNl,
          toothNumber,
          unitPrice: String(nza.maxTariff),
          quantity: item.quantity || '1',
          dedupeKey,
          auto: true as const,
          aiDetected: true,
          reasoning: item.reasoning || '',
        };
      })
      .filter(Boolean);

    return Response.json({ detectedLines, source: 'ai' });
  } catch (error) {
    return handleError(error);
  }
}
