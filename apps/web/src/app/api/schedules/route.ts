import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const practitionerId = url.searchParams.get('practitionerId') || undefined;

    const where: any = { practiceId: user.practiceId, isActive: true };
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
