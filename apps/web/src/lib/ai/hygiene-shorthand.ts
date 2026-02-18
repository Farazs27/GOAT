/**
 * Hygiene shorthand abbreviation expansion for dental hygienist notes.
 * Converts common shorthand codes to full Dutch clinical terms.
 */

export const HYGIENE_SHORTHAND_MAP: Record<string, string> = {
  'sc': 'scaling',
  'rp': 'root planing',
  'fi': 'fluoride applicatie',
  'pol': 'polijsten',
  'dh': 'mondhygiëne instructie',
  'irr': 'irrigatie',
  'chl': 'chloorhexidine',
  'mhi': 'mondhygiëne instructie',
  'pf': 'pocket flushing',
  'bop': 'bleeding on probing',
  'ppr': 'parodontale pocket reductie',
  'us': 'ultrasonisch reinigen',
  'ew': 'elementenreiniging wortel',
  'gi': 'gingivitis',
  'pa': 'parodontitis',
};

/**
 * Expands shorthand abbreviations in text, matching on word boundaries.
 * Case-insensitive matching, preserves surrounding text.
 */
export function expandHygieneShorthand(text: string): string {
  let result = text;
  for (const [short, full] of Object.entries(HYGIENE_SHORTHAND_MAP)) {
    // Word-boundary match, case-insensitive
    const regex = new RegExp(`\\b${short}\\b`, 'gi');
    result = result.replace(regex, full);
  }
  return result;
}

/**
 * Returns a list of shorthand hints for UI display.
 */
export function getShorthandHints(): { short: string; full: string }[] {
  return Object.entries(HYGIENE_SHORTHAND_MAP).map(([short, full]) => ({
    short,
    full,
  }));
}
