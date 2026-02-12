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

    // Verify access
    const design = await prisma.dsdDesign.findFirst({
      where: { id: designId, practiceId: user.practiceId },
    });
    if (!design) throw new ApiError('Design niet gevonden', 404);

    const versions = await prisma.dsdDesignVersion.findMany({
      where: { designId },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        createdBy: true,
        notes: true,
        createdAt: true,
      },
    });

    return Response.json(versions);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ designId: string }> },
) {
  try {
    const user = await withAuth(request);
    const { designId } = await params;
    const body = await request.json();

    // Verify access
    const design = await prisma.dsdDesign.findFirst({
      where: { id: designId, practiceId: user.practiceId },
    });
    if (!design) throw new ApiError('Design niet gevonden', 404);

    const { landmarkData, calibrationData, measurements, derivedLines, notes } = body;
    if (!landmarkData) {
      throw new ApiError('landmarkData is required', 400);
    }

    // Get next version number
    const lastVersion = await prisma.dsdDesignVersion.findFirst({
      where: { designId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await prisma.dsdDesignVersion.create({
      data: {
        designId,
        versionNumber,
        createdBy: user.id,
        landmarkData,
        calibrationData: calibrationData ?? undefined,
        measurements: measurements ?? undefined,
        derivedLines: derivedLines ?? undefined,
        notes,
      },
    });

    // Update design timestamp
    await prisma.dsdDesign.update({
      where: { id: designId },
      data: { status: 'IN_PROGRESS' },
    });

    return Response.json(version, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
