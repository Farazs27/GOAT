/**
 * NZa Code Detection Engine
 *
 * Parses Dutch dental clinical notes and auto-detects NZa billing codes.
 * Extracts tooth numbers (FDI notation) and surface letters to select
 * the correct code variant (e.g., 2-surface composiet → V22).
 */

export interface DetectedLine {
  code: string;
  nzaCodeId?: string;
  description: string;
  toothNumber: string;
  unitPrice: string;
  quantity: string;
  dedupeKey: string; // code:toothNumber
  auto: true;
  aiDetected?: boolean;    // true if detected by Gemini AI
  reasoning?: string;      // AI's reasoning for the detection
}

interface NzaCode {
  id: string;
  code: string;
  descriptionNl: string;
  maxTariff: number | string;
  requiresTooth: boolean;
  requiresSurface: boolean;
  category: string;
}

interface KeywordRule {
  keywords: string[];
  code: string;
  /** If set, surface count maps to a different code (e.g., {1:'V21', 2:'V22', 3:'V23'}) */
  surfaceCodeMap?: Record<number, string>;
  /** If set, a nearby channel count maps to a different code */
  channelCodeMap?: Record<number, string>;
  priority: number; // higher wins when multiple rules match the same region
}

// --- Keyword Rules (expanded with shorthand, abbreviations, synonyms) ---

