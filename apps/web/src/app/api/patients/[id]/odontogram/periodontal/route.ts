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
      },
    });

    return Response.json(chart, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
