import { NextRequest } from 'next/server';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { assertNoPII } from '@/lib/ai/pii-guard';
import { callGemini, parseGeminiJson } from '@/lib/ai/gemini-client';

interface ExpandedNoteFree {
  bevindingen: string;
  diagnose: string;
  behandeling: string;
  afspraken: string;
}

interface ExpandedNoteSoap {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

type ExpandedNote = ExpandedNoteFree | ExpandedNoteSoap;

function buildExpandPrompt(shorthand: string, format: 'free' | 'soap'): string {
  const formatInstruction =
    format === 'soap'
      ? `Structureer de output als JSON met deze velden: { "subjective": "...", "objective": "...", "assessment": "...", "plan": "..." }`
      : `Structureer de output als JSON met deze velden: { "bevindingen": "...", "diagnose": "...", "behandeling": "...", "afspraken": "..." }`;

  return `Je bent een expert Nederlands tandheelkundig documentatiesysteem. Je taak is het uitbreiden van verkorte klinische notities naar volledige, professionele documentatie.

AFKORTINGEN DIE TANDARTSEN GEBRUIKEN:
- comp/composiet = composietvulling
- amal = amalgaamvulling
- wkb = wortelkanaalbehandeling
- ext/exo = extractie
- loco/verd = lokale verdoving
- bw = bitewing röntgen
- pano/OPT/OPG = panoramische röntgen
- CBCT = cone beam CT
- PA = periapicaal
- krn = kroon
- brg = brug
- dp = devitalisatie pulpa
- paro = parodontaal
- DPSI = Dutch Periodontal Screening Index
- MO/DO/MOD/MODP = vlaknotatie (M=mesiaal, O=occlusaal, D=distaal, B=buccaal, V=vestibulair, L=linguaal, P=palataal)
- ok/bk = boven/onderkaak
- chir = chirurgisch
- impl = implantaat
- fluor = fluoride applicatie
- detrg = detartrage (tandsteen verwijderen)
- sec car = secundaire cariës
- GIC = glasionomeer cement
- IRM = intermediate restorative material
- CaOH = calciumhydroxide
- pt = patient
- kl = klaagt over
- perc+ = positieve percussietest
- perc- = negatieve percussietest
- vit+ = positieve vitaliteitstest
- vit- = negatieve vitaliteitstest
- dx = diagnose
- irr pulp = irreversibele pulpitis
- rev pulp = reversibele pulpitis
- gin = gingivitis
- peri = periapicaal

STRIKTE REGELS:
1. Breid ALLEEN afkortingen uit en verbeter de opmaak
2. Voeg GEEN bevindingen of diagnoses toe die NIET in het origineel staan
3. Behoud alle tandnummers en specificaties exact
4. Gebruik professioneel tandheelkundig Nederlands

VERKORTE NOTITIE:
${shorthand}

${formatInstruction}

Retourneer ALLEEN de JSON, geen extra tekst.`;
}

export async function POST(request: NextRequest) {
  try {
    await withAuth(request);
    const body = await request.json();
    const { shorthand, format = 'free' } = body;

    if (!shorthand || typeof shorthand !== 'string' || shorthand.trim().length < 3) {
      throw new ApiError('Shorthand tekst is vereist (minimaal 3 tekens)', 400);
    }

    if (format !== 'free' && format !== 'soap') {
      throw new ApiError('Format moet "free" of "soap" zijn', 400);
    }

    // PII safety check before sending to external AI
    assertNoPII(shorthand);

    const prompt = buildExpandPrompt(shorthand.trim(), format);
    const responseText = await callGemini(prompt);
    const expanded = parseGeminiJson<ExpandedNote>(responseText);

    return Response.json({
      expanded,
      originalShorthand: shorthand,
      aiGenerated: true,
    });
  } catch (error) {
    return handleError(error);
  }
}
