import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id: patientId } = await params;

    const charts = await prisma.periodontalChart.findMany({
      where: {
        patientId,
        practiceId: user.practiceId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const result = charts.map((chart) => ({
      id: chart.id,
      chartData: chart.chartData,
      sessionNote: chart.sessionNote,
      createdAt: chart.createdAt,
      authorName: [chart.author.firstName, chart.author.lastName].filter(Boolean).join(' '),
    }));

    return Response.json(result);
  } catch (error) {
    return handleError(error);
  }
}
