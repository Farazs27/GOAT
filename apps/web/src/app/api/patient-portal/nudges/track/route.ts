import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const { nudgeId } = body as { nudgeId?: string };

    if (!nudgeId) {
      throw new ApiError('nudgeId is verplicht', 400);
    }

    // Verify nudge belongs to this patient
    const nudge = await prisma.patientNudge.findUnique({
      where: { id: nudgeId },
    });

    if (!nudge || nudge.patientId !== user.patientId) {
      throw new ApiError('Nudge niet gevonden', 404);
    }

    if (nudge.clickedAt) {
      return Response.json({ success: true, alreadyTracked: true });
    }

    await prisma.patientNudge.update({
      where: { id: nudgeId },
      data: { clickedAt: new Date() },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
