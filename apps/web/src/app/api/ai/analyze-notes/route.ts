import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { NZA_CODE_EXAMPLES } from '@/lib/ai/nza-codebook';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface AiDetectedCode {
  code: string;
  description: string;
  toothNumber: string;
  quantity: string;
  reasoning: string;
}

// Category keywords for pre-filtering — only send relevant categories to prompt
const CATEGORY_TRIGGERS: Record<string, string[]> = {
  VERDOVING: ['verdoving', 'loco', 'anesthesie', 'geleidingsverdoving', 'sedatie', 'lachgas', 'verd'],
  CONSULTATIE: ['consult', 'controle', 'onderzoek', 'recall', 'verwijzing', 'intake', 'telefonisch', 'spoed', 'behandelplan', 'instructie', 'mondverzorging'],
  ENDO: ['endo', 'wkb', 'wortelkanaal', 'pulpa', 'extirpatie', 'pulpitis', 'kanaal', 'kanalen', 'devitalisatie', 'trepanatie', 'MTA', 'revascularisatie', 'apicoectomie', 'hemisectie', 'open cavum', 'resorptie'],
  GNATHOLOGIE: ['gnathologie', 'TMJ', 'kaakgewricht', 'opbeetplaat', 'splint', 'bruxisme', 'klikken', 'crepitatie'],
  IMPLANTOLOGIE_CHIR: ['implantaat', 'impl', 'sinuslift', 'botopbouw', 'augmentatie', 'peri-implantitis', 'membraan', 'explantatie', 'fixture'],
  ORTHODONTIE: ['ortho', 'bracket', 'beugel', 'retainer', 'aligner', 'Invisalign', 'draadwissel', 'debonding', 'minischroef'],
  IMPLANTOLOGIE_PROT: ['abutment', 'healing abutment', 'mesostructuur', 'impl kroon', 'implantaatkroon', 'steg', 'drukknop', 'click prothese', 'Locator'],
  PREVENTIE: ['tandsteen', 'reiniging', 'gebitsreiniging', 'poetsinstructie', 'fluoride', 'fluor', 'sealing', 'sealant', 'paro', 'DPSI', 'parodontaal', 'dieptereiniging', 'scaling', 'mondhygiëne', 'Preventie'],
  PROTHETIEK: ['prothese', 'kunstgebit', 'rebasen', 'reparatie proth', 'frameprothese', 'immediaatprothese', 'overkappingsprothese', 'klammer', 'Prothetiek'],
  KROON: ['kroon', 'brug', 'veneer', 'facing', 'inlay', 'onlay', 'overlay', 'stiftkroon', 'Maryland', 'recementation', 'verlijmen', 'prep', 'preparatie', 'kleurbepaling', 'wax-up', 'Kroon'],
  KAAKCHIRURGIE: ['chirurgisch', 'operatief', 'flap', 'mucoperiostlap', 'cystectomie', 'biopsie', 'frenulectomie', 'torus', 'exostose', 'alveoloplastiek', 'drainage', 'abces', 'hechting', 'hechtingen', 'fractuur', 'repositie', 'Kaakchirurgie'],
  VULLING: ['vulling', 'comp', 'composiet', 'amalgaam', 'amal', 'glasionomeer', 'GIC', 'compomeer', 'opbouw', 'stift', 'facet', 'hoekopbouw', 'splinting', 'cusp', 'cariës', 'excavatie', 'provisorisch', 'tijdelijk', 'Vulling'],
  RONTGEN: ['röntgen', 'bitewing', 'bw', 'pano', 'OPT', 'OPG', 'CBCT', 'periapicaal', 'PA foto', 'cephalometrisch', 'ceph', 'foto', 'opname', 'Rontgen'],
  EXTRACTIE: ['extractie', 'ext', 'trekken', 'exo', 'melkelement', 'melktand', 'Extractie'],
  IMPLANTAAT: ['implantaat', 'impl', 'implantatie', 'fixture', 'implantaatkroon', 'Implantaat'],
};

function getRelevantCategories(notes: string): string[] {
  const lowerNotes = notes.toLowerCase();
  const matched = new Set<string>();

  for (const [category, triggers] of Object.entries(CATEGORY_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lowerNotes.includes(trigger.toLowerCase())) {
        matched.add(category);
        break;
      }
    }
  }

  // Always include VERDOVING if any invasive procedure is detected
  const invasiveCategories = ['ENDO', 'VULLING', 'EXTRACTIE', 'KROON', 'KAAKCHIRURGIE', 'IMPLANTOLOGIE_CHIR', 'IMPLANTAAT'];
  if (invasiveCategories.some(c => matched.has(c))) {
    matched.add('VERDOVING');
  }

  // Always include CONSULTATIE for context
  matched.add('CONSULTATIE');

  // If nothing specific matched, send everything
  if (matched.size <= 2) {
    return Object.keys(CATEGORY_TRIGGERS);
  }

  return Array.from(matched);
}

