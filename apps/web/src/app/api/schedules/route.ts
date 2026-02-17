import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const practitionerId = url.searchParams.get('practitionerId') || undefined;

    // Return practitioners list for schedule manager dropdown
    if (url.searchParams.get('listPractitioners') === 'true') {
      const practitioners = await prisma.user.findMany({
        where: { practiceId: user.practiceId, isActive: true, role: { in: ['DENTIST', 'HYGIENIST', 'PRACTICE_ADMIN'] } },
        select: { id: true, firstName: true, lastName: true, role: true },
        orderBy: { lastName: 'asc' },
      });
      return Response.json(practitioners);
    }

    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const where: any = { practiceId: user.practiceId };
    if (!includeInactive) where.isActive = true;
    if (practitionerId) where.practitionerId = practitionerId;

    const schedules = await prisma.practitionerSchedule.findMany({
      where,
      orderBy: [{ practitionerId: 'asc' }, { dayOfWeek: 'asc' }],
      include: {
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return Response.json(schedules);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { practitionerId, dayOfWeek, startTime, endTime, slotDuration } = body;

    if (!practitionerId || dayOfWeek === undefined || !startTime || !endTime) {
      throw new ApiError('Behandelaar, dag, start- en eindtijd zijn verplicht', 400);
    }

    const schedule = await prisma.practitionerSchedule.create({
      data: {
        practiceId: user.practiceId,
        practitionerId,
        dayOfWeek,
        startTime,
        endTime,
        slotDuration: slotDuration || 15,
      },
      include: {
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return Response.json(schedule, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
