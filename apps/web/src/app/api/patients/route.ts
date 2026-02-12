import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { maskBsn } from '@dentflow/crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const categoriesParam = url.searchParams.get('categories') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '200');
    const skip = (page - 1) * limit;

    const where: any = { practiceId: user.practiceId, isActive: true };

    // Category filter
    if (categoriesParam) {
      const cats = categoriesParam.split(',').map(c => c.trim()).filter(Boolean);
      if (cats.length > 0) {
        where.patientCategories = { some: { category: { in: cats } } };
      }
    }

    if (search) {
      const orConditions: any[] = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { patientNumber: { contains: search, mode: 'insensitive' } },
      ];
      // Try to parse as date (dd-mm-yyyy or yyyy-mm-dd)
      const ddmmyyyy = search.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      const yyyymmdd = search.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (ddmmyyyy) {
        const d = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`);
        if (!isNaN(d.getTime())) {
          const nextDay = new Date(d);
          nextDay.setDate(nextDay.getDate() + 1);
          orConditions.push({ dateOfBirth: { gte: d, lt: nextDay } });
        }
      } else if (yyyymmdd) {
        const d = new Date(search);
        if (!isNaN(d.getTime())) {
          const nextDay = new Date(d);
          nextDay.setDate(nextDay.getDate() + 1);
          orConditions.push({ dateOfBirth: { gte: d, lt: nextDay } });
        }
      }
      where.OR = orConditions;
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastName: 'asc' },
        include: { patientCategories: { select: { category: true } } },
      }),
      prisma.patient.count({ where }),
    ]);

    const masked = patients.map((p: any) => ({
      ...p,
      bsn: p.bsn ? maskBsn(p.bsn) : null,
      bsnEncrypted: undefined,
      bsnHash: undefined,
    }));

    return Response.json({
      data: masked,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { firstName, lastName, dateOfBirth, email, phone, bsn, addressStreet, addressCity, addressPostal, insuranceCompany, insuranceNumber, medicalAlerts, medications } = body;

    if (!firstName || !lastName) {
      throw new ApiError('Voornaam en achternaam zijn verplicht', 400);
    }

    // Generate patient number
    const lastPatient = await prisma.patient.findFirst({
      where: { practiceId: user.practiceId },
      orderBy: { patientNumber: 'desc' },
    });
    const nextNumber = lastPatient
      ? parseInt(lastPatient.patientNumber.split('-')[2]) + 1
      : 1;
    const patientNumber = `P-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;

    const patient = await prisma.patient.create({
      data: {
        practiceId: user.practiceId,
        patientNumber,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
        email,
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
        practiceId: user.practiceId,
        toothNumber,
        status: 'PRESENT',
        isPrimary: false,
      })),
    });

    return Response.json(
      { ...patient, bsn: patient.bsn ? maskBsn(patient.bsn) : null },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
