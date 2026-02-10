import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const practiceId = user.practiceId;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalPatients,
      appointmentsToday,
      appointmentsMonth,
      recentAuditLogs,
      activeCredentials,
    ] = await Promise.all([
      prisma.user.count({ where: { practiceId, isActive: true } }),
      prisma.patient.count({ where: { practiceId } }),
      prisma.appointment.count({
        where: { practiceId, startTime: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.appointment.count({
        where: { practiceId, startTime: { gte: startOfMonth, lt: endOfDay } },
      }),
      prisma.auditLog.findMany({
        where: { practiceId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.credential.count({ where: { practiceId, isActive: true } }),
    ]);

    let revenueMonth = 0;
    let revenueToday = 0;
    try {
      const monthInvoices = await prisma.invoice.aggregate({
        where: { practiceId, status: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      });
      revenueMonth = Number(monthInvoices._sum.total || 0);

      const todayInvoices = await prisma.invoice.aggregate({
        where: { practiceId, status: 'PAID', createdAt: { gte: startOfDay, lt: endOfDay } },
        _sum: { total: true },
      });
      revenueToday = Number(todayInvoices._sum.total || 0);
    } catch {
      // graceful fallback
    }

    return Response.json({
      totalUsers,
      totalPatients,
      appointmentsToday,
      appointmentsMonth,
      revenueToday,
      revenueMonth,
      activeCredentials,
      recentAuditLogs,
    });
  } catch (error) {
    return handleError(error);
  }
}
