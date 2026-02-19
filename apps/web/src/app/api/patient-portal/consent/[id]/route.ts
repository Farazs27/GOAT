import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const form = await prisma.consentForm.findFirst({
      where: { id, patientId: user.patientId },
    });
    if (!form) throw new ApiError('Toestemmingsformulier niet gevonden', 404);

    return Response.json(form);
  } catch (error) {
    return handleError(error);
  }
}
