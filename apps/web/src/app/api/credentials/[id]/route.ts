import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

function maskSecret(secret: string): string {
  if (!secret || secret.length < 4) return '****';
  return '****' + secret.slice(-4);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);
    const { id } = await params;

    const credential = await prisma.credential.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!credential) throw new ApiError('Credential niet gevonden', 404);

    return Response.json({
      ...credential,
      apiKey: credential.apiKey ? maskApiKey(credential.apiKey) : null,
      apiSecret: credential.apiSecret ? maskSecret(credential.apiSecret) : null,
      accessToken: credential.accessToken ? maskSecret(credential.accessToken) : null,
      refreshToken: credential.refreshToken ? maskSecret(credential.refreshToken) : null,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);
    const { id } = await params;

    const existing = await prisma.credential.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Credential niet gevonden', 404);

    const body = await request.json();
    const updated = await prisma.credential.update({ where: { id }, data: body });

    return Response.json({
      ...updated,
      apiKey: updated.apiKey ? maskApiKey(updated.apiKey) : null,
      apiSecret: updated.apiSecret ? maskSecret(updated.apiSecret) : null,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);
    const { id } = await params;

    const existing = await prisma.credential.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Credential niet gevonden', 404);

    await prisma.credential.delete({ where: { id } });
    return Response.json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
