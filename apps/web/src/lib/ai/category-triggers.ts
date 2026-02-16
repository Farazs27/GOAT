/**
 * Shared category trigger definitions for AI code detection.
 * Used by both analyze-notes and treatment-chat routes to determine
 * which NZa code categories are relevant for a given clinical text.
 */

import { NZA_CODE_EXAMPLES } from './nza-codebook';

// Category keywords for pre-filtering — only send relevant categories to prompt
export const CATEGORY_TRIGGERS: Record<string, string[]> = {
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

/**
 * Determine which NZa code categories are relevant based on clinical text content.
 */
export function getRelevantCategories(text: string): string[] {
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

/**
 * Build codebook prompt section for the given relevant categories.
 */
export function buildCodebookPrompt(relevantCategories: string[]): string {
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
