/**
 * KNMT Codebook — Structured knowledge for NZa dental code detection.
 * Contains shorthand mappings, companion code rules, decision trees,
 * and few-shot examples for the AI prompt.
 */

// Common dental shorthand → full Dutch term
export const SHORTHAND_MAP: Record<string, string> = {
  // Materials
  comp: 'composiet vulling',
  amal: 'amalgaam vulling',
  gic: 'glasionomeer cement',
  // Procedures
  wkb: 'wortelkanaalbehandeling',
  ext: 'extractie',
  exo: 'extractie',
  loco: 'lokale verdoving',
  verd: 'verdoving',
  krn: 'kroon',
  brg: 'brug',
  dp: 'devitalisatie pulpa',
  // Imaging
  bw: 'bitewing röntgenfoto',
  pano: 'panoramische röntgenfoto',
  opt: 'panoramische röntgenfoto',
  opg: 'panoramische röntgenfoto',
  kfo: 'orthodontie',
  // Periodontal
  paro: 'parodontaal',
  dpsi: 'dutch periodontal screening index',
  poc: 'pocketmeting',
  // Anatomy
  ok: 'bovenkaak',
  bk: 'onderkaak',
  mol: 'molaar',
  pm: 'premolaar',
  inc: 'incisief',
  // Common abbreviations
  mo: 'mesiaal-occlusaal',
  do: 'distaal-occlusaal',
  mod: 'mesiaal-occlusaal-distaal',
  mob: 'mesiaal-occlusaal-buccaal',
  dob: 'distaal-occlusaal-buccaal',
  // Status
  sec: 'secundaire cariës',
  'sec car': 'secundaire cariës',
  init: 'initiële cariës',
  // Prosthetics
  proth: 'prothese',
  overkp: 'overkappingsprothese',
  rvs: 'roestvrijstalen kroon',
};

// Companion code rules: when code X is detected, suggest code Y
export const COMPANION_RULES: { trigger: string; suggest: string; reason: string }[] = [
  { trigger: 'V21', suggest: 'A01', reason: 'Vulling vereist meestal verdoving' },
  { trigger: 'V22', suggest: 'A01', reason: 'Vulling vereist meestal verdoving' },
  { trigger: 'V23', suggest: 'A01', reason: 'Vulling vereist meestal verdoving' },
  { trigger: 'V24', suggest: 'A01', reason: 'Vulling vereist meestal verdoving' },
  { trigger: 'E01', suggest: 'X10', reason: 'Endo vereist lengtebepaling röntgenfoto' },
  { trigger: 'E02', suggest: 'X10', reason: 'Endo vereist lengtebepaling röntgenfoto' },
  { trigger: 'E03', suggest: 'X10', reason: 'Endo vereist lengtebepaling röntgenfoto' },
  { trigger: 'E04', suggest: 'X10', reason: 'Endo vereist lengtebepaling röntgenfoto' },
  { trigger: 'E02', suggest: 'A01', reason: 'Wortelkanaalbehandeling vereist verdoving' },
  { trigger: 'E03', suggest: 'A01', reason: 'Wortelkanaalbehandeling vereist verdoving' },
  { trigger: 'E04', suggest: 'A01', reason: 'Wortelkanaalbehandeling vereist verdoving' },
  { trigger: 'X30', suggest: 'A01', reason: 'Extractie vereist verdoving' },
  { trigger: 'X33', suggest: 'A01', reason: 'Chirurgische extractie vereist verdoving' },
  { trigger: 'X34', suggest: 'A01', reason: 'Hemisectie vereist verdoving' },
  { trigger: 'R10', suggest: 'R01', reason: 'Indirecte restauratie vereist preparatie' },
  { trigger: 'R24', suggest: 'R01', reason: 'Kroon vereist preparatie' },
  { trigger: 'R40', suggest: 'R01', reason: 'Brug vereist preparatie per pijler' },
];

// Decision trees for surface-count and channel-count codes
export const SURFACE_CODE_MAP: Record<number, string> = {
  1: 'V21', 2: 'V22', 3: 'V23', 4: 'V24', 5: 'V24',
};

export const CHANNEL_CODE_MAP: Record<number, string> = {
  1: 'E02', 2: 'E03', 3: 'E04', 4: 'E04',
};

