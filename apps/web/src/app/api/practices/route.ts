import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN]);

    const practices = await prisma.practice.findMany({
      orderBy: { name: 'asc' },
    });

    return Response.json(practices);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN]);

    const body = await request.json();
    const { name, slug, agbCode, kvkNumber, addressStreet, addressCity, addressPostal, phone, email } = body;

    if (!name || !slug) {
      throw new ApiError('Naam en slug zijn verplicht', 400);
    }

    const practice = await prisma.practice.create({
      data: { name, slug, agbCode, kvkNumber, addressStreet, addressCity, addressPostal, phone, email },
    });

    return Response.json(practice, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