const KEYWORD_RULES: KeywordRule[] = [
  // CONSULTATIE
  { keywords: ['eerste consult', 'nieuw consult', 'intake', 'nieuw patient', 'nieuw patiënt', 'eerste bezoek', 'new patient'], code: 'C01', priority: 2 },
  { keywords: ['periodiek onderzoek', 'periodieke controle', 'halfjaarlijks onderzoek', 'halfjaarlijkse controle', 'controle', 'jaarlijkse controle', 'recall', 'nacontrole'], code: 'C02', priority: 1 },
  { keywords: ['uitgebreid onderzoek', 'uitgebreid consult', 'volledig onderzoek', 'uitgebr onderzoek', 'uitgebr consult'], code: 'C03', priority: 3 },
  { keywords: ['spoedconsult', 'spoed consult', 'buiten werktijd', 'avondconsult', 'weekendconsult', 'noodconsult'], code: 'C11', priority: 4 },
  { keywords: ['verwijzing', 'schriftelijke verwijzing', 'verwezen naar', 'doorverwezen'], code: 'C13', priority: 2 },
  { keywords: ['behandelplan opgesteld', 'behandelplan besproken', 'behandelplan gemaakt', 'beh plan', 'bhp'], code: 'C22', priority: 2 },
  { keywords: ['poetsinstructie', 'instructie mondzorg', 'instructie mondverzorging', 'poetsinstr', 'mondzorginstructie'], code: 'C28', priority: 2 },
  { keywords: ['probleemgericht consult', 'probleemgericht', 'klachtconsult'], code: 'C29', priority: 2 },
  { keywords: ['telefonisch consult', 'tel consult', 'telefoon consult'], code: 'C80', priority: 2 },
  { keywords: ['teleconsult', 'teleconsultatie', 'telezorg', 'videoconsult'], code: 'C84', priority: 2 },
  { keywords: ['intercollegiaal consult', 'overleg collega'], code: 'C85', priority: 2 },

  // RONTGEN
  { keywords: ['bitewing', 'bitewings', 'bw', 'bite wing', 'bws'], code: 'X01', priority: 1 },
  { keywords: ['bitewing 3', 'bitewing 4', '3 bitewings', '4 bitewings', '3 bws', '4 bws'], code: 'X02', priority: 2 },
  { keywords: ['periapicale opname', 'periapicaal', 'solitary', 'pa foto', 'peri-apicaal', 'periapicale foto', 'kleine foto'], code: 'X03', priority: 2 },
  { keywords: ['kleine serie', 'serie röntgen', 'meerdere foto'], code: 'X04', priority: 2 },
  { keywords: ['panoramisch', 'panoramische opname', 'opt', 'opg', 'panoramafoto', 'pano', 'orthopantomogram'], code: 'X10', priority: 2 },
  { keywords: ['cbct', 'conebeam', 'cone beam', 'dvt', 'cone-beam', '3d scan'], code: 'X21', priority: 3 },
  { keywords: ['cephalometrisch', 'cephalogram', 'cefalo', 'laterale schedelopname'], code: 'X05', priority: 2 },
  { keywords: ['intra-orale foto', 'intraorale foto', 'klinische foto'], code: 'X25', priority: 1 },
  { keywords: ['rontgen', 'röntgen', 'foto gemaakt', 'ro gemaakt', 'rö gemaakt'], code: 'X03', priority: 0 },

  // VULLING - composiet (with shorthand)
  { keywords: ['composiet vulling', 'composiet restauratie', 'composiet', 'comp vulling', 'comp rest', 'comp'], code: 'V21', surfaceCodeMap: { 1: 'V21', 2: 'V22', 3: 'V23', 4: 'V24' }, priority: 3 },
  // VULLING - amalgaam
  { keywords: ['amalgaam vulling', 'amalgaam', 'amal', 'amalg'], code: 'V01', surfaceCodeMap: { 1: 'V01', 2: 'V02', 3: 'V03' }, priority: 2 },
  // VULLING - glasionomeer
  { keywords: ['glasionomeer', 'gic', 'gi cement', 'glass ionomer', 'glasionomeervulling'], code: 'V30', priority: 2 },
  // VULLING - compomeer
  { keywords: ['compomeer'], code: 'V35', priority: 2 },
  // VULLING - provisorisch
  { keywords: ['tijdelijke vulling', 'provisorische vulling', 'cavit', 'temp vulling', 'noodvulling', 'temp rest'], code: 'V10', priority: 2 },
  // VULLING - caries excavatie
  { keywords: ['stepwise excavatie', 'caries excavatie', 'stepwise', 'indirecte overkapping'], code: 'V12', priority: 2 },
  // VULLING - stift
  { keywords: ['parapulpaire stift', 'parastift', 'parapulpair'], code: 'V40', priority: 2 },
  { keywords: ['wortelstift', 'gegoten stift', 'wortelkanaalstift', 'fiber stift', 'glasvezelstift'], code: 'V45', priority: 2 },
  // VULLING - opbouw
  { keywords: ['opbouw plastisch', 'kern opbouw', 'core opbouw', 'opbouw', 'core buildup', 'build-up'], code: 'V50', priority: 2 },
  // VULLING - hoekopbouw
  { keywords: ['hoekopbouw', 'hoek opbouw', 'hoek restauratie', 'incisale hoek'], code: 'V70', priority: 3 },
  // VULLING - facet
  { keywords: ['direct veneer', 'composiet facet', 'direct facing', 'directe facing'], code: 'V60', priority: 3 },
  // VULLING - cusp replacement
  { keywords: ['cusp vervanging', 'cusp replacement', 'knobbel opbouw', 'knobbel vervanging'], code: 'V80', priority: 3 },
  // VULLING - splinting
  { keywords: ['splinting', 'tandsplinting', 'draadsplint', 'retentiedraad', 'retainer'], code: 'V85', priority: 2 },
  // VULLING - kroonvervangende
  { keywords: ['kroonvervangende restauratie', 'kroonvervangend composiet', 'kroonvervangende comp'], code: 'V75', priority: 3 },
  // VULLING - generic (lower priority)
  { keywords: ['vulling', 'restauratie', 'vulln', 'rest aangebracht'], code: 'V21', surfaceCodeMap: { 1: 'V21', 2: 'V22', 3: 'V23', 4: 'V24' }, priority: 1 },

  // ENDO (with abbreviations)
  { keywords: ['pulpa-extirpatie', 'pulpaextirpatie', 'pulpa extirpatie', 'pulpotomie', 'pulpacapping'], code: 'E01', priority: 3 },
  { keywords: ['wortelkanaalbehandeling', 'wortelkanaal', 'endo', 'wkb', 'endodontische behandeling', 'zenuwbehandeling'], code: 'E02', channelCodeMap: { 1: 'E02', 2: 'E03', 3: 'E04' }, priority: 2 },
  { keywords: ['directe overkapping', 'directe pulpa overkapping', 'directe pulpacapping', 'direct capping'], code: 'E13', priority: 3 },
  { keywords: ['noodbehandeling endo', 'endo nood', 'open cavum', 'trepanatie', 'ontsluiting'], code: 'E16', priority: 3 },
  { keywords: ['herbehandeling wortelkanaal', 'herbehandeling endo', 'revisie endo', 'revisie wkb', 'her-endo', 'herendo'], code: 'E31', channelCodeMap: { 1: 'E31', 2: 'E32', 3: 'E33' }, priority: 3 },
  { keywords: ['interne bleaching', 'walking bleach', 'inwendig bleken'], code: 'E34', priority: 2 },
  { keywords: ['opbouw wortelstift na endo', 'stift na endo'], code: 'E40', priority: 2 },
  { keywords: ['opbouw tbv kroon na wkb', 'opbouw na endo'], code: 'E50', priority: 2 },
  { keywords: ['hemisectie'], code: 'E55', priority: 3 },
  { keywords: ['premolarisatie'], code: 'E56', priority: 3 },
  { keywords: ['apicoectomie', 'wortelresectie', 'wortelpuntresectie', 'apico'], code: 'E57', priority: 4 },
  { keywords: ['kanaallengtebepaling', 'elektronische lengtebepaling', 'apex locator'], code: 'E60', priority: 2 },
  { keywords: ['mta afsluiting', 'mta plug', 'mta'], code: 'E85', priority: 3 },
  { keywords: ['revascularisatie'], code: 'E86', priority: 3 },

  // PREVENTIE (with abbreviations)
  { keywords: ['tandsteen verwijderen', 'tandsteen', 'scaling', 'depuratie', 'ts verwijderd', 'supragingivaal reiniging'], code: 'M01', priority: 1 },
  { keywords: ['uitgebreide gebitsreiniging', 'uitgebreide reiniging', 'mondhygiene behandeling', 'mondhygiëne behandeling'], code: 'M02', priority: 2 },
  { keywords: ['mondzorgadvies', 'voorlichting mondzorg'], code: 'M03', priority: 2 },
  { keywords: ['voedingsadvies', 'witboekje', 'dieetadvies'], code: 'M04', priority: 2 },
  { keywords: ['fluoride applicatie', 'fluoride', 'fluor applicatie', 'fluoridegel', 'fluor lak', 'fluor'], code: 'M05', priority: 1 },
  { keywords: ['sealing', 'sealant', 'fissuursealant', 'fissuur sealant', 'seal'], code: 'M10', priority: 2 },
  { keywords: ['dieptereiniging', 'diepe reiniging', 'rootplaning', 'root planing', 'subgingivaal', 'subgingivale reiniging', 'deep scaling'], code: 'M30', priority: 2 },
  { keywords: ['paro nazorg', 'nazorg parodontaal', 'parodontale nazorg'], code: 'M32', priority: 2 },
  { keywords: ['dpsi', 'parodontale screening', 'dpsi score'], code: 'M35', priority: 2 },
  { keywords: ['pa-status', 'parodontaal onderzoek', 'paro status', 'initieel parodontaal', 'parodontale status', 'paro onderzoek'], code: 'M40', priority: 3 },
  { keywords: ['parodontale evaluatie', 'paro evaluatie', 'paro eval'], code: 'M41', priority: 2 },

  // VERDOVING (with abbreviations)
  { keywords: ['verdoving', 'anesthesie', 'lokale verdoving', 'verdoofd', 'loco', 'infiltratie', 'verd', 'lokaal verdoofd', 'verdoving gegeven'], code: 'A01', priority: 1 },
  { keywords: ['additionele verdoving', 'extra verdoving', 'bijprikken', 'naverdoving'], code: 'A02', priority: 2 },
  { keywords: ['oppervlakte-anesthesie', 'oppervlakte anesthesie', 'topicale anesthesie', 'spray verdoving'], code: 'A10', priority: 2 },
  { keywords: ['geleidingsverdoving', 'mandibulaire verdoving', 'blok anesthesie', 'mandibulairblok'], code: 'A15', priority: 2 },
  { keywords: ['sedatie', 'lachgas', 'inhalatiesedatie', 'n2o'], code: 'A20', priority: 3 },

  // EXTRACTIE (with abbreviations)
  { keywords: ['chirurgische extractie', 'operatieve extractie', 'chir extractie', 'chir ext'], code: 'X32', priority: 4 },
  { keywords: ['moeilijke extractie', 'gecompliceerde extractie', 'moeil ext'], code: 'X31', priority: 3 },
  { keywords: ['extractie', 'trekken', 'tand trekken', 'kies trekken', 'ext', 'geëxtraheerd', 'verwijderd'], code: 'X30', priority: 1 },
  { keywords: ['melkelement extractie', 'melktand trekken', 'wisseltand', 'melkelement verwijderd', 'melk ext'], code: 'X33', priority: 2 },
  { keywords: ['hemisectie bij extractie'], code: 'X34', priority: 3 },

  // KROON / BRUG / INLAY (with abbreviations)
  { keywords: ['metalen kroon', 'kroon metaal', 'gouden kroon', 'gold kroon'], code: 'R01', priority: 3 },
  { keywords: ['mk kroon', 'metaal-keramiek kroon', 'metaalkeramiek', 'metaal keramiek', 'porcelain fused'], code: 'R02', priority: 3 },
  { keywords: ['volkeramische kroon', 'zirconia kroon', 'e.max kroon', 'emax', 'zirkonia', 'zirkonium', 'volledig keramisch'], code: 'R03', priority: 4 },
  { keywords: ['veneer', 'facet porselein', 'porseleinen facing', 'keramisch facet', 'porselein veneer'], code: 'R08', priority: 3 },
  { keywords: ['kroon', 'porselein kroon', 'keramische kroon', 'krn', 'kroon prep', 'kroonpreparatie'], code: 'R02', priority: 2 },
  { keywords: ['brug', 'bridge', 'brugwerk'], code: 'R10', priority: 2 },
  { keywords: ['maryland brug', 'adhesieve brug', 'plakbrug'], code: 'R80', priority: 3 },
  { keywords: ['inlay'], code: 'R20', surfaceCodeMap: { 1: 'R20', 2: 'R21', 3: 'R22' }, priority: 2 },
  { keywords: ['onlay'], code: 'R24', priority: 2 },
  { keywords: ['overlay', 'tafelkroon'], code: 'R25', priority: 2 },
  { keywords: ['tijdelijke kroon', 'provisorische kroon', 'temp kroon', 'noodkroon', 'noodvoorziening'], code: 'R60', priority: 2 },
  { keywords: ['recementation', 'recementation kroon', 'kroon vastgezet', 'teruggeplaatst', 'opnieuw gecementeerd'], code: 'R40', priority: 2 },
  { keywords: ['kleurbepaling', 'kleur bepaald', 'shade'], code: 'R75', priority: 1 },
  { keywords: ['afdruk', 'impressie', 'alginaat', 'siliconen afdruk'], code: 'R75', priority: 1 },
  { keywords: ['noodkroon', 'noodvoorziening'], code: 'R90', priority: 2 },

  // IMPLANTAAT (with abbreviations)
  { keywords: ['implantaat plaatsen', 'implantaat chirurgisch', 'implantaat geplaatst', 'impl plaatsen'], code: 'I01', priority: 3 },
  { keywords: ['implantaat kroon', 'kroon op implantaat', 'impl kroon'], code: 'I10', priority: 3 },
  { keywords: ['healing abutment', 'healing cap', 'genezingskap'], code: 'J01', priority: 2 },
  { keywords: ['abutment', 'mesostructuur', 'opbouw implantaat'], code: 'J02', priority: 2 },
  { keywords: ['peri-implantitis', 'periimplantitis', 'peri implantitis'], code: 'G50', priority: 3 },
  { keywords: ['sinuslift', 'sinus lift', 'sinusbodemelevatie', 'sinus elevatie', 'sinus bodemelevatie'], code: 'G30', priority: 3 },
  { keywords: ['botaugmentatie', 'bot augmentatie', 'botopbouw', 'bot opbouw', 'bone graft'], code: 'G25', priority: 2 },

  // GNATHOLOGIE (with abbreviations)
  { keywords: ['opbeetplaat', 'bitesplint', 'occlusale splint', 'knarsplaat', 'relaxplaat', 'knarsbitje', 'bruxisme splint'], code: 'F21', priority: 3 },
  { keywords: ['gnathologisch consult', 'kaakgewricht consult', 'tmj consult', 'kaakgewricht'], code: 'F01', priority: 2 },
  { keywords: ['registratie kaakgewricht', 'kaakregistratie'], code: 'F15', priority: 2 },
  { keywords: ['controle splint', 'aanpassing splint', 'splint controle'], code: 'F22', priority: 2 },

  // PROTHETIEK (with abbreviations)
  { keywords: ['volledige prothese', 'volledig kunstgebit', 'kunstgebit', 'volledige gebitsprothese'], code: 'P01', priority: 2 },
  { keywords: ['partieel kunstgebit', 'partiele prothese', 'partiële prothese', 'partieel'], code: 'P10', priority: 2 },
  { keywords: ['frameprothese', 'frame prothese', 'model gietprothese'], code: 'P15', priority: 3 },
  { keywords: ['immediaatprothese', 'immediaat prothese', 'directe prothese'], code: 'P06', priority: 3 },
  { keywords: ['rebasen', 'rebasing', 'opvullen prothese', 'rebase'], code: 'P30', priority: 2 },
  { keywords: ['reparatie prothese', 'prothese reparatie', 'gebroken prothese', 'prothese rep'], code: 'P35', priority: 2 },
  { keywords: ['prothese element toevoegen', 'tand toevoegen prothese', 'element toevoegen'], code: 'P37', priority: 2 },

  // KAAKCHIRURGIE (with abbreviations)
  { keywords: ['operatieve extractie met lap', 'mucoperiostlap', 'flap extractie'], code: 'T01', priority: 3 },
  { keywords: ['geretineerd element', 'retinentie', 'verstandskies operatief', 'retinentie verwijderen'], code: 'T02', priority: 3 },
  { keywords: ['retinentie complex', 'complexe retinentie'], code: 'T03', priority: 4 },
  { keywords: ['alveolotomie'], code: 'T10', priority: 3 },
  { keywords: ['cystectomie klein', 'kleine cyste'], code: 'T20', priority: 3 },
  { keywords: ['cystectomie groot', 'grote cyste', 'cystectomie', 'cyste verwijdering'], code: 'T21', priority: 3 },
  { keywords: ['biopsie weke delen', 'biopsie mucosa'], code: 'T30', priority: 3 },
  { keywords: ['biopsie bot', 'biopsie hard', 'biopsie'], code: 'T31', priority: 2 },
  { keywords: ['frenulectomie', 'tongriemcorrectie', 'tongriem', 'frenulum', 'lippenbandcorrectie'], code: 'T40', priority: 3 },
  { keywords: ['frenulectomie lip', 'lipbandje'], code: 'T41', priority: 3 },
  { keywords: ['torus verwijderen', 'torus mandibularis', 'torus palatinus', 'torus'], code: 'T50', priority: 3 },
  { keywords: ['exostose', 'exostose verwijderen'], code: 'T55', priority: 3 },
  { keywords: ['alveoloplastiek', 'kaakwal correctie'], code: 'T57', priority: 3 },
  { keywords: ['drainage abces', 'abces drainage', 'incisie abces', 'abces geopend'], code: 'T60', priority: 3 },
  { keywords: ['hechting', 'hechtingen', 'wondhechting', 'gehecht', 'sutuur'], code: 'T70', priority: 1 },
  { keywords: ['hechtingen verwijderen', 'hechtingen eruit', 'suturen verwijderd'], code: 'T71', priority: 2 },
  { keywords: ['wondzorg', 'nacontrole wond'], code: 'T91', priority: 1 },
];

