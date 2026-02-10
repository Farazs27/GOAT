import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';
import { maskBsn } from '@dentflow/crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId },
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

export async function PATCH(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const { email, phone, addressStreet, addressCity, addressPostal } = body;

    const updated = await prisma.patient.update({
      where: { id: user.patientId },
      data: { email, phone, addressStreet, addressCity, addressPostal },
    });

    return Response.json({
      ...updated,
      bsn: updated.bsn ? maskBsn(updated.bsn) : null,
      bsnEncrypted: undefined,
      bsnHash: undefined,
    });
  } catch (error) {
    return handleError(error);
  }
}
