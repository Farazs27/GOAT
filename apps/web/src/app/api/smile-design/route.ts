import { NextRequest } from 'next/server';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const designs = await prisma.dsdDesign.findMany({
      where: {
        practiceId: user.practiceId,
        ...(patientId ? { patientId } : {}),
        status: { not: 'ARCHIVED' },
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        creator: { select: { firstName: true, lastName: true } },
        image: { select: { filePath: true, fileName: true } },
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Response.json(designs);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();

    const { title, patientId, imageId, notes } = body;
    if (!title || !patientId || !imageId) {
      throw new ApiError('title, patientId, and imageId are required', 400);
    }

    // Verify patient belongs to practice
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Patient niet gevonden', 404);

    // Verify image belongs to patient
    const image = await prisma.patientImage.findFirst({
      where: { id: imageId, patientId },
    });
    if (!image) throw new ApiError('Afbeelding niet gevonden', 404);

    const design = await prisma.dsdDesign.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        createdBy: user.id,
        title,
        notes,
        imageId,
        versions: {
          create: {
            versionNumber: 1,
            createdBy: user.id,
            landmarkData: { landmarks: [] },
            notes: 'Initial version',
          },
        },
      },
      include: {
        versions: true,
        patient: { select: { firstName: true, lastName: true } },
        image: { select: { filePath: true, fileName: true } },
      },
    });

    return Response.json(design, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
