import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/invoice-number';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PROPOSED', 'CANCELLED'],
  PROPOSED: ['ACCEPTED', 'CANCELLED', 'DRAFT'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const plan = await prisma.treatmentPlan.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        treatments: { include: { nzaCode: true, tooth: true }, orderBy: { createdAt: 'asc' } },
        creator: { select: { firstName: true, lastName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    if (!plan) throw new ApiError('Behandelplan niet gevonden', 404);
    return Response.json(plan);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const plan = await prisma.treatmentPlan.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!plan) throw new ApiError('Behandelplan niet gevonden', 404);

    const body = await request.json();

    // If status change requested, validate transition and apply side effects atomically
    if (body.status) {
      const currentStatus = plan.status;
      const newStatus = body.status;
      const allowed = ALLOWED_TRANSITIONS[currentStatus];

      if (!allowed || !allowed.includes(newStatus)) {
        throw new ApiError(`Ongeldige statusovergang van ${currentStatus} naar ${newStatus}`, 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Build update data for the plan
        const planData: Record<string, unknown> = { status: newStatus };
        if (body.title) planData.title = body.title;
        if (body.description !== undefined) planData.description = body.description;

        // Timestamp side effects
        if (newStatus === 'PROPOSED') planData.proposedAt = new Date();
        if (newStatus === 'ACCEPTED') planData.acceptedAt = new Date();

        // Treatment cascading side effects
        if (newStatus === 'IN_PROGRESS') {
          await tx.treatment.updateMany({
            where: { treatmentPlanId: id, status: 'PLANNED' },
            data: { status: 'IN_PROGRESS' },
          });
        }

        if (newStatus === 'CANCELLED') {
          await tx.treatment.updateMany({
            where: {
              treatmentPlanId: id,
              status: { notIn: ['COMPLETED'] },
            },
            data: { status: 'CANCELLED' },
          });
        }

        if (newStatus === 'COMPLETED') {
          // Complete all non-terminal treatments
          await tx.treatment.updateMany({
            where: {
              treatmentPlanId: id,
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
            data: { status: 'COMPLETED', performedAt: new Date() },
          });

          // Fetch completed treatments for invoice lines
          const treatments = await tx.treatment.findMany({
            where: { treatmentPlanId: id, status: 'COMPLETED' },
            include: { nzaCode: true, tooth: true },
          });

          if (treatments.length > 0) {
            // Generate invoice number using shared utility
            const invoiceNumber = await generateInvoiceNumber(tx, user.practiceId);

            // Build invoice lines
            const lines = treatments.map((t) => {
              const unitPrice = t.unitPrice ? Number(t.unitPrice) : (t.nzaCode?.maxTariff ? Number(t.nzaCode.maxTariff) : 0);
              const quantity = t.quantity || 1;
              const lineTotal = unitPrice * quantity;
              return {
                practiceId: user.practiceId,
                description: t.description,
                treatmentId: t.id,
                nzaCodeId: t.nzaCodeId || undefined,
                nzaCode: t.nzaCode?.code || undefined,
                toothNumber: t.tooth?.toothNumber || undefined,
                quantity,
                unitPrice,
                lineTotal,
              };
            });

            const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

            await tx.invoice.create({
              data: {
                practiceId: user.practiceId,
                patientId: plan.patientId,
                invoiceNumber,
                subtotal,
                total: subtotal,
                patientAmount: subtotal,
                dueDate: new Date(Date.now() + 30 * 86400000),
                lines: { create: lines },
              },
            });
          }
        }

        // Update the plan
        const updated = await tx.treatmentPlan.update({
          where: { id },
          data: planData,
          include: {
            treatments: { include: { nzaCode: true, tooth: true } },
            creator: { select: { firstName: true, lastName: true } },
          },
        });

        return updated;
      });

      return Response.json(result);
    }

    // Non-status update (title, description, etc.)
    const data: Record<string, unknown> = {};
    if (body.title) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;

    const updated = await prisma.treatmentPlan.update({
      where: { id },
      data,
      include: {
        treatments: { include: { nzaCode: true, tooth: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
