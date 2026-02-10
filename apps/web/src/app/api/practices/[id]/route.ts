import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const practice = await prisma.practice.findUnique({
      where: { id },
      include: {
        users: { where: { isActive: true }, orderBy: { lastName: 'asc' } },
      },
    });

    if (!practice) throw new ApiError('Praktijk niet gevonden', 404);
    return Response.json(practice);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);
    const { id } = await params;

    const body = await request.json();
    const updated = await prisma.practice.update({
      where: { id },
      data: body,
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
