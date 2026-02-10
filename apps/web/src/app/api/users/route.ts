import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { hashPassword } from '@/lib/passwords';
import { UserRole } from '@dentflow/shared-types';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const role = url.searchParams.get('role') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const skip = (page - 1) * limit;

    const where: any = { practiceId: user.practiceId };
    if (!includeInactive) where.isActive = true;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastName: 'asc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          bigNumber: true,
          agbCode: true,
          specialization: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return Response.json({
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);

    const body = await request.json();
    const { email, password, firstName, lastName, role, phone, bigNumber, agbCode, specialization } = body;

    if (!email || !password || !role) {
      throw new ApiError('E-mail, wachtwoord en rol zijn verplicht', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError('E-mailadres is al in gebruik', 409);

    const passwordHash = await hashPassword(password);

    const created = await prisma.user.create({
      data: {
        practiceId: user.practiceId,
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as any,
        phone,
        bigNumber,
        agbCode,
        specialization,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
