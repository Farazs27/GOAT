import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id: planId } = await params;

    const plan = await prisma.treatmentPlan.findFirst({
      where: { id: planId, practiceId: user.practiceId },
    });
    if (!plan) throw new ApiError('Behandelplan niet gevonden', 404);

    const body = await request.json();
    const { description, toothId, nzaCodeId, quantity, notes } = body;

    // Look up NZa code for pricing
    let unitPrice: number | undefined;
    if (nzaCodeId) {
      const nzaCode = await prisma.nzaCode.findUnique({ where: { id: nzaCodeId } });
      if (nzaCode) unitPrice = Number(nzaCode.maxTariff);
    }

    const qty = quantity ?? 1;
    const totalPrice = unitPrice ? unitPrice * qty : undefined;

    const treatment = await prisma.treatment.create({
      data: {
        practiceId: user.practiceId,
        patientId: plan.patientId,
        treatmentPlanId: planId,
        performedBy: user.id,
        description,
        toothId,
        nzaCodeId,
        quantity: qty,
        unitPrice,
        totalPrice,
        notes,
      },
      include: { nzaCode: true, tooth: true },
    });

    // Recalculate plan total
    const treatments = await prisma.treatment.findMany({ where: { treatmentPlanId: planId } });
    const total = treatments.reduce((sum: number, t: any) => sum + (t.totalPrice ? Number(t.totalPrice) : 0), 0);
    await prisma.treatmentPlan.update({ where: { id: planId }, data: { totalEstimate: total } });

    return Response.json(treatment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
