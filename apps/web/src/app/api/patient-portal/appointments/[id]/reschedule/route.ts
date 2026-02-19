import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

function check24hRule(startTime: Date) {
  const hoursUntil = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 24) {
    throw new ApiError('Afspraken kunnen alleen tot 24 uur van tevoren worden gewijzigd', 403);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: user.patientId },
    });
    if (!appointment) throw new ApiError('Afspraak niet gevonden', 404);

    check24hRule(appointment.startTime);

    const durationMs = appointment.endTime.getTime() - appointment.startTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    // Look at the next 14 days for available slots
    const startSearch = new Date();
    startSearch.setHours(0, 0, 0, 0);
    startSearch.setDate(startSearch.getDate() + 1); // start from tomorrow
    const endSearch = new Date(startSearch);
    endSearch.setDate(endSearch.getDate() + 14);

    // Get practitioner's schedule
    const schedules = await prisma.practitionerSchedule.findMany({
      where: {
        practitionerId: appointment.practitionerId,
        practiceId: appointment.practiceId,
        isActive: true,
      },
    });

    // Get existing appointments in that range
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        practitionerId: appointment.practitionerId,
        startTime: { gte: startSearch, lt: endSearch },
        status: { notIn: ['CANCELLED'] },
        id: { not: appointment.id }, // exclude current appointment
      },
      orderBy: { startTime: 'asc' },
    });

    // Find available slots
    const slots: { date: string; startTime: string; endTime: string }[] = [];
    const current = new Date(startSearch);

    while (current < endSearch && slots.length < 5) {
      // dayOfWeek: 0=Monday in schema
      const jsDay = current.getDay(); // 0=Sunday
      const schemaDay = jsDay === 0 ? 6 : jsDay - 1; // convert to 0=Monday

      const daySchedules = schedules.filter(s => s.dayOfWeek === schemaDay);

      for (const schedule of daySchedules) {
        if (slots.length >= 5) break;

        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);

        const slotStart = new Date(current);
        slotStart.setHours(startH, startM, 0, 0);

        const scheduleEnd = new Date(current);
        scheduleEnd.setHours(endH, endM, 0, 0);

        while (slotStart.getTime() + durationMinutes * 60000 <= scheduleEnd.getTime() && slots.length < 5) {
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

          // Check no overlap with existing appointments
          const hasConflict = existingAppointments.some(existing => {
            return slotStart < existing.endTime && slotEnd > existing.startTime;
          });

          if (!hasConflict && slotStart > new Date()) {
            slots.push({
              date: slotStart.toISOString().split('T')[0],
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
            });
          }

          slotStart.setMinutes(slotStart.getMinutes() + (schedule.slotDuration || 15));
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return Response.json({ slots });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: user.patientId },
    });
    if (!appointment) throw new ApiError('Afspraak niet gevonden', 404);

    check24hRule(appointment.startTime);

    const body = await request.json();
    const { slotStart } = body;
    if (!slotStart) throw new ApiError('slotStart is verplicht', 400);

    const newStart = new Date(slotStart);
    const durationMs = appointment.endTime.getTime() - appointment.startTime.getTime();
    const newEnd = new Date(newStart.getTime() + durationMs);

    // Verify slot is still available (optimistic lock)
    const conflict = await prisma.appointment.findFirst({
      where: {
        practitionerId: appointment.practitionerId,
        id: { not: appointment.id },
        status: { notIn: ['CANCELLED'] },
        startTime: { lt: newEnd },
        endTime: { gt: newStart },
      },
    });

    if (conflict) {
      throw new ApiError('Dit tijdstip is niet meer beschikbaar', 409);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        startTime: newStart,
        endTime: newEnd,
        durationMinutes: Math.round(durationMs / 60000),
      },
      include: {
        practitioner: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
