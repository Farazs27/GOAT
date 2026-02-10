import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId') || undefined;
    const appointmentId = url.searchParams.get('appointmentId') || undefined;

    const where: any = { practiceId: user.practiceId };
    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;

    const notes = await prisma.clinicalNote.findMany({
      where,
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(notes);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, appointmentId, noteType, content, isConfidential } = body;

    if (!patientId || !noteType || !content) {
      throw new ApiError('Pati\u00ebnt, notetype en inhoud zijn verplicht', 400);
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const note = await prisma.clinicalNote.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        appointmentId,
        authorId: user.id,
        noteType: noteType as any,
        content,
        isConfidential: isConfidential ?? false,
      },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return Response.json(note, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
