import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.practitionerSchedule.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Schema niet gevonden', 404);

    const body = await request.json();
    const updated = await prisma.practitionerSchedule.update({
      where: { id },
      data: body,
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.practitionerSchedule.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Schema niet gevonden', 404);

    await prisma.practitionerSchedule.delete({ where: { id } });
    return Response.json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
