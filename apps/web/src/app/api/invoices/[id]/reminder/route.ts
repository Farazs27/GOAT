import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!invoice) throw new ApiError('Factuur niet gevonden', 404);

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED' || invoice.status === 'CREDITED') {
      throw new ApiError('Kan geen herinnering sturen voor deze factuur', 400);
    }

    const remaining = Number(invoice.total) - Number(invoice.paidAmount);
    const daysOverdue = Math.max(
      0,
      Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    // Log the reminder as a notification record
    await prisma.notification.create({
      data: {
        practiceId: user.practiceId,
        patientId: invoice.patientId,
        channel: 'EMAIL',
        template: 'PAYMENT_REMINDER',
        subject: `Betalingsherinnering factuur #${invoice.invoiceNumber}`,
        content: `Herinnering voor openstaand bedrag van €${remaining.toFixed(2)} op factuur #${invoice.invoiceNumber}.`,
        status: 'PENDING',
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: remaining,
          daysOverdue,
          sentBy: user.id,
        },
      },
    });

    // Update the invoice notes to track reminder history
    const now = new Date().toISOString();
    const existingNotes = invoice.notes || '';
    const reminderNote = `[${now}] Betalingsherinnering verstuurd door ${user.email}`;
    const updatedNotes = existingNotes ? `${existingNotes}\n${reminderNote}` : reminderNote;

    await prisma.invoice.update({
      where: { id },
      data: { notes: updatedNotes },
    });

    console.log(`[REMINDER] Payment reminder for invoice #${invoice.invoiceNumber} to ${invoice.patient.firstName} ${invoice.patient.lastName} (${invoice.patient.email || 'no email'}). Amount: €${remaining.toFixed(2)}, Days overdue: ${daysOverdue}`);

    return Response.json({
      success: true,
      reminder: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientName: `${invoice.patient.firstName} ${invoice.patient.lastName}`,
        patientEmail: invoice.patient.email,
        amount: remaining,
        daysOverdue,
        sentAt: now,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