// --- Helpers ---

function isValidFDI(num: number): boolean {
  const quadrant = Math.floor(num / 10);
  const tooth = num % 10;
  if (quadrant >= 1 && quadrant <= 4) return tooth >= 1 && tooth <= 8;
  if (quadrant >= 5 && quadrant <= 8) return tooth >= 1 && tooth <= 5;
  return false;
}

/**
 * Extract tooth numbers from text near a keyword match position.
 * Searches within a ±80 char window around the match.
 */
function extractToothNumbers(text: string, matchStart: number, matchEnd: number): string[] {
  const windowStart = Math.max(0, matchStart - 80);
  const windowEnd = Math.min(text.length, matchEnd + 80);
  const context = text.substring(windowStart, windowEnd);

  const teeth: string[] = [];

  // Pattern 1: explicit "element XX", "elem. XX", "elt XX", "tand XX", "kies XX"
  const explicitRe = /(?:element|elem\.?|elt\.?|tand|kies)\s*(\d{2})(?:\s*[,\/&+]\s*(\d{2}))*/gi;
  let m: RegExpExecArray | null;
  while ((m = explicitRe.exec(context)) !== null) {
    // Capture all numbers in the match
    const nums = m[0].match(/\d{2}/g) || [];
    for (const n of nums) {
      if (isValidFDI(parseInt(n))) teeth.push(n);
    }
  }

  // Pattern 2: standalone two-digit FDI numbers (only if no explicit match found)
  if (teeth.length === 0) {
    const standaloneRe = /\b(\d{2})\b/g;
    while ((m = standaloneRe.exec(context)) !== null) {
      const n = parseInt(m[1]);
      if (isValidFDI(n)) teeth.push(m[1]);
    }
  }

  return [...new Set(teeth)];
}

