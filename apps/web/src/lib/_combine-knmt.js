const fs = require('fs');
const p1 = fs.readFileSync(__dirname + '/knmt-codes-2026-part1.ts', 'utf8');
const p2 = fs.readFileSync(__dirname + '/knmt-codes-2026-part2.ts', 'utf8');

const m1 = p1.match(/export const KNMT_PART1 = \[([\s\S]*)\];/);
const m2 = p2.match(/export const KNMT_PART2 = \[([\s\S]*)\];/);

const combined = `// KNMT Tarievenboekje 2026 - Complete codes dataset

export interface KnmtCode {
  code: string;
  description: string;
  points: number | null;
  tariff: number | null;
  toelichting: string;
  requiresTooth: boolean;
  requiresSurface: boolean;
}

export interface KnmtSubcategory {
  name: string;
  codes: KnmtCode[];
}

export interface KnmtCategory {
  code: string;
  roman: string;
  name: string;
  subcategories: KnmtSubcategory[];
}

export const KNMT_CATEGORIES: KnmtCategory[] = [${m1[1]},${m2[1]}
];

// Helper to get flat list of all codes
export function getAllKnmtCodes(): (KnmtCode & { category: string; subcategory: string })[] {
  return KNMT_CATEGORIES.flatMap(cat =>
    cat.subcategories.flatMap(sub =>
      sub.codes.map(code => ({ ...code, category: cat.code, subcategory: sub.name }))
    )
  );
}

// Category label map for UI display
export const CATEGORY_LABELS: Record<string, string> = {
  'C': 'Consultatie en diagnostiek',
  'X': "Foto's",
  'M': 'Preventieve mondzorg',
  'A': 'Verdoving',
  'B': 'Roesje (lachgassedatie)',
  'V': 'Vullingen',
  'E': 'Wortelkanaalbehandelingen',
  'R': 'Kronen en bruggen',
  'G': 'Kauwstelsel (OPD)',
  'H': 'Chirurgische ingrepen',
  'P': 'Kunstgebitten',
  'T': 'Tandvleesbehandelingen',
  'J': 'Implantaten',
  'U': 'Uurtarieven',
  'Y': 'Informatieverstrekking',
  'F': 'Orthodontie',
};
`;

fs.writeFileSync(__dirname + '/knmt-codes-2026.ts', combined);
fs.unlinkSync(__dirname + '/knmt-codes-2026-part1.ts');
fs.unlinkSync(__dirname + '/knmt-codes-2026-part2.ts');
fs.unlinkSync(__filename);
console.log('Done. Combined file lines:', combined.split('\n').length);
