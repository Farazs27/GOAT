import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';
import { createEvent, EventAttributes } from 'ics';

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
  HYGIENE: 'Mondhygiëne',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: user.patientId },
      include: {
        practitioner: { select: { firstName: true, lastName: true } },
        practice: { select: { name: true } },
      },
    });
    if (!appointment) throw new ApiError('Afspraak niet gevonden', 404);

    const start = appointment.startTime;
    const durationMinutes = appointment.durationMinutes;
    const typeLabel = typeLabels[appointment.appointmentType] || appointment.appointmentType;

    const event: EventAttributes = {
      title: `Tandarts afspraak - ${typeLabel}`,
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      duration: { minutes: durationMinutes },
      location: appointment.practice.name,
      description: `Behandelaar: ${appointment.practitioner.firstName} ${appointment.practitioner.lastName}`,
      status: 'CONFIRMED',
    };

    const { error, value } = createEvent(event);
    if (error || !value) {
      throw new ApiError('Kon kalenderbestand niet maken', 500);
    }

    return new Response(value, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="afspraak.ics"',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
