import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: user.patientId },
    });
    if (!appointment) throw new ApiError('Afspraak niet gevonden', 404);

    if (appointment.status === 'CANCELLED') {
      throw new ApiError('Afspraak is al geannuleerd', 400);
    }

    // 24h cancellation policy
    const hoursUntil = (appointment.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24) {
      throw new ApiError('Afspraken kunnen alleen tot 24 uur van tevoren worden geannuleerd', 400);
    }

    const body = await request.json().catch(() => ({}));

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: body.reason || 'Geannuleerd door pati\u00ebnt',
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
