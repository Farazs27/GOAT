import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const toothNumber = url.searchParams.get('toothNumber');
    const nzaCode = url.searchParams.get('nzaCode');

    if (!patientId) {
      throw new ApiError('patientId is verplicht', 400);
    }

    const where: any = {
      practiceId: user.practiceId,
      patientId,
    };

    // Filter by tooth number if provided
    if (toothNumber) {
      where.tooth = { toothNumber: parseInt(toothNumber, 10) };
    }

    // Filter by NZa code if provided
    if (nzaCode) {
      where.nzaCode = { code: nzaCode };
    }

    const treatments = await prisma.treatment.findMany({
      where,
      include: {
        performer: { select: { firstName: true, lastName: true } },
        nzaCode: { select: { code: true, descriptionNl: true } },
        tooth: { select: { toothNumber: true } },
        appointment: { select: { id: true, startTime: true, appointmentType: true } },
        treatmentPlan: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = treatments.map((t) => ({
      id: t.id,
      description: t.description,
      status: t.status,
      performedAt: t.performedAt,
      createdAt: t.createdAt,
      nzaCode: t.nzaCode?.code || null,
      nzaDescription: t.nzaCode?.descriptionNl || null,
      toothNumber: t.tooth?.toothNumber || null,
      practitionerName: `${t.performer.firstName} ${t.performer.lastName}`,
      appointmentDate: t.appointment?.startTime || null,
      appointmentType: t.appointment?.appointmentType || null,
      treatmentPlanTitle: t.treatmentPlan?.title || null,
    }));

    return Response.json(result);
  } catch (error) {
    return handleError(error);
  }
}
