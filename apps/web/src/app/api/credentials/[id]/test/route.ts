import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.SUPER_ADMIN, UserRole.PRACTICE_ADMIN]);
    const { id } = await params;

    const credential = await prisma.credential.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!credential) throw new ApiError('Credential niet gevonden', 404);

    // Simple connection test based on type
    let success = false;
    let message = '';

    try {
      if (credential.type === 'MOLLIE' && credential.apiKey) {
        const res = await fetch('https://api.mollie.com/v2/organizations/me', {
          headers: { Authorization: `Bearer ${credential.apiKey}` },
        });
        success = res.ok;
        message = success ? 'Mollie verbinding succesvol' : `Mollie fout: ${res.status}`;
      } else {
        success = true;
        message = 'Verbinding niet testbaar voor dit type — gemarkeerd als actief';
      }
    } catch (e: any) {
      message = `Verbindingsfout: ${e.message}`;
    }

    await prisma.credential.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });

    return Response.json({ success, message });
  } catch (error) {
    return handleError(error);
  }
}
