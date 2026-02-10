import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const images = await prisma.patientImage.findMany({
      where: { patientId: id, practiceId: user.practiceId },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(images);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('imageType') as string || 'OTHER';
    const notes = formData.get('notes') as string || '';

    if (!file) throw new ApiError('Bestand is verplicht', 400);

    // Upload to Vercel Blob
    const blob = await put(`patients/${id}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    const image = await prisma.patientImage.create({
      data: {
        practiceId: user.practiceId,
        patientId: id,
        uploadedBy: user.id,
        fileName: file.name,
        filePath: blob.url,
        fileSize: file.size,
        mimeType: file.type,
        imageType: imageType as any,
        notes,
      },
    });

    return Response.json(image, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
