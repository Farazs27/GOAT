import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const note = await prisma.clinicalNote.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    if (!note) throw new ApiError('Klinische notitie niet gevonden', 404);
    return Response.json(note);
  } catch (error) {
    return handleError(error);
  }
}
