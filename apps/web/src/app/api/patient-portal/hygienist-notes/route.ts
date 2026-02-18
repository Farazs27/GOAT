import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, handleError, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('Niet geautoriseerd', 401);
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload.patientId) {
      throw new AuthError('Geen patiententoegang', 403);
    }

    const notes = await prisma.clinicalNote.findMany({
      where: {
        patientId: payload.patientId,
        noteType: 'HYGIENE',
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return simplified view: only home care instructions and next visit info
    const simplified = notes.map((note) => {
      let content: Record<string, any> = {};
      try {
        content = typeof note.content === 'string' ? JSON.parse(note.content) : {};
      } catch {
        content = {};
      }

      return {
        id: note.id,
        createdAt: note.createdAt.toISOString(),
        authorName: `${note.author.firstName} ${note.author.lastName}`,
        homeCareInstructions: content.homeCareInstructions || '',
        nextVisitRecommendation: content.nextVisitRecommendation || '',
      };
    });

    return Response.json(simplified);
  } catch (error) {
    return handleError(error);
  }
}
