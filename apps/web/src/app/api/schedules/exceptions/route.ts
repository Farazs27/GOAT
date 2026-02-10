import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const practitionerId = url.searchParams.get('practitionerId') || undefined;

    const where: any = { practiceId: user.practiceId };
    if (practitionerId) where.practitionerId = practitionerId;

    const exceptions = await prisma.scheduleException.findMany({
      where,
      orderBy: { exceptionDate: 'desc' },
      include: {
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return Response.json(exceptions);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { practitionerId, exceptionDate, exceptionType, startTime, endTime, reason } = body;

    if (!practitionerId || !exceptionDate || !exceptionType) {
      throw new ApiError('Behandelaar, datum en type zijn verplicht', 400);
    }

    const exception = await prisma.scheduleException.create({
      data: {
        practiceId: user.practiceId,
        practitionerId,
        exceptionDate: new Date(exceptionDate),
        exceptionType: exceptionType as any,
        startTime,
        endTime,
        reason,
      },
      include: {
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return Response.json(exception, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
