import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const session = await prisma.perioSession.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        sites: true,
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!session) {
      return Response.json({ message: 'Sessie niet gevonden' }, { status: 404 });
    }

    return Response.json(session);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.perioSession.findFirst({
      where: { id, practiceId: user.practiceId },
    });

    if (!existing) {
      return Response.json({ message: 'Sessie niet gevonden' }, { status: 404 });
    }

    const { sessionNote, sessionType, sites } = body;

    const session = await prisma.$transaction(async (tx) => {
      await tx.perioSession.update({
        where: { id },
        data: {
          ...(sessionNote !== undefined && { sessionNote }),
          ...(sessionType !== undefined && { sessionType }),
        },
      });

      if (sites && Array.isArray(sites)) {
        await tx.perioSite.deleteMany({ where: { sessionId: id } });

        if (sites.length > 0) {
          await tx.perioSite.createMany({
            data: sites.map((s: Record<string, unknown>) => ({
              sessionId: id,
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
      }

      return tx.perioSession.findUnique({
        where: { id },
        include: {
          sites: true,
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    return Response.json(session);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.perioSession.findFirst({
      where: { id, practiceId: user.practiceId },
    });

    if (!existing) {
      return Response.json({ message: 'Sessie niet gevonden' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.perioSite.deleteMany({ where: { sessionId: id } });
      await tx.perioSession.delete({ where: { id } });
    });

    return Response.json({ message: 'Sessie verwijderd' });
  } catch (error) {
    return handleError(error);
  }
}
