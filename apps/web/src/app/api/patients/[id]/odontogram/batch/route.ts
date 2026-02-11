import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Patiënt niet gevonden', 404);

    const body = await request.json();
    const { teeth } = body; // Array of { toothNumber, status?, surfaces? }

    const results = await prisma.$transaction(async (tx) => {
      const updated = [];
      for (const item of teeth) {
        // Upsert tooth
        const tooth = await tx.tooth.upsert({
          where: { patientId_toothNumber: { patientId: id, toothNumber: item.toothNumber } },
          create: {
            practiceId: user.practiceId,
            patientId: id,
            toothNumber: item.toothNumber,
            status: item.status || 'PRESENT',
          },
          update: {
            ...(item.status ? { status: item.status } : {}),
          },
        });

        // Create surfaces if provided
        if (item.surfaces?.length) {
          for (const surf of item.surfaces) {
            await tx.toothSurface.create({
              data: {
                practiceId: user.practiceId,
                toothId: tooth.id,
                surface: surf.surface,
                condition: surf.condition,
                material: surf.material || null,
                restorationType: surf.restorationType || null,
                recordedBy: user.id,
              },
            });
          }
        }

        updated.push(tooth);
      }
      return updated;
    });

    return Response.json({ updated: results });
  } catch (error) {
    return handleError(error);
  }
}
