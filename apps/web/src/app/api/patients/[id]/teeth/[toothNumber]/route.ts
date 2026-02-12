import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; toothNumber: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id, toothNumber } = await params;
    const toothNum = parseInt(toothNumber, 10);
    const body = await request.json();

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Patiënt niet gevonden', 404);

    const tooth = await prisma.tooth.upsert({
      where: {
        patientId_toothNumber: { patientId: id, toothNumber: toothNum },
      },
      update: {
        status: body.status,
      },
      create: {
        patientId: id,
        practiceId: user.practiceId,
        toothNumber: toothNum,
        status: body.status,
        isPrimary: false,
      },
    });

    return Response.json({ tooth });
  } catch (error) {
    return handleError(error);
  }
}
