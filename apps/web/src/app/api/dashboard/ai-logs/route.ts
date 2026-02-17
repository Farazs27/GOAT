import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);

    const patientId = searchParams.get('patientId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const hasFeedback = searchParams.get('hasFeedback');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {
      practiceId: user.practiceId,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }

    if (hasFeedback === 'true') {
      where.messages = {
        some: {
          feedback: { not: null },
        },
      };
    }

    const [sessions, total] = await Promise.all([
      prisma.aiChatSession.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          patient: {
            select: { firstName: true, lastName: true, id: true },
          },
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
      }),
      prisma.aiChatSession.count({ where }),
    ]);

    const enriched = sessions.map((session) => {
      const messageCount = session.messages.length;
      const thumbsUp = session.messages.filter((m) => m.feedback === 'up').length;
      const thumbsDown = session.messages.filter((m) => m.feedback === 'down').length;
      const lastActivity = session.messages.length > 0
        ? session.messages[session.messages.length - 1].createdAt
        : session.createdAt;

      return {
        id: session.id,
        patient: session.patient,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount,
        feedbackSummary: { thumbsUp, thumbsDown },
        lastActivity,
        messages: session.messages,
      };
    });

    return Response.json({ sessions: enriched, total });
  } catch (error) {
    return handleError(error);
  }
}
