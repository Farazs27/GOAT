import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function POST(
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
    const { surface, condition, material } = body;

    const created = await prisma.toothSurface.create({
      data: {
        practiceId: user.practiceId,
        toothId: tooth.id,
        surface,
        condition: condition as any,
        material,
        recordedBy: user.id,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
