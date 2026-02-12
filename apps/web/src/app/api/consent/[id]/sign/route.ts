import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;
    const { signatureData, signedByName } = await request.json();

    if (!signatureData || !signedByName) {
      throw new ApiError('Handtekening en naam zijn verplicht', 400);
    }

    const form = await prisma.consentForm.findFirst({
      where: { id, practiceId: user.practiceId },
    });

    if (!form) throw new ApiError('Toestemmingsformulier niet gevonden', 404);
    if (form.status === 'SIGNED') throw new ApiError('Formulier is al ondertekend', 400);

    const updated = await prisma.consentForm.update({
      where: { id },
      data: {
        signatureData,
        signedByName,
        signedAt: new Date(),
        status: 'SIGNED',
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
