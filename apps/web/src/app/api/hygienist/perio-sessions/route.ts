import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return Response.json({ message: 'patientId is verplicht' }, { status: 400 });
    }

    const sessions = await prisma.perioSession.findMany({
      where: {
        patientId,
        practiceId: user.practiceId,
      },
      include: {
        sites: true,
        author: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(sessions);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();

    const { patientId, appointmentId, sessionType, sessionNote, sites } = body;

    if (!patientId || !sessionType) {
      return Response.json({ message: 'patientId en sessionType zijn verplicht' }, { status: 400 });
    }

    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.perioSession.create({
        data: {
          practiceId: user.practiceId,
          patientId,
          appointmentId: appointmentId || null,
          authorId: user.id,
          sessionType,
          sessionNote: sessionNote || null,
        },
      });

      if (sites && Array.isArray(sites) && sites.length > 0) {
        await tx.perioSite.createMany({
          data: sites.map((s: Record<string, unknown>) => ({
            sessionId: created.id,
            toothNumber: s.toothNumber as number,
            surface: s.surface as string,
            sitePosition: s.sitePosition as string,
            probingDepth: (s.probingDepth as number) || 0,
            gingivalMargin: (s.gingivalMargin as number) || 0,
            bleeding: (s.bleeding as boolean) || false,
            plaque: (s.plaque as boolean) || false,
            suppuration: (s.suppuration as boolean) || false,
            mobility: (s.mobility as number) ?? null,
            furcationGrade: (s.furcationGrade as number) ?? null,
            isImplant: (s.isImplant as boolean) || false,
            toothNote: (s.toothNote as string) || null,
            keratinizedWidth: (s.keratinizedWidth as number) ?? null,
          })),
        });
      }

      return tx.perioSession.findUnique({
        where: { id: created.id },
        include: {
          sites: true,
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    return Response.json(session, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
