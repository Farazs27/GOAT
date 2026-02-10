import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const practiceId = user.practiceId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [outstanding, monthTotal, overdueCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: { practiceId, status: { in: ['SENT', 'OVERDUE'] } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { practiceId, createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.invoice.count({
        where: { practiceId, status: 'OVERDUE' },
      }),
    ]);

    return Response.json({
      outstandingAmount: Number(outstanding._sum.total || 0),
      monthTotal: Number(monthTotal._sum.total || 0),
      overdueCount,
    });
  } catch (error) {
    return handleError(error);
  }
}
