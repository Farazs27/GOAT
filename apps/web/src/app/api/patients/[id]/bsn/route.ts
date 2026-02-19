import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { getClientIp } from '@/lib/audit';
import { UserRole } from '@nexiom/shared-types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN, UserRole.DENTIST]);
    const { id } = await params;

    const body = await request.json();
    const { reason } = body;
    if (!reason || reason.length < 5) {
      throw new ApiError('Reden voor BSN inzage is verplicht (min 5 tekens)', 400);
    }

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    // Audit log for BSN access
    await prisma.auditLog.create({
      data: {
        practiceId: user.practiceId,
        userId: user.id,
        action: 'BSN_ACCESS',
        resourceType: 'PATIENT',
        resourceId: id,
        ipAddress: getClientIp(request),
        bsnAccessed: true,
        bsnAccessReason: reason,
        newValues: { reason },
      },
    });

    return Response.json({ bsn: patient.bsn });
  } catch (error) {
    return handleError(error);
  }
}
