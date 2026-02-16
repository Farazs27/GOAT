import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; toothNumber: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id, toothNumber } = await params;
    const toothNum = parseInt(toothNumber, 10);

    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Patiënt niet gevonden', 404);

    const tooth = await prisma.tooth.findFirst({
      where: { patientId: id, toothNumber: toothNum, practiceId: user.practiceId },
    });
    if (!tooth) {
      return Response.json({ treatments: [] });
    }

    // Query actual Treatment records with linked surfaces
    const treatments = await prisma.treatment.findMany({
      where: { toothId: tooth.id, practiceId: user.practiceId },
      include: {
        performer: { select: { firstName: true, lastName: true } },
        toothSurfaces: { select: { surface: true, condition: true, material: true, restorationType: true } },
      },
      orderBy: { performedAt: 'desc' },
    });

    if (treatments.length > 0) {
      const result = treatments.map((t) => ({
        id: t.id,
        date: (t.performedAt || t.createdAt).toISOString(),
        description: t.description,
        nzaCode: '', // Will be populated in Phase 3 (billing)
        performedBy: t.performer
          ? `${t.performer.firstName ?? ''} ${t.performer.lastName ?? ''}`.trim()
          : 'Onbekend',
        surfaces: t.toothSurfaces.map((s) => s.surface),
      }));

      return Response.json({ treatments: result });
    }

    // Fallback: legacy surface-grouping for old data without Treatment records
    const surfaces = await prisma.toothSurface.findMany({
      where: { toothId: tooth.id },
      include: {
        recorder: { select: { firstName: true, lastName: true } },
      },
      orderBy: { recordedAt: 'desc' },
    });

    const grouped = new Map<string, typeof surfaces>();
    for (const s of surfaces) {
      const key = s.recordedAt.toISOString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(s);
    }

    const fallbackTreatments = Array.from(grouped.entries()).map(([dateStr, items]) => {
      const first = items[0];
      const recorderName = first.recorder
        ? `${first.recorder.firstName ?? ''} ${first.recorder.lastName ?? ''}`.trim()
        : 'Onbekend';

      return {
        id: first.id,
        date: dateStr,
        description: `${first.restorationType || first.condition} \u2014 ${first.material || ''}`.trim(),
        nzaCode: '',
        performedBy: recorderName,
        surfaces: items.map((i) => i.surface),
      };
    });

    return Response.json({ treatments: fallbackTreatments });
  } catch (error) {
    return handleError(error);
  }
}
