import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);
    const { id } = await params;

    const found = await prisma.user.findFirst({
      where: { id, practiceId: user.practiceId },
      include: { practice: true },
    });

    if (!found) throw new ApiError('Gebruiker niet gevonden', 404);
    return Response.json(found);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);
    const { id } = await params;

    const existing = await prisma.user.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Gebruiker niet gevonden', 404);

    const body = await request.json();
    const { email, firstName, lastName, role, phone, bigNumber, agbCode, specialization, isActive } = body;

    if (email && email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup) throw new ApiError('E-mailadres is al in gebruik', 409);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { email, firstName, lastName, role: role as any, phone, bigNumber, agbCode, specialization, isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);
    const { id } = await params;

    const existing = await prisma.user.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Gebruiker niet gevonden', 404);

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return Response.json({ message: 'Gebruiker gedeactiveerd' });
  } catch (error) {
    return handleError(error);
  }
}