function buildCodebookPrompt(relevantCategories: string[]): string {
  const categorySet = new Set(relevantCategories);
  // Match on both uppercase category key and the actual category value in the codebook
  const relevantExamples = NZA_CODE_EXAMPLES.filter(ex =>
    categorySet.has(ex.category) || categorySet.has(ex.category.toUpperCase())
  );

  return relevantExamples.map(ex => {
    const lines = [
      `CODE: ${ex.code} — ${ex.description} (€${ex.maxTariff}${ex.requiresTooth ? ', per element' : ''}${ex.requiresSurface ? ', per vlak' : ''})`,
      `  Voorbeelden: ${ex.examples.map(e => `"${e}"`).join(' | ')}`,
      `  Trefwoorden: ${ex.keywords.join(', ')}`,
    ];
    if (ex.companions.length > 0) {
      lines.push(`  Begeleidende codes: ${ex.companions.join(', ')}`);
    }
    return lines.join('\n');
  }).join('\n\n');
}

function buildPrompt(
  notes: { bevindingen: string; behandelplan: string; uitlegAfspraken: string; algemeen: string },
  codebookSection: string,
  allCodesList: string
): string {
  return `Je bent een expert Nederlands tandheelkundig declaratiesysteem. Je kent ALLE NZa prestatiecodes, KNMT-richtlijnen, en tandheelkundige terminologie. Je MOET de juiste NZa-codes detecteren uit klinische notities.

KLINISCHE NOTITIES VAN DE TANDARTS:
═══════════════════════════════════
Bevindingen: ${notes.bevindingen || '(leeg)'}
Behandelplan: ${notes.behandelplan || '(leeg)'}
Uitleg & Afspraken: ${notes.uitlegAfspraken || '(leeg)'}
Algemeen: ${notes.algemeen || '(leeg)'}
═══════════════════════════════════

CODEBOEK MET VOORBEELDEN:
Hieronder staan de relevante NZa-codes met voorbeelden van hoe tandartsen deze verrichtingen noteren.
Gebruik deze voorbeelden om de notities hierboven te matchen met de juiste codes.

${codebookSection}

ALLE BESCHIKBARE CODES (voor referentie):
${allCodesList}

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

VLAKKEN TELLEN (CRUCIAAL VOOR VULLINGEN):
- Tel het aantal UNIEKE letters in de vlaknotatie
- O = 1 vlak → V21 (composiet) of V01 (amalgaam)
- MO, DO, OB, OL = 2 vlakken → V22 of V02
- MOD, MOB, DOB, MOL = 3 vlakken → V23 of V03
- MODP, MODB, MODBL = 4+ vlakken → V24 of V03
- Let op: "comp 46 MO" = V22 (2 vlakken), "comp 36 MOD" = V23 (3 vlakken)

KANALEN TELLEN (CRUCIAAL VOOR ENDO):
- 1 kanaal / 1k → E02
- 2 kanalen / 2k → E03
- 3+ kanalen / 3k → E04
- Incisieven/premolaren = meestal 1-2 kanalen
- Molaren bovenkaak = meestal 3-4 kanalen
- Molaren onderkaak = meestal 2-3 kanalen

TANDNUMMERS:
- FDI-notatie: 11-18 (rechtsboven), 21-28 (linksboven), 31-38 (linksonder), 41-48 (rechtsonder)
- Melkgebit: 51-55, 61-65, 71-75, 81-85
- "regio 36" = element 36 = tandnummer 36

BEGELEIDENDE CODES (voeg automatisch toe als logisch):
- Bij ELKE vulling (V-codes) → voeg A01 (verdoving) toe, tenzij expliciet "zonder verdoving" staat
- Bij ELKE extractie (X30-X34) → voeg A01 (verdoving) toe
- Bij ELKE endo (E-codes) → voeg A01 (verdoving) + X03 of X10 (röntgen) toe
- Bij kroonpreparatie → voeg A01 toe
- Bij chirurgische ingrepen → voeg A01 of A15 toe

STRIKTE REGELS:
1. Detecteer ALLEEN verrichtingen die DAADWERKELIJK beschreven staan in de notities
2. Geef bij elke code het FDI-tandnummer als dat vermeld is (of lege string als niet van toepassing)
3. Tel vlakken NAUWKEURIG bij vullingen — dit bepaalt de juiste code
4. Tel kanalen NAUWKEURIG bij endo — dit bepaalt de juiste code
5. Voeg begeleidende codes toe (verdoving, röntgen) als de behandeling dat logisch vereist
6. Geef NOOIT dezelfde code + tandnummer combinatie dubbel
7. Gebruik quantity "1" tenzij expliciet meerdere sessies/injecties vermeld
8. Bij gebitsreiniging: tel het aantal keer 5 minuten voor de quantity van M01

Retourneer een JSON array:
[
  {
    "code": "NZA-code",
    "description": "Korte beschrijving",
    "toothNumber": "FDI-tandnummer of lege string",
    "quantity": "aantal (standaard 1)",
    "reasoning": "Waarom deze code: citeer het relevante stuk uit de notities"
  }
]

Retourneer [] als er geen verrichtingen staan.
Retourneer ALLEEN codes uit de beschikbare lijst.`;
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

    // Determine which categories are relevant based on note content
    const relevantCategories = getRelevantCategories(combined);

    // Build codebook examples section for relevant categories
    const codebookSection = buildCodebookPrompt(relevantCategories);

    // Build compact all-codes reference
    const allCodesList = nzaCodes.map(c =>
      `${c.code}: ${c.descriptionNl} (€${c.maxTariff})`
    ).join('\n');

    const prompt = buildPrompt(
      { bevindingen, behandelplan, uitlegAfspraken, algemeen },
      codebookSection,
      allCodesList
    );

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          topP: 0.8,
          maxOutputTokens: 4096,
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
