import { NextRequest } from 'next/server';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> },
) {
  try {
    const user = await withAuth(request);
    const { designId } = await params;

    const design = await prisma.dsdDesign.findFirst({
      where: { id: designId, practiceId: user.practiceId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        creator: { select: { firstName: true, lastName: true } },
        image: { select: { id: true, filePath: true, fileName: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!design) throw new ApiError('Design niet gevonden', 404);

    return Response.json(design);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> },
) {
  try {
    const user = await withAuth(request);
    const { designId } = await params;
    const body = await request.json();

    const existing = await prisma.dsdDesign.findFirst({
      where: { id: designId, practiceId: user.practiceId },
    });
    if (!existing) throw new ApiError('Design niet gevonden', 404);

    const { title, status, notes } = body;
    const design = await prisma.dsdDesign.update({
      where: { id: designId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    return Response.json(design);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> },
) {
  try {
    const user = await withAuth(request);
    const { designId } = await params;

    const existing = await prisma.dsdDesign.findFirst({
      where: { id: designId, practiceId: user.practiceId },
    });
    if (!existing) throw new ApiError('Design niet gevonden', 404);

    await prisma.dsdDesign.update({
      where: { id: designId },
      data: { status: 'ARCHIVED' },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
