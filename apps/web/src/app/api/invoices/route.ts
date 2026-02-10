import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { practiceId: user.practiceId };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
          payments: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return Response.json({
      data: invoices,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, dueDate, insuranceAmount, notes, lines } = body;

    if (!patientId) throw new ApiError('Pati\u00ebnt is verplicht', 400);

    // Generate invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: { practiceId: user.practiceId, invoiceNumber: { startsWith: `F${year}` } },
      orderBy: { invoiceNumber: 'desc' },
    });
    const seq = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1
      : 1;
    const invoiceNumber = `F${year}-${String(seq).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    if (lines && Array.isArray(lines)) {
      subtotal = lines.reduce((sum: number, l: any) => sum + (l.quantity || 1) * (l.unitPrice || 0), 0);
    }
    const insAmount = insuranceAmount || 0;
    const patientAmount = subtotal - insAmount;

    const invoice = await prisma.invoice.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        invoiceNumber,
        subtotal,
        total: subtotal,
        insuranceAmount: insAmount,
        patientAmount,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 86400000),
        notes,
        lines: lines
          ? {
              create: lines.map((l: any) => ({
                practiceId: user.practiceId,
                description: l.description || '',
                treatmentId: l.treatmentId,
                nzaCode: l.nzaCode,
                toothNumber: l.toothNumber,
                quantity: l.quantity || 1,
                unitPrice: l.unitPrice || 0,
                lineTotal: (l.quantity || 1) * (l.unitPrice || 0),
              })),
            }
          : undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        lines: true,
      },
    });

    return Response.json(invoice, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
