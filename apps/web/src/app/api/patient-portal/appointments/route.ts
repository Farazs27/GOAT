import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const now = new Date();

    const [upcoming, past] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          patientId: user.patientId,
          startTime: { gte: now },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        orderBy: { startTime: 'asc' },
        include: {
          practitioner: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.appointment.findMany({
        where: {
          patientId: user.patientId,
          OR: [
            { startTime: { lt: now } },
            { status: { in: ['CANCELLED', 'NO_SHOW'] } },
          ],
        },
        orderBy: { startTime: 'desc' },
        take: 20,
        include: {
          practitioner: { select: { firstName: true, lastName: true } },
          treatments: { select: { description: true, toothId: true, status: true } },
        },
      }),
    ]);

    return Response.json({ upcoming, past });
  } catch (error) {
    return handleError(error);
  }
}
