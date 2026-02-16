import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { invoiceId, amount, method } = body;

    if (!invoiceId || !amount || !method) {
      throw new ApiError('Factuur, bedrag en betaalmethode zijn verplicht', 400);
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, practiceId: user.practiceId },
      include: { payments: true },
    });
    if (!invoice) throw new ApiError('Factuur niet gevonden', 404);

    const payment = await prisma.payment.create({
      data: {
        practiceId: user.practiceId,
        invoiceId,
        amount,
        method: method as any,
      },
    });

    // Recalculate paid amount
    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0) + amount;
    // Compare against patientAmount (what patient actually owes after insurance), fall back to total
    const amountOwed = (invoice.patientAmount && Number(invoice.patientAmount) > 0)
      ? Number(invoice.patientAmount)
      : Number(invoice.total);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: totalPaid,
        status: totalPaid >= amountOwed ? 'PAID' : 'PARTIALLY_PAID',
      },
    });

    return Response.json(payment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
