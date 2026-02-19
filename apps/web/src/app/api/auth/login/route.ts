import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/passwords';
import { signAccessToken, signRefreshToken, handleError } from '@/lib/auth';
import { UserRole, RolePermissions } from '@nexiom/shared-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ message: 'E-mail en wachtwoord zijn verplicht' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      console.error('LOGIN ERROR: DATABASE_URL is not configured');
      return Response.json({ message: 'Server configuratiefout' }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { practice: { select: { id: true, name: true, slug: true } } },
    });

    if (!user || !user.isActive) {
      return Response.json({ message: 'Ongeldige inloggegevens' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return Response.json({ message: 'Ongeldige inloggegevens' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = RolePermissions[user.role as UserRole] || [];
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      practiceId: user.practiceId,
    };

    return Response.json({
      access_token: signAccessToken(tokenPayload, '1h'),
      refresh_token: signRefreshToken(tokenPayload, '8h'),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        practiceId: user.practiceId,
        permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : error);
    return handleError(error);
  }
}
