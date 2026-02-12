import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> },
) {
  try {
    const user = await withAuth(request);
    const { designId } = await params;

    // Verify access
    const design = await prisma.dsdDesign.findFirst({
      where: { id: designId, practiceId: user.practiceId },
    });
    if (!design) throw new ApiError('Design niet gevonden', 404);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) throw new ApiError('Bestand is verplicht', 400);

    // Validate STL file
    const validTypes = [
      'model/stl',
      'application/sla',
      'application/vnd.ms-pki.stl',
      'application/octet-stream',
    ];
    const isStl = validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.stl');
    if (!isStl) throw new ApiError('Alleen STL-bestanden zijn toegestaan', 400);

    // Upload to Vercel Blob
    const blob = await put(`smile-design/${designId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    // Update the latest version with STL reference
    const latestVersion = await prisma.dsdDesignVersion.findFirst({
      where: { designId },
      orderBy: { versionNumber: 'desc' },
    });

    if (latestVersion) {
      await prisma.dsdDesignVersion.update({
        where: { id: latestVersion.id },
        data: {
          stlFileUrl: blob.url,
          stlFileName: file.name,
        },
      });
    }

    return Response.json({
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
