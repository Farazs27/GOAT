import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { del } from '@vercel/blob';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    const user = await withAuth(request);
    const { id, imageId } = await params;

    const image = await prisma.patientImage.findFirst({
      where: { id: imageId, patientId: id, practiceId: user.practiceId },
    });
    if (!image) throw new ApiError('Afbeelding niet gevonden', 404);

    // Delete from Vercel Blob
    if (image.filePath) {
      try {
        await del(image.filePath);
      } catch {
        // blob may already be deleted
      }
    }

    await prisma.patientImage.delete({ where: { id: imageId } });
    return Response.json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
