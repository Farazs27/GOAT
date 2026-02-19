import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const nudges = await prisma.patientNudge.findMany({
      where: {
        patientId: user.patientId,
        channel: 'in_app',
        clickedAt: null,
      },
      orderBy: { sentAt: 'desc' },
      select: {
        id: true,
        message: true,
        sentAt: true,
        metadata: true,
      },
    });

    const formatted = nudges.map((n) => ({
      id: n.id,
      message: n.message,
      sentAt: n.sentAt,
      bookingLink: (n.metadata as Record<string, unknown>)?.bookingLink || null,
    }));

    return Response.json({ nudges: formatted });
  } catch (error) {
    return handleError(error);
  }
}
