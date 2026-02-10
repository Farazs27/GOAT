import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

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
  return `Je bent een Nederlands tandheelkundig declaratiesysteem. Analyseer de klinische notities van een tandarts en detecteer welke NZa-codes (prestatiecode mondzorg) van toepassing zijn.

KLINISCHE NOTITIES:
---
Bevindingen: ${notes.bevindingen || '(leeg)'}
Behandelplan: ${notes.behandelplan || '(leeg)'}
Uitleg & Afspraken: ${notes.uitlegAfspraken || '(leeg)'}
Algemeen: ${notes.algemeen || '(leeg)'}
---

BESCHIKBARE NZA-CODES:
${codesReference}

INSTRUCTIES:
1. Analyseer de notities zorgvuldig op uitgevoerde of geplande verrichtingen
2. Identificeer tandnummers in FDI-notatie (11-48 voor permanent gebit, 51-85 voor melkgebit)
3. Identificeer vlakken (M=mesiaal, O=occlusaal, D=distaal, B=buccaal, V=vestibulair, L=linguaal, P=palataal)
4. Voor vullingen: tel het aantal vlakken en kies de juiste code (bijv. 1 vlak=V21, 2 vlakken=V22, 3 vlakken=V23, 4+ vlakken=V24)
5. Voor wortelkanaalbehandelingen: tel het aantal kanalen en kies E02 (1 kanaal), E03 (2 kanalen), E04 (3+ kanalen)
6. Detecteer ALLEEN verrichtingen die daadwerkelijk in de notities beschreven staan
7. Voeg verdoving (A01/A15) toe als dit expliciet vermeld wordt
8. Voeg röntgenfoto's (X-codes) toe als deze vermeld worden
9. Voeg consulten (C-codes) toe als beschreven
10. Let op preventieve handelingen: tandsteen (M01), fluoride (M05), sealing (M10), paro (M30/M35/M40)
11. Geef per lijn het correcte tandnummer als dat van toepassing is

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
