import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const chart = await prisma.periodontalChart.findFirst({
      where: { patientId: id, practiceId: user.practiceId },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(chart);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;
    const body = await request.json();

    const chart = await prisma.periodontalChart.create({
      data: {
        practiceId: user.practiceId,
        patientId: id,
        appointmentId: body.appointmentId,
        authorId: user.id,
        chartData: body.chartData,
        sessionNote: body.sessionNote || null,
      },
    });

    // Auto-create HYGIENE clinical note from perio chart data
    const chartData = body.chartData as Record<string, any>;
    let totalSites = 0;
    let bopSites = 0;
    if (chartData && typeof chartData === 'object') {
      for (const toothKey of Object.keys(chartData)) {
        const tooth = chartData[toothKey];
        if (tooth?.bop) {
          const bopArr = Array.isArray(tooth.bop) ? tooth.bop : [];
          for (const val of bopArr) {
            totalSites++;
            if (val === true || val === 1) bopSites++;
          }
        }
      }
    }
    const bopPercentage = totalSites > 0 ? Math.round((bopSites / totalSites) * 100) : 0;

    await prisma.clinicalNote.create({
      data: {
        practiceId: user.practiceId,
        patientId: id,
        appointmentId: body.appointmentId || null,
        authorId: user.id,
        noteType: 'HYGIENE',
        content: JSON.stringify({
          oralHygieneScore: 0,
          bopPercentage,
          homeCareInstructions: '',
          complianceNotes: '',
          nextVisitRecommendation: '',
          perioChartId: chart.id,
          sessionNote: body.sessionNote || '',
        }),
      },
    });

    return Response.json(chart, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
