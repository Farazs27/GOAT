import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize 32 adult teeth for FDI notation
async function initializeTeeth(patientId: string, practiceId: string) {
  const adultTeeth = [
    // Quadrant 1 (Upper Right) - 11-18
    11, 12, 13, 14, 15, 16, 17, 18,
    // Quadrant 2 (Upper Left) - 21-28
    21, 22, 23, 24, 25, 26, 27, 28,
    // Quadrant 3 (Lower Left) - 31-38
    31, 32, 33, 34, 35, 36, 37, 38,
    // Quadrant 4 (Lower Right) - 41-48
    41, 42, 43, 44, 45, 46, 47, 48,
  ];

  for (const toothNumber of adultTeeth) {
    await prisma.tooth.create({
      data: {
        patientId,
        practiceId,
        toothNumber,
        status: 'PRESENT',
        isPrimary: false,
      },
    });
  }
}

// NZa Codes 2026 - Sample subset (official tariffs would be imported from CSV)
const nzaCodes2026 = [
  // Consultations (C)
  { code: 'C01', category: 'CONSULTATIE', descriptionNl: 'Eerste consult mondzorg', maxTariff: 25.72, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C02', category: 'CONSULTATIE', descriptionNl: 'Periodiek mondonderzoek', maxTariff: 25.72, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'C03', category: 'CONSULTATIE', descriptionNl: 'Consult met uitgebreid onderzoek', maxTariff: 51.44, unit: 'per_consult', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  
  // Imaging (X)
  { code: 'X01', category: 'RONTGEN', descriptionNl: 'Bitewing opname (1-2)', maxTariff: 20.58, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X02', category: 'RONTGEN', descriptionNl: 'Bitewing opname (3-4)', maxTariff: 30.87, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X10', category: 'RONTGEN', descriptionNl: 'Panoramische opname', maxTariff: 46.29, unit: 'per_image', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  
  // Restorative (V)
  { code: 'V01', category: 'VULLING', descriptionNl: 'Amalgaam 1 vlak', maxTariff: 51.44, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V02', category: 'VULLING', descriptionNl: 'Amalgaam 2 vlakken', maxTariff: 71.15, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V21', category: 'VULLING', descriptionNl: 'Composiet 1 vlak', maxTariff: 64.30, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V22', category: 'VULLING', descriptionNl: 'Composiet 2 vlakken', maxTariff: 89.00, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V23', category: 'VULLING', descriptionNl: 'Composiet 3 vlakken', maxTariff: 110.60, unit: 'per_surface', requiresTooth: true, requiresSurface: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'V30', category: 'VULLING', descriptionNl: 'Glasionomeer cement', maxTariff: 51.44, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  
  // Endodontics (E)
  { code: 'E01', category: 'ENDO', descriptionNl: 'Pulpa-extirpatie', maxTariff: 77.16, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E02', category: 'ENDO', descriptionNl: 'Wortelkanaalbehandeling 1 kanaal', maxTariff: 128.60, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E03', category: 'ENDO', descriptionNl: 'Wortelkanaalbehandeling 2 kanalen', maxTariff: 192.90, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'E04', category: 'ENDO', descriptionNl: 'Wortelkanaalbehandeling 3 of meer kanalen', maxTariff: 257.20, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  
  // Preventive (M)
  { code: 'M01', category: 'PREVENTIE', descriptionNl: 'Tandsteen verwijderen', maxTariff: 18.00, unit: 'per_5min', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M02', category: 'PREVENTIE', descriptionNl: 'Mondhygiënistbehandeling', maxTariff: 15.43, unit: 'per_5min', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M05', category: 'PREVENTIE', descriptionNl: 'Fluoride applicatie', maxTariff: 25.72, unit: 'per_treatment', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'M30', category: 'PREVENTIE', descriptionNl: 'Dieptereiniging per sextant', maxTariff: 77.16, unit: 'per_sextant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  
  // Anesthesia (A)
  { code: 'A01', category: 'VERDOVING', descriptionNl: 'Lokale verdoving', maxTariff: 15.43, unit: 'per_injection', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'A02', category: 'VERDOVING', descriptionNl: 'Lokale verdoving additioneel', maxTariff: 7.72, unit: 'per_injection', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  
  // Extractions (X)
  { code: 'X30', category: 'EXTRACTIE', descriptionNl: 'Extractie eenvoudig', maxTariff: 51.44, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X31', category: 'EXTRACTIE', descriptionNl: 'Extractie moeilijk', maxTariff: 102.88, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'X32', category: 'EXTRACTIE', descriptionNl: 'Extractie chirurgisch', maxTariff: 154.32, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  
  // Crowns/Bridges (R)
  { code: 'R01', category: 'KROON', descriptionNl: 'Volledige kroon metaal', maxTariff: 360.08, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R02', category: 'KROON', descriptionNl: 'Volledige kroon metaal-keramiek', maxTariff: 514.40, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'R10', category: 'KROON', descriptionNl: 'Brug 3 elementen', maxTariff: 1028.80, unit: 'per_bridge', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  
  // Implants (I)
  { code: 'I01', category: 'IMPLANTAAT', descriptionNl: 'Implantaat chirurgisch', maxTariff: 771.60, unit: 'per_implant', validFrom: '2026-01-01', validUntil: '2026-12-31' },
  { code: 'I10', category: 'IMPLANTAAT', descriptionNl: 'Implantaat kroon', maxTariff: 617.28, unit: 'per_tooth', requiresTooth: true, validFrom: '2026-01-01', validUntil: '2026-12-31' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed NZa codes
  console.log('📋 Seeding NZa codes...');
  for (const code of nzaCodes2026) {
    await prisma.nzaCode.upsert({
      where: {
        code_validFrom: {
          code: code.code,
          validFrom: new Date(code.validFrom),
        },
      },
      update: {},
      create: {
        code: code.code,
        category: code.category,
        descriptionNl: code.descriptionNl,
        maxTariff: code.maxTariff,
        unit: code.unit,
        requiresTooth: code.requiresTooth || false,
        requiresSurface: code.requiresSurface || false,
        validFrom: new Date(code.validFrom),
        validUntil: new Date(code.validUntil),
      },
    });
  }
  console.log(`✅ Seeded ${nzaCodes2026.length} NZa codes`);

  // Create test practice
  const testPractice = await prisma.practice.upsert({
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
    },
  });
  console.log('✅ Created test practice');

  // Create default users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dentflow.nl' },
    update: {},
    create: {
      practiceId: testPractice.id,
      email: 'admin@dentflow.nl',
      passwordHash: '$2b$10$/GvRCLaaIuXqDOCE/GT4MeNbpFPUnuwgnVR0xPUJRDwHKGcWlM.RG', // Welcome123
      firstName: 'Admin',
      lastName: 'User',
      role: 'PRACTICE_ADMIN',
    },
  });

  const dentistUser = await prisma.user.upsert({
    where: { email: 'faraz@tandarts-amsterdam.nl' },
    update: {},
    create: {
      practiceId: testPractice.id,
      email: 'faraz@tandarts-amsterdam.nl',
      passwordHash: '$2b$10$jIcpcKly7/A1LOBMKv2PeugLplUXGS/c9HSD.MlzRsAu0VZ.HNzju', // Sharifi1997
      firstName: 'Faraz',
      lastName: 'Sharifi',
      role: 'DENTIST',
      bigNumber: '12345678901',
    },
  });
  console.log('✅ Created test users');

  // Create test patient
  const testPatient = await prisma.patient.upsert({
    where: {
      practiceId_patientNumber: {
        practiceId: testPractice.id,
        patientNumber: 'P-2026-0001',
      },
    },
    update: {},
    create: {
      practiceId: testPractice.id,
      patientNumber: 'P-2026-0001',
      firstName: 'Peter',
      lastName: 'Jansen',
      dateOfBirth: new Date('1985-06-15'),
      email: 'peter.jansen@email.nl',
      phone: '+31 6 12345678',
      bsn: '123456782', // Test BSN
      insuranceCompany: 'VGZ',
      insuranceNumber: '123456789',
      gdprConsentAt: new Date(),
    },
  });
  console.log('✅ Created test patient');

  // Initialize teeth for test patient
  await initializeTeeth(testPatient.id, testPractice.id);
  console.log('✅ Initialized 32 teeth for test patient');

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
