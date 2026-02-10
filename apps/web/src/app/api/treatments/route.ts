import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, description, toothId, nzaCodeId, durationMinutes, notes } = body;

    if (!patientId || !description) {
      throw new ApiError('Pati\u00ebnt en omschrijving zijn verplicht', 400);
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const treatment = await prisma.treatment.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        performedBy: user.id,
        description,
        toothId,
        nzaCodeId,
        durationMinutes,
        notes,
        status: 'COMPLETED',
        performedAt: new Date(),
      },
      include: { nzaCode: true, tooth: true },
    });

    return Response.json(treatment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
