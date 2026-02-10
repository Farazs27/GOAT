import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const teeth = await prisma.tooth.findMany({
      where: { patientId: id, practiceId: user.practiceId },
      include: { surfaces: { orderBy: { recordedAt: 'desc' } } },
      orderBy: { toothNumber: 'asc' },
    });

    return Response.json(teeth);
  } catch (error) {
    return handleError(error);
  }
}
