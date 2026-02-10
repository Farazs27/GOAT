import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError, ApiError } from '@/lib/auth';
import { validateBsn } from '@dentflow/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, dateOfBirth, gender, email, phone, bsn, addressStreet, addressCity, addressPostal, insuranceCompany, insuranceNumber, medicalAlerts, medications, gdprConsent, practiceSlug } = body;

    if (!firstName || !lastName || !email || !bsn || !gdprConsent) {
      throw new ApiError('Voornaam, achternaam, e-mail, BSN en GDPR toestemming zijn verplicht', 400);
    }

    if (!validateBsn(bsn)) {
      throw new ApiError('Ongeldig BSN nummer', 400);
    }

    // Find practice by slug
    const practice = await prisma.practice.findFirst({
      where: practiceSlug ? { slug: practiceSlug } : { isActive: true },
    });
    if (!practice) throw new ApiError('Praktijk niet gevonden', 404);

    // Check for existing patient with same email
    const existing = await prisma.patient.findFirst({
      where: { email: email.toLowerCase(), practiceId: practice.id },
    });
    if (existing) throw new ApiError('Er bestaat al een pati\u00ebnt met dit e-mailadres', 409);

    // Generate patient number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await prisma.patient.count({
      where: {
        practiceId: practice.id,
        createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) },
      },
    });
    const patientNumber = `P-${dateStr}-${String(countToday + 1).padStart(3, '0')}`;

    const patient = await prisma.patient.create({
      data: {
        practiceId: practice.id,
        patientNumber,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
        gender,
        email: email.toLowerCase(),
        phone,
        bsn,
        addressStreet,
        addressCity,
        addressPostal,
        insuranceCompany,
        insuranceNumber,
        medicalAlerts: medicalAlerts || [],
        medications: medications || [],
        gdprConsentAt: new Date(),
        isActive: true,
      },
    });

    // Initialize 32 adult teeth
    const adultTeeth = [
      11, 12, 13, 14, 15, 16, 17, 18,
      21, 22, 23, 24, 25, 26, 27, 28,
      31, 32, 33, 34, 35, 36, 37, 38,
      41, 42, 43, 44, 45, 46, 47, 48,
    ];
    await prisma.tooth.createMany({
      data: adultTeeth.map(toothNumber => ({
        patientId: patient.id,
        practiceId: practice.id,
        toothNumber,
        status: 'PRESENT',
        isPrimary: false,
      })),
    });

    return Response.json({
      id: patient.id,
      patientNumber: patient.patientNumber,
      email: patient.email,
      firstName: patient.firstName,
      lastName: patient.lastName,
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
