import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { KNMT_PART1 } from '../../../apps/web/src/lib/knmt-codes-2026-part1';
import { KNMT_PART2 } from '../../../apps/web/src/lib/knmt-codes-2026-part2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Helper: date relative to now
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function hoursFromNow(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + n);
  return d;
}
function atTime(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Initialize 32 adult teeth for FDI notation
async function initializeTeeth(patientId: string, practiceId: string) {
  const adultTeeth = [
    11, 12, 13, 14, 15, 16, 17, 18,
    21, 22, 23, 24, 25, 26, 27, 28,
    31, 32, 33, 34, 35, 36, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48,
  ];

  await prisma.tooth.createMany({
    data: adultTeeth.map((toothNumber) => ({
      patientId,
      practiceId,
      toothNumber,
      status: 'PRESENT' as const,
      isPrimary: false,
    })),
    skipDuplicates: true,
  });
}

// NZa Codes 2026 — Generated from KNMT Tarievenboekje 2026
function getAllKnmtCodes() {
  const allCategories = [...KNMT_PART1, ...KNMT_PART2];
  const codes: Array<{
    code: string;
    category: string;
    subcategory: string;
    description: string;
    tariff: number | null;
    points: number | null;
    toelichting: string | null;
    requiresTooth: boolean;
    requiresSurface: boolean;
  }> = [];
  for (const cat of allCategories) {
    for (const sub of cat.subcategories) {
      for (const c of sub.codes) {
        codes.push({
          code: c.code,
          category: cat.name,
          subcategory: sub.name,
          description: c.description,
          tariff: c.tariff ?? null,
          points: c.points ?? null,
          toelichting: c.toelichting ?? null,
          requiresTooth: c.requiresTooth ?? false,
          requiresSurface: c.requiresSurface ?? false,
        });
      }
    }
  }
  return codes;
}

const knmtCodes = getAllKnmtCodes();
const nzaCodes2026 = knmtCodes.map(k => ({
  code: k.code,
  category: k.category,
  subcategory: k.subcategory,
  descriptionNl: k.description,
  maxTariff: k.tariff ?? 0,
  points: k.points,
  toelichting: k.toelichting,
  unit: 'per_treatment' as const,
  requiresTooth: k.requiresTooth,
  requiresSurface: k.requiresSurface,
  validFrom: new Date('2026-01-01'),
  validUntil: new Date('2026-12-31'),
  isActive: true,
}));

/* Old hardcoded array removed — now generated from KNMT data above
  { code: 'A01', category: 'VERDOVING', descriptionNl: 'Lokale verdoving (infiltratie)', maxTariff: 15.43, unit: 'per_injection', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'A02', category: 'VERDOVING', descriptionNl: 'Lokale verdoving additioneel', maxTariff: 7.72, unit: 'per_injection', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'A10', category: 'VERDOVING', descriptionNl: 'Oppervlakte-anesthesie', maxTariff: 9.88, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'A15', category: 'VERDOVING', descriptionNl: 'Geleidingsverdoving', maxTariff: 18.00, unit: 'per_injection', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'A20', category: 'VERDOVING', descriptionNl: 'Sedatie (lachgas/inhalatiesedatie) per kwartier', maxTariff: 45.00, unit: 'per_15min', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── C: CONSULTATIE EN DIAGNOSTIEK ────────────────────────
  { code: 'C01', category: 'CONSULTATIE', descriptionNl: 'Eerste consult mondzorg', maxTariff: 25.72, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C02', category: 'CONSULTATIE', descriptionNl: 'Periodiek mondonderzoek', maxTariff: 25.72, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C03', category: 'CONSULTATIE', descriptionNl: 'Consult met uitgebreid onderzoek', maxTariff: 51.44, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C11', category: 'CONSULTATIE', descriptionNl: 'Spoedconsult buiten werktijd', maxTariff: 38.58, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C13', category: 'CONSULTATIE', descriptionNl: 'Schriftelijke verwijzing', maxTariff: 12.86, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C22', category: 'CONSULTATIE', descriptionNl: 'Opstellen en bespreken behandelplan', maxTariff: 25.72, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C28', category: 'CONSULTATIE', descriptionNl: 'Instructie mondverzorging', maxTariff: 18.00, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C29', category: 'CONSULTATIE', descriptionNl: 'Probleemgericht consult', maxTariff: 25.72, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C80', category: 'CONSULTATIE', descriptionNl: 'Telefonisch consult', maxTariff: 12.86, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C84', category: 'CONSULTATIE', descriptionNl: 'Teleconsultatie (telezorg)', maxTariff: 18.00, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C85', category: 'CONSULTATIE', descriptionNl: 'Intercollegiaal consult', maxTariff: 25.72, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── E: ENDODONTIE ────────────────────────────────────────
  { code: 'E01', category: 'ENDO', descriptionNl: 'Pulpa-extirpatie/pulpotomie', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E02', category: 'ENDO', descriptionNl: 'Wortelkanaalbehandeling 1 kanaal', maxTariff: 128.60, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E03', category: 'ENDO', descriptionNl: 'Wortelkanaalbehandeling 2 kanalen', maxTariff: 192.90, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E04', category: 'ENDO', descriptionNl: 'Wortelkanaalbehandeling 3 of meer kanalen', maxTariff: 257.20, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E13', category: 'ENDO', descriptionNl: 'Directe overkapping pulpa', maxTariff: 38.58, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E16', category: 'ENDO', descriptionNl: 'Noodbehandeling endodontisch', maxTariff: 51.44, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E31', category: 'ENDO', descriptionNl: 'Herbehandeling wortelkanaal 1 kanaal', maxTariff: 160.75, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E32', category: 'ENDO', descriptionNl: 'Herbehandeling wortelkanaal 2 kanalen', maxTariff: 225.05, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E33', category: 'ENDO', descriptionNl: 'Herbehandeling wortelkanaal 3+ kanalen', maxTariff: 289.35, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E34', category: 'ENDO', descriptionNl: 'Interne bleaching devitaal element', maxTariff: 64.30, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E40', category: 'ENDO', descriptionNl: 'Opbouw wortelstift na endodontie', maxTariff: 51.44, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E50', category: 'ENDO', descriptionNl: 'Opbouw t.b.v. kroon na wortelkanaalbehandeling', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E55', category: 'ENDO', descriptionNl: 'Hemisectie', maxTariff: 102.88, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E56', category: 'ENDO', descriptionNl: 'Premolarisatie', maxTariff: 102.88, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E57', category: 'ENDO', descriptionNl: 'Wortelresectie (apicoectomie)', maxTariff: 154.32, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E60', category: 'ENDO', descriptionNl: 'Elektronische kanaallengtebepaling', maxTariff: 12.86, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E77', category: 'ENDO', descriptionNl: 'Open cavum / spoedhulp endodontisch', maxTariff: 25.72, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E80', category: 'ENDO', descriptionNl: 'Behandeling interne resorptie', maxTariff: 128.60, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E85', category: 'ENDO', descriptionNl: 'MTA-afsluiting', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E86', category: 'ENDO', descriptionNl: 'Revascularisatie', maxTariff: 192.90, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E97', category: 'ENDO', descriptionNl: 'Endodontische spoedbehandeling', maxTariff: 51.44, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── F: GNATHOLOGIE ───────────────────────────────────────
  { code: 'F01', category: 'GNATHOLOGIE', descriptionNl: 'Gnathologisch consult', maxTariff: 51.44, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'F15', category: 'GNATHOLOGIE', descriptionNl: 'Registratie kaakgewricht', maxTariff: 25.72, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'F21', category: 'GNATHOLOGIE', descriptionNl: 'Occlusale splint (opbeetplaat)', maxTariff: 192.90, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'F22', category: 'GNATHOLOGIE', descriptionNl: 'Controle/aanpassing occlusale splint', maxTariff: 25.72, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'F31', category: 'GNATHOLOGIE', descriptionNl: 'Gnathologische behandeling per zitting', maxTariff: 51.44, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'F45', category: 'GNATHOLOGIE', descriptionNl: 'Fysiotherapeutische verwijzing kaakgewricht', maxTariff: 38.58, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── G: IMPLANTOLOGIE CHIRURGISCH ─────────────────────────
  { code: 'G01', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Pre-implantologisch consult', maxTariff: 51.44, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G05', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Diagnostiek implantologie', maxTariff: 77.16, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G10', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Plaatsen eerste implantaat', maxTariff: 458.96, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G11', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Plaatsen volgend implantaat dezelfde zitting', maxTariff: 343.04, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G15', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Directe implantatie na extractie', maxTariff: 514.40, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G20', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Vrijleggen implantaat (tweede fase)', maxTariff: 128.60, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G25', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Toeslag botopbouw klein', maxTariff: 192.90, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G30', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Sinusbodemlift intern', maxTariff: 385.80, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G31', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Sinusbodemlift extern', maxTariff: 771.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G35', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Botblokaugmentatie', maxTariff: 514.40, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G40', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Bindweefseltransplantaat bij implantaat', maxTariff: 192.90, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G50', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Peri-implantitis behandeling chirurgisch', maxTariff: 257.20, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G60', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Implantaat verwijdering', maxTariff: 192.90, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G70', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Membraan bij implantaat', maxTariff: 128.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'G80', category: 'IMPLANTOLOGIE_CHIR', descriptionNl: 'Sinusbodemlift (kaakchirurgisch)', maxTariff: 514.40, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── H: ORTHODONTIE ───────────────────────────────────────
  { code: 'H01', category: 'ORTHODONTIE', descriptionNl: 'Orthodontisch consult', maxTariff: 38.58, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H05', category: 'ORTHODONTIE', descriptionNl: 'Orthodontisch onderzoek met studiemodellen', maxTariff: 102.88, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H10', category: 'ORTHODONTIE', descriptionNl: 'Plaatsen vaste apparatuur boven of onder', maxTariff: 514.40, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H11', category: 'ORTHODONTIE', descriptionNl: 'Plaatsen vaste apparatuur boven en onder', maxTariff: 771.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H20', category: 'ORTHODONTIE', descriptionNl: 'Periodieke controle orthodontie', maxTariff: 38.58, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H25', category: 'ORTHODONTIE', descriptionNl: 'Plaatsen retentie-apparaat', maxTariff: 128.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H30', category: 'ORTHODONTIE', descriptionNl: 'Reparatie orthodontische apparatuur', maxTariff: 38.58, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H33', category: 'ORTHODONTIE', descriptionNl: 'Verwijderen vaste apparatuur en plaatsen retainer', maxTariff: 192.90, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H35', category: 'ORTHODONTIE', descriptionNl: 'Uitneembare orthodontische apparatuur', maxTariff: 343.04, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H50', category: 'ORTHODONTIE', descriptionNl: 'Verwijdering bracket', maxTariff: 25.72, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H55', category: 'ORTHODONTIE', descriptionNl: 'Orthodontische minischroef plaatsen', maxTariff: 192.90, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'H60', category: 'ORTHODONTIE', descriptionNl: 'Aligner behandeling per stap', maxTariff: 128.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── J: IMPLANTOLOGIE PROTHETISCH ─────────────────────────
  { code: 'J01', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Plaatsen healing abutment', maxTariff: 38.58, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J02', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Plaatsen/vervangen abutment (mesostructuur)', maxTariff: 128.60, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J03', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Individueel abutment (custom)', maxTariff: 192.90, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J10', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Kroon op implantaat metaal', maxTariff: 514.40, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J11', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Kroon op implantaat porselein', maxTariff: 617.28, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J12', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Kroon op implantaat volkeramisch', maxTariff: 685.87, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J20', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Tijdelijke kroon op implantaat', maxTariff: 128.60, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J30', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Brug op implantaten (per element)', maxTariff: 343.04, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J40', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Steg op implantaten', maxTariff: 514.40, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J50', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Drukknopconstructie op implantaten', maxTariff: 257.20, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J60', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Click-prothese op implantaten', maxTariff: 385.80, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J70', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Reparatie implantaatgedragen voorziening', maxTariff: 77.16, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J80', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Verlijmen/vervangen implantaatschroef', maxTariff: 38.58, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'J97', category: 'IMPLANTOLOGIE_PROT', descriptionNl: 'Noodreparatie implantaatwerk', maxTariff: 51.44, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── M: PREVENTIEVE MONDZORG ──────────────────────────────
  { code: 'M01', category: 'PREVENTIE', descriptionNl: 'Tandsteen verwijderen (per 5 min)', maxTariff: 18.00, unit: 'per_5min', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M02', category: 'PREVENTIE', descriptionNl: 'Mondhygiënistbehandeling (per 5 min)', maxTariff: 15.43, unit: 'per_5min', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M03', category: 'PREVENTIE', descriptionNl: 'Poetsinstructie en mondzorgadvies', maxTariff: 18.00, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M04', category: 'PREVENTIE', descriptionNl: 'Voedingsadvies mondgezondheid', maxTariff: 12.86, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M05', category: 'PREVENTIE', descriptionNl: 'Fluoride applicatie', maxTariff: 25.72, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M10', category: 'PREVENTIE', descriptionNl: 'Sealing (fissuursealant per element)', maxTariff: 38.58, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M15', category: 'PREVENTIE', descriptionNl: 'Preventief consult', maxTariff: 25.72, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M20', category: 'PREVENTIE', descriptionNl: 'Extra fluoride applicatie hoog risico', maxTariff: 18.00, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M30', category: 'PREVENTIE', descriptionNl: 'Dieptereiniging per sextant', maxTariff: 77.16, unit: 'per_sextant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M32', category: 'PREVENTIE', descriptionNl: 'Nazorg parodontale behandeling', maxTariff: 38.58, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M35', category: 'PREVENTIE', descriptionNl: 'Parodontale screening (DPSI)', maxTariff: 12.86, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M40', category: 'PREVENTIE', descriptionNl: 'Initieel parodontaal onderzoek (PA-status)', maxTariff: 51.44, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M41', category: 'PREVENTIE', descriptionNl: 'Parodontale evaluatie', maxTariff: 25.72, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M50', category: 'PREVENTIE', descriptionNl: 'Supra- en subgingivale reiniging', maxTariff: 38.58, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── P: UITNEEMBARE PROTHETIEK ────────────────────────────
  { code: 'P01', category: 'PROTHETIEK', descriptionNl: 'Volledige gebitsprothese bovenkaak', maxTariff: 514.40, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P02', category: 'PROTHETIEK', descriptionNl: 'Volledige gebitsprothese onderkaak', maxTariff: 514.40, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P03', category: 'PROTHETIEK', descriptionNl: 'Volledige gebitsprothese boven en onder', maxTariff: 900.20, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P06', category: 'PROTHETIEK', descriptionNl: 'Immediaatprothese bovenkaak', maxTariff: 571.84, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P07', category: 'PROTHETIEK', descriptionNl: 'Immediaatprothese onderkaak', maxTariff: 571.84, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P10', category: 'PROTHETIEK', descriptionNl: 'Partiële gebitsprothese kunsthars', maxTariff: 343.04, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P15', category: 'PROTHETIEK', descriptionNl: 'Partiële frameprothese', maxTariff: 685.87, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P16', category: 'PROTHETIEK', descriptionNl: 'Partiële frameprothese met attachments', maxTariff: 857.34, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P20', category: 'PROTHETIEK', descriptionNl: 'Overkappingsprothese', maxTariff: 685.87, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P25', category: 'PROTHETIEK', descriptionNl: 'Tijdelijke (interim) prothese', maxTariff: 257.20, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P30', category: 'PROTHETIEK', descriptionNl: 'Rebasen prothese indirect', maxTariff: 128.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P31', category: 'PROTHETIEK', descriptionNl: 'Rebasen prothese direct (soft-line)', maxTariff: 77.16, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P33', category: 'PROTHETIEK', descriptionNl: 'Opvullen prothese (tissue conditioner)', maxTariff: 51.44, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P35', category: 'PROTHETIEK', descriptionNl: 'Reparatie prothese zonder afdruk', maxTariff: 51.44, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P36', category: 'PROTHETIEK', descriptionNl: 'Reparatie prothese met afdruk', maxTariff: 77.16, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P37', category: 'PROTHETIEK', descriptionNl: 'Toevoegen element aan prothese', maxTariff: 64.30, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P38', category: 'PROTHETIEK', descriptionNl: 'Toevoegen klammer aan prothese', maxTariff: 51.44, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P40', category: 'PROTHETIEK', descriptionNl: 'Prothese duplicaat', maxTariff: 192.90, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P50', category: 'PROTHETIEK', descriptionNl: 'Occlusie-instelling prothese', maxTariff: 38.58, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P60', category: 'PROTHETIEK', descriptionNl: 'Nabehandeling prothese per zitting', maxTariff: 25.72, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'P70', category: 'PROTHETIEK', descriptionNl: 'Prothesecontrole', maxTariff: 18.00, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── R: KRONEN, BRUGGEN, INLAYS ──────────────────────────
  { code: 'R01', category: 'KROON', descriptionNl: 'Volledige kroon metaal', maxTariff: 360.08, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R02', category: 'KROON', descriptionNl: 'Volledige kroon metaal-keramiek', maxTariff: 514.40, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R03', category: 'KROON', descriptionNl: 'Volledige kroon volkeramisch', maxTariff: 571.84, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R04', category: 'KROON', descriptionNl: 'Jacket kroon (composiet/kunsthars)', maxTariff: 257.20, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R06', category: 'KROON', descriptionNl: 'Toeslag kroon op opbouw', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R08', category: 'KROON', descriptionNl: 'Facing / veneer (porseleinen facet)', maxTariff: 385.80, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R10', category: 'KROON', descriptionNl: 'Brug 3 elementen', maxTariff: 1028.80, unit: 'per_bridge', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R12', category: 'KROON', descriptionNl: 'Brug 4 elementen', maxTariff: 1286.00, unit: 'per_bridge', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R13', category: 'KROON', descriptionNl: 'Brug per extra element (5+)', maxTariff: 257.20, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R20', category: 'KROON', descriptionNl: 'Inlay 1 vlak', maxTariff: 192.90, unit: 'per_tooth', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R21', category: 'KROON', descriptionNl: 'Inlay 2 vlakken', maxTariff: 257.20, unit: 'per_tooth', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R22', category: 'KROON', descriptionNl: 'Inlay 3 of meer vlakken', maxTariff: 321.50, unit: 'per_tooth', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R24', category: 'KROON', descriptionNl: 'Onlay', maxTariff: 385.80, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R25', category: 'KROON', descriptionNl: 'Overlay', maxTariff: 428.36, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R30', category: 'KROON', descriptionNl: 'Stiftkroon', maxTariff: 385.80, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R31', category: 'KROON', descriptionNl: 'Stiftkroon composiet', maxTariff: 321.50, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R34', category: 'KROON', descriptionNl: 'Gegoten opbouw met stift', maxTariff: 128.60, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R35', category: 'KROON', descriptionNl: 'Parapulpaire stift (toeslag)', maxTariff: 25.72, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R40', category: 'KROON', descriptionNl: 'Verlijmen/recementation kroon of brug', maxTariff: 38.58, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R45', category: 'KROON', descriptionNl: 'Verwijdering kroon', maxTariff: 38.58, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R50', category: 'KROON', descriptionNl: 'Reparatie kroon in de mond', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R55', category: 'KROON', descriptionNl: 'Reparatie brug in de mond', maxTariff: 102.88, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R60', category: 'KROON', descriptionNl: 'Tijdelijke kroon prefab', maxTariff: 38.58, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R61', category: 'KROON', descriptionNl: 'Tijdelijke kroon chairside', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R70', category: 'KROON', descriptionNl: 'Proefopstelling brug (wax-up)', maxTariff: 51.44, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R75', category: 'KROON', descriptionNl: 'Kleurbepaling', maxTariff: 12.86, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R80', category: 'KROON', descriptionNl: 'Maryland brug (adhesief)', maxTariff: 514.40, unit: 'per_bridge', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R90', category: 'KROON', descriptionNl: 'Noodkroon / noodvoorziening', maxTariff: 64.30, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── T: KAAKCHIRURGIE ─────────────────────────────────────
  { code: 'T01', category: 'KAAKCHIRURGIE', descriptionNl: 'Operatieve extractie met mucoperiostlap', maxTariff: 128.60, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T02', category: 'KAAKCHIRURGIE', descriptionNl: 'Operatieve verwijdering geretineerd element', maxTariff: 192.90, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T03', category: 'KAAKCHIRURGIE', descriptionNl: 'Operatieve verwijdering retinentie complex', maxTariff: 257.20, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T10', category: 'KAAKCHIRURGIE', descriptionNl: 'Alveolotomie', maxTariff: 128.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T20', category: 'KAAKCHIRURGIE', descriptionNl: 'Cystectomie klein', maxTariff: 192.90, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T21', category: 'KAAKCHIRURGIE', descriptionNl: 'Cystectomie groot', maxTariff: 321.50, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T30', category: 'KAAKCHIRURGIE', descriptionNl: 'Biopsie weke delen', maxTariff: 77.16, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T31', category: 'KAAKCHIRURGIE', descriptionNl: 'Biopsie hard weefsel', maxTariff: 128.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T40', category: 'KAAKCHIRURGIE', descriptionNl: 'Frenulectomie (tongriemcorrectie)', maxTariff: 77.16, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T41', category: 'KAAKCHIRURGIE', descriptionNl: 'Frenulectomie lip', maxTariff: 77.16, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T50', category: 'KAAKCHIRURGIE', descriptionNl: 'Torus verwijdering', maxTariff: 192.90, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T55', category: 'KAAKCHIRURGIE', descriptionNl: 'Exostose verwijdering', maxTariff: 128.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T57', category: 'KAAKCHIRURGIE', descriptionNl: 'Alveoloplastiek', maxTariff: 128.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T60', category: 'KAAKCHIRURGIE', descriptionNl: 'Drainage abces', maxTariff: 51.44, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T70', category: 'KAAKCHIRURGIE', descriptionNl: 'Hechting weke delen', maxTariff: 38.58, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T71', category: 'KAAKCHIRURGIE', descriptionNl: 'Verwijdering hechtingen', maxTariff: 12.86, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T80', category: 'KAAKCHIRURGIE', descriptionNl: 'Repositie/fixatie kaakfractuur', maxTariff: 771.60, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T90', category: 'KAAKCHIRURGIE', descriptionNl: 'Wondhechting', maxTariff: 38.58, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'T91', category: 'KAAKCHIRURGIE', descriptionNl: 'Wondzorg en nacontrole', maxTariff: 18.00, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── V: VULLINGEN ─────────────────────────────────────────
  { code: 'V01', category: 'VULLING', descriptionNl: 'Amalgaam 1 vlak', maxTariff: 51.44, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V02', category: 'VULLING', descriptionNl: 'Amalgaam 2 vlakken', maxTariff: 71.15, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V03', category: 'VULLING', descriptionNl: 'Amalgaam 3 of meer vlakken', maxTariff: 89.00, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V10', category: 'VULLING', descriptionNl: 'Provisorische vulling (tijdelijk)', maxTariff: 25.72, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V12', category: 'VULLING', descriptionNl: 'Cariës-excavatie (stepwise)', maxTariff: 38.58, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V15', category: 'VULLING', descriptionNl: 'Indirecte overkapping (isolatie)', maxTariff: 18.00, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V21', category: 'VULLING', descriptionNl: 'Composiet 1 vlak', maxTariff: 64.30, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V22', category: 'VULLING', descriptionNl: 'Composiet 2 vlakken', maxTariff: 89.00, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V23', category: 'VULLING', descriptionNl: 'Composiet 3 vlakken', maxTariff: 110.60, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V24', category: 'VULLING', descriptionNl: 'Composiet 4 of meer vlakken', maxTariff: 128.60, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V30', category: 'VULLING', descriptionNl: 'Glasionomeer cement', maxTariff: 51.44, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V35', category: 'VULLING', descriptionNl: 'Compomeer vulling', maxTariff: 56.58, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V40', category: 'VULLING', descriptionNl: 'Stiftverankering (parapulpair)', maxTariff: 25.72, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V45', category: 'VULLING', descriptionNl: 'Wortelstift (gegoten)', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V50', category: 'VULLING', descriptionNl: 'Opbouw plastisch materiaal', maxTariff: 64.30, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V60', category: 'VULLING', descriptionNl: 'Facet composiet (direct veneer)', maxTariff: 128.60, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V70', category: 'VULLING', descriptionNl: 'Hoekopbouw composiet', maxTariff: 89.00, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V75', category: 'VULLING', descriptionNl: 'Kroonvervangende composiet restauratie', maxTariff: 128.60, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V80', category: 'VULLING', descriptionNl: 'Cusp replacement composiet', maxTariff: 102.88, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V85', category: 'VULLING', descriptionNl: 'Tandsplinting composiet/draad per element', maxTariff: 38.58, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── X: RONTGEN EN EXTRACTIE ──────────────────────────────
  { code: 'X01', category: 'RONTGEN', descriptionNl: 'Bitewing opname (1-2)', maxTariff: 20.58, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X02', category: 'RONTGEN', descriptionNl: 'Bitewing opname (3-4)', maxTariff: 30.87, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X03', category: 'RONTGEN', descriptionNl: 'Periapicale opname (solitair)', maxTariff: 20.58, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X04', category: 'RONTGEN', descriptionNl: 'Kleine serie röntgenopnamen (2-4)', maxTariff: 30.87, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X05', category: 'RONTGEN', descriptionNl: 'Cephalometrische opname', maxTariff: 38.58, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X10', category: 'RONTGEN', descriptionNl: 'Panoramische opname (OPT/OPG)', maxTariff: 46.29, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X21', category: 'RONTGEN', descriptionNl: 'CBCT klein volume', maxTariff: 102.88, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X22', category: 'RONTGEN', descriptionNl: 'CBCT groot volume', maxTariff: 154.32, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X25', category: 'RONTGEN', descriptionNl: 'Intra-orale foto', maxTariff: 12.86, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X30', category: 'EXTRACTIE', descriptionNl: 'Extractie eenvoudig', maxTariff: 51.44, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X31', category: 'EXTRACTIE', descriptionNl: 'Extractie moeilijk', maxTariff: 102.88, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X32', category: 'EXTRACTIE', descriptionNl: 'Extractie chirurgisch', maxTariff: 154.32, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X33', category: 'EXTRACTIE', descriptionNl: 'Extractie melkelement', maxTariff: 25.72, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X34', category: 'EXTRACTIE', descriptionNl: 'Hemisectie bij extractie', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },

  // ─── I: IMPLANTAAT (legacy codes for compatibility) ───────
  { code: 'I01', category: 'IMPLANTAAT', descriptionNl: 'Implantaat chirurgisch', maxTariff: 771.60, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'I10', category: 'IMPLANTAAT', descriptionNl: 'Implantaat kroon', maxTariff: 617.28, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
*/

async function main() {
  console.log('Cleaning existing data...\n');

  // Delete in FK-safe order
  await prisma.staffChatMessage.deleteMany();
  await prisma.staffChatMember.deleteMany();
  await prisma.staffChat.deleteMany();
  await prisma.noteFlag.deleteMany();
  await prisma.patientCategory.deleteMany();
  await prisma.message.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.anamnesis.deleteMany();
  await prisma.dsdDesignVersion.deleteMany();
  await prisma.dsdDesign.deleteMany();
  await prisma.patientImage.deleteMany();
  await prisma.periodontalChart.deleteMany();
  await prisma.document.deleteMany();
  await prisma.consentForm.deleteMany();
  await prisma.insuranceClaim.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.toothSurface.deleteMany();
  await prisma.tooth.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.conversationMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.aiChatMessage.deleteMany();
  await prisma.aiChatSession.deleteMany();
  await prisma.patientNudge.deleteMany();
  await prisma.dentistTask.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.whatsAppConversation.deleteMany();
  await prisma.emailMessage.deleteMany();
  await prisma.emailThread.deleteMany();
  await prisma.consentTemplate.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.scheduleException.deleteMany();
  await prisma.practitionerSchedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customCodeCategoryCode.deleteMany();
  await prisma.customCodeCategory.deleteMany();
  await prisma.nzaCode.deleteMany();
  await prisma.practice.deleteMany();

  console.log('Database cleaned.\n');
  console.log('Seeding database...\n');

  // ─── NZa Codes ───────────────────────────────────────────
  console.log('Seeding NZa codes...');
  for (const code of nzaCodes2026) {
    await prisma.nzaCode.upsert({
      where: { code_validFrom: { code: code.code, validFrom: code.validFrom } },
      update: {},
      create: {
        code: code.code,
        category: code.category,
        descriptionNl: code.descriptionNl,
        maxTariff: code.maxTariff,
        unit: code.unit,
        requiresTooth: code.requiresTooth || false,
        requiresSurface: code.requiresSurface || false,
        validFrom: code.validFrom,
        validUntil: code.validUntil,
        subcategory: code.subcategory || null,
        toelichting: code.toelichting || null,
        points: code.points || null,
      },
    });
  }
  console.log(`  ${nzaCodes2026.length} NZa codes seeded`);

  // Fetch NZa codes for linking
  const nzaMap: Record<string, string> = {};
  const allNza = await prisma.nzaCode.findMany();
  for (const n of allNza) nzaMap[n.code] = n.id;

  // ─── Practice ────────────────────────────────────────────
  console.log('Seeding practice...');
  const practice = await prisma.practice.upsert({
    where: { slug: 'tandarts-praktijk-amsterdam' },
    update: {},
    create: {
      name: 'Tandartspraktijk Amsterdam',
      slug: 'tandarts-praktijk-amsterdam',
      agbCode: '12345678',
      kvkNumber: '12345678',
      addressStreet: 'Kalverstraat 123',
      addressCity: 'Amsterdam',
      addressPostal: '1012 NX',
      phone: '+31 20 123 4567',
      email: 'info@tandarts-amsterdam.nl',
      billingConfig: { defaultPaymentTermDays: 30, vatRate: 0, currency: 'EUR' },
      settings: { locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
    },
  });

  // ─── Users ───────────────────────────────────────────────
  console.log('Seeding users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexiom.nl' },
    update: {},
    create: {
      practiceId: practice.id,
      email: 'admin@nexiom.nl',
      passwordHash: '$2b$10$/GvRCLaaIuXqDOCE/GT4MeNbpFPUnuwgnVR0xPUJRDwHKGcWlM.RG', // Welcome123
      firstName: 'Admin',
      lastName: 'User',
      role: 'PRACTICE_ADMIN',
    },
  });

  const dentist = await prisma.user.upsert({
    where: { email: 'faraz@tandarts-amsterdam.nl' },
    update: {},
    create: {
      practiceId: practice.id,
      email: 'faraz@tandarts-amsterdam.nl',
      passwordHash: '$2b$10$jIcpcKly7/A1LOBMKv2PeugLplUXGS/c9HSD.MlzRsAu0VZ.HNzju', // Sharifi1997
      firstName: 'Faraz',
      lastName: 'Sharifi',
      role: 'DENTIST',
      bigNumber: '12345678901',
      specialization: 'Algemene Tandheelkunde',
    },
  });

  const hygienist = await prisma.user.upsert({
    where: { email: 'lisa@tandarts-amsterdam.nl' },
    update: {},
    create: {
      practiceId: practice.id,
      email: 'lisa@tandarts-amsterdam.nl',
      passwordHash: '$2b$10$/GvRCLaaIuXqDOCE/GT4MeNbpFPUnuwgnVR0xPUJRDwHKGcWlM.RG',
      firstName: 'Lisa',
      lastName: 'de Vries',
      role: 'HYGIENIST',
      bigNumber: '98765432101',
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'sophie@tandarts-amsterdam.nl' },
    update: {},
    create: {
      practiceId: practice.id,
      email: 'sophie@tandarts-amsterdam.nl',
      passwordHash: '$2b$10$/GvRCLaaIuXqDOCE/GT4MeNbpFPUnuwgnVR0xPUJRDwHKGcWlM.RG',
      firstName: 'Sophie',
      lastName: 'Bakker',
      role: 'RECEPTIONIST',
    },
  });
  console.log('  4 users seeded');

  // ─── Patients ────────────────────────────────────────────
  console.log('Seeding patients...');
  const patientData = [
    { number: 'P-2026-0001', first: 'Peter', last: 'Jansen', dob: '1985-06-15', email: 'peter.jansen@email.nl', phone: '+31 6 12345678', bsn: '123456782', insurance: 'VGZ', insNumber: '123456789', gender: 'M', street: 'Herengracht 100', city: 'Amsterdam', postal: '1015 BS', alerts: ['Penicilline allergie'], meds: ['Ibuprofen'] },
    { number: 'P-2026-0002', first: 'Maria', last: 'van den Berg', dob: '1992-03-22', email: 'maria.vdberg@email.nl', phone: '+31 6 23456789', bsn: '234567891', insurance: 'Zilveren Kruis', insNumber: '234567890', gender: 'F', street: 'Keizersgracht 200', city: 'Amsterdam', postal: '1016 DW', alerts: [], meds: [] },
    { number: 'P-2026-0003', first: 'Jan', last: 'de Boer', dob: '1970-11-08', email: 'jan.deboer@email.nl', phone: '+31 6 34567890', bsn: '345678900', insurance: 'CZ', insNumber: '345678901', gender: 'M', street: 'Prinsengracht 300', city: 'Amsterdam', postal: '1017 GX', alerts: ['Diabetes type 2', 'Bloedverdunners'], meds: ['Metformine', 'Acenocoumarol'] },
    { number: 'P-2026-0004', first: 'Anna', last: 'Visser', dob: '2001-09-30', email: 'anna.visser@email.nl', phone: '+31 6 45678901', bsn: '456789012', insurance: 'Menzis', insNumber: '456789012', gender: 'F', street: 'Singel 400', city: 'Amsterdam', postal: '1018 AB', alerts: [], meds: [] },
    { number: 'P-2026-0005', first: 'Hendrik', last: 'Mulder', dob: '1958-01-17', email: 'h.mulder@email.nl', phone: '+31 6 56789012', bsn: '567890123', insurance: 'VGZ', insNumber: '567890123', gender: 'M', street: 'Damrak 50', city: 'Amsterdam', postal: '1012 LL', alerts: ['Hartaandoening'], meds: ['Atenolol', 'Aspirine'] },
    { number: 'P-2026-0006', first: 'Emma', last: 'Smit', dob: '1995-07-12', email: 'emma.smit@email.nl', phone: '+31 6 67890123', bsn: '678901234', insurance: 'Zilveren Kruis', insNumber: '678901234', gender: 'F', street: 'Rokin 60', city: 'Amsterdam', postal: '1012 KV', alerts: [], meds: [] },
    { number: 'P-2026-0007', first: 'Willem', last: 'Bakker', dob: '1983-12-05', email: 'w.bakker@email.nl', phone: '+31 6 78901234', bsn: '789012345', insurance: 'CZ', insNumber: '789012345', gender: 'M', street: 'Leidsestraat 70', city: 'Amsterdam', postal: '1017 PA', alerts: ['Latex allergie'], meds: [] },
    { number: 'P-2026-0008', first: 'Sara', last: 'Hendriks', dob: '1978-04-25', email: 'sara.hendriks@email.nl', phone: '+31 6 89012345', bsn: '890123456', insurance: 'Menzis', insNumber: '890123456', gender: 'F', street: 'Vijzelstraat 80', city: 'Amsterdam', postal: '1017 HM', alerts: [], meds: ['Amoxicilline (profylaxe)'] },
    { number: 'P-2026-0009', first: 'Thomas', last: 'Dekker', dob: '1965-08-19', email: 'thomas.dekker@email.nl', phone: '+31 6 90123456', bsn: '901234567', insurance: 'VGZ', insNumber: '901234567', gender: 'M', street: 'Muntplein 10', city: 'Amsterdam', postal: '1012 WR', alerts: ['Hoge bloeddruk'], meds: ['Lisinopril'] },
    { number: 'P-2026-0010', first: 'Fleur', last: 'Martens', dob: '2005-02-14', email: 'fleur.martens@email.nl', phone: '+31 6 01234567', bsn: '012345678', insurance: 'Zilveren Kruis', insNumber: '012345678', gender: 'F', street: 'Spuistraat 20', city: 'Amsterdam', postal: '1012 SP', alerts: [], meds: [] },
  ];

  const patients: Array<{ id: string; patientNumber: string }> = [];
  for (const p of patientData) {
    const patient = await prisma.patient.upsert({
      where: { practiceId_patientNumber: { practiceId: practice.id, patientNumber: p.number } },
      update: {},
      create: {
        practiceId: practice.id,
        patientNumber: p.number,
        firstName: p.first,
        lastName: p.last,
        dateOfBirth: new Date(p.dob),
        gender: p.gender,
        email: p.email,
        phone: p.phone,
        bsn: p.bsn,
        insuranceCompany: p.insurance,
        insuranceNumber: p.insNumber,
        addressStreet: p.street,
        addressCity: p.city,
        addressPostal: p.postal,
        medicalAlerts: p.alerts,
        medications: p.meds,
        gdprConsentAt: daysAgo(90),
      },
    });
    patients.push({ id: patient.id, patientNumber: patient.patientNumber });
  }
  // Additional patients for category demo data
  const extraPatientData = [
    { number: 'P-2026-0011', first: 'Kees', last: 'van Dijk', dob: '1990-05-20', email: 'kees.vandijk@email.nl', phone: '+31 6 11122233', bsn: '111222333', insurance: 'VGZ', insNumber: '111222333', gender: 'M', street: 'Bilderdijkstraat 10', city: 'Amsterdam', postal: '1053 KA', alerts: [], meds: [] },
    { number: 'P-2026-0012', first: 'Lotte', last: 'Bos', dob: '1988-09-14', email: 'lotte.bos@email.nl', phone: '+31 6 11122244', bsn: '111222344', insurance: 'CZ', insNumber: '111222344', gender: 'F', street: 'Overtoom 200', city: 'Amsterdam', postal: '1054 HP', alerts: [], meds: [] },
    { number: 'P-2026-0013', first: 'Pieter', last: 'Vermeer', dob: '1975-03-08', email: 'pieter.vermeer@email.nl', phone: '+31 6 11122255', bsn: '111222355', insurance: 'Menzis', insNumber: '111222355', gender: 'M', street: 'Nassaukade 100', city: 'Amsterdam', postal: '1052 DE', alerts: ['Astma'], meds: ['Salbutamol'] },
    { number: 'P-2026-0014', first: 'Noor', last: 'de Groot', dob: '1999-12-01', email: 'noor.degroot@email.nl', phone: '+31 6 11122266', bsn: '111222366', insurance: 'Zilveren Kruis', insNumber: '111222366', gender: 'F', street: 'Da Costakade 50', city: 'Amsterdam', postal: '1053 WH', alerts: [], meds: [] },
    { number: 'P-2026-0015', first: 'Daan', last: 'Vos', dob: '1982-07-25', email: 'daan.vos@email.nl', phone: '+31 6 11122277', bsn: '111222377', insurance: 'VGZ', insNumber: '111222377', gender: 'M', street: 'Jan Pieter Heijestraat 30', city: 'Amsterdam', postal: '1053 GA', alerts: [], meds: [] },
    { number: 'P-2026-0016', first: 'Iris', last: 'Meijer', dob: '1993-11-18', email: 'iris.meijer@email.nl', phone: '+31 6 11122288', bsn: '111222388', insurance: 'CZ', insNumber: '111222388', gender: 'F', street: 'Kinkerstraat 40', city: 'Amsterdam', postal: '1053 DT', alerts: [], meds: [] },
    { number: 'P-2026-0017', first: 'Ruben', last: 'Kramer', dob: '1960-02-28', email: 'ruben.kramer@email.nl', phone: '+31 6 11122299', bsn: '111222399', insurance: 'Menzis', insNumber: '111222399', gender: 'M', street: 'Eerste Constantijn Huygensstraat 5', city: 'Amsterdam', postal: '1054 BP', alerts: ['Pacemaker'], meds: ['Warfarine'] },
    { number: 'P-2026-0018', first: 'Eva', last: 'Jonker', dob: '2003-06-09', email: 'eva.jonker@email.nl', phone: '+31 6 11133311', bsn: '111333111', insurance: 'VGZ', insNumber: '111333111', gender: 'F', street: 'Vondelstraat 60', city: 'Amsterdam', postal: '1054 GE', alerts: [], meds: [] },
    { number: 'P-2026-0019', first: 'Bart', last: 'Willems', dob: '1971-10-03', email: 'bart.willems@email.nl', phone: '+31 6 11133322', bsn: '111333222', insurance: 'Zilveren Kruis', insNumber: '111333222', gender: 'M', street: 'Stadhouderskade 80', city: 'Amsterdam', postal: '1072 AC', alerts: ['Diabetes type 1'], meds: ['Insuline'] },
    { number: 'P-2026-0020', first: 'Sophie', last: 'van Leeuwen', dob: '1986-08-22', email: 'sophie.vleeuwen@email.nl', phone: '+31 6 11133333', bsn: '111333333', insurance: 'CZ', insNumber: '111333333', gender: 'F', street: 'Weteringschans 90', city: 'Amsterdam', postal: '1017 XS', alerts: [], meds: [] },
    { number: 'P-2026-0021', first: 'Jasper', last: 'Kok', dob: '1997-01-14', email: 'jasper.kok@email.nl', phone: '+31 6 11133344', bsn: '111333444', insurance: 'Menzis', insNumber: '111333444', gender: 'M', street: 'Ferdinand Bolstraat 100', city: 'Amsterdam', postal: '1072 LJ', alerts: [], meds: [] },
    { number: 'P-2026-0022', first: 'Femke', last: 'Dijkstra', dob: '1980-04-07', email: 'femke.dijkstra@email.nl', phone: '+31 6 11133355', bsn: '111333555', insurance: 'VGZ', insNumber: '111333555', gender: 'F', street: 'Albert Cuypstraat 110', city: 'Amsterdam', postal: '1073 BD', alerts: ['Bloedingsneigingen'], meds: [] },
    { number: 'P-2026-0023', first: 'Maarten', last: 'Peters', dob: '1955-09-30', email: 'maarten.peters@email.nl', phone: '+31 6 11133366', bsn: '111333666', insurance: 'Zilveren Kruis', insNumber: '111333666', gender: 'M', street: 'Van Woustraat 120', city: 'Amsterdam', postal: '1073 LT', alerts: ['Hypertensie'], meds: ['Amlodipine'] },
    { number: 'P-2026-0024', first: 'Anouk', last: 'Hoekstra', dob: '2000-07-16', email: 'anouk.hoekstra@email.nl', phone: '+31 6 11133377', bsn: '111333777', insurance: 'CZ', insNumber: '111333777', gender: 'F', street: 'Ceintuurbaan 130', city: 'Amsterdam', postal: '1074 CR', alerts: [], meds: [] },
    { number: 'P-2026-0025', first: 'Thijs', last: 'Brouwer', dob: '1968-12-11', email: 'thijs.brouwer@email.nl', phone: '+31 6 11133388', bsn: '111333888', insurance: 'Menzis', insNumber: '111333888', gender: 'M', street: 'Sarphatistraat 140', city: 'Amsterdam', postal: '1018 GK', alerts: [], meds: [] },
    { number: 'P-2026-0026', first: 'Lisa', last: 'Prins', dob: '1991-05-04', email: 'lisa.prins@email.nl', phone: '+31 6 11144411', bsn: '111444111', insurance: 'VGZ', insNumber: '111444111', gender: 'F', street: 'Plantage Middenlaan 20', city: 'Amsterdam', postal: '1018 DD', alerts: [], meds: [] },
    { number: 'P-2026-0027', first: 'Jeroen', last: 'van der Wal', dob: '1973-08-29', email: 'jeroen.vdwal@email.nl', phone: '+31 6 11144422', bsn: '111444222', insurance: 'Zilveren Kruis', insNumber: '111444222', gender: 'M', street: 'Weesperstraat 30', city: 'Amsterdam', postal: '1018 DN', alerts: [], meds: ['Omeprazol'] },
    { number: 'P-2026-0028', first: 'Charlotte', last: 'Scholten', dob: '1984-02-17', email: 'charlotte.scholten@email.nl', phone: '+31 6 11144433', bsn: '111444333', insurance: 'CZ', insNumber: '111444333', gender: 'F', street: 'Jodenbreestraat 40', city: 'Amsterdam', postal: '1011 NK', alerts: [], meds: [] },
    { number: 'P-2026-0029', first: 'Rick', last: 'Schouten', dob: '1996-06-12', email: 'rick.schouten@email.nl', phone: '+31 6 11144444', bsn: '111444444', insurance: 'Menzis', insNumber: '111444444', gender: 'M', street: 'Nieuwmarkt 50', city: 'Amsterdam', postal: '1012 CR', alerts: [], meds: [] },
    { number: 'P-2026-0030', first: 'Merel', last: 'de Wit', dob: '1977-11-23', email: 'merel.dewit@email.nl', phone: '+31 6 11144455', bsn: '111444555', insurance: 'VGZ', insNumber: '111444555', gender: 'F', street: 'Zeedijk 60', city: 'Amsterdam', postal: '1012 BA', alerts: [], meds: [] },
    { number: 'P-2026-0031', first: 'Bram', last: 'Huisman', dob: '1963-04-19', email: 'bram.huisman@email.nl', phone: '+31 6 11155511', bsn: '111555111', insurance: 'Zilveren Kruis', insNumber: '111555111', gender: 'M', street: 'Haarlemmerstraat 70', city: 'Amsterdam', postal: '1013 EL', alerts: ['Nierfalen'], meds: ['Dialyse'] },
    { number: 'P-2026-0032', first: 'Julia', last: 'Geerts', dob: '2002-01-06', email: 'julia.geerts@email.nl', phone: '+31 6 11155522', bsn: '111555222', insurance: 'CZ', insNumber: '111555222', gender: 'F', street: 'Brouwersgracht 80', city: 'Amsterdam', postal: '1013 GW', alerts: [], meds: [] },
    { number: 'P-2026-0033', first: 'Sander', last: 'van den Heuvel', dob: '1989-10-15', email: 'sander.vdheuvel@email.nl', phone: '+31 6 11155533', bsn: '111555333', insurance: 'Menzis', insNumber: '111555333', gender: 'M', street: 'Bloemgracht 90', city: 'Amsterdam', postal: '1016 KJ', alerts: [], meds: [] },
    { number: 'P-2026-0034', first: 'Nina', last: 'Smeets', dob: '1994-03-28', email: 'nina.smeets@email.nl', phone: '+31 6 11155544', bsn: '111555444', insurance: 'VGZ', insNumber: '111555444', gender: 'F', street: 'Egelantiersgracht 100', city: 'Amsterdam', postal: '1015 RL', alerts: [], meds: [] },
    { number: 'P-2026-0035', first: 'Tom', last: 'van Vliet', dob: '1952-07-08', email: 'tom.vanvliet@email.nl', phone: '+31 6 11155555', bsn: '111555555', insurance: 'Zilveren Kruis', insNumber: '111555555', gender: 'M', street: 'Lindengracht 110', city: 'Amsterdam', postal: '1015 KK', alerts: ['COPD'], meds: ['Tiotropium'] },
    { number: 'P-2026-0036', first: 'Sanne', last: 'Bosman', dob: '1987-12-20', email: 'sanne.bosman@email.nl', phone: '+31 6 11166611', bsn: '111666111', insurance: 'CZ', insNumber: '111666111', gender: 'F', street: 'Westerstraat 120', city: 'Amsterdam', postal: '1015 MN', alerts: [], meds: [] },
    { number: 'P-2026-0037', first: 'Lars', last: 'Kuijpers', dob: '1979-06-02', email: 'lars.kuijpers@email.nl', phone: '+31 6 11166622', bsn: '111666222', insurance: 'Menzis', insNumber: '111666222', gender: 'M', street: 'Haarlemmerdijk 130', city: 'Amsterdam', postal: '1013 KG', alerts: [], meds: [] },
    { number: 'P-2026-0038', first: 'Vera', last: 'Timmermans', dob: '2004-09-11', email: 'vera.timmermans@email.nl', phone: '+31 6 11166633', bsn: '111666333', insurance: 'VGZ', insNumber: '111666333', gender: 'F', street: 'Czaar Peterstraat 140', city: 'Amsterdam', postal: '1018 PL', alerts: [], meds: [] },
    { number: 'P-2026-0039', first: 'Jesse', last: 'Maas', dob: '1966-01-30', email: 'jesse.maas@email.nl', phone: '+31 6 11166644', bsn: '111666444', insurance: 'Zilveren Kruis', insNumber: '111666444', gender: 'M', street: 'Eerste van Swindenstraat 150', city: 'Amsterdam', postal: '1093 GA', alerts: [], meds: ['Metoprolol'] },
    { number: 'P-2026-0040', first: 'Mila', last: 'Hermans', dob: '1998-04-15', email: 'mila.hermans@email.nl', phone: '+31 6 11166655', bsn: '111666555', insurance: 'CZ', insNumber: '111666555', gender: 'F', street: 'Dapperstraat 160', city: 'Amsterdam', postal: '1093 BT', alerts: [], meds: [] },
    { number: 'P-2026-0041', first: 'Wouter', last: 'Peeters', dob: '1974-08-07', email: 'wouter.peeters@email.nl', phone: '+31 6 11177711', bsn: '111777111', insurance: 'Menzis', insNumber: '111777111', gender: 'M', street: 'Linnaeusstraat 170', city: 'Amsterdam', postal: '1093 EE', alerts: [], meds: [] },
    { number: 'P-2026-0042', first: 'Amber', last: 'Claessen', dob: '1981-11-26', email: 'amber.claessen@email.nl', phone: '+31 6 11177722', bsn: '111777222', insurance: 'VGZ', insNumber: '111777222', gender: 'F', street: 'Mauritskade 180', city: 'Amsterdam', postal: '1092 AD', alerts: ['Epilepsie'], meds: ['Valproaat'] },
    { number: 'P-2026-0043', first: 'Stijn', last: 'van der Berg', dob: '1957-05-13', email: 'stijn.vdberg@email.nl', phone: '+31 6 11177733', bsn: '111777333', insurance: 'Zilveren Kruis', insNumber: '111777333', gender: 'M', street: 'Oosterpark 190', city: 'Amsterdam', postal: '1092 AE', alerts: [], meds: [] },
    { number: 'P-2026-0044', first: 'Roos', last: 'de Jong', dob: '1995-02-09', email: 'roos.dejong@email.nl', phone: '+31 6 11177744', bsn: '111777444', insurance: 'CZ', insNumber: '111777444', gender: 'F', street: 'Wibautstraat 200', city: 'Amsterdam', postal: '1091 GP', alerts: [], meds: [] },
    { number: 'P-2026-0045', first: 'Hugo', last: 'Franssen', dob: '1969-09-24', email: 'hugo.franssen@email.nl', phone: '+31 6 11177755', bsn: '111777555', insurance: 'Menzis', insNumber: '111777555', gender: 'M', street: 'Roetersstraat 210', city: 'Amsterdam', postal: '1018 WB', alerts: [], meds: [] },
    { number: 'P-2026-0046', first: 'Fleur', last: 'van Beek', dob: '2001-06-18', email: 'fleur.vanbeek@email.nl', phone: '+31 6 11188811', bsn: '111888111', insurance: 'VGZ', insNumber: '111888111', gender: 'F', street: 'Valkenburgerstraat 220', city: 'Amsterdam', postal: '1011 MZ', alerts: [], meds: [] },
    { number: 'P-2026-0047', first: 'Tim', last: 'Hendriks', dob: '1983-03-05', email: 'tim.hendriks@email.nl', phone: '+31 6 11188822', bsn: '111888222', insurance: 'Zilveren Kruis', insNumber: '111888222', gender: 'M', street: 'Rapenburgerstraat 230', city: 'Amsterdam', postal: '1011 MJ', alerts: [], meds: [] },
    { number: 'P-2026-0048', first: 'Lieke', last: 'Wolters', dob: '1976-10-31', email: 'lieke.wolters@email.nl', phone: '+31 6 11188833', bsn: '111888333', insurance: 'CZ', insNumber: '111888333', gender: 'F', street: 'Kloveniersburgwal 240', city: 'Amsterdam', postal: '1012 CV', alerts: [], meds: [] },
    { number: 'P-2026-0049', first: 'Cas', last: 'Jansma', dob: '1992-08-14', email: 'cas.jansma@email.nl', phone: '+31 6 11188844', bsn: '111888444', insurance: 'Menzis', insNumber: '111888444', gender: 'M', street: 'Geldersekade 250', city: 'Amsterdam', postal: '1012 BH', alerts: [], meds: [] },
    { number: 'P-2026-0050', first: 'Ella', last: 'Driessen', dob: '1964-01-22', email: 'ella.driessen@email.nl', phone: '+31 6 11188855', bsn: '111888555', insurance: 'VGZ', insNumber: '111888555', gender: 'F', street: 'Oudezijds Voorburgwal 260', city: 'Amsterdam', postal: '1012 GL', alerts: ['Reuma'], meds: ['Methotrexaat'] },
  ];

  for (const p of extraPatientData) {
    const patient = await prisma.patient.upsert({
      where: { practiceId_patientNumber: { practiceId: practice.id, patientNumber: p.number } },
      update: {},
      create: {
        practiceId: practice.id,
        patientNumber: p.number,
        firstName: p.first,
        lastName: p.last,
        dateOfBirth: new Date(p.dob),
        gender: p.gender,
        email: p.email,
        phone: p.phone,
        bsn: p.bsn,
        insuranceCompany: p.insurance,
        insuranceNumber: p.insNumber,
        addressStreet: p.street,
        addressCity: p.city,
        addressPostal: p.postal,
        medicalAlerts: p.alerts,
        medications: p.meds,
        gdprConsentAt: daysAgo(90),
      },
    });
    patients.push({ id: patient.id, patientNumber: patient.patientNumber });
  }
  console.log(`  ${patients.length} patients seeded`);

  // ─── Teeth ───────────────────────────────────────────────
  console.log('Seeding teeth...');
  for (const p of patients) {
    await initializeTeeth(p.id, practice.id);
  }

  // Mark some teeth as non-PRESENT for realism
  const tooth18_p5 = await prisma.tooth.findUnique({
    where: { patientId_toothNumber: { patientId: patients[4].id, toothNumber: 18 } },
  });
  if (tooth18_p5) await prisma.tooth.update({ where: { id: tooth18_p5.id }, data: { status: 'MISSING', notes: 'Geextraheerd 2020' } });

  const tooth28_p5 = await prisma.tooth.findUnique({
    where: { patientId_toothNumber: { patientId: patients[4].id, toothNumber: 28 } },
  });
  if (tooth28_p5) await prisma.tooth.update({ where: { id: tooth28_p5.id }, data: { status: 'MISSING', notes: 'Geextraheerd 2020' } });

  const tooth36_p4 = await prisma.tooth.findUnique({
    where: { patientId_toothNumber: { patientId: patients[4].id, toothNumber: 36 } },
  });
  if (tooth36_p4) await prisma.tooth.update({ where: { id: tooth36_p4.id }, data: { status: 'CROWN', notes: 'Metaal-keramiek kroon 2023' } });

  const tooth46_p2 = await prisma.tooth.findUnique({
    where: { patientId_toothNumber: { patientId: patients[2].id, toothNumber: 46 } },
  });
  if (tooth46_p2) await prisma.tooth.update({ where: { id: tooth46_p2.id }, data: { status: 'IMPLANT', notes: 'Implantaat 2024' } });

  console.log('  Teeth initialized for all patients');

  // ─── Patient Categories ────────────────────────────────────
  console.log('Seeding patient categories...');
  // Categories: Actief, Inactief, Definitief Archief, Algemeen, Orthodontie, Restoratief, Multidisciplinair, Endodontologie, Parodontologie, Nazorg
  // Each patient index maps to: patients[0]=Peter, [1]=Maria, ..., [9]=Fleur, [10]=Kees, ..., [49]=Ella
  const categoryAssignments: { patientIdx: number; category: string }[] = [
    // Actief (patients 0-14 + extras)
    { patientIdx: 0, category: 'Actief' }, { patientIdx: 1, category: 'Actief' }, { patientIdx: 2, category: 'Actief' },
    { patientIdx: 3, category: 'Actief' }, { patientIdx: 4, category: 'Actief' }, { patientIdx: 5, category: 'Actief' },
    { patientIdx: 6, category: 'Actief' }, { patientIdx: 7, category: 'Actief' }, { patientIdx: 8, category: 'Actief' },
    { patientIdx: 9, category: 'Actief' }, { patientIdx: 10, category: 'Actief' }, { patientIdx: 11, category: 'Actief' },
    { patientIdx: 12, category: 'Actief' }, { patientIdx: 13, category: 'Actief' }, { patientIdx: 14, category: 'Actief' },
    { patientIdx: 20, category: 'Actief' }, { patientIdx: 21, category: 'Actief' }, { patientIdx: 25, category: 'Actief' },

    // Inactief
    { patientIdx: 15, category: 'Inactief' }, { patientIdx: 16, category: 'Inactief' }, { patientIdx: 17, category: 'Inactief' },
    { patientIdx: 18, category: 'Inactief' }, { patientIdx: 19, category: 'Inactief' }, { patientIdx: 30, category: 'Inactief' },
    { patientIdx: 31, category: 'Inactief' }, { patientIdx: 32, category: 'Inactief' }, { patientIdx: 33, category: 'Inactief' },
    { patientIdx: 34, category: 'Inactief' }, { patientIdx: 35, category: 'Inactief' }, { patientIdx: 36, category: 'Inactief' },
    { patientIdx: 37, category: 'Inactief' }, { patientIdx: 38, category: 'Inactief' }, { patientIdx: 39, category: 'Inactief' },

    // Definitief Archief
    { patientIdx: 22, category: 'Definitief Archief' }, { patientIdx: 23, category: 'Definitief Archief' },
    { patientIdx: 24, category: 'Definitief Archief' }, { patientIdx: 30, category: 'Definitief Archief' },
    { patientIdx: 31, category: 'Definitief Archief' }, { patientIdx: 32, category: 'Definitief Archief' },
    { patientIdx: 33, category: 'Definitief Archief' }, { patientIdx: 34, category: 'Definitief Archief' },
    { patientIdx: 35, category: 'Definitief Archief' }, { patientIdx: 36, category: 'Definitief Archief' },
    { patientIdx: 37, category: 'Definitief Archief' }, { patientIdx: 38, category: 'Definitief Archief' },
    { patientIdx: 39, category: 'Definitief Archief' }, { patientIdx: 40, category: 'Definitief Archief' },
    { patientIdx: 41, category: 'Definitief Archief' },

    // Algemeen
    { patientIdx: 0, category: 'Algemeen' }, { patientIdx: 1, category: 'Algemeen' }, { patientIdx: 3, category: 'Algemeen' },
    { patientIdx: 5, category: 'Algemeen' }, { patientIdx: 9, category: 'Algemeen' }, { patientIdx: 10, category: 'Algemeen' },
    { patientIdx: 11, category: 'Algemeen' }, { patientIdx: 13, category: 'Algemeen' }, { patientIdx: 14, category: 'Algemeen' },
    { patientIdx: 20, category: 'Algemeen' }, { patientIdx: 21, category: 'Algemeen' }, { patientIdx: 25, category: 'Algemeen' },
    { patientIdx: 26, category: 'Algemeen' }, { patientIdx: 27, category: 'Algemeen' }, { patientIdx: 28, category: 'Algemeen' },

    // Orthodontie
    { patientIdx: 3, category: 'Orthodontie' }, { patientIdx: 9, category: 'Orthodontie' }, { patientIdx: 13, category: 'Orthodontie' },
    { patientIdx: 17, category: 'Orthodontie' }, { patientIdx: 21, category: 'Orthodontie' }, { patientIdx: 23, category: 'Orthodontie' },
    { patientIdx: 28, category: 'Orthodontie' }, { patientIdx: 29, category: 'Orthodontie' }, { patientIdx: 32, category: 'Orthodontie' },
    { patientIdx: 35, category: 'Orthodontie' }, { patientIdx: 37, category: 'Orthodontie' }, { patientIdx: 40, category: 'Orthodontie' },
    { patientIdx: 43, category: 'Orthodontie' }, { patientIdx: 45, category: 'Orthodontie' }, { patientIdx: 47, category: 'Orthodontie' },

    // Restoratief
    { patientIdx: 0, category: 'Restoratief' }, { patientIdx: 2, category: 'Restoratief' }, { patientIdx: 4, category: 'Restoratief' },
    { patientIdx: 6, category: 'Restoratief' }, { patientIdx: 7, category: 'Restoratief' }, { patientIdx: 10, category: 'Restoratief' },
    { patientIdx: 12, category: 'Restoratief' }, { patientIdx: 15, category: 'Restoratief' }, { patientIdx: 19, category: 'Restoratief' },
    { patientIdx: 22, category: 'Restoratief' }, { patientIdx: 26, category: 'Restoratief' }, { patientIdx: 30, category: 'Restoratief' },
    { patientIdx: 34, category: 'Restoratief' }, { patientIdx: 41, category: 'Restoratief' }, { patientIdx: 46, category: 'Restoratief' },

    // Multidisciplinair
    { patientIdx: 2, category: 'Multidisciplinair' }, { patientIdx: 4, category: 'Multidisciplinair' },
    { patientIdx: 8, category: 'Multidisciplinair' }, { patientIdx: 12, category: 'Multidisciplinair' },
    { patientIdx: 16, category: 'Multidisciplinair' }, { patientIdx: 18, category: 'Multidisciplinair' },
    { patientIdx: 22, category: 'Multidisciplinair' }, { patientIdx: 24, category: 'Multidisciplinair' },
    { patientIdx: 27, category: 'Multidisciplinair' }, { patientIdx: 31, category: 'Multidisciplinair' },
    { patientIdx: 36, category: 'Multidisciplinair' }, { patientIdx: 39, category: 'Multidisciplinair' },
    { patientIdx: 42, category: 'Multidisciplinair' }, { patientIdx: 44, category: 'Multidisciplinair' },
    { patientIdx: 48, category: 'Multidisciplinair' },

    // Endodontologie
    { patientIdx: 0, category: 'Endodontologie' }, { patientIdx: 2, category: 'Endodontologie' },
    { patientIdx: 6, category: 'Endodontologie' }, { patientIdx: 8, category: 'Endodontologie' },
    { patientIdx: 11, category: 'Endodontologie' }, { patientIdx: 14, category: 'Endodontologie' },
    { patientIdx: 16, category: 'Endodontologie' }, { patientIdx: 19, category: 'Endodontologie' },
    { patientIdx: 24, category: 'Endodontologie' }, { patientIdx: 27, category: 'Endodontologie' },
    { patientIdx: 33, category: 'Endodontologie' }, { patientIdx: 38, category: 'Endodontologie' },
    { patientIdx: 41, category: 'Endodontologie' }, { patientIdx: 44, category: 'Endodontologie' },
    { patientIdx: 49, category: 'Endodontologie' },

    // Parodontologie
    { patientIdx: 2, category: 'Parodontologie' }, { patientIdx: 4, category: 'Parodontologie' },
    { patientIdx: 7, category: 'Parodontologie' }, { patientIdx: 8, category: 'Parodontologie' },
    { patientIdx: 12, category: 'Parodontologie' }, { patientIdx: 16, category: 'Parodontologie' },
    { patientIdx: 18, category: 'Parodontologie' }, { patientIdx: 22, category: 'Parodontologie' },
    { patientIdx: 25, category: 'Parodontologie' }, { patientIdx: 29, category: 'Parodontologie' },
    { patientIdx: 34, category: 'Parodontologie' }, { patientIdx: 39, category: 'Parodontologie' },
    { patientIdx: 42, category: 'Parodontologie' }, { patientIdx: 46, category: 'Parodontologie' },
    { patientIdx: 49, category: 'Parodontologie' },

    // Nazorg
    { patientIdx: 1, category: 'Nazorg' }, { patientIdx: 5, category: 'Nazorg' }, { patientIdx: 7, category: 'Nazorg' },
    { patientIdx: 10, category: 'Nazorg' }, { patientIdx: 13, category: 'Nazorg' }, { patientIdx: 15, category: 'Nazorg' },
    { patientIdx: 20, category: 'Nazorg' }, { patientIdx: 23, category: 'Nazorg' }, { patientIdx: 26, category: 'Nazorg' },
    { patientIdx: 29, category: 'Nazorg' }, { patientIdx: 33, category: 'Nazorg' }, { patientIdx: 36, category: 'Nazorg' },
    { patientIdx: 40, category: 'Nazorg' }, { patientIdx: 43, category: 'Nazorg' }, { patientIdx: 48, category: 'Nazorg' },
  ];

  for (const ca of categoryAssignments) {
    if (patients[ca.patientIdx]) {
      await prisma.patientCategory.create({
        data: {
          patientId: patients[ca.patientIdx].id,
          category: ca.category,
        },
      });
    }
  }
  console.log(`  ${categoryAssignments.length} category assignments seeded`);

  // ─── Tooth Surfaces (findings) ───────────────────────────
  console.log('Seeding tooth surfaces...');
  const surfaceFindings = [
    { patientIdx: 0, toothNum: 16, surface: 'O', condition: 'FILLING' as const, material: 'COMPOSITE' },
    { patientIdx: 0, toothNum: 26, surface: 'MO', condition: 'FILLING' as const, material: 'COMPOSITE' },
    { patientIdx: 0, toothNum: 36, surface: 'O', condition: 'CARIES' as const, material: null },
    { patientIdx: 1, toothNum: 14, surface: 'D', condition: 'CARIES' as const, material: null },
    { patientIdx: 2, toothNum: 16, surface: 'MOD', condition: 'FILLING' as const, material: 'AMALGAM' },
    { patientIdx: 2, toothNum: 26, surface: 'OB', condition: 'FILLING' as const, material: 'COMPOSITE' },
    { patientIdx: 2, toothNum: 37, surface: 'O', condition: 'DECAY' as const, material: null },
    { patientIdx: 4, toothNum: 16, surface: 'MOD', condition: 'FILLING' as const, material: 'AMALGAM' },
    { patientIdx: 4, toothNum: 26, surface: 'DO', condition: 'FILLING' as const, material: 'COMPOSITE' },
    { patientIdx: 4, toothNum: 47, surface: 'O', condition: 'CARIES' as const, material: null },
    { patientIdx: 6, toothNum: 36, surface: 'M', condition: 'FRACTURE' as const, material: null },
    { patientIdx: 7, toothNum: 15, surface: 'OB', condition: 'FILLING' as const, material: 'CERAMIC' },
  ];

  for (const sf of surfaceFindings) {
    const tooth = await prisma.tooth.findUnique({
      where: { patientId_toothNumber: { patientId: patients[sf.patientIdx].id, toothNumber: sf.toothNum } },
    });
    if (tooth) {
      await prisma.toothSurface.create({
        data: {
          practiceId: practice.id,
          toothId: tooth.id,
          surface: sf.surface,
          condition: sf.condition,
          material: sf.material,
          recordedBy: dentist.id,
        },
      });
    }
  }
  console.log(`  ${surfaceFindings.length} surface findings seeded`);

  // ─── Practitioner Schedules ──────────────────────────────
  console.log('Seeding schedules...');
  // Dentist: Mon-Fri 08:30-17:00
  for (let day = 0; day <= 4; day++) {
    await prisma.practitionerSchedule.create({
      data: {
        practiceId: practice.id,
        practitionerId: dentist.id,
        dayOfWeek: day,
        startTime: '08:30',
        endTime: '17:00',
        slotDuration: 30,
      },
    });
  }
  // Hygienist: Mon, Wed, Fri 09:00-16:00
  for (const day of [0, 2, 4]) {
    await prisma.practitionerSchedule.create({
      data: {
        practiceId: practice.id,
        practitionerId: hygienist.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '16:00',
        slotDuration: 30,
      },
    });
  }
  console.log('  Schedules seeded');

  // ─── Schedule Exceptions ─────────────────────────────────
  await prisma.scheduleException.createMany({
    data: [
      { practiceId: practice.id, practitionerId: dentist.id, exceptionDate: daysFromNow(14), exceptionType: 'TRAINING', reason: 'Congres KNMT Utrecht' },
      { practiceId: practice.id, practitionerId: dentist.id, exceptionDate: daysFromNow(30), exceptionType: 'HOLIDAY', reason: 'Voorjaarsvakantie' },
      { practiceId: practice.id, practitionerId: dentist.id, exceptionDate: daysFromNow(31), exceptionType: 'HOLIDAY', reason: 'Voorjaarsvakantie' },
      { practiceId: practice.id, practitionerId: hygienist.id, exceptionDate: daysFromNow(7), exceptionType: 'SICK', reason: 'Ziekmelding' },
    ],
  });
  console.log('  Schedule exceptions seeded');

  // ─── Appointments ────────────────────────────────────────
  console.log('Seeding appointments...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // TODAY's appointments (for dashboard visibility)
  const todayAppointments = [
    { patientIdx: 0, type: 'CHECKUP' as const, status: 'COMPLETED' as const, hour: 8, min: 30, dur: 30, pract: dentist.id, room: 'Kamer 1', notes: 'Halfjaarlijkse controle' },
    { patientIdx: 1, type: 'TREATMENT' as const, status: 'COMPLETED' as const, hour: 9, min: 0, dur: 45, pract: dentist.id, room: 'Kamer 1', notes: 'Vulling element 14' },
    { patientIdx: 3, type: 'HYGIENE' as const, status: 'COMPLETED' as const, hour: 9, min: 30, dur: 30, pract: hygienist.id, room: 'Kamer 2' },
    { patientIdx: 2, type: 'TREATMENT' as const, status: 'IN_PROGRESS' as const, hour: 10, min: 30, dur: 60, pract: dentist.id, room: 'Kamer 1', notes: 'Kroon element 37' },
    { patientIdx: 5, type: 'CHECKUP' as const, status: 'CHECKED_IN' as const, hour: 11, min: 30, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 7, type: 'HYGIENE' as const, status: 'CONFIRMED' as const, hour: 13, min: 0, dur: 30, pract: hygienist.id, room: 'Kamer 2' },
    { patientIdx: 4, type: 'CONSULTATION' as const, status: 'CONFIRMED' as const, hour: 14, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1', notes: 'Bespreking implantaatkroon' },
    { patientIdx: 8, type: 'CHECKUP' as const, status: 'SCHEDULED' as const, hour: 15, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 6, type: 'EMERGENCY' as const, status: 'SCHEDULED' as const, hour: 16, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1', notes: 'Spoedgeval: pijnklachten' },
  ];

  // Past appointments (completed)
  const pastAppointments = [
    { patientIdx: 0, type: 'CHECKUP' as const, status: 'COMPLETED' as const, daysAgo: 60, hour: 9, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 1, type: 'CHECKUP' as const, status: 'COMPLETED' as const, daysAgo: 55, hour: 10, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 2, type: 'TREATMENT' as const, status: 'COMPLETED' as const, daysAgo: 45, hour: 11, min: 0, dur: 60, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 3, type: 'HYGIENE' as const, status: 'COMPLETED' as const, daysAgo: 40, hour: 9, min: 0, dur: 30, pract: hygienist.id, room: 'Kamer 2' },
    { patientIdx: 4, type: 'CONSULTATION' as const, status: 'COMPLETED' as const, daysAgo: 35, hour: 14, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 5, type: 'CHECKUP' as const, status: 'COMPLETED' as const, daysAgo: 30, hour: 9, min: 30, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 6, type: 'EMERGENCY' as const, status: 'COMPLETED' as const, daysAgo: 25, hour: 16, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 0, type: 'TREATMENT' as const, status: 'COMPLETED' as const, daysAgo: 20, hour: 10, min: 30, dur: 45, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 7, type: 'HYGIENE' as const, status: 'COMPLETED' as const, daysAgo: 15, hour: 10, min: 0, dur: 30, pract: hygienist.id, room: 'Kamer 2' },
    { patientIdx: 8, type: 'CHECKUP' as const, status: 'COMPLETED' as const, daysAgo: 10, hour: 11, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 2, type: 'TREATMENT' as const, status: 'COMPLETED' as const, daysAgo: 7, hour: 9, min: 0, dur: 60, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 9, type: 'CHECKUP' as const, status: 'NO_SHOW' as const, daysAgo: 5, hour: 14, min: 30, dur: 30, pract: dentist.id, room: 'Kamer 1' },
  ];

  // Future appointments
  const futureAppointments = [
    { patientIdx: 1, type: 'TREATMENT' as const, status: 'CONFIRMED' as const, daysAhead: 1, hour: 9, min: 0, dur: 45, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 3, type: 'CHECKUP' as const, status: 'SCHEDULED' as const, daysAhead: 2, hour: 10, min: 30, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 5, type: 'HYGIENE' as const, status: 'CONFIRMED' as const, daysAhead: 3, hour: 9, min: 0, dur: 30, pract: hygienist.id, room: 'Kamer 2' },
    { patientIdx: 0, type: 'CHECKUP' as const, status: 'SCHEDULED' as const, daysAhead: 5, hour: 11, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 4, type: 'TREATMENT' as const, status: 'SCHEDULED' as const, daysAhead: 7, hour: 14, min: 0, dur: 60, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 9, type: 'CHECKUP' as const, status: 'SCHEDULED' as const, daysAhead: 10, hour: 9, min: 30, dur: 30, pract: dentist.id, room: 'Kamer 1', notes: 'Eerder niet verschenen, opnieuw ingepland' },
    { patientIdx: 7, type: 'TREATMENT' as const, status: 'SCHEDULED' as const, daysAhead: 12, hour: 10, min: 0, dur: 45, pract: dentist.id, room: 'Kamer 1' },
    { patientIdx: 6, type: 'CONSULTATION' as const, status: 'SCHEDULED' as const, daysAhead: 15, hour: 15, min: 0, dur: 30, pract: dentist.id, room: 'Kamer 1' },
  ];

  const appointmentRecords: Array<{ id: string; patientIdx: number; isPast: boolean }> = [];

  // Create today's appointments
  for (const a of todayAppointments) {
    const start = atTime(today, a.hour, a.min);
    const end = new Date(start.getTime() + a.dur * 60_000);
    const rec = await prisma.appointment.create({
      data: {
        practiceId: practice.id,
        patientId: patients[a.patientIdx].id,
        practitionerId: a.pract,
        startTime: start,
        endTime: end,
        durationMinutes: a.dur,
        appointmentType: a.type,
        status: a.status,
        room: a.room,
        notes: a.notes,
      },
    });
    appointmentRecords.push({ id: rec.id, patientIdx: a.patientIdx, isPast: false });
  }
  console.log(`  ${todayAppointments.length} today's appointments seeded`);

  for (const a of pastAppointments) {
    const baseDate = daysAgo(a.daysAgo);
    const start = atTime(baseDate, a.hour, a.min);
    const end = new Date(start.getTime() + a.dur * 60_000);
    const rec = await prisma.appointment.create({
      data: {
        practiceId: practice.id,
        patientId: patients[a.patientIdx].id,
        practitionerId: a.pract,
        startTime: start,
        endTime: end,
        durationMinutes: a.dur,
        appointmentType: a.type,
        status: a.status,
        room: a.room,
      },
    });
    appointmentRecords.push({ id: rec.id, patientIdx: a.patientIdx, isPast: true });
  }

  for (const a of futureAppointments) {
    const baseDate = daysFromNow(a.daysAhead);
    const start = atTime(baseDate, a.hour, a.min);
    const end = new Date(start.getTime() + a.dur * 60_000);
    const rec = await prisma.appointment.create({
      data: {
        practiceId: practice.id,
        patientId: patients[a.patientIdx].id,
        practitionerId: a.pract,
        startTime: start,
        endTime: end,
        durationMinutes: a.dur,
        appointmentType: a.type,
        status: a.status,
        room: a.room,
        notes: a.notes,
      },
    });
    appointmentRecords.push({ id: rec.id, patientIdx: a.patientIdx, isPast: false });
  }
  console.log(`  ${appointmentRecords.length} appointments seeded`);

  // ─── Treatment Plans ─────────────────────────────────────
  console.log('Seeding treatment plans...');

  // Plan 1: Peter Jansen - filling (completed)
  const plan1 = await prisma.treatmentPlan.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      createdBy: dentist.id,
      title: 'Vulling element 36',
      description: 'Composiet vulling occlusaal op element 36 vanwege caries',
      status: 'COMPLETED',
      proposedAt: daysAgo(60),
      acceptedAt: daysAgo(58),
      totalEstimate: 64.30,
      insuranceEstimate: 51.44,
      patientEstimate: 12.86,
    },
  });

  // Plan 2: Jan de Boer - root canal + crown (in progress)
  const plan2 = await prisma.treatmentPlan.create({
    data: {
      practiceId: practice.id,
      patientId: patients[2].id,
      createdBy: dentist.id,
      title: 'Wortelkanaalbehandeling en kroon element 37',
      description: 'Endo 37 gevolgd door metaal-keramiek kroon vanwege uitgebreide caries',
      status: 'IN_PROGRESS',
      proposedAt: daysAgo(45),
      acceptedAt: daysAgo(43),
      totalEstimate: 707.30,
      insuranceEstimate: 565.84,
      patientEstimate: 141.46,
    },
  });

  // Plan 3: Hendrik Mulder - implant crown (proposed)
  const plan3 = await prisma.treatmentPlan.create({
    data: {
      practiceId: practice.id,
      patientId: patients[4].id,
      createdBy: dentist.id,
      title: 'Kroon op implantaat element 47',
      description: 'Implantaatkroon op bestaand implantaat element 47',
      status: 'PROPOSED',
      proposedAt: daysAgo(35),
      totalEstimate: 617.28,
      insuranceEstimate: 493.82,
      patientEstimate: 123.46,
    },
  });

  // Plan 4: Maria - filling (accepted, scheduled)
  const plan4 = await prisma.treatmentPlan.create({
    data: {
      practiceId: practice.id,
      patientId: patients[1].id,
      createdBy: dentist.id,
      title: 'Vulling element 14',
      description: 'Composiet vulling distaal element 14',
      status: 'ACCEPTED',
      proposedAt: daysAgo(55),
      acceptedAt: daysAgo(53),
      totalEstimate: 64.30,
      insuranceEstimate: 51.44,
      patientEstimate: 12.86,
    },
  });

  // Plan 5: Peter Jansen - implant + kroon element 46 (in progress, multi-step)
  const plan5 = await prisma.treatmentPlan.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      createdBy: dentist.id,
      title: 'Implantaat en kroon element 46',
      description: 'Extractie wortelrest 46, botopbouw, implantaat plaatsing en definitieve kroon',
      status: 'IN_PROGRESS',
      proposedAt: daysAgo(90),
      acceptedAt: daysAgo(88),
      totalEstimate: 2450.00,
      insuranceEstimate: 1225.00,
      patientEstimate: 1225.00,
    },
  });

  // Plan 6: Peter Jansen - proposed kostenraming for whitening
  const plan6 = await prisma.treatmentPlan.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      createdBy: dentist.id,
      title: 'Tanden bleken bovenkaak',
      description: 'In-office bleaching bovenfront met thuisbleken nabehandeling',
      status: 'PROPOSED',
      proposedAt: daysAgo(5),
      totalEstimate: 350.00,
      insuranceEstimate: 0,
      patientEstimate: 350.00,
    },
  });

  console.log('  6 treatment plans seeded');

  // ─── Treatments ──────────────────────────────────────────
  console.log('Seeding treatments...');
  const tooth36_p0 = await prisma.tooth.findUnique({
    where: { patientId_toothNumber: { patientId: patients[0].id, toothNumber: 36 } },
  });
  const tooth37_p2 = await prisma.tooth.findUnique({
    where: { patientId_toothNumber: { patientId: patients[2].id, toothNumber: 37 } },
  });
  const tooth14_p1 = await prisma.tooth.findUnique({
    where: { patientId_toothNumber: { patientId: patients[1].id, toothNumber: 14 } },
  });

  // Completed filling for Peter
  const treatment1 = await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      treatmentPlanId: plan1.id,
      appointmentId: appointmentRecords[16].id, // past: Peter TREATMENT daysAgo(20)
      performedBy: dentist.id,
      toothId: tooth36_p0?.id,
      nzaCodeId: nzaMap['V21'],
      description: 'Composiet vulling 1 vlak element 36',
      status: 'COMPLETED',
      performedAt: daysAgo(20),
      durationMinutes: 30,
      unitPrice: 64.30,
      totalPrice: 64.30,
    },
  });

  // Root canal for Jan (completed)
  const treatment2 = await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[2].id,
      treatmentPlanId: plan2.id,
      appointmentId: appointmentRecords[11].id, // past: Jan TREATMENT daysAgo(45)
      performedBy: dentist.id,
      toothId: tooth37_p2?.id,
      nzaCodeId: nzaMap['E03'],
      description: 'Wortelkanaalbehandeling 2 kanalen element 37',
      status: 'COMPLETED',
      performedAt: daysAgo(45),
      durationMinutes: 60,
      unitPrice: 192.90,
      totalPrice: 192.90,
    },
  });

  // Crown for Jan (planned, next step)
  const treatment3 = await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[2].id,
      treatmentPlanId: plan2.id,
      performedBy: dentist.id,
      toothId: tooth37_p2?.id,
      nzaCodeId: nzaMap['R02'],
      description: 'Metaal-keramiek kroon element 37',
      status: 'PLANNED',
      unitPrice: 514.40,
      totalPrice: 514.40,
    },
  });

  // Filling for Maria (planned)
  const treatment4 = await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[1].id,
      treatmentPlanId: plan4.id,
      appointmentId: appointmentRecords[21].id, // future: Maria TREATMENT daysAhead(1)
      performedBy: dentist.id,
      toothId: tooth14_p1?.id,
      nzaCodeId: nzaMap['V21'],
      description: 'Composiet vulling 1 vlak element 14',
      status: 'PLANNED',
      unitPrice: 64.30,
      totalPrice: 64.30,
    },
  });

  // Anesthesia for Jan's root canal
  await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[2].id,
      treatmentPlanId: plan2.id,
      appointmentId: appointmentRecords[11].id, // past: Jan TREATMENT daysAgo(45)
      performedBy: dentist.id,
      nzaCodeId: nzaMap['A01'],
      description: 'Lokale verdoving',
      status: 'COMPLETED',
      performedAt: daysAgo(45),
      durationMinutes: 5,
      unitPrice: 15.43,
      totalPrice: 15.43,
    },
  });

  // Peter's implant plan (plan5) treatments - multi-step journey
  const tooth46_p0 = await prisma.tooth.findUnique({
    where: { patientId_toothNumber: { patientId: patients[0].id, toothNumber: 46 } },
  });

  // Step 1: Extraction (completed)
  await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      treatmentPlanId: plan5.id,
      performedBy: dentist.id,
      toothId: tooth46_p0?.id,
      description: 'Extractie wortelrest element 46',
      status: 'COMPLETED',
      performedAt: daysAgo(80),
      durationMinutes: 30,
      unitPrice: 95.00,
      totalPrice: 95.00,
    },
  });

  // Step 2: Botopbouw (completed)
  await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      treatmentPlanId: plan5.id,
      performedBy: dentist.id,
      toothId: tooth46_p0?.id,
      description: 'Botopbouw (augmentatie) regio 46',
      status: 'COMPLETED',
      performedAt: daysAgo(75),
      durationMinutes: 45,
      unitPrice: 450.00,
      totalPrice: 450.00,
    },
  });

  // Step 3: Implantaat plaatsing (completed)
  await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      treatmentPlanId: plan5.id,
      performedBy: dentist.id,
      toothId: tooth46_p0?.id,
      description: 'Implantaat plaatsing element 46',
      status: 'COMPLETED',
      performedAt: daysAgo(50),
      durationMinutes: 60,
      unitPrice: 1200.00,
      totalPrice: 1200.00,
    },
  });

  // Step 4: Healing abutment (completed)
  await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      treatmentPlanId: plan5.id,
      performedBy: dentist.id,
      toothId: tooth46_p0?.id,
      description: 'Plaatsing healing abutment element 46',
      status: 'COMPLETED',
      performedAt: daysAgo(20),
      durationMinutes: 20,
      unitPrice: 150.00,
      totalPrice: 150.00,
    },
  });

  // Step 5: Afdruk / scan (planned - next step)
  await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      treatmentPlanId: plan5.id,
      performedBy: dentist.id,
      toothId: tooth46_p0?.id,
      description: 'Digitale afdruk voor kroon op implantaat 46',
      status: 'PLANNED',
      unitPrice: 105.00,
      totalPrice: 105.00,
    },
  });

  // Step 6: Definitieve kroon plaatsing (planned)
  await prisma.treatment.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      treatmentPlanId: plan5.id,
      performedBy: dentist.id,
      toothId: tooth46_p0?.id,
      nzaCodeId: nzaMap['R02'],
      description: 'Kroon op implantaat element 46 (zirconia)',
      status: 'PLANNED',
      unitPrice: 450.00,
      totalPrice: 450.00,
    },
  });

  console.log('  11 treatments seeded');

  // ─── Clinical Notes ──────────────────────────────────────
  console.log('Seeding clinical notes...');
  // Appointment index mapping (today 0-8, past 9-20, future 21-28):
  // 0:Peter today CHECKUP, 9:Peter past CHECKUP(60d), 10:Maria past CHECKUP(55d),
  // 11:Jan past TREATMENT(45d), 12:Anna past HYGIENE(40d), 13:Hendrik past CONSULT(35d),
  // 14:Emma past CHECKUP(30d), 15:Willem past EMERGENCY(25d), 16:Peter past TREATMENT(20d),
  // 17:Sara past HYGIENE(15d), 18:Thomas past CHECKUP(10d), 19:Jan past TREATMENT(7d),
  // 20:Fleur past NO_SHOW(5d), 21:Maria future TREATMENT(+1d)
  const clinicalNotes = [
    { patientIdx: 0, apptIdx: 9, type: 'SOAP' as const, content: 'S: Patient klaagt over gevoeligheid element 36 bij koud\nO: Caries occlusaal element 36, vitaal, percussie -\nA: Caries D2 element 36\nP: Composiet vulling plannen' },
    { patientIdx: 0, apptIdx: 16, type: 'PROGRESS' as const, content: 'Composiet vulling element 36 occlusaal geplaatst. Rubberdam gebruikt. Occlusie gecontroleerd en aangepast. Patient verdraagt het goed.' },
    { patientIdx: 1, apptIdx: 10, type: 'SOAP' as const, content: 'S: Geen klachten, routine controle\nO: Caries distaal element 14, verder gebit in goede conditie\nA: Caries D1-D2 element 14\nP: Vulling plannen, mondhygiene instructie gegeven' },
    { patientIdx: 2, apptIdx: 11, type: 'PROGRESS' as const, content: 'Wortelkanaalbehandeling element 37 uitgevoerd. 2 kanalen gevonden en behandeld. Calciumhydroxide als tussentijdse medicatie. Vervolgafspraak over 2 weken.' },
    { patientIdx: 2, apptIdx: 19, type: 'PROGRESS' as const, content: 'Wortelkanaalvulling element 37 geplaatst. Goede afsluiting op rontgenfoto. Kroon besproken met patient, akkoord.' },
    { patientIdx: 4, apptIdx: 13, type: 'SOAP' as const, content: 'S: Wil graag kroon op implantaat positie 47\nO: Implantaat 47 goed geintegreerd, voldoende botaanbod\nA: Geschikt voor implantaatkroon\nP: Behandelplan opgesteld, offerte meegegeven' },
    { patientIdx: 6, apptIdx: 15, type: 'PROGRESS' as const, content: 'Spoedbezoek: patient is gevallen, fractuur mesiale rand element 36. Scherpe rand afgeslepen, composiet opbouw uitgevoerd. Verdere behandeling nodig.' },
    { patientIdx: 8, apptIdx: 18, type: 'SOAP' as const, content: 'S: Geen klachten\nO: Gebit in goede staat, lichte tandsteenopbouw buccaal ondertanden\nA: Goede mondhygiene, minimale tandsteen\nP: Volgende controle over 6 maanden, verwijzing mondhygienist' },
  ];

  for (const note of clinicalNotes) {
    await prisma.clinicalNote.create({
      data: {
        practiceId: practice.id,
        patientId: patients[note.patientIdx].id,
        appointmentId: appointmentRecords[note.apptIdx].id,
        authorId: dentist.id,
        noteType: note.type,
        content: note.content,
      },
    });
  }
  console.log(`  ${clinicalNotes.length} clinical notes seeded`);

  // ─── Invoices ────────────────────────────────────────────
  console.log('Seeding invoices...');

  // Invoice 1: Peter's filling (paid)
  const invoice1 = await prisma.invoice.create({
    data: {
      practiceId: practice.id,
      patientId: patients[0].id,
      invoiceNumber: 'INV-2026-0001',
      invoiceDate: daysAgo(20),
      dueDate: daysAgo(-10),
      subtotal: 64.30,
      taxAmount: 0,
      total: 64.30,
      insuranceAmount: 51.44,
      patientAmount: 12.86,
      paidAmount: 64.30,
      status: 'PAID',
    },
  });

  // Invoice 2: Jan's root canal (partially paid - insurance paid)
  const invoice2 = await prisma.invoice.create({
    data: {
      practiceId: practice.id,
      patientId: patients[2].id,
      invoiceNumber: 'INV-2026-0002',
      invoiceDate: daysAgo(7),
      dueDate: daysFromNow(23),
      subtotal: 208.33,
      taxAmount: 0,
      total: 208.33,
      insuranceAmount: 166.66,
      patientAmount: 41.67,
      paidAmount: 166.66,
      status: 'PARTIALLY_PAID',
      claimStatus: 'ACCEPTED',
      claimReference: 'VZ-2026-00456',
    },
  });

  // Invoice 3: Emma's checkup (sent, unpaid)
  const invoice3 = await prisma.invoice.create({
    data: {
      practiceId: practice.id,
      patientId: patients[5].id,
      invoiceNumber: 'INV-2026-0003',
      invoiceDate: daysAgo(30),
      dueDate: daysAgo(0),
      subtotal: 25.72,
      taxAmount: 0,
      total: 25.72,
      insuranceAmount: 20.58,
      patientAmount: 5.14,
      paidAmount: 0,
      status: 'SENT',
    },
  });

  // Invoice 4: Hygiene appointment for Anna (draft)
  const invoice4 = await prisma.invoice.create({
    data: {
      practiceId: practice.id,
      patientId: patients[3].id,
      invoiceNumber: 'INV-2026-0004',
      invoiceDate: daysAgo(40),
      dueDate: daysAgo(10),
      subtotal: 40.86,
      taxAmount: 0,
      total: 40.86,
      insuranceAmount: 32.69,
      patientAmount: 8.17,
      paidAmount: 0,
      status: 'DRAFT',
    },
  });

  // Invoice 5: Hendrik's consultation (overdue)
  const invoice5 = await prisma.invoice.create({
    data: {
      practiceId: practice.id,
      patientId: patients[4].id,
      invoiceNumber: 'INV-2026-0005',
      invoiceDate: daysAgo(50),
      dueDate: daysAgo(20),
      subtotal: 51.44,
      taxAmount: 0,
      total: 51.44,
      insuranceAmount: 25.72,
      patientAmount: 25.72,
      paidAmount: 0,
      status: 'OVERDUE',
    },
  });

  // Invoice 6: Willem's emergency (sent)
  const invoice6 = await prisma.invoice.create({
    data: {
      practiceId: practice.id,
      patientId: patients[6].id,
      invoiceNumber: 'INV-2026-0006',
      invoiceDate: daysAgo(25),
      dueDate: daysFromNow(5),
      subtotal: 110.60,
      taxAmount: 0,
      total: 110.60,
      insuranceAmount: 88.48,
      patientAmount: 22.12,
      paidAmount: 0,
      status: 'SENT',
    },
  });

  // Invoice 7: Thomas's checkup (paid)
  const invoice7 = await prisma.invoice.create({
    data: {
      practiceId: practice.id,
      patientId: patients[8].id,
      invoiceNumber: 'INV-2026-0007',
      invoiceDate: daysAgo(10),
      dueDate: daysFromNow(20),
      subtotal: 46.30,
      taxAmount: 0,
      total: 46.30,
      insuranceAmount: 37.04,
      patientAmount: 9.26,
      paidAmount: 46.30,
      status: 'PAID',
    },
  });

  console.log('  7 invoices seeded');

  // ─── Invoice Lines ───────────────────────────────────────
  console.log('Seeding invoice lines...');
  await prisma.invoiceLine.createMany({
    data: [
      { practiceId: practice.id, invoiceId: invoice1.id, treatmentId: treatment1.id, nzaCodeId: nzaMap['V21'], description: 'Composiet vulling 1 vlak', nzaCode: 'V21', toothNumber: 36, surface: 'O', quantity: 1, unitPrice: 64.30, lineTotal: 64.30, sortOrder: 1 },
      { practiceId: practice.id, invoiceId: invoice2.id, treatmentId: treatment2.id, nzaCodeId: nzaMap['E03'], description: 'Wortelkanaalbehandeling 2 kanalen', nzaCode: 'E03', toothNumber: 37, quantity: 1, unitPrice: 192.90, lineTotal: 192.90, sortOrder: 1 },
      { practiceId: practice.id, invoiceId: invoice2.id, nzaCodeId: nzaMap['A01'], description: 'Lokale verdoving', nzaCode: 'A01', quantity: 1, unitPrice: 15.43, lineTotal: 15.43, sortOrder: 2 },
      { practiceId: practice.id, invoiceId: invoice3.id, nzaCodeId: nzaMap['C02'], description: 'Periodiek mondonderzoek', nzaCode: 'C02', quantity: 1, unitPrice: 25.72, lineTotal: 25.72, sortOrder: 1 },
      { practiceId: practice.id, invoiceId: invoice4.id, nzaCodeId: nzaMap['M02'], description: 'Mondhygienistbehandeling', nzaCode: 'M02', quantity: 2, unitPrice: 15.43, lineTotal: 30.86, sortOrder: 1 },
      { practiceId: practice.id, invoiceId: invoice4.id, nzaCodeId: nzaMap['M05'], description: 'Fluoride applicatie', nzaCode: 'M05', quantity: 1, unitPrice: 10.00, lineTotal: 10.00, sortOrder: 2 },
      // Invoice 5: Hendrik consultation (overdue)
      { practiceId: practice.id, invoiceId: invoice5.id, nzaCodeId: nzaMap['C03'], description: 'Consult met uitgebreid onderzoek', nzaCode: 'C03', quantity: 1, unitPrice: 51.44, lineTotal: 51.44, sortOrder: 1 },
      // Invoice 6: Willem emergency (sent)
      { practiceId: practice.id, invoiceId: invoice6.id, nzaCodeId: nzaMap['V23'], description: 'Composiet vulling 3 vlakken', nzaCode: 'V23', toothNumber: 36, surface: 'MOD', quantity: 1, unitPrice: 110.60, lineTotal: 110.60, sortOrder: 1 },
      // Invoice 7: Thomas checkup (paid)
      { practiceId: practice.id, invoiceId: invoice7.id, nzaCodeId: nzaMap['C02'], description: 'Periodiek mondonderzoek', nzaCode: 'C02', quantity: 1, unitPrice: 25.72, lineTotal: 25.72, sortOrder: 1 },
      { practiceId: practice.id, invoiceId: invoice7.id, nzaCodeId: nzaMap['X01'], description: 'Bitewing opname (1-2)', nzaCode: 'X01', quantity: 1, unitPrice: 20.58, lineTotal: 20.58, sortOrder: 2 },
    ],
  });
  console.log('  11 invoice lines seeded');

  // ─── Payments ────────────────────────────────────────────
  console.log('Seeding payments...');
  await prisma.payment.createMany({
    data: [
      { practiceId: practice.id, invoiceId: invoice1.id, amount: 51.44, method: 'BANK_TRANSFER', status: 'COMPLETED', paidAt: daysAgo(15) },
      { practiceId: practice.id, invoiceId: invoice1.id, amount: 12.86, method: 'IDEAL', status: 'COMPLETED', paidAt: daysAgo(12) },
      { practiceId: practice.id, invoiceId: invoice2.id, amount: 166.66, method: 'BANK_TRANSFER', status: 'COMPLETED', paidAt: daysAgo(3) },
      // Invoice 7 (Thomas, PAID): insurance + patient portions
      { practiceId: practice.id, invoiceId: invoice7.id, amount: 37.04, method: 'BANK_TRANSFER', status: 'COMPLETED', paidAt: daysAgo(5) },
      { practiceId: practice.id, invoiceId: invoice7.id, amount: 9.26, method: 'PIN', status: 'COMPLETED', paidAt: daysAgo(4) },
    ],
  });
  console.log('  5 payments seeded');

  // ─── Insurance Claims ────────────────────────────────────
  console.log('Seeding insurance claims...');
  await prisma.insuranceClaim.createMany({
    data: [
      {
        practiceId: practice.id, patientId: patients[0].id, invoiceId: invoice1.id,
        uzoviCode: '3332', status: 'ACCEPTED', submittedAt: daysAgo(19), responseAt: daysAgo(16),
        amountClaimed: 51.44, amountApproved: 51.44,
        claimData: { nzaCodes: ['V21'], toothNumbers: [36] },
        responseData: { approvalCode: 'APR-001' },
      },
      {
        practiceId: practice.id, patientId: patients[2].id, invoiceId: invoice2.id,
        uzoviCode: '0403', status: 'ACCEPTED', submittedAt: daysAgo(6), responseAt: daysAgo(4),
        amountClaimed: 166.66, amountApproved: 166.66,
        claimData: { nzaCodes: ['E03', 'A01'], toothNumbers: [37] },
        responseData: { approvalCode: 'APR-002' },
      },
      {
        practiceId: practice.id, patientId: patients[5].id, invoiceId: invoice3.id,
        uzoviCode: '3311', status: 'SUBMITTED', submittedAt: daysAgo(28),
        amountClaimed: 20.58,
        claimData: { nzaCodes: ['C02'] },
      },
    ],
  });
  console.log('  3 insurance claims seeded');

  // ─── Consent Forms ───────────────────────────────────────
  console.log('Seeding consent forms...');
  await prisma.consentForm.createMany({
    data: [
      {
        practiceId: practice.id, patientId: patients[2].id, treatmentPlanId: plan2.id,
        consentType: 'TREATMENT', treatmentType: 'ENDODONTICS',
        title: 'Toestemming wortelkanaalbehandeling',
        content: 'Ik verleen toestemming voor een wortelkanaalbehandeling op element 37. De risicos en alternatieven zijn met mij besproken.',
        description: 'Toestemming voor wortelkanaalbehandeling element 37',
        status: 'SIGNED', signedAt: daysAgo(43), signedByName: 'Jan de Boer',
        emailSentAt: daysAgo(44), emailAddress: 'jan.deboer@email.nl',
      },
      {
        practiceId: practice.id, patientId: patients[4].id, treatmentPlanId: plan3.id,
        consentType: 'TREATMENT', treatmentType: 'IMPLANT',
        title: 'Toestemming implantaatkroon',
        content: 'Ik verleen toestemming voor het plaatsen van een implantaatkroon op positie 47. De kosten, risicos en alternatieven zijn besproken.',
        description: 'Toestemming voor implantaatkroon element 47',
        status: 'PENDING',
        emailSentAt: daysAgo(34), emailAddress: 'h.mulder@email.nl',
        expiresAt: daysFromNow(30),
      },
      {
        practiceId: practice.id, patientId: patients[0].id,
        consentType: 'GENERAL', treatmentType: 'GENERAL',
        title: 'Algemene behandelovereenkomst',
        content: 'Ik ga akkoord met de algemene behandelvoorwaarden van Tandartspraktijk Amsterdam.',
        description: 'Algemene toestemming voor behandeling',
        status: 'SIGNED', signedAt: daysAgo(90), signedByName: 'Peter Jansen',
      },
    ],
  });
  console.log('  3 consent forms seeded');

  // ─── Anamnesis ───────────────────────────────────────────
  console.log('Seeding anamnesis records...');
  await prisma.anamnesis.createMany({
    data: [
      {
        practiceId: practice.id, patientId: patients[0].id, version: 1, completedAt: daysAgo(90),
        data: {
          heartCondition: false, diabetes: false, bloodThinners: false,
          allergies: ['Penicilline'], medications: ['Ibuprofen (incidenteel)'],
          smoking: false, pregnant: false, lastDentalVisit: '6 maanden geleden',
          complaints: 'Gevoeligheid bij koude dranken',
        },
      },
      {
        practiceId: practice.id, patientId: patients[2].id, version: 1, completedAt: daysAgo(45),
        data: {
          heartCondition: false, diabetes: true, diabetesType: 'Type 2', bloodThinners: true,
          bloodThinnerType: 'Acenocoumarol', allergies: [], medications: ['Metformine', 'Acenocoumarol'],
          smoking: false, pregnant: false, lastDentalVisit: '1 jaar geleden',
          complaints: 'Pijn bij kauwen rechtsonder',
        },
      },
      {
        practiceId: practice.id, patientId: patients[4].id, version: 1, completedAt: daysAgo(35),
        data: {
          heartCondition: true, heartConditionType: 'Hypertensie', diabetes: false, bloodThinners: false,
          allergies: [], medications: ['Atenolol', 'Aspirine'],
          smoking: false, pregnant: false, lastDentalVisit: '3 maanden geleden',
          complaints: 'Wil kroon op implantaat',
        },
      },
      {
        practiceId: practice.id, patientId: patients[1].id, version: 1, completedAt: daysAgo(55),
        data: {
          heartCondition: false, diabetes: false, bloodThinners: false,
          allergies: [], medications: [],
          smoking: false, pregnant: false, lastDentalVisit: '6 maanden geleden',
          complaints: 'Geen klachten, routine controle',
        },
      },
    ],
  });
  console.log('  4 anamnesis records seeded');

  // ─── Audit Logs ──────────────────────────────────────────
  console.log('Seeding audit logs...');
  await prisma.auditLog.createMany({
    data: [
      { practiceId: practice.id, userId: admin.id, action: 'CREATE', resourceType: 'Practice', resourceId: practice.id, newValues: { name: 'Tandartspraktijk Amsterdam' }, ipAddress: '192.168.1.1' },
      { practiceId: practice.id, userId: dentist.id, action: 'CREATE', resourceType: 'Patient', resourceId: patients[0].id, newValues: { name: 'Peter Jansen' }, ipAddress: '192.168.1.10' },
      { practiceId: practice.id, userId: dentist.id, action: 'VIEW_BSN', resourceType: 'Patient', resourceId: patients[0].id, bsnAccessed: true, bsnAccessReason: 'Verzekeringsclaim verwerking', ipAddress: '192.168.1.10' },
      { practiceId: practice.id, userId: dentist.id, action: 'CREATE', resourceType: 'TreatmentPlan', resourceId: plan1.id, newValues: { title: 'Vulling element 36' }, ipAddress: '192.168.1.10' },
      { practiceId: practice.id, userId: dentist.id, action: 'UPDATE', resourceType: 'Treatment', resourceId: treatment1.id, oldValues: { status: 'PLANNED' }, newValues: { status: 'COMPLETED' }, ipAddress: '192.168.1.10' },
      { practiceId: practice.id, userId: admin.id, action: 'CREATE', resourceType: 'Invoice', resourceId: invoice1.id, newValues: { invoiceNumber: 'INV-2026-0001' }, ipAddress: '192.168.1.1' },
      { practiceId: practice.id, userId: dentist.id, action: 'VIEW_BSN', resourceType: 'Patient', resourceId: patients[2].id, bsnAccessed: true, bsnAccessReason: 'Verzekeringsclaim verwerking', ipAddress: '192.168.1.10' },
      { practiceId: practice.id, userId: receptionist.id, action: 'CREATE', resourceType: 'Appointment', resourceId: appointmentRecords[21].id, newValues: { type: 'TREATMENT', patientIdx: 1 }, ipAddress: '192.168.1.20' },
    ],
  });
  console.log('  8 audit logs seeded');

  // ─── Notifications ───────────────────────────────────────
  console.log('Seeding notifications...');
  await prisma.notification.createMany({
    data: [
      { practiceId: practice.id, patientId: patients[1].id, channel: 'EMAIL', template: 'appointment_reminder', subject: 'Herinnering: afspraak morgen', content: 'Beste Maria, dit is een herinnering voor uw afspraak morgen om 09:00.', status: 'SENT', sentAt: hoursFromNow(-2) },
      { practiceId: practice.id, patientId: patients[3].id, channel: 'SMS', template: 'appointment_confirmation', subject: 'Afspraak bevestigd', content: 'Uw afspraak op ' + daysFromNow(2).toLocaleDateString('nl-NL') + ' is bevestigd.', status: 'DELIVERED', sentAt: daysAgo(1) },
      { practiceId: practice.id, patientId: patients[4].id, channel: 'EMAIL', template: 'consent_request', subject: 'Toestemmingsformulier', content: 'Beste Hendrik, graag ontvangen wij uw getekende toestemmingsformulier voor de implantaatkroon.', status: 'SENT', sentAt: daysAgo(34) },
      { practiceId: practice.id, patientId: patients[9].id, channel: 'EMAIL', template: 'appointment_reminder', subject: 'Nieuwe afspraak', content: 'Beste Fleur, we hebben een nieuwe afspraak voor u ingepland.', status: 'PENDING' },
      { practiceId: practice.id, userId: dentist.id, channel: 'IN_APP', template: 'schedule_change', subject: 'Roosterwijziging', content: 'Uw rooster is aangepast: training op ' + daysFromNow(14).toLocaleDateString('nl-NL'), status: 'READ', sentAt: daysAgo(2), readAt: daysAgo(1) },
      { practiceId: practice.id, patientId: patients[0].id, channel: 'EMAIL', template: 'invoice_sent', subject: 'Factuur INV-2026-0001', content: 'Beste Peter, bijgevoegd vindt u uw factuur voor de behandeling.', status: 'DELIVERED', sentAt: daysAgo(20) },
    ],
  });
  console.log('  6 notifications seeded');

  // ─── Prescriptions ──────────────────────────────────────
  console.log('Seeding prescriptions...');
  await prisma.prescription.createMany({
    data: [
      {
        practiceId: practice.id,
        patientId: patients[0].id,
        prescribedBy: dentist.id,
        medicationName: 'Amoxicilline',
        dosage: '500mg',
        frequency: '3x per dag',
        duration: '7 dagen',
        quantity: 21,
        route: 'oraal',
        instructions: 'Innemen na de maaltijd',
        status: 'COMPLETED',
        prescribedAt: daysAgo(20),
      },
      {
        practiceId: practice.id,
        patientId: patients[1].id,
        prescribedBy: dentist.id,
        medicationName: 'Ibuprofen',
        dosage: '600mg',
        frequency: '3x per dag',
        duration: '5 dagen',
        quantity: 15,
        route: 'oraal',
        instructions: 'Innemen met voedsel, niet op lege maag',
        status: 'COMPLETED',
        prescribedAt: daysAgo(15),
      },
      {
        practiceId: practice.id,
        patientId: patients[2].id,
        appointmentId: appointmentRecords[3].id, // today: patient 2 TREATMENT
        prescribedBy: dentist.id,
        medicationName: 'Metronidazol',
        dosage: '500mg',
        frequency: '3x per dag',
        duration: '7 dagen',
        quantity: 21,
        route: 'oraal',
        instructions: 'Geen alcohol gebruiken tijdens de kuur',
        status: 'ACTIVE',
        prescribedAt: new Date(),
      },
      {
        practiceId: practice.id,
        patientId: patients[4].id,
        prescribedBy: dentist.id,
        medicationName: 'Chloorhexidine 0.12%',
        dosage: '15ml',
        frequency: '2x per dag spoelen',
        duration: '14 dagen',
        quantity: 1,
        route: 'spoeling',
        instructions: '30 seconden spoelen, daarna uitspugen. Niet eten of drinken gedurende 30 minuten na gebruik.',
        status: 'ACTIVE',
        prescribedAt: daysAgo(5),
      },
      {
        practiceId: practice.id,
        patientId: patients[6].id,
        appointmentId: appointmentRecords[8].id, // today: patient 6 EMERGENCY
        prescribedBy: dentist.id,
        medicationName: 'Clindamycine',
        dosage: '300mg',
        frequency: '4x per dag',
        duration: '7 dagen',
        quantity: 28,
        route: 'oraal',
        instructions: 'Innemen met een groot glas water, bij aanhoudende diarree contact opnemen',
        status: 'ACTIVE',
        prescribedAt: new Date(),
      },
    ],
  });
  console.log('  5 prescriptions seeded');

  // ─── Referrals ──────────────────────────────────────────
  console.log('Seeding referrals...');
  await prisma.referral.createMany({
    data: [
      {
        practiceId: practice.id,
        patientId: patients[0].id,
        createdBy: dentist.id,
        specialistType: 'Kaakchirurg',
        specialistName: 'Dr. R. van der Berg',
        specialistPractice: 'Centrum voor Kaakchirurgie Amsterdam',
        specialistPhone: '+31 20 555 0101',
        specialistEmail: 'info@kaakchirurgie-adam.nl',
        reason: 'Verwijdering verstandskiezen 18 en 28 (geïmpacteerd)',
        clinicalInfo: 'OPT toont mesioangulaire impactie 18 en 28, beide in contact met nervus alveolaris inferior. Patient ervaart recidiverende pericoronitis.',
        urgency: 'ROUTINE',
        status: 'APPOINTMENT_MADE',
        referralDate: daysAgo(30),
        appointmentMadeAt: daysAgo(25),
        pdfUrl: null,
      },
      {
        practiceId: practice.id,
        patientId: patients[0].id,
        createdBy: dentist.id,
        specialistType: 'Parodontoloog',
        specialistName: 'Dr. M. Bakker',
        specialistPractice: 'Amsterdam Parodontologie',
        specialistPhone: '+31 20 555 0202',
        reason: 'Verdiepte pockets (6-7mm) regio 16-17, ondanks adequate mondhygiëne',
        clinicalInfo: 'BOP positief, pockets 6-7mm buccaal 16-17. Subgingivale tandsteen op röntgen. Initiële parodontale therapie uitgevoerd zonder verbetering.',
        urgency: 'URGENT',
        status: 'SENT',
        referralDate: daysAgo(5),
        pdfUrl: null,
      },
    ],
  });
  console.log('  2 referrals seeded');

  // ─── Complaints ─────────────────────────────────────────
  console.log('Seeding complaints...');
  await prisma.complaint.createMany({
    data: [
      {
        practiceId: practice.id,
        patientId: patients[0].id,
        type: 'COMPLIMENT',
        subject: 'BEHANDELING',
        description: 'Ik wil de tandarts en het hele team bedanken voor de uitstekende behandeling. De implantaat procedure verliep zeer soepel en ik voel me goed geïnformeerd over elk stap.',
        anonymous: false,
        referenceNumber: 'KLACHT-20260115-1001',
        status: 'AFGEHANDELD',
        response: 'Hartelijk dank voor uw mooie woorden! We waarderen het dat u de tijd neemt om dit met ons te delen.',
        resolvedAt: daysAgo(20),
        createdAt: daysAgo(25),
        updatedAt: daysAgo(20),
      },
    ],
  });
  console.log('  1 complaint seeded');

  // ─── Credentials ─────────────────────────────────────────
  console.log('Seeding credentials...');
  await prisma.credential.createMany({
    data: [
      { practiceId: practice.id, name: 'Mollie Test', type: 'MOLLIE', environment: 'test', apiKey: 'test_xxxxxxxxxxxxxxxxxxxx', isTestMode: true, createdBy: admin.id },
      { practiceId: practice.id, name: 'Resend Email', type: 'RESEND', environment: 'production', apiKey: 're_xxxxxxxxxxxxxxxxxxxx', createdBy: admin.id },
    ],
  });
  console.log('  2 credentials seeded');

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
