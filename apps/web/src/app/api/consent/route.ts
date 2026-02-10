import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { CONSENT_TEMPLATES } from '@/lib/consent-templates';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');

    if (!patientId) throw new ApiError('Pati\u00ebnt ID is verplicht', 400);

    const forms = await prisma.consentForm.findMany({
      where: { practiceId: user.practiceId, patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(forms);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, treatmentType, title, customContent } = body;

    if (!patientId || !treatmentType) {
      throw new ApiError('Pati\u00ebnt en behandeltype zijn verplicht', 400);
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const template = CONSENT_TEMPLATES[treatmentType] || CONSENT_TEMPLATES['GENERAL'];

    const form = await prisma.consentForm.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        consentType: 'TREATMENT',
        treatmentType,
        title: title || template.title,
        content: customContent || template.content,
        description: title || template.title,
        status: 'PENDING',
      },
    });

    return Response.json(form, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
