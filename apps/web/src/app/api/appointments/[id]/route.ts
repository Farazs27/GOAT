import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, patientNumber: true, medicalAlerts: true, medications: true },
        },
        practitioner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!appointment) throw new ApiError('Afspraak niet gevonden', 404);
    return Response.json(appointment);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.appointment.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Afspraak niet gevonden', 404);

    const body = await request.json();
    const updateData: any = { ...body };
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);
    if (body.status === 'CANCELLED') updateData.cancelledAt = new Date();

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.appointment.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Afspraak niet gevonden', 404);

    await prisma.appointment.delete({ where: { id } });
    return Response.json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
