import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const appointmentId = url.searchParams.get('appointmentId') || undefined;
    const status = url.searchParams.get('status') || undefined;

    if (!patientId) {
      throw new ApiError('patientId is verplicht', 400);
    }

    const where: any = { practiceId: user.practiceId, patientId };
    if (appointmentId) where.appointmentId = appointmentId;
    if (status) where.status = status;

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        prescriber: { select: { firstName: true, lastName: true } },
      },
      orderBy: { prescribedAt: 'desc' },
    });

    return Response.json({ data: prescriptions });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();

    const { patientId, medicationName, dosage, frequency } = body;
    if (!patientId || !medicationName || !dosage || !frequency) {
      throw new ApiError('patientId, medicationName, dosage en frequency zijn verplicht', 400);
    }

    const prescription = await prisma.prescription.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        appointmentId: body.appointmentId || undefined,
        prescribedBy: user.id,
        medicationName,
        genericName: body.genericName || undefined,
        dosage,
        frequency,
        duration: body.duration || undefined,
        quantity: body.quantity || undefined,
        route: body.route || 'oraal',
        instructions: body.instructions || undefined,
      },
      include: {
        prescriber: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(prescription, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
