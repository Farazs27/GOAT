import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const forms = await prisma.consentForm.findMany({
      where: { patientId: user.patientId },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(forms);
  } catch (error) {
    return handleError(error);
  }
}
