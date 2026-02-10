import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const plan = await prisma.treatmentPlan.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        treatments: { include: { nzaCode: true, tooth: true }, orderBy: { createdAt: 'asc' } },
        creator: { select: { firstName: true, lastName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    if (!plan) throw new ApiError('Behandelplan niet gevonden', 404);
    return Response.json(plan);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const plan = await prisma.treatmentPlan.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!plan) throw new ApiError('Behandelplan niet gevonden', 404);

    const body = await request.json();
    const data: any = {};
    if (body.title) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status) {
      data.status = body.status;
      if (body.status === 'PROPOSED') data.proposedAt = new Date();
      if (body.status === 'ACCEPTED') data.acceptedAt = new Date();
    }

    const updated = await prisma.treatmentPlan.update({
      where: { id },
      data,
      include: {
        treatments: { include: { nzaCode: true, tooth: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
