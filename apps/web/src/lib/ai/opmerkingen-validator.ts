/**
 * NZa Opmerkingen Validator — Checks AI suggestions against NZa rules
 * for rejection risk flagging.
 *
 * Hard-coded rules based on common NZa opmerkingen (tarievenboekje 2026).
 * Returns Dutch warning messages for each potential rejection risk.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OpmerkingenWarning {
  code: string;
  ruleType: 'frequency' | 'age' | 'combination' | 'indication' | 'general';
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface SuggestionForValidation {
  code: string;
  [key: string]: unknown;
}

export interface ValidationContext {
  patientAge?: number;
  recentCodes?: Array<{ code: string; date: string }>;
}

// ─── Rule Definitions ───────────────────────────────────────────────────────

interface OpmerkingenRule {
  codes: string[];
  check: (
    suggestion: SuggestionForValidation,
    context: ValidationContext,
    allSuggestions: SuggestionForValidation[]
  ) => OpmerkingenWarning | null;
}

function countRecentOccurrences(
  code: string,
  recentCodes: Array<{ code: string; date: string }>,
  withinMonths: number
): number {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - withinMonths);
  return recentCodes.filter(
    rc => rc.code === code && new Date(rc.date) >= cutoff
  ).length;
}

const OPMERKINGEN_RULES: OpmerkingenRule[] = [
  // 1. X10 (bitewing): max 2x/jaar for adults (18+)
  {
    codes: ['X10'],
    check: (suggestion, context) => {
      if (!context.recentCodes) return null;
      const count = countRecentOccurrences('X10', context.recentCodes, 12);
      if (count >= 2 && (context.patientAge === undefined || context.patientAge >= 18)) {
        return {
          code: suggestion.code,
          ruleType: 'frequency',
          severity: 'warning',
          message: 'X10: maximaal 2x per jaar voor patienten >=18 jaar (NZa opmerking)',
        };
      }
      return null;
    },
  },

  // 2. X21 (OPG): max 1x per 3 jaar unless indication
  {
    codes: ['X21'],
    check: (suggestion, context) => {
      if (!context.recentCodes) return null;
      const count = countRecentOccurrences('X21', context.recentCodes, 36);
      if (count >= 1) {
        return {
          code: suggestion.code,
          ruleType: 'frequency',
          severity: 'warning',
          message: 'X21 (OPG): maximaal 1x per 3 jaar tenzij specifieke indicatie (NZa opmerking)',
        };
      }
      return null;
    },
  },

  // 3. C11 (periodieke controle): max 2x/jaar
  {
    codes: ['C11'],
    check: (suggestion, context) => {
      if (!context.recentCodes) return null;
      const count = countRecentOccurrences('C11', context.recentCodes, 12);
      if (count >= 2) {
        return {
          code: suggestion.code,
          ruleType: 'frequency',
          severity: 'warning',
          message: 'C11: maximaal 2x per jaar (NZa opmerking)',
        };
      }
      return null;
    },
  },

  // 4. C13 (uitgebreid onderzoek): max 1x/jaar
  {
    codes: ['C13'],
    check: (suggestion, context) => {
      if (!context.recentCodes) return null;
      const count = countRecentOccurrences('C13', context.recentCodes, 12);
      if (count >= 1) {
        return {
          code: suggestion.code,
          ruleType: 'frequency',
          severity: 'warning',
          message: 'C13: maximaal 1x per jaar (NZa opmerking)',
        };
      }
      return null;
    },
  },

  // 5. V-codes cannot combine with R-codes (kroon) on same tooth same day
  {
    codes: ['V71', 'V72', 'V73', 'V74', 'V81', 'V82', 'V83', 'V84', 'V91', 'V92', 'V93', 'V94'],
    check: (suggestion, _context, allSuggestions) => {
      const toothNumbers = suggestion.toothNumbers as number[] | undefined;
      if (!toothNumbers || toothNumbers.length === 0) return null;
      const hasKroon = allSuggestions.some(s => {
        if (!String(s.code).startsWith('R')) return false;
        const sTeeth = s.toothNumbers as number[] | undefined;
        if (!sTeeth) return false;
        return sTeeth.some(t => toothNumbers.includes(t));
      });
      if (hasKroon) {
        return {
          code: suggestion.code,
          ruleType: 'combination',
          severity: 'error',
          message: `${suggestion.code}: vulling niet combineerbaar met kroon (R-code) op hetzelfde element op dezelfde dag`,
        };
      }
      return null;
    },
  },

  // 6. M01 (mondzorgcoaching): max 2x/jaar
  {
    codes: ['M01'],
    check: (suggestion, context) => {
      if (!context.recentCodes) return null;
      const count = countRecentOccurrences('M01', context.recentCodes, 12);
      if (count >= 2) {
        return {
          code: suggestion.code,
          ruleType: 'frequency',
          severity: 'warning',
          message: 'M01: maximaal 2x per jaar (NZa opmerking)',
        };
      }
      return null;
    },
  },

  // 7. M02 (fluoride applicatie): max 2x/jaar for adults
  {
    codes: ['M02'],
    check: (suggestion, context) => {
      if (!context.recentCodes) return null;
      if (context.patientAge !== undefined && context.patientAge < 18) return null;
      const count = countRecentOccurrences('M02', context.recentCodes, 12);
      if (count >= 2) {
        return {
          code: suggestion.code,
          ruleType: 'frequency',
          severity: 'warning',
          message: 'M02: maximaal 2x per jaar voor volwassenen (NZa opmerking)',
        };
      }
      return null;
    },
  },

  // 8. E97 (endo herbehandeling): requires prior E-code on same tooth
  {
    codes: ['E97'],
    check: (suggestion, context) => {
      if (!context.recentCodes) {
        return {
          code: suggestion.code,
          ruleType: 'indication',
          severity: 'info',
          message: 'E97 (herbehandeling endo): vereist eerdere endodontische behandeling op hetzelfde element',
        };
      }
      const hasEndoHistory = context.recentCodes.some(rc =>
        ['E13', 'E14', 'E16', 'E17'].includes(rc.code)
      );
      if (!hasEndoHistory) {
        return {
          code: suggestion.code,
          ruleType: 'indication',
          severity: 'warning',
          message: 'E97 (herbehandeling endo): geen eerdere E-code gevonden — indicatie vereist',
        };
      }
      return null;
    },
  },

  // 9. T21 (tandsteen verwijderen): max 2x/jaar for adults
  {
    codes: ['T21'],
    check: (suggestion, context) => {
      if (!context.recentCodes) return null;
      const count = countRecentOccurrences('T21', context.recentCodes, 12);
      if (count >= 2) {
        return {
          code: suggestion.code,
          ruleType: 'frequency',
          severity: 'warning',
          message: 'T21: maximaal 2x per jaar voor volwassenen (NZa opmerking)',
        };
      }
      return null;
    },
  },

  // 10. T22 (uitgebreide gebitsreiniging): max 2x/jaar
  {
    codes: ['T22'],
    check: (suggestion, context) => {
      if (!context.recentCodes) return null;
      const count = countRecentOccurrences('T22', context.recentCodes, 12);
      if (count >= 2) {
        return {
          code: suggestion.code,
          ruleType: 'frequency',
          severity: 'warning',
          message: 'T22: maximaal 2x per jaar (NZa opmerking)',
        };
      }
      return null;
    },
  },

  // 11. A15 (oppervlakte-anesthesie) cannot combine with A10 in same region
  {
    codes: ['A15'],
    check: (suggestion, _context, allSuggestions) => {
      const hasA10 = allSuggestions.some(s => s.code === 'A10');
      if (hasA10) {
        return {
          code: suggestion.code,
          ruleType: 'combination',
          severity: 'warning',
          message: 'A15: oppervlakteverdoving niet combineerbaar met A10 (infiltratieverdoving) in hetzelfde regio',
        };
      }
      return null;
    },
  },

  // 12. M03 (gebitsreiniging per 5 min): age-dependent frequency
  {
    codes: ['M03'],
    check: (suggestion, context) => {
      if (context.patientAge !== undefined && context.patientAge < 18) {
        return {
          code: suggestion.code,
          ruleType: 'age',
          severity: 'info',
          message: 'M03: let op leeftijdsafhankelijke frequentiebeperking bij jeugdigen',
        };
      }
      return null;
    },
  },
];

// ─── Main Validation Function ───────────────────────────────────────────────

/**
 * Validate suggestions against NZa opmerkingen rules.
 * Returns an array of warnings for potential rejection risks.
 */
export function validateOpmerkingen(
  suggestions: SuggestionForValidation[],
  context: ValidationContext = {}
): OpmerkingenWarning[] {
  const warnings: OpmerkingenWarning[] = [];

  for (const suggestion of suggestions) {
    for (const rule of OPMERKINGEN_RULES) {
      if (rule.codes.includes(suggestion.code)) {
        const warning = rule.check(suggestion, context, suggestions);
        if (warning) {
          warnings.push(warning);
        }
      }
    }
  }

  return warnings;
}

/**
 * Enriches suggestions with their applicable warnings.
 * Adds a `warnings` array to each suggestion object.
 */
export function enrichSuggestionsWithWarnings<T extends SuggestionForValidation>(
  suggestions: T[],
  context: ValidationContext = {}
): Array<T & { warnings: OpmerkingenWarning[] }> {
  const allWarnings = validateOpmerkingen(suggestions, context);

  return suggestions.map(suggestion => ({
    ...suggestion,
    warnings: allWarnings.filter(w => w.code === suggestion.code),
  }));
}
