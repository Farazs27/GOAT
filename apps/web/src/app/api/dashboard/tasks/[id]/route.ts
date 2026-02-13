import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['NOT_DONE', 'IN_PROGRESS', 'DONE'];
    if (!status || !validStatuses.includes(status)) {
      throw new ApiError('Ongeldige status', 400);
    }

    // Check if this is a custom task (DentistTask)
    let task = await prisma.dentistTask.findFirst({
      where: { id, userId: user.id, practiceId: user.practiceId },
    });

    if (task) {
      // Update existing custom task
      const updated = await prisma.dentistTask.update({
        where: { id },
        data: {
          status,
          completedAt: status === 'DONE' ? new Date() : null,
        },
      });
      return Response.json(updated);
    }

    // This is an auto-generated task — create/update a DentistTask override
    // The id format tells us the type: we receive targetType and targetId in body
    const { targetType, targetId } = body;
    if (!targetType || !targetId) {
      throw new ApiError('targetType en targetId zijn verplicht voor auto-taken', 400);
    }

    const categoryMap: Record<string, string> = {
      'clinical-note': 'CLINICAL_NOTE',
      'invoice': 'INVOICE',
      'prescription': 'PRESCRIPTION',
      'treatment-plan': 'TREATMENT',
      'treatment': 'TREATMENT',
    };

    const category = categoryMap[targetType];
    if (!category) {
      throw new ApiError('Ongeldig targetType', 400);
    }

    const upserted = await prisma.dentistTask.upsert({
      where: {
        userId_targetType_targetId: {
          userId: user.id,
          targetType,
          targetId,
        },
      },
      create: {
        practiceId: user.practiceId,
        userId: user.id,
        title: body.title || 'Auto-taak',
        category: category as any,
        targetType,
        targetId,
        status,
        completedAt: status === 'DONE' ? new Date() : null,
      },
      update: {
        status,
        completedAt: status === 'DONE' ? new Date() : null,
      },
    });

    return Response.json(upserted);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const task = await prisma.dentistTask.findFirst({
      where: { id, userId: user.id, practiceId: user.practiceId },
    });

    if (!task) {
      throw new ApiError('Taak niet gevonden', 404);
    }

    if (task.category !== 'CUSTOM') {
      throw new ApiError('Alleen eigen taken kunnen worden verwijderd', 403);
    }

    await prisma.dentistTask.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
