import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);

    const channel = searchParams.get('channel');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {
      practiceId: user.practiceId,
    };

    if (channel) {
      where.channel = channel;
    }

    if (dateFrom || dateTo) {
      const sentAt: Record<string, Date> = {};
      if (dateFrom) sentAt.gte = new Date(dateFrom);
      if (dateTo) sentAt.lte = new Date(dateTo);
      where.sentAt = sentAt;
    }

    const [nudges, total] = await Promise.all([
      prisma.patientNudge.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          patient: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.patientNudge.count({ where }),
    ]);

    // Check if patients have booked since each nudge
    const enriched = await Promise.all(
      nudges.map(async (nudge) => {
        const hasBookedSince = await prisma.appointment.count({
          where: {
            patientId: nudge.patientId,
            createdAt: { gt: nudge.sentAt },
            status: { notIn: ['CANCELLED'] },
          },
        });

        return {
          id: nudge.id,
          patient: nudge.patient,
          nudgeType: nudge.nudgeType,
          channel: nudge.channel,
          message: nudge.message,
          sentAt: nudge.sentAt,
          clickedAt: nudge.clickedAt,
          bookedAt: nudge.bookedAt,
          hasBookedSince: hasBookedSince > 0,
        };
      }),
    );

    return Response.json({ nudges: enriched, total });
  } catch (error) {
    return handleError(error);
  }
}
