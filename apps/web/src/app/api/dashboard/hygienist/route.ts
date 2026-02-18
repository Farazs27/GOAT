import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, requireRoles } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, ['HYGIENIST']);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86400000);
    const sixMonthsAgo = new Date(todayStart.getTime() - 180 * 86400000);

    // Today's appointments for this hygienist
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        practitionerId: user.id,
        practiceId: user.practiceId,
        startTime: { gte: todayStart, lt: todayEnd },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Pending perio charts: patients with hygiene appointments in last 7 days
    // but no perio chart created within 1 day of that appointment
    const recentHygieneAppts = await prisma.appointment.findMany({
      where: {
        practitionerId: user.id,
        practiceId: user.practiceId,
        appointmentType: { in: ['HYGIENE', 'CLEANING'] },
        startTime: { gte: sevenDaysAgo, lt: todayEnd },
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    const pendingPerioCharts: Array<{ patientId: string; patientName: string; appointmentDate: string }> = [];
    for (const appt of recentHygieneAppts) {
      const chartAfterAppt = await prisma.periodontalChart.findFirst({
        where: {
          patientId: appt.patient.id,
          practiceId: user.practiceId,
          createdAt: {
            gte: new Date(new Date(appt.startTime).getTime() - 86400000),
            lte: new Date(new Date(appt.startTime).getTime() + 86400000),
          },
        },
      });
      if (!chartAfterAppt) {
        pendingPerioCharts.push({
          patientId: appt.patient.id,
          patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
          appointmentDate: appt.startTime.toISOString(),
        });
      }
    }

    // Overdue patients: last hygiene visit > 6 months ago
    const overduePatients = await prisma.$queryRaw<
      Array<{ patient_id: string; first_name: string; last_name: string; last_visit: Date }>
    >`
      SELECT DISTINCT ON (p.id) p.id as patient_id, p.first_name, p.last_name, a.start_time as last_visit
      FROM patients p
      INNER JOIN appointments a ON a.patient_id = p.id
      WHERE a.practitioner_id = ${user.id}
        AND a.practice_id = ${user.practiceId}
        AND a.appointment_type IN ('HYGIENE', 'CLEANING')
        AND a.status = 'COMPLETED'
        AND a.start_time < ${sixMonthsAgo}
        AND NOT EXISTS (
          SELECT 1 FROM appointments a2
          WHERE a2.patient_id = p.id
            AND a2.practitioner_id = ${user.id}
            AND a2.appointment_type IN ('HYGIENE', 'CLEANING')
            AND a2.status = 'COMPLETED'
            AND a2.start_time >= ${sixMonthsAgo}
        )
      ORDER BY p.id, a.start_time DESC
      LIMIT 20
    `;

    // BOP trends: last 5 perio charts by this user
    const recentCharts = await prisma.periodontalChart.findMany({
      where: { authorId: user.id, practiceId: user.practiceId },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const bopTrends = recentCharts.map((chart) => {
      const data = chart.chartData as Record<string, any>;
      let totalSites = 0;
      let bopSites = 0;
      if (data && typeof data === 'object') {
        for (const toothKey of Object.keys(data)) {
          const tooth = data[toothKey];
          if (tooth?.bop) {
            const bopArr = Array.isArray(tooth.bop) ? tooth.bop : [];
            for (const val of bopArr) {
              totalSites++;
              if (val === true || val === 1) bopSites++;
            }
          }
        }
      }
      const bopPercent = totalSites > 0 ? Math.round((bopSites / totalSites) * 100) : 0;
      return {
        date: chart.createdAt.toISOString(),
        bopPercent,
        patientName: `${chart.patient.firstName} ${chart.patient.lastName}`,
      };
    });

    return Response.json({
      todayAppointments: todayAppointments.map((a) => ({
        id: a.id,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        appointmentType: a.appointmentType,
        status: a.status,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        patientId: a.patient.id,
      })),
      pendingPerioCharts,
      overduePatients: overduePatients.map((p) => ({
        patientId: p.patient_id,
        patientName: `${p.first_name} ${p.last_name}`,
        lastVisit: p.last_visit,
        daysOverdue: Math.floor((now.getTime() - new Date(p.last_visit).getTime()) / 86400000),
      })),
      bopTrends: bopTrends.reverse(),
    });
  } catch (error) {
    return handleError(error);
  }
}
