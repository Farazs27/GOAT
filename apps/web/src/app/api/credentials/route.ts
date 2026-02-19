import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

function maskSecret(secret: string): string {
  if (!secret || secret.length < 4) return '****';
  return '****' + secret.slice(-4);
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);

    const credentials = await prisma.credential.findMany({
      where: { practiceId: user.practiceId },
      orderBy: { createdAt: 'desc' },
    });

    const masked = credentials.map((c: any) => ({
      ...c,
      apiKey: c.apiKey ? maskApiKey(c.apiKey) : null,
      apiSecret: c.apiSecret ? maskSecret(c.apiSecret) : null,
      accessToken: c.accessToken ? maskSecret(c.accessToken) : null,
      refreshToken: c.refreshToken ? maskSecret(c.refreshToken) : null,
    }));

    return Response.json(masked);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);

    const body = await request.json();
    const { name, type, environment, apiKey, apiSecret, accessToken, refreshToken, config, isTestMode, expiresAt } = body;

    if (!name || !type) {
      throw new ApiError('Naam en type zijn verplicht', 400);
    }

    const credential = await prisma.credential.create({
      data: {
        practiceId: user.practiceId,
        name,
        type,
        environment: environment || 'PRODUCTION',
        apiKey,
        apiSecret,
        accessToken,
        refreshToken,
        config: config || {},
        isTestMode: isTestMode ?? false,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    return Response.json({
      ...credential,
      apiKey: credential.apiKey ? maskApiKey(credential.apiKey) : null,
      apiSecret: credential.apiSecret ? maskSecret(credential.apiSecret) : null,
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
