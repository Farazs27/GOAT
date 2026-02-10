import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; toothNumber: string }> },
) {
  try {
    const user = await withAuth(request);
    const { id, toothNumber } = await params;
    const num = parseInt(toothNumber);

    const tooth = await prisma.tooth.findFirst({
      where: { patientId: id, toothNumber: num, practiceId: user.practiceId },
    });
    if (!tooth) throw new ApiError('Tand niet gevonden', 404);

    const body = await request.json();
    const updated = await prisma.tooth.update({
      where: { id: tooth.id },
      data: {
        status: body.status as any,
        notes: body.notes ?? tooth.notes,
      },
      include: { surfaces: { orderBy: { recordedAt: 'desc' } } },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
