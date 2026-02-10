import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const form = await prisma.consentForm.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!form) throw new ApiError('Toestemmingsformulier niet gevonden', 404);
    return Response.json(form);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const form = await prisma.consentForm.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!form) throw new ApiError('Toestemmingsformulier niet gevonden', 404);
    if (form.status === 'SIGNED') {
      throw new ApiError('Ondertekende formulieren kunnen niet worden verwijderd', 403);
    }

    await prisma.consentForm.delete({ where: { id } });
    return Response.json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
