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

    // Get surface records grouped by recordedAt as treatment entries
    const surfaces = await prisma.toothSurface.findMany({
      where: { toothId: tooth.id },
      include: {
        recorder: { select: { firstName: true, lastName: true } },
      },
      orderBy: { recordedAt: 'desc' },
    });

    // Group surfaces by recordedAt timestamp (same timestamp = same treatment action)
    const grouped = new Map<string, typeof surfaces>();
    for (const s of surfaces) {
      const key = s.recordedAt.toISOString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(s);
    }

    const treatments = Array.from(grouped.entries()).map(([dateStr, items]) => {
      const first = items[0];
      const recorderName = first.recorder
        ? `${first.recorder.firstName ?? ''} ${first.recorder.lastName ?? ''}`.trim()
        : 'Onbekend';

      return {
        id: first.id,
        date: dateStr,
        description: `${first.restorationType || first.condition} — ${first.material || ''}`.trim(),
        nzaCode: '',
        performedBy: recorderName,
        surfaces: items.map((i) => i.surface),
      };
    });

    return Response.json({ treatments });
  } catch (error) {
    return handleError(error);
  }
}
