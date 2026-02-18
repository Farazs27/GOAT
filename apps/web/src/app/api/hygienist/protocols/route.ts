import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_STEPS = [
  { name: 'Initieel onderzoek', status: 'PENDING' },
  { name: 'Scaling Q1/Q2', status: 'PENDING' },
  { name: 'Herevaluatie', status: 'PENDING' },
  { name: 'Scaling Q3/Q4', status: 'PENDING' },
];

export async function GET(request: Request) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is verplicht' }, { status: 400 });
    }

    const protocols = await prisma.perioProtocol.findMany({
      where: {
        practiceId: user.practiceId,
        patientId,
      },
      include: {
        sessions: {
          select: { id: true, createdAt: true, sessionType: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(protocols);
  } catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, steps, id, sessionId } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is verplicht' }, { status: 400 });
    }

    // Update existing protocol (link session or update steps)
    if (id) {
      const existing = await prisma.perioProtocol.findFirst({
        where: { id, practiceId: user.practiceId },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Protocol niet gevonden' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};
      if (steps) updateData.steps = steps;
      if (sessionId) {
        updateData.sessions = { connect: { id: sessionId } };
      }

      const updated = await prisma.perioProtocol.update({
        where: { id },
        data: updateData,
        include: {
          sessions: {
            select: { id: true, createdAt: true, sessionType: true },
          },
        },
      });

      return NextResponse.json(updated);
    }

    // Create new protocol
    const protocol = await prisma.perioProtocol.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        steps: steps ?? DEFAULT_STEPS,
      },
      include: {
        sessions: {
          select: { id: true, createdAt: true, sessionType: true },
        },
      },
    });

    return NextResponse.json(protocol, { status: 201 });
  } catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status });
  }
}
