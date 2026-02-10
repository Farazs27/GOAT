import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { maskBsn } from '@dentflow/crypto';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        teeth: {
          include: { surfaces: { orderBy: { recordedAt: 'desc' }, take: 1 } },
        },
      },
    });

    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    return Response.json({
      ...patient,
      bsn: patient.bsn ? maskBsn(patient.bsn) : null,
      bsnEncrypted: undefined,
      bsnHash: undefined,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.patient.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const body = await request.json();
    const { firstName, lastName, email, phone, addressStreet, addressCity, addressPostal, insuranceCompany, insuranceNumber, medicalAlerts, medications } = body;

    const updated = await prisma.patient.update({
      where: { id },
      data: { firstName, lastName, email, phone, addressStreet, addressCity, addressPostal, insuranceCompany, insuranceNumber, medicalAlerts, medications },
    });

    return Response.json({
      ...updated,
      bsn: updated.bsn ? maskBsn(updated.bsn) : null,
    });
  } catch (error) {
    return handleError(error);
  }
}
