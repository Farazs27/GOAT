import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const treatment = await prisma.treatment.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!treatment) throw new ApiError('Behandeling niet gevonden', 404);

    const body = await request.json();
    const data: any = {};
    if (body.status) {
      data.status = body.status;
      if (body.status === 'COMPLETED') data.performedAt = new Date();
    }
    if (body.notes !== undefined) data.notes = body.notes;

    const updated = await prisma.treatment.update({
      where: { id },
      data,
      include: { nzaCode: true, tooth: true },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