// Few-shot examples for the AI prompt
export const FEW_SHOT_EXAMPLES = [
  {
    notes: 'Bevindingen: 36 MOD cariës, 46 O cariës\nBehandelplan: 36 MOD comp, 46 O comp, loco 36 en 46',
    expected: [
      { code: 'A01', toothNumber: '36', reasoning: 'Lokale verdoving element 36' },
      { code: 'A01', toothNumber: '46', reasoning: 'Lokale verdoving element 46' },
      { code: 'V23', toothNumber: '36', reasoning: 'Composiet vulling 3 vlakken (MOD) element 36' },
      { code: 'V21', toothNumber: '46', reasoning: 'Composiet vulling 1 vlak (O) element 46' },
    ],
  },
  {
    notes: 'Bevindingen: 11 fractuur, kroon nodig\nBehandelplan: prep 11 kroon, afdruk',
    expected: [
      { code: 'A01', toothNumber: '11', reasoning: 'Verdoving voor preparatie' },
      { code: 'R01', toothNumber: '11', reasoning: 'Preparatie voor kroon' },
      { code: 'R24', toothNumber: '11', reasoning: 'Kroon op element 11' },
    ],
  },
  {
    notes: 'Bevindingen: 48 geïmpacteerd, klachten\nBehandelplan: ext 48 chirurgisch, verdoving',
    expected: [
      { code: 'A01', toothNumber: '48', reasoning: 'Verdoving voor chirurgische extractie' },
      { code: 'X33', toothNumber: '48', reasoning: 'Chirurgische extractie geïmpacteerde 48' },
    ],
  },
  {
    notes: 'Bevindingen: 26 pulpitis irreversibilis\nBehandelplan: wkb 26 (3 kanalen), verdoving, röntgen',
    expected: [
      { code: 'A01', toothNumber: '26', reasoning: 'Verdoving voor wortelkanaalbehandeling' },
      { code: 'E04', toothNumber: '26', reasoning: 'Wortelkanaalbehandeling 3+ kanalen' },
      { code: 'X10', toothNumber: '26', reasoning: 'Röntgenfoto voor lengtebepaling' },
    ],
  },
  {
    notes: 'Bevindingen: DPSI 3+, gegeneraliseerde pockets >5mm\nBehandelplan: paro intake, BW links en rechts',
    expected: [
      { code: 'M30', toothNumber: '', reasoning: 'Parodontale intake bij DPSI 3+' },
      { code: 'X02', toothNumber: '', reasoning: 'Bitewing röntgenfoto' },
    ],
  },
  {
    notes: 'Controle, tandsteen boven en onder verwijderd, fluoride applicatie, mondhygiëne instructie',
    expected: [
      { code: 'C02', toothNumber: '', reasoning: 'Periodiek onderzoek / controle' },
      { code: 'M01', toothNumber: '', reasoning: 'Tandsteen verwijderd (gebitsreiniging)' },
      { code: 'M05', toothNumber: '', reasoning: 'Fluoride applicatie' },
      { code: 'M02', toothNumber: '', reasoning: 'Mondhygiëne instructie' },
    ],
  },
];

/**
 * Build the few-shot examples string for the AI prompt.
 */
export function buildFewShotPrompt(): string {
  return FEW_SHOT_EXAMPLES.map((ex, i) => {
    const notesStr = ex.notes;
    const expectedStr = JSON.stringify(ex.expected, null, 2);
    return `VOORBEELD ${i + 1}:\nNotities: ${notesStr}\nVerwacht resultaat:\n${expectedStr}`;
  }).join('\n\n');
}

/**
 * Build companion code suggestions string for the AI prompt.
 */
export function buildCompanionRulesPrompt(): string {
  const grouped = new Map<string, string[]>();
  for (const rule of COMPANION_RULES) {
    const existing = grouped.get(rule.trigger) || [];
    existing.push(`${rule.suggest} (${rule.reason})`);
    grouped.set(rule.trigger, existing);
  }
  return Array.from(grouped.entries())
    .map(([trigger, suggestions]) => `- Bij ${trigger}: overweeg ook ${suggestions.join(', ')}`)
    .join('\n');
}

/**
 * Build shorthand expansion reference for the AI prompt.
 */
export function buildShorthandPrompt(): string {
  return Object.entries(SHORTHAND_MAP)
    .map(([abbr, full]) => `- "${abbr}" = ${full}`)
    .join('\n');
}