/**
 * Count surfaces from text near a keyword match.
 * Looks for patterns like "MO", "MOD", "MODBV" or full words like "mesiaal occlusaal".
 */
function countSurfaces(text: string, matchStart: number, matchEnd: number): number {
  const windowStart = Math.max(0, matchStart - 60);
  const windowEnd = Math.min(text.length, matchEnd + 60);
  const context = text.substring(windowStart, windowEnd).toLowerCase();

  // Look for condensed surface letters (M, O, D, B, V, L, P)
  const letterRe = /\b([modbvlp]{1,5})\b/gi;
  let best = 0;
  let m: RegExpExecArray | null;
  while ((m = letterRe.exec(context)) !== null) {
    const letters = m[1].toUpperCase();
    // Only count if all chars are valid surface letters and at least 2 chars
    if (letters.length >= 2 && /^[MODBVLP]+$/.test(letters)) {
      best = Math.max(best, new Set(letters.split('')).size);
    }
  }

  // Also check for surface words
  const surfaceWords = ['mesiaal', 'distaal', 'occlusaal', 'buccaal', 'linguaal', 'palataal', 'vestibulaal'];
  let wordCount = 0;
  for (const w of surfaceWords) {
    if (context.includes(w)) wordCount++;
  }
  best = Math.max(best, wordCount);

  // Check for explicit "X vlak" / "X vlakken"
  const vlakRe = /(\d)\s*vlak(?:ken)?/i;
  const vlakMatch = vlakRe.exec(context);
  if (vlakMatch) {
    best = Math.max(best, parseInt(vlakMatch[1]));
  }

  return best || 1; // default to 1 surface
}

