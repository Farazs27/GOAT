import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { generateInvoicePdf } from '@/lib/pdf/invoice-pdf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true,
            bsn: true,
            email: true,
            addressStreet: true,
            addressCity: true,
            addressPostal: true,
          },
        },
        lines: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) throw new ApiError('Factuur niet gevonden', 404);

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

    // Fetch practitioner (logged-in user) details for the PDF
    const practitioner = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true, bigNumber: true },
    });

    const pdfInvoice = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      insuranceAmount: Number(invoice.insuranceAmount),
      patientAmount: Number(invoice.patientAmount),
      paidAmount: Number(invoice.paidAmount),
      status: invoice.status,
      notes: invoice.notes,
      patient: invoice.patient,
      practitioner: practitioner ? {
        name: `${practitioner.firstName} ${practitioner.lastName}`,
        bigNumber: practitioner.bigNumber,
      } : null,
      lines: invoice.lines.map((l) => ({
        nzaCode: l.nzaCode,
        description: l.description,
        toothNumber: l.toothNumber,
        surface: l.surface,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
        lineTotal: Number(l.lineTotal),
        sortOrder: l.sortOrder,
      })),
      payments: invoice.payments.map((p) => ({
        amount: Number(p.amount),
        method: p.method,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
    };

    const pdfBuffer = generateInvoicePdf(pdfInvoice, practice);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factuur-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
