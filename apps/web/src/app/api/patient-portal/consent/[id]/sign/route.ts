import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const form = await prisma.consentForm.findFirst({
      where: { id, patientId: user.patientId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!form) throw new ApiError('Toestemmingsformulier niet gevonden', 404);
    if (form.status === 'SIGNED') throw new ApiError('Dit formulier is al ondertekend', 400);
    if (form.status === 'REVOKED') throw new ApiError('Dit formulier is ingetrokken', 400);

    const body = await request.json();
    const { signatureData, signedByName } = body;

    if (!signatureData || !signedByName) {
      throw new ApiError('Handtekening en naam zijn verplicht', 400);
    }

    const signedAt = new Date();

    const updated = await prisma.consentForm.update({
      where: { id },
      data: {
        signatureData,
        signedByName,
        signedAt,
        status: 'SIGNED',
        emailAddress: form.patient.email,
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          practiceId: form.practiceId,
          action: 'CONSENT_SIGNED',
          resourceType: 'ConsentForm',
          resourceId: id,
          newValues: {
            signedByName,
            signedAt: signedAt.toISOString(),
            treatmentType: form.treatmentType,
          },
        },
      });
    } catch {
      // non-critical
    }

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
