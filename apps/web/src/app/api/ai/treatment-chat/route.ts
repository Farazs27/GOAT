import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { NZA_CODE_EXAMPLES } from '@/lib/ai/nza-codebook';
import { validateAndCorrectSuggestions, type AiSuggestion } from '@/lib/ai/treatment-validator';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── Category pre-filtering (same as analyze-notes) ─────────────────────────

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

function getRelevantCategories(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matched = new Set<string>();

  for (const [category, triggers] of Object.entries(CATEGORY_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
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

// ─── Chat prompt builder ─────────────────────────────────────────────────────

function buildChatPrompt(
  message: string,
  history: Array<{ role: string; content: string; suggestions?: unknown[] }>,
  codebookSection: string,
  allCodesList: string,
  context?: { selectedTeeth?: number[]; performerId?: string }
): string {
  // Format last 6 messages of history
  const recentHistory = history.slice(-6);
  const historySection = recentHistory.length > 0
    ? recentHistory.map(h => `${h.role === 'user' ? 'TANDARTS' : 'ASSISTENT'}: ${h.content}`).join('\n')
    : '(geen eerdere berichten)';

  const contextSection = context?.selectedTeeth?.length
    ? `\nGESELECTEERDE ELEMENTEN: ${context.selectedTeeth.join(', ')}`
    : '';

  return `Je bent een expert Nederlands tandheelkundig declaratiesysteem en AI-assistent voor tandartsen. Je helpt bij het opstellen van behandelplannen door NZa prestatiecodes te detecteren uit natuurlijke taal.

CHATGESCHIEDENIS:
${historySection}

HUIDIGE INVOER VAN DE TANDARTS:
"${message}"
${contextSection}

CODEBOEK MET VOORBEELDEN:
${codebookSection}

ALLE BESCHIKBARE CODES (met toelichting):
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
- O = 1 vlak → V91 (composiet) of V71 (amalgaam)
- MO, DO, OB, OL = 2 vlakken → V92 of V72
- MOD, MOB, DOB, MOL = 3 vlakken → V93 of V73
- MODP, MODB, MODBL = 4+ vlakken → V94 of V74
- Let op: "comp 46 MO" = V92 (2 vlakken), "comp 36 MOD" = V93 (3 vlakken)

KANALEN TELLEN (CRUCIAAL VOOR ENDO):
- 1 kanaal / 1k → E13
- 2 kanalen / 2k → E14
- 3 kanalen / 3k → E16
- 4+ kanalen / 4k → E17
- Incisieven/premolaren = meestal 1-2 kanalen
- Molaren bovenkaak = meestal 3-4 kanalen
- Molaren onderkaak = meestal 2-3 kanalen

TANDNUMMERS:
- FDI-notatie: 11-18 (rechtsboven), 21-28 (linksboven), 31-38 (linksonder), 41-48 (rechtsonder)
- Melkgebit: 51-55, 61-65, 71-75, 81-85
- "regio 36" = element 36 = tandnummer 36

BEGELEIDENDE CODES (voeg automatisch toe als logisch):
- Bij ELKE vulling (V-codes) → voeg A10 (verdoving) toe, tenzij expliciet "zonder verdoving" staat
- Bij ELKE extractie (H11, H16, H35) → voeg A10 (verdoving) toe
- Bij ELKE endo (E13, E14, E16, E17) → voeg A10 (verdoving) + X10 (röntgen) toe
- Bij kroonpreparatie → voeg A10 toe
- Bij chirurgische ingrepen → voeg A10 toe

CONTEXT-BEWUSTZIJN:
- Als de tandarts "dezelfde", "ook voor", "hetzelfde", "idem", "ook" zegt, verwijs dan naar de VORIGE suggesties in de chatgeschiedenis
- Bijvoorbeeld: "hetzelfde voor 37" → herhaal de laatst voorgestelde codes maar dan voor element 37
- "ook een vulling" → gebruik dezelfde vulling-specificaties als eerder besproken

STRIKTE REGELS:
1. Detecteer ALLEEN verrichtingen die DAADWERKELIJK beschreven staan in de invoer (of via context uit eerdere berichten)
2. Geef bij elke code de FDI-tandnummers als die vermeld zijn
3. Tel vlakken NAUWKEURIG bij vullingen — dit bepaalt de juiste code
4. Tel kanalen NAUWKEURIG bij endo — dit bepaalt de juiste code
5. Voeg begeleidende codes toe (verdoving, röntgen) als de behandeling dat logisch vereist
6. Geef NOOIT dezelfde code + tandnummer combinatie dubbel
7. Gebruik quantity 1 tenzij expliciet meerdere sessies/injecties vermeld
8. Bij gebitsreiniging: tel het aantal keer 5 minuten voor de quantity van M01

Retourneer een JSON array:
[
  {
    "code": "NZA-code",
    "description": "Korte beschrijving",
    "toothNumbers": [36],
    "surfaces": "MO",
    "canals": null,
    "quantity": 1,
    "reasoning": "Waarom deze code: citeer het relevante stuk uit de invoer",
    "isCompanion": false
  }
]

- toothNumbers: array van FDI-nummers (leeg array als niet van toepassing)
- surfaces: string vlaknotatie of null als niet van toepassing
- canals: getal of null als niet van toepassing
- isCompanion: true als het een automatisch toegevoegde begeleidende code is

Retourneer [] als er geen verrichtingen staan.
Retourneer ALLEEN codes uit de beschikbare lijst.`;
}

// ─── Generate natural language summary ───────────────────────────────────────

async function generateSummary(
  message: string,
  suggestions: Array<{ nzaCode: string; description: string; toothNumbers: number[] }>
): Promise<string> {
  if (suggestions.length === 0) {
    // Detect language
    const isDutch = /[a-z]/.test(message.toLowerCase()) &&
      /(vulling|kroon|extractie|endo|comp|tand|element|paro|controle|brug)/i.test(message);
    return isDutch
      ? 'Ik kon geen specifieke verrichtingen herkennen. Kun je het iets anders formuleren?'
      : 'I could not detect any specific procedures. Could you rephrase?';
  }

  const summaryPrompt = `Je bent een tandheelkundig AI-assistent. De tandarts typte: "${message}"

Hieruit zijn deze codes gedetecteerd:
${suggestions.map(s => `- ${s.nzaCode}: ${s.description}${s.toothNumbers.length ? ` (element ${s.toothNumbers.join(', ')})` : ''}`).join('\n')}

Geef een KORTE bevestiging (1-2 zinnen) in DEZELFDE TAAL als de invoer van de tandarts. Wees bondig en professioneel. Noem de belangrijkste verrichtingen. Gebruik geen markdown.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: summaryPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!res.ok) return suggestions.length + ' verrichting(en) gedetecteerd.';

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || suggestions.length + ' verrichting(en) gedetecteerd.';
  } catch {
    return suggestions.length + ' verrichting(en) gedetecteerd.';
  }
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await withAuth(request);
    const body = await request.json();
    const { message, history = [], context } = body;

    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      throw new ApiError('Bericht is te kort', 400);
    }

    if (!GEMINI_API_KEY) {
      throw new ApiError('Gemini API key niet geconfigureerd', 500);
    }

    // Fetch all active NZA codes from DB (with toelichting)
    const nzaCodes = await prisma.nzaCode.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    // Combine message with recent history for category detection
    const recentText = [
      message,
      ...history.slice(-4).map((h: { content: string }) => h.content),
    ].join(' ');

    // Determine relevant categories
    const relevantCategories = getRelevantCategories(recentText);

    // Build codebook examples for relevant categories
    const codebookSection = buildCodebookPrompt(relevantCategories);

    // Build compact all-codes reference (with toelichting)
    const allCodesList = nzaCodes.map(c => {
      const toelichting = (c as Record<string, unknown>).toelichting;
      const toelichtingStr = toelichting ? ` — ${toelichting}` : '';
      return `${c.code}: ${c.descriptionNl} (€${c.maxTariff})${toelichtingStr}`;
    }).join('\n');

    // Build chat prompt
    const prompt = buildChatPrompt(message, history, codebookSection, allCodesList, context);

    // Call Gemini API for code detection
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
      return Response.json({
        response: 'Geen verrichtingen gedetecteerd.',
        suggestions: [],
      });
    }

    // Parse AI response
    let aiResult: Array<{
      code: string;
      description: string;
      toothNumbers: number[];
      surfaces: string | null;
      canals: number | null;
      quantity: number;
      reasoning: string;
      isCompanion: boolean;
    }>;

    try {
      aiResult = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Gemini response:', responseText);
      return Response.json({
        response: 'Er ging iets mis bij het verwerken van de AI-respons.',
        suggestions: [],
      });
    }

    if (!Array.isArray(aiResult)) {
      return Response.json({
        response: 'Geen verrichtingen gedetecteerd.',
        suggestions: [],
      });
    }

    // Map to AiSuggestion[] for validator
    const aiSuggestions: AiSuggestion[] = aiResult.map(item => ({
      code: item.code,
      description: item.description || '',
      toothNumbers: Array.isArray(item.toothNumbers) ? item.toothNumbers : [],
      surfaces: item.surfaces || undefined,
      canals: item.canals || undefined,
      quantity: item.quantity || 1,
      reasoning: item.reasoning || '',
      isCompanion: item.isCompanion || false,
    }));

    // Run through validator
    const validated = validateAndCorrectSuggestions(aiSuggestions, message);

    // Build code lookup map
    const codeMap = new Map(nzaCodes.map(c => [c.code, c]));

    // Build final suggestions with DB enrichment
    const suggestions = validated
      .filter(v => codeMap.has(v.code))
      .map((v, idx) => {
        const nza = codeMap.get(v.code)!;
        return {
          id: `tc-${Date.now()}-${idx}`,
          nzaCode: v.code,
          nzaCodeId: nza.id,
          description: nza.descriptionNl,
          toothNumbers: v.toothNumbers,
          unitPrice: Number(nza.maxTariff),
          quantity: v.quantity,
          reasoning: v.reasoning,
          confidence: v.confidence,
          isCompanion: v.isCompanion,
          corrected: v.corrected,
          corrections: v.corrections,
        };
      });

    // Generate natural language summary (second Gemini call)
    const summaryInput = suggestions.map(s => ({
      nzaCode: s.nzaCode,
      description: s.description,
      toothNumbers: s.toothNumbers,
    }));
    const response = await generateSummary(message, summaryInput);

    return Response.json({ response, suggestions });
  } catch (error) {
    return handleError(error);
  }
}
