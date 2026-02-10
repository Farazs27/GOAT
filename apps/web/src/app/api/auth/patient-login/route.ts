import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, handleError } from '@/lib/auth';
import { UserRole, RolePermissions } from '@dentflow/shared-types';

export async function POST(request: NextRequest) {
  try {
    const { email, bsnLastFour } = await request.json();

    if (!email || !bsnLastFour || bsnLastFour.length !== 4) {
      return Response.json({ message: 'E-mail en laatste 4 cijfers BSN zijn verplicht' }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { email: email.toLowerCase(), isActive: true },
    });

    if (!patient) {
      return Response.json({ message: 'Ongeldige inloggegevens' }, { status: 401 });
    }

    const bsn = patient.bsn || '';
    if (!bsn || bsn.slice(-4) !== bsnLastFour) {
      return Response.json({ message: 'Ongeldige inloggegevens' }, { status: 401 });
    }

    const permissions = RolePermissions[UserRole.PATIENT] || [];
    const tokenPayload = {
      sub: patient.id,
      email: patient.email!,
      role: UserRole.PATIENT,
      practiceId: patient.practiceId,
      patientId: patient.id,
    };

    return Response.json({
      access_token: signAccessToken(tokenPayload, '2h'),
      refresh_token: signRefreshToken(tokenPayload, '24h'),
      patient: {
        id: patient.id,
        email: patient.email,
        firstName: patient.firstName,
        lastName: patient.lastName,
        practiceId: patient.practiceId,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
