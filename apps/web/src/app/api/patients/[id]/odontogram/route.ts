import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Patiënt niet gevonden', 404);

    const teeth = await prisma.tooth.findMany({
      where: { patientId: id, practiceId: user.practiceId },
      include: { surfaces: { orderBy: { recordedAt: 'desc' } } },
      orderBy: { toothNumber: 'asc' },
    });

    // Flatten surfaces for the frontend
    const flatSurfaces = teeth.flatMap((t) =>
      t.surfaces.map((s) => ({
        id: s.id,
        toothNumber: t.toothNumber,
        surface: s.surface,
        condition: s.condition,
        material: s.material,
        restorationType: s.restorationType,
        recordedAt: s.recordedAt,
      }))
    );

    return Response.json({
      teeth: teeth.map((t) => ({
        id: t.id,
        toothNumber: t.toothNumber,
        status: t.status,
        isPrimary: t.isPrimary,
        notes: t.notes,
      })),
      surfaces: flatSurfaces,
    });
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
    if (!patient) throw new ApiError('Patiënt niet gevonden', 404);

    const body = await request.json();
    const { toothNumber, treatmentType, surfaces, status, restorationType, material } = body;

    // Use a transaction to create Tooth, Treatment, and ToothSurface records atomically
    const { tooth, treatment } = await prisma.$transaction(async (tx) => {
      // Upsert the tooth
      const tooth = await tx.tooth.upsert({
        where: { patientId_toothNumber: { patientId: id, toothNumber } },
        create: {
          practiceId: user.practiceId,
          patientId: id,
          toothNumber,
          status: status || 'PRESENT',
        },
        update: {
          ...(status ? { status } : {}),
        },
      });

      // Create a Treatment record for this action
      const description = `${restorationType || treatmentType} \u2014 ${(surfaces || []).join(',')}`;
      const treatment = await tx.treatment.create({
        data: {
          practiceId: user.practiceId,
          patientId: id,
          performedBy: user.id,
          toothId: tooth.id,
          description,
          status: 'COMPLETED',
          performedAt: new Date(),
        },
      });

      // Create surface records linked to the Treatment
      if (surfaces?.length) {
        for (const surf of surfaces) {
          await tx.toothSurface.create({
            data: {
              practiceId: user.practiceId,
              toothId: tooth.id,
              treatmentId: treatment.id,
              surface: surf,
              condition: (
                treatmentType === 'FILLING' ? 'FILLING'
                : treatmentType === 'CROWN_RESTORATION' || treatmentType === 'CROWN' ? 'CROWN'
                : treatmentType === 'INLAY' ? 'INLAY'
                : treatmentType === 'ONLAY' ? 'ONLAY'
                : treatmentType === 'VENEER' ? 'VENEER'
                : treatmentType === 'PARTIAL_CROWN' ? 'PARTIAL_CROWN'
                : treatmentType === 'CARIES' ? 'CARIES'
                : 'FILLING'
              ) as any,
              material: material || null,
              restorationType: restorationType || null,
              recordedBy: user.id,
            },
          });
        }
      }

      return { tooth, treatment };
    });

    // Fetch updated tooth with surfaces
    const updated = await prisma.tooth.findUnique({
      where: { id: tooth.id },
      include: { surfaces: { orderBy: { recordedAt: 'desc' } } },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
