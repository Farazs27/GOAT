import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const now = new Date();

    // Find patients with exactly 1 completed appointment in last 30 days and no future appointments
    const patients = await prisma.patient.findMany({
      where: {
        practiceId: user.practiceId,
        appointments: {
          some: {
            status: 'COMPLETED',
            startTime: { gte: thirtyDaysAgo },
          },
        },
      },
      include: {
        appointments: {
          select: { id: true, startTime: true, status: true, appointmentType: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    // Filter: exactly 1 completed appointment total, no future appointments
    const result = patients
      .filter((p) => {
        const completed = p.appointments.filter((a) => a.status === 'COMPLETED');
        const future = p.appointments.filter((a) => new Date(a.startTime) > now && !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));
        return completed.length === 1 && future.length === 0;
      })
      .map((p) => {
        const firstVisit = p.appointments.find((a) => a.status === 'COMPLETED');
        return {
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          patientNumber: p.patientNumber,
          firstVisitDate: firstVisit?.startTime,
          firstVisitType: firstVisit?.appointmentType,
        };
      });

    // Check for recent follow-up reminder notifications
    const patientIds = result.map(p => p.id);
    const recentReminders = patientIds.length > 0
      ? await prisma.notification.findMany({
          where: {
            patientId: { in: patientIds },
            template: 'followup-reminder',
            status: 'SENT',
            sentAt: { gte: thirtyDaysAgo },
          },
          select: { patientId: true, sentAt: true },
          orderBy: { sentAt: 'desc' },
        })
      : [];

    const reminderMap = new Map<string, Date>();
    for (const r of recentReminders) {
      if (r.patientId && !reminderMap.has(r.patientId)) {
        reminderMap.set(r.patientId, r.sentAt!);
      }
    }

    const enriched = result.map(p => ({
      ...p,
      contactedAt: reminderMap.get(p.id)?.toISOString() || null,
    }));

    return Response.json(enriched);
  } catch (error) {
    return handleError(error);
  }
}
