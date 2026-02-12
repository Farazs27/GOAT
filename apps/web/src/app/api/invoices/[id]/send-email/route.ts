import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { sendEmail } from '@/lib/email/service';
import { getInvoiceNotificationEmail } from '@/lib/email/templates/invoice-notification';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        patient: true,
      },
    });

    if (!invoice) throw new ApiError('Factuur niet gevonden', 404);
    if (!invoice.patient.email) throw new ApiError('Patiënt heeft geen e-mailadres', 400);

    const practice = await prisma.practice.findUnique({
      where: { id: user.practiceId },
    });

    if (!practice) throw new ApiError('Praktijk niet gevonden', 404);

    const emailContent = getInvoiceNotificationEmail({
      patient: invoice.patient,
      invoice,
      practice,
    });

    const result = await sendEmail({
      to: invoice.patient.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.success) {
      throw new ApiError(result.error || 'E-mail verzenden mislukt', 500);
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return handleError(error);
  }
}
