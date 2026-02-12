import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId') || undefined;

    const where: any = { practiceId: user.practiceId };
    if (patientId) where.patientId = patientId;

    const status = url.searchParams.get('status');
    if (status) {
      const statuses = status.split(',');
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    const countOnly = url.searchParams.get('countOnly') === 'true';
    if (countOnly) {
      const count = await prisma.treatmentPlan.count({ where });
      return Response.json({ count });
    }

    const plans = await prisma.treatmentPlan.findMany({
      where,
      include: {
        treatments: { include: { nzaCode: true, tooth: true } },
        creator: { select: { firstName: true, lastName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(plans);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, title, description } = body;

    if (!patientId || !title) {
      throw new ApiError('Pati\u00ebnt en titel zijn verplicht', 400);
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const plan = await prisma.treatmentPlan.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        createdBy: user.id,
        title,
        description,
      },
      include: {
        treatments: true,
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(plan, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
