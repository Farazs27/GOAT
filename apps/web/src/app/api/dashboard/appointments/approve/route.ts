import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);

    const body = await request.json();
    const { appointmentId, action, reason } = body as {
      appointmentId: string;
      action: 'approve' | 'reject';
      reason?: string;
    };

    if (!appointmentId || !action || !['approve', 'reject'].includes(action)) {
      throw new ApiError('appointmentId en action (approve/reject) zijn verplicht', 400);
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, practiceId: user.practiceId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!appointment) {
      throw new ApiError('Afspraak niet gevonden', 404);
    }

    if (appointment.status !== 'PENDING_APPROVAL') {
      throw new ApiError('Afspraak heeft niet de status PENDING_APPROVAL', 400);
    }

    const dateStr = new Date(appointment.startTime).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeStr = new Date(appointment.startTime).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (action === 'approve') {
      const updated = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'CONFIRMED' },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            practitioner: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        await tx.notification.create({
          data: {
            practiceId: user.practiceId,
            patientId: appointment.patient.id,
            channel: 'IN_APP',
            template: 'booking_approved',
            subject: 'Afspraak bevestigd',
            content: `Uw afspraak op ${dateStr} om ${timeStr} is bevestigd.`,
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        return appt;
      });

      return Response.json(updated);
    } else {
      const rejectReason = reason || 'Geen reden opgegeven';

      const updated = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            practitioner: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        await tx.notification.create({
          data: {
            practiceId: user.practiceId,
            patientId: appointment.patient.id,
            channel: 'IN_APP',
            template: 'booking_rejected',
            subject: 'Afspraak afgewezen',
            content: `Uw afspraak op ${dateStr} is helaas afgewezen. ${rejectReason}`,
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        return appt;
      });

      return Response.json(updated);
    }
  } catch (error) {
    return handleError(error);
  }
}
