import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { id } = await params;

    const session = await prisma.aiChatSession.findFirst({
      where: { id, patientId: user.patientId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            richCards: true,
            feedback: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      throw new ApiError('Sessie niet gevonden', 404);
    }

    return Response.json({
      session: {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
      },
      messages: session.messages,
    });
  } catch (error) {
    return handleError(error);
  }
}