/**
 * Extract channel count for endo procedures.
 */
function extractChannelCount(text: string, matchStart: number, matchEnd: number): number {
  const windowStart = Math.max(0, matchStart - 40);
  const windowEnd = Math.min(text.length, matchEnd + 40);
  const context = text.substring(windowStart, windowEnd).toLowerCase();

  const channelRe = /(\d)\s*(?:\+\s*)?kanal/;
  const m = channelRe.exec(context);
  if (m) return Math.min(parseInt(m[1]), 3);
  return 1;
}

// --- Main Detection Function ---

export function detectNzaFromNotes(
  notesSections: { bevindingen: string; behandelplan: string; uitlegAfspraken: string; algemeen: string },
  allNzaCodes: NzaCode[]
): DetectedLine[] {
  // Build a lookup map for NZa codes
  const codeMap = new Map<string, NzaCode>();
  for (const nza of allNzaCodes) {
    codeMap.set(nza.code, nza);
  }

  // Combine relevant text (bevindingen and behandelplan are primary clinical sections)
  const primaryText = `${notesSections.bevindingen}\n${notesSections.behandelplan}`;
  const secondaryText = `${notesSections.uitlegAfspraken}\n${notesSections.algemeen}`;
  const fullText = `${primaryText}\n${secondaryText}`.toLowerCase();

  if (fullText.trim().length < 3) return [];

  // Track matches: dedupeKey → { line, priority }
  const matches = new Map<string, { line: DetectedLine; priority: number }>();

  for (const rule of KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      const kw = keyword.toLowerCase();
      let searchFrom = 0;
      let idx: number;

      while ((idx = fullText.indexOf(kw, searchFrom)) !== -1) {
        searchFrom = idx + kw.length;

        // Word boundary check: char before/after should not be a letter
        if (idx > 0 && /\w/.test(fullText[idx - 1])) continue;
        const afterIdx = idx + kw.length;
        if (afterIdx < fullText.length && /\w/.test(fullText[afterIdx])) continue;

        // Determine the actual code (may vary by surface count or channel count)
        let resolvedCode = rule.code;

        if (rule.surfaceCodeMap) {
          const surfaces = countSurfaces(fullText, idx, afterIdx);
          resolvedCode = rule.surfaceCodeMap[Math.min(surfaces, 3)] || rule.code;
        }

        if (rule.channelCodeMap) {
          const channels = extractChannelCount(fullText, idx, afterIdx);
          resolvedCode = rule.channelCodeMap[Math.min(channels, 3)] || rule.code;
        }

        const nza = codeMap.get(resolvedCode);
        if (!nza) continue;

        // Extract tooth numbers
        const teeth = extractToothNumbers(fullText, idx, afterIdx);

        if (nza.requiresTooth && teeth.length === 0) {
          // Code requires a tooth but we couldn't find one — still add with empty tooth
          const dedupeKey = `${resolvedCode}:`;
          const existing = matches.get(dedupeKey);
          if (!existing || rule.priority > existing.priority) {
            matches.set(dedupeKey, {
              line: {
                code: resolvedCode,
                nzaCodeId: nza.id,
                description: nza.descriptionNl,
                toothNumber: '',
                unitPrice: String(nza.maxTariff),
                quantity: '1',
                dedupeKey,
                auto: true,
              },
              priority: rule.priority,
            });
          }
        } else if (teeth.length > 0 && (nza.requiresTooth || nza.requiresSurface)) {
          // Create a line per tooth
          for (const tooth of teeth) {
            const dedupeKey = `${resolvedCode}:${tooth}`;
            const existing = matches.get(dedupeKey);
            if (!existing || rule.priority > existing.priority) {
              matches.set(dedupeKey, {
                line: {
                  code: resolvedCode,
                  nzaCodeId: nza.id,
                  description: nza.descriptionNl,
                  toothNumber: tooth,
                  unitPrice: String(nza.maxTariff),
                  quantity: '1',
                  dedupeKey,
                  auto: true,
                },
                priority: rule.priority,
              });
            }
          }
        } else {
          // No tooth required — single line
          const dedupeKey = `${resolvedCode}:`;
          const existing = matches.get(dedupeKey);
          if (!existing || rule.priority > existing.priority) {
            matches.set(dedupeKey, {
              line: {
                code: resolvedCode,
                nzaCodeId: nza.id,
                description: nza.descriptionNl,
                toothNumber: teeth[0] || '',
                unitPrice: String(nza.maxTariff),
                quantity: '1',
                dedupeKey,
                auto: true,
              },
              priority: rule.priority,
            });
          }
        }

        // Only match the first occurrence of each keyword to avoid duplicates
        break;
      }
    }
  }

  return Array.from(matches.values()).map(m => m.line);
}
