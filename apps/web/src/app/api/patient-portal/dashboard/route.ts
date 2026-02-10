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

    // Next appointment
    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: user.patientId,
        startTime: { gte: new Date() },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      orderBy: { startTime: 'asc' },
      include: {
        practitioner: { select: { firstName: true, lastName: true } },
      },
    });

    // Pending consent forms
    const pendingConsent = await prisma.consentForm.count({
      where: { patientId: user.patientId, status: 'PENDING' },
    });

    // Latest anamnesis
    const latestAnamnesis = await prisma.anamnesis.findFirst({
      where: { patientId: user.patientId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, completedAt: true, updatedAt: true },
    });

    return Response.json({
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        patientNumber: patient.patientNumber,
        bsn: patient.bsn ? maskBsn(patient.bsn) : null,
      },
      nextAppointment,
      pendingConsent,
      latestAnamnesis,
    });
  } catch (error) {
    return handleError(error);
  }
}
