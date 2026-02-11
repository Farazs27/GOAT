import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { generateQuotePdf } from '@/lib/pdf/quote-pdf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const plan = await prisma.treatmentPlan.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        treatments: {
          include: {
            nzaCode: true,
            tooth: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true,
            dateOfBirth: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            bigNumber: true,
          },
        },
      },
    });

    if (!plan) throw new ApiError('Behandelplan niet gevonden', 404);

    const practice = await prisma.practice.findUnique({
      where: { id: user.practiceId },
      select: {
        name: true,
        agbCode: true,
        kvkNumber: true,
        avgCode: true,
        addressStreet: true,
        addressCity: true,
        addressPostal: true,
        phone: true,
        email: true,
      },
    });

    if (!practice) throw new ApiError('Praktijk niet gevonden', 404);

    // Build quote number from plan creation date + partial ID
    const dateStr = new Date(plan.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
    const quoteNumber = `OFF-${dateStr}-${id.slice(0, 6).toUpperCase()}`;

    const quoteDate = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const lines = plan.treatments.map((t) => {
      const unitPrice = t.unitPrice ? Number(t.unitPrice) : (t.nzaCode ? Number(t.nzaCode.maxTariff) : 0);
      const totalPrice = t.totalPrice ? Number(t.totalPrice) : unitPrice * t.quantity;
      return {
        code: t.nzaCode?.code || '',
        description: t.description || t.nzaCode?.descriptionNl || '',
        toothNumber: t.tooth?.toothNumber || null,
        quantity: t.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const subtotal = plan.totalEstimate ? Number(plan.totalEstimate) : lines.reduce((sum, l) => sum + l.totalPrice, 0);
    const insuranceEstimate = plan.insuranceEstimate ? Number(plan.insuranceEstimate) : 0;
    const patientEstimate = plan.patientEstimate ? Number(plan.patientEstimate) : subtotal - insuranceEstimate;

    const pdfBuffer = generateQuotePdf({
      quoteNumber,
      quoteDate,
      validUntil,
      patient: plan.patient,
      practitioner: plan.creator,
      practice,
      lines,
      subtotal,
      insuranceEstimate,
      patientEstimate,
      planTitle: plan.title,
    });

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="offerte-${quoteNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
