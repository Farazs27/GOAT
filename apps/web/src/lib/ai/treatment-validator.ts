/**
 * Treatment Validator — Rule-based validation engine for NZA code suggestions.
 *
 * This is the SAFETY NET that catches AI mistakes before they reach the dentist.
 * Hard-coded rules based on NZA tarievenboekje 2026.
 *
 * 3-layer accuracy:
 * 1. AI Detection (Gemini) → understands natural language
 * 2. THIS FILE → hard rules catch mistakes, auto-corrects
 * 3. DB Verification → every code verified against actual records
 */

import { NZA_CODE_EXAMPLES } from './nza-codebook';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AiSuggestion {
  code: string;
  description: string;
  toothNumbers: number[];
  surfaces?: string;   // e.g. "MO", "MOD"
  canals?: number;
  quantity: number;
  reasoning: string;
  isCompanion: boolean;
}

export interface ValidatedSuggestion {
  code: string;
  originalCode: string;
  description: string;
  toothNumbers: number[];
  quantity: number;
  reasoning: string;
  isCompanion: boolean;
  confidence: 'high' | 'medium';
  corrected: boolean;
  corrections: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

// Surface count → composiet vulling code (KNMT 2026: V91-V94)
const COMPOSIET_SURFACE_MAP: Record<number, string> = {
  1: 'V91',
  2: 'V92',
  3: 'V93',
  4: 'V94',
  5: 'V94',
  6: 'V94',
};

// Surface count → amalgaam vulling code
const AMALGAAM_SURFACE_MAP: Record<number, string> = {
  1: 'V71',
  2: 'V72',
  3: 'V73',
  4: 'V74',
  5: 'V74',
  6: 'V74',
};

// Canal count → endo code (KNMT 2026: E13/E14/E16/E17)
const ENDO_CANAL_MAP: Record<number, string> = {
  1: 'E13',
  2: 'E14',
  3: 'E16',
  4: 'E17',
  5: 'E17',
};

// Typical canal counts per tooth type (FDI)
const TOOTH_CANAL_DEFAULTS: Record<string, number> = {
  // Upper incisors: 1 canal
  '11': 1, '12': 1, '21': 1, '22': 1,
  // Upper canines: 1 canal
  '13': 1, '23': 1,
  // Upper premolars: 1-2 canals (default 2 for upper)
  '14': 2, '15': 1, '24': 2, '25': 1,
  // Upper molars: 3-4 canals (default 3)
  '16': 3, '17': 3, '18': 3, '26': 3, '27': 3, '28': 3,
  // Lower incisors: 1 canal
  '31': 1, '32': 1, '41': 1, '42': 1,
  // Lower canines: 1 canal
  '33': 1, '43': 1,
  // Lower premolars: 1 canal
  '34': 1, '35': 1, '44': 1, '45': 1,
  // Lower molars: 2-3 canals (default 3)
  '36': 3, '37': 3, '38': 2, '46': 3, '47': 3, '48': 2,
};

// Valid surface letters
const VALID_SURFACES = new Set(['M', 'O', 'D', 'B', 'V', 'L', 'P']);

// Composiet vulling codes (KNMT 2026)
const COMPOSIET_CODES = new Set(['V91', 'V92', 'V93', 'V94']);
// Amalgaam vulling codes
const AMALGAAM_CODES = new Set(['V71', 'V72', 'V73', 'V74']);
// Glasionomeer vulling codes
const GLASIONOMEER_CODES = new Set(['V81', 'V82', 'V83', 'V84']);
// All vulling codes
const VULLING_CODES = new Set([...COMPOSIET_CODES, ...AMALGAAM_CODES, ...GLASIONOMEER_CODES]);
// Endo treatment codes (KNMT 2026: E13/E14/E16/E17)
const ENDO_CODES = new Set(['E13', 'E14', 'E16', 'E17']);
// Extraction codes
const EXTRACTION_CODES = new Set(['H11', 'H16', 'H35', 'H36', 'H37', 'H38', 'H39']);
// Kroon/brug codes (start with R)
const isKroonCode = (code: string) => code.startsWith('R');
// Chirurgisch codes
const CHIRURGISCH_CODES = new Set(['H35', 'H36', 'H37', 'H38', 'H39', 'H40', 'H50']);

// Companion code rules: which codes auto-trigger which companions
const COMPANION_RULES: Array<{
  trigger: (code: string) => boolean;
  companions: string[];
  label: string;
}> = [
  {
    trigger: (code) => VULLING_CODES.has(code),
    companions: ['A10'],
    label: 'Verdoving bij vulling',
  },
  {
    trigger: (code) => ENDO_CODES.has(code),
    companions: ['A10', 'X10'],
    label: 'Verdoving + röntgen bij endo',
  },
  {
    trigger: (code) => EXTRACTION_CODES.has(code),
    companions: ['A10'],
    label: 'Verdoving bij extractie',
  },
  {
    trigger: (code) => isKroonCode(code),
    companions: ['A10'],
    label: 'Verdoving bij kroon/brug',
  },
  {
    trigger: (code) => CHIRURGISCH_CODES.has(code),
    companions: ['A10'],
    label: 'Verdoving bij chirurgie',
  },
];

// Exclusion rules: codes that cannot be combined
const EXCLUSION_RULES: Array<{
  codes: [string, string];
  message: string;
}> = [
  { codes: ['A15', 'A10'], message: 'A15 (oppervlakteverdoving) niet combineren met A10 in zelfde regio' },
];

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Count unique surfaces from a surface string like "MO", "MOD", "MODP"
 */
export function countSurfaces(surfaceStr: string): number {
  if (!surfaceStr) return 0;
  const upper = surfaceStr.toUpperCase().replace(/[^MODBVLP]/g, '');
  const unique = new Set(upper.split(''));
  return unique.size;
}

/**
 * Extract surface notation from input text (e.g. "comp MO 36" → "MO")
 */
export function extractSurfaces(text: string): string | null {
  const upper = text.toUpperCase();
  // Match patterns like MO, MOD, MODP, OD, etc. (2+ consecutive surface letters)
  const match = upper.match(/\b([MODBVLP]{2,6})\b/);
  if (match) {
    // Verify all letters are valid surfaces
    const letters = match[1];
    if ([...letters].every(l => VALID_SURFACES.has(l))) {
      return letters;
    }
  }
  return null;
}

/**
 * Extract surface count from shorthand like "2v", "3v", "1 vlak", "2 vlakken"
 */
export function extractSurfaceCount(text: string): number | null {
  const lower = text.toLowerCase();
  // "2v", "3v", "1v"
  const shortMatch = lower.match(/\b(\d)v\b/);
  if (shortMatch) return parseInt(shortMatch[1]);
  // "2 vlak", "3 vlakken", "1 vlak"
  const longMatch = lower.match(/(\d)\s*vlak(?:ken)?/);
  if (longMatch) return parseInt(longMatch[1]);
  return null;
}

/**
 * Extract canal count from text like "3k", "2 kanalen", "3 kanalen"
 */
export function extractCanalCount(text: string): number | null {
  const lower = text.toLowerCase();
  // "3k", "2k", "1k"
  const shortMatch = lower.match(/\b(\d)k\b/);
  if (shortMatch) return parseInt(shortMatch[1]);
  // "3 kanalen", "2 kanalen", "1 kanaal"
  const longMatch = lower.match(/(\d)\s*(?:kanalen|kanaal)/);
  if (longMatch) return parseInt(longMatch[1]);
  return null;
}

/**
 * Check if a keyword from the codebook matches the input text
 */
function hasKeywordMatch(code: string, inputText: string): boolean {
  const entry = NZA_CODE_EXAMPLES.find(e => e.code === code);
  if (!entry) return false;
  const lower = inputText.toLowerCase();
  return entry.keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// ─── Main Validation Function ───────────────────────────────────────────────

/**
 * Validates and corrects AI-suggested NZA codes against hard rules.
 * Returns corrected suggestions with confidence scoring.
 */
export function validateAndCorrectSuggestions(
  suggestions: AiSuggestion[],
  inputText: string
): ValidatedSuggestion[] {
  const results: ValidatedSuggestion[] = [];
  const existingCodes = new Set<string>();

  // Pre-extract info from input text
  const inputSurfaces = extractSurfaces(inputText);
  const inputSurfaceCount = extractSurfaceCount(inputText) ?? (inputSurfaces ? countSurfaces(inputSurfaces) : null);
  const inputCanalCount = extractCanalCount(inputText);

  for (const suggestion of suggestions) {
    const corrections: string[] = [];
    let correctedCode = suggestion.code;
    let correctedQuantity = suggestion.quantity;
    let confidence: 'high' | 'medium' = 'high';

    // ─── Vulling code validation ──────────────────────────────────────
    if (COMPOSIET_CODES.has(suggestion.code) || AMALGAAM_CODES.has(suggestion.code)) {
      const isAmalgaam = AMALGAAM_CODES.has(suggestion.code);
      const surfaceMap = isAmalgaam ? AMALGAAM_SURFACE_MAP : COMPOSIET_SURFACE_MAP;

      // Determine correct surface count
      const surfaceCount = suggestion.surfaces
        ? countSurfaces(suggestion.surfaces)
        : inputSurfaceCount;

      if (surfaceCount && surfaceCount >= 1 && surfaceCount <= 6) {
        const correctCode = surfaceMap[surfaceCount];
        if (correctCode && correctCode !== suggestion.code) {
          corrections.push(`Code gecorrigeerd: ${suggestion.code} → ${correctCode} (${surfaceCount} vlak${surfaceCount !== 1 ? 'ken' : ''})`);
          correctedCode = correctCode;
          confidence = 'medium';
        }
      }
    }

    // ─── Endo code validation ─────────────────────────────────────────
    if (ENDO_CODES.has(suggestion.code)) {
      // Try explicit canal count first, then tooth-based default
      let canalCount = suggestion.canals ?? inputCanalCount;

      if (!canalCount && suggestion.toothNumbers.length > 0) {
        // Infer from tooth type
        const toothStr = String(suggestion.toothNumbers[0]);
        const defaultCanals = TOOTH_CANAL_DEFAULTS[toothStr];
        if (defaultCanals) {
          canalCount = defaultCanals;
        }
      }

      if (canalCount && canalCount >= 1 && canalCount <= 5) {
        const correctCode = ENDO_CANAL_MAP[canalCount];
        if (correctCode && correctCode !== suggestion.code) {
          corrections.push(`Code gecorrigeerd: ${suggestion.code} → ${correctCode} (${canalCount} ${canalCount === 1 ? 'kanaal' : 'kanalen'})`);
          correctedCode = correctCode;
          confidence = 'medium';
        }
      }
    }

    // ─── M03 (gebitsreiniging) quantity validation ────────────────────
    if (suggestion.code === 'M03') {
      // Extract minutes from input
      const minMatch = inputText.toLowerCase().match(/(\d+)\s*min/);
      if (minMatch) {
        const minutes = parseInt(minMatch[1]);
        const correctQty = Math.ceil(minutes / 5);
        if (correctQty !== suggestion.quantity) {
          corrections.push(`Aantal gecorrigeerd: ${suggestion.quantity} → ${correctQty} (${minutes} min / 5 min per eenheid)`);
          correctedQuantity = correctQty;
          confidence = 'medium';
        }
      }
    }

    // ─── Confidence scoring ───────────────────────────────────────────
    if (corrections.length === 0) {
      // No corrections needed — check for keyword match
      confidence = hasKeywordMatch(correctedCode, inputText) ? 'high' : 'medium';
    } else if (corrections.length >= 2) {
      confidence = 'medium';
    }

    // ─── Deduplication ────────────────────────────────────────────────
    const toothKey = suggestion.toothNumbers.length > 0
      ? suggestion.toothNumbers.sort().join(',')
      : 'no-tooth';
    const dedupeKey = `${correctedCode}:${toothKey}`;
    if (existingCodes.has(dedupeKey)) continue;
    existingCodes.add(dedupeKey);

    results.push({
      code: correctedCode,
      originalCode: suggestion.code,
      description: suggestion.description,
      toothNumbers: suggestion.toothNumbers,
      quantity: correctedQuantity,
      reasoning: suggestion.reasoning,
      isCompanion: suggestion.isCompanion,
      confidence,
      corrected: corrections.length > 0,
      corrections,
    });
  }

  // ─── Ensure companion codes ───────────────────────────────────────
  const mainCodes = results.filter(r => !r.isCompanion);
  const companionCodesToAdd = new Set<string>();

  for (const main of mainCodes) {
    for (const rule of COMPANION_RULES) {
      if (rule.trigger(main.code)) {
        for (const comp of rule.companions) {
          // Check if companion already exists in results
          const alreadyExists = results.some(r => r.code === comp && r.isCompanion);
          if (!alreadyExists) {
            companionCodesToAdd.add(comp);
          }
        }
      }
    }
  }

  // Add missing companion codes
  for (const compCode of companionCodesToAdd) {
    const codebookEntry = NZA_CODE_EXAMPLES.find(e => e.code === compCode);
    const dedupeKey = `${compCode}:no-tooth`;
    if (existingCodes.has(dedupeKey)) continue;
    existingCodes.add(dedupeKey);

    results.push({
      code: compCode,
      originalCode: compCode,
      description: codebookEntry?.description || compCode,
      toothNumbers: [],
      quantity: 1,
      reasoning: 'Automatisch toegevoegd als begeleidende code',
      isCompanion: true,
      confidence: 'high',
      corrected: false,
      corrections: [],
    });
  }

  // ─── Exclusion rule check ─────────────────────────────────────────
  const allCodes = new Set(results.map(r => r.code));
  for (const rule of EXCLUSION_RULES) {
    if (allCodes.has(rule.codes[0]) && allCodes.has(rule.codes[1])) {
      // Remove the second code and add a correction note
      const idx = results.findIndex(r => r.code === rule.codes[0] && r.isCompanion);
      if (idx >= 0) {
        results.splice(idx, 1);
      }
    }
  }

  return results;
}
