import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.scheduleException.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Uitzondering niet gevonden', 404);

    await prisma.scheduleException.delete({ where: { id } });
    return Response.json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
