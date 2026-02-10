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

// --- Keyword Rules ---

const KEYWORD_RULES: KeywordRule[] = [
  // CONSULTATIE
  { keywords: ['eerste consult', 'nieuw consult', 'intake'], code: 'C01', priority: 2 },
  { keywords: ['periodiek onderzoek', 'periodieke controle', 'halfjaarlijks onderzoek', 'controle'], code: 'C02', priority: 1 },
  { keywords: ['uitgebreid onderzoek', 'uitgebreid consult', 'volledig onderzoek'], code: 'C03', priority: 3 },
  { keywords: ['spoedconsult', 'spoed consult', 'buiten werktijd'], code: 'C11', priority: 4 },
  { keywords: ['behandelplan opgesteld', 'behandelplan besproken'], code: 'C22', priority: 2 },
  { keywords: ['probleemgericht consult'], code: 'C29', priority: 2 },

  // RONTGEN
  { keywords: ['bitewing', 'bitewings', 'bw'], code: 'X01', priority: 1 },
  { keywords: ['panoramisch', 'panoramische opname', 'opt', 'opg', 'panoramafoto'], code: 'X10', priority: 2 },
  { keywords: ['periapicale opname', 'periapicaal', 'solitary'], code: 'X03', priority: 2 },
  { keywords: ['cbct', 'conebeam', 'cone beam', 'dvt'], code: 'X21', priority: 3 },
  { keywords: ['cephalometrisch', 'cephalogram'], code: 'X05', priority: 2 },

  // VULLING - composiet
  { keywords: ['composiet vulling', 'composiet restauratie', 'composiet'], code: 'V21', surfaceCodeMap: { 1: 'V21', 2: 'V22', 3: 'V23', 4: 'V24' }, priority: 3 },
  // VULLING - amalgaam
  { keywords: ['amalgaam vulling', 'amalgaam'], code: 'V01', surfaceCodeMap: { 1: 'V01', 2: 'V02', 3: 'V03' }, priority: 2 },
  // VULLING - glasionomeer
  { keywords: ['glasionomeer', 'gic', 'gi cement'], code: 'V30', priority: 2 },
  // VULLING - compomeer
  { keywords: ['compomeer'], code: 'V35', priority: 2 },
  // VULLING - provisorisch
  { keywords: ['tijdelijke vulling', 'provisorische vulling', 'cavit'], code: 'V10', priority: 2 },
  // VULLING - stift
  { keywords: ['parapulpaire stift', 'parastift'], code: 'V40', priority: 2 },
  { keywords: ['wortelstift', 'gegoten stift'], code: 'V45', priority: 2 },
  // VULLING - opbouw
  { keywords: ['opbouw plastisch', 'kern opbouw', 'core opbouw'], code: 'V50', priority: 2 },
  // VULLING - hoekopbouw
  { keywords: ['hoekopbouw', 'hoek opbouw', 'hoek restauratie'], code: 'V70', priority: 3 },
  // VULLING - facet
  { keywords: ['direct veneer', 'composiet facet', 'direct facing'], code: 'V60', priority: 3 },
  // VULLING - cusp replacement
  { keywords: ['cusp vervanging', 'cusp replacement', 'knobbel opbouw'], code: 'V80', priority: 3 },
  // VULLING - splinting
  { keywords: ['splinting', 'tandsplinting', 'draadsplint'], code: 'V85', priority: 2 },
  // VULLING - caries excavatie
  { keywords: ['stepwise excavatie', 'caries excavatie', 'stepwise'], code: 'V12', priority: 2 },
  // VULLING - kroonvervangende
  { keywords: ['kroonvervangende restauratie', 'kroonvervangend composiet'], code: 'V75', priority: 3 },
  // VULLING - generic (lower priority, matches "vulling" alone)
  { keywords: ['vulling', 'restauratie'], code: 'V21', surfaceCodeMap: { 1: 'V21', 2: 'V22', 3: 'V23', 4: 'V24' }, priority: 1 },

  // ENDO
  { keywords: ['pulpa-extirpatie', 'pulpaextirpatie', 'pulpa extirpatie', 'pulpotomie'], code: 'E01', priority: 3 },
  { keywords: ['wortelkanaalbehandeling', 'wortelkanaal', 'endo', 'wkb'], code: 'E02', channelCodeMap: { 1: 'E02', 2: 'E03', 3: 'E04' }, priority: 2 },
  { keywords: ['directe overkapping', 'directe pulpa overkapping'], code: 'E13', priority: 3 },
  { keywords: ['herbehandeling wortelkanaal', 'herbehandeling endo', 'revisie endo'], code: 'E31', channelCodeMap: { 1: 'E31', 2: 'E32', 3: 'E33' }, priority: 3 },
  { keywords: ['interne bleaching', 'walking bleach'], code: 'E34', priority: 2 },
  { keywords: ['apicoectomie', 'wortelresectie', 'wortelpuntresectie'], code: 'E57', priority: 4 },
  { keywords: ['mta afsluiting', 'mta plug'], code: 'E85', priority: 3 },

  // PREVENTIE
  { keywords: ['tandsteen verwijderen', 'tandsteen', 'scaling', 'depuratie'], code: 'M01', priority: 1 },
  { keywords: ['mondhygiene', 'mondhygiëne'], code: 'M02', priority: 1 },
  { keywords: ['poetsinstructie', 'mondzorgadvies'], code: 'M03', priority: 2 },
  { keywords: ['voedingsadvies', 'witboekje'], code: 'M04', priority: 2 },
  { keywords: ['fluoride applicatie', 'fluoride', 'fluor applicatie'], code: 'M05', priority: 1 },
  { keywords: ['sealing', 'sealant', 'fissuursealant', 'fissuur sealant'], code: 'M10', priority: 2 },
  { keywords: ['dieptereiniging', 'diepe reiniging', 'rootplaning', 'root planing', 'subgingivaal'], code: 'M30', priority: 2 },
  { keywords: ['paro nazorg', 'nazorg parodontaal', 'parodontale nazorg'], code: 'M32', priority: 2 },
  { keywords: ['dpsi', 'parodontale screening'], code: 'M35', priority: 2 },
  { keywords: ['pa-status', 'parodontaal onderzoek', 'paro status', 'initieel parodontaal'], code: 'M40', priority: 3 },
  { keywords: ['parodontale evaluatie', 'paro evaluatie'], code: 'M41', priority: 2 },

  // VERDOVING
  { keywords: ['verdoving', 'anesthesie', 'lokale verdoving', 'verdoofd'], code: 'A01', priority: 1 },
  { keywords: ['geleidingsverdoving', 'mandibulaire verdoving'], code: 'A15', priority: 2 },
  { keywords: ['sedatie', 'lachgas', 'inhalatiesedatie'], code: 'A20', priority: 3 },

  // EXTRACTIE
  { keywords: ['chirurgische extractie', 'operatieve extractie'], code: 'X32', priority: 4 },
  { keywords: ['moeilijke extractie', 'gecompliceerde extractie'], code: 'X31', priority: 3 },
  { keywords: ['extractie', 'trekken', 'tand trekken', 'kies trekken'], code: 'X30', priority: 1 },
  { keywords: ['melkelement extractie', 'melktand trekken', 'wisseltand'], code: 'X33', priority: 2 },

  // KROON / BRUG / INLAY
  { keywords: ['metalen kroon', 'kroon metaal'], code: 'R01', priority: 3 },
  { keywords: ['mk kroon', 'metaal-keramiek kroon'], code: 'R02', priority: 3 },
  { keywords: ['volkeramische kroon', 'zirconia kroon', 'e.max kroon', 'emax'], code: 'R03', priority: 4 },
  { keywords: ['veneer', 'facet porselein', 'porseleinen facing'], code: 'R08', priority: 3 },
  { keywords: ['kroon', 'porselein kroon', 'keramische kroon'], code: 'R02', priority: 2 },
  { keywords: ['brug', 'bridge'], code: 'R10', priority: 2 },
  { keywords: ['maryland brug', 'adhesieve brug'], code: 'R80', priority: 3 },
  { keywords: ['inlay'], code: 'R20', surfaceCodeMap: { 1: 'R20', 2: 'R21', 3: 'R22' }, priority: 2 },
  { keywords: ['onlay'], code: 'R24', priority: 2 },
  { keywords: ['overlay'], code: 'R25', priority: 2 },
  { keywords: ['tijdelijke kroon', 'provisorische kroon'], code: 'R60', priority: 2 },
  { keywords: ['recementation', 'recementation kroon', 'kroon vastgezet', 'teruggeplaatst'], code: 'R40', priority: 2 },
  { keywords: ['kleurbepaling', 'kleur bepaald'], code: 'R75', priority: 1 },

  // IMPLANTAAT
  { keywords: ['implantaat plaatsen', 'implantaat chirurgisch'], code: 'I01', priority: 3 },
  { keywords: ['implantaat kroon', 'kroon op implantaat'], code: 'I10', priority: 3 },
  { keywords: ['healing abutment', 'healing cap'], code: 'J01', priority: 2 },
  { keywords: ['abutment', 'mesostructuur'], code: 'J02', priority: 2 },
  { keywords: ['peri-implantitis', 'periimplantitis'], code: 'G50', priority: 3 },
  { keywords: ['sinuslift', 'sinus lift', 'sinusbodemelevatie'], code: 'G30', priority: 3 },
  { keywords: ['botaugmentatie', 'bot augmentatie', 'botopbouw'], code: 'G25', priority: 2 },

  // GNATHOLOGIE
  { keywords: ['opbeetplaat', 'bitesplint', 'occlusale splint', 'knarsplaat', 'relaxplaat'], code: 'F21', priority: 3 },
  { keywords: ['gnathologisch consult', 'kaakgewricht consult'], code: 'F01', priority: 2 },

  // PROTHETIEK
  { keywords: ['volledige prothese', 'volledig kunstgebit', 'kunstgebit'], code: 'P01', priority: 2 },
  { keywords: ['partieel kunstgebit', 'partiele prothese', 'partiële prothese'], code: 'P10', priority: 2 },
  { keywords: ['frameprothese', 'frame prothese'], code: 'P15', priority: 3 },
  { keywords: ['rebasen', 'rebasing', 'opvullen prothese'], code: 'P30', priority: 2 },
  { keywords: ['reparatie prothese', 'prothese reparatie', 'gebroken prothese'], code: 'P35', priority: 2 },
  { keywords: ['prothese element toevoegen', 'tand toevoegen prothese'], code: 'P37', priority: 2 },
  { keywords: ['immediaatprothese', 'immediaat prothese'], code: 'P06', priority: 3 },

  // KAAKCHIRURGIE
  { keywords: ['biopsie'], code: 'T30', priority: 3 },
  { keywords: ['frenulectomie', 'tongriemcorrectie', 'tongriem', 'frenulum'], code: 'T40', priority: 3 },
  { keywords: ['drainage abces', 'abces drainage', 'incisie abces'], code: 'T60', priority: 3 },
  { keywords: ['hechting', 'hechtingen', 'wondhechting'], code: 'T70', priority: 1 },
  { keywords: ['hechtingen verwijderen', 'hechtingen eruit'], code: 'T71', priority: 2 },
  { keywords: ['torus', 'torus verwijderen', 'torus mandibularis'], code: 'T50', priority: 3 },
  { keywords: ['cystectomie', 'cyste verwijdering'], code: 'T20', priority: 3 },
  { keywords: ['geretineerd element', 'retinentie', 'verstandskies operatief'], code: 'T02', priority: 3 },
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
