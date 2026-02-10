import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || undefined;
    const practitionerId = url.searchParams.get('practitionerId') || undefined;
    const patientId = url.searchParams.get('patientId') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const where: any = { practiceId: user.practiceId };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.startTime = { gte: start, lte: end };
    }
    if (practitionerId) where.practitionerId = practitionerId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: date ? 'asc' : 'desc' },
      take: date ? undefined : 20,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, patientNumber: true, medicalAlerts: true, medications: true },
        },
        practitioner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return Response.json(appointments);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, practitionerId, startTime, endTime, durationMinutes, appointmentType, room, notes, patientNotes } = body;

    if (!patientId || !practitionerId || !startTime || !endTime) {
      throw new ApiError('Pati\u00ebnt, behandelaar, start- en eindtijd zijn verplicht', 400);
    }

    const appointment = await prisma.appointment.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        practitionerId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMinutes,
        appointmentType,
        room,
        notes,
        patientNotes,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return Response.json(appointment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
