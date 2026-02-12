import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const categories = await prisma.patientCategory.findMany({
      where: { patient: { id, practiceId: user.practiceId } },
      select: { category: true },
      orderBy: { assignedAt: 'asc' },
    });

    return Response.json(categories.map(c => c.category));
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;
    const { categories } = await request.json() as { categories: string[] };

    // Verify patient belongs to practice
    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!patient) {
      return Response.json({ error: 'Patient niet gevonden' }, { status: 404 });
    }

    // Delete all existing and recreate
    await prisma.patientCategory.deleteMany({ where: { patientId: id } });

    if (categories.length > 0) {
      await prisma.patientCategory.createMany({
        data: categories.map(category => ({ patientId: id, category })),
      });
    }

    return Response.json(categories);
  } catch (error) {
    return handleError(error);
  }
}
