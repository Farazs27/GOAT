import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId },
    });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Next appointment
    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: user.patientId,
        startTime: { gte: now },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      orderBy: { startTime: 'asc' },
      select: {
        startTime: true,
        endTime: true,
        appointmentType: true,
        practitioner: { select: { firstName: true, lastName: true } },
      },
    });

    // Unread messages from conversations (staff messages not read by patient)
    const unreadMessages = await prisma.conversationMessage.count({
      where: {
        conversation: { patientId: user.patientId },
        senderType: 'STAFF',
        isRead: false,
      },
    });

    // Recent documents (last 30 days)
    const recentDocuments = await prisma.document.count({
      where: {
        patientId: user.patientId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Unpaid invoices
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        patientId: user.patientId,
        status: { notIn: ['PAID', 'CANCELLED', 'CREDITED'] },
      },
      select: { patientAmount: true },
    });

    const unpaidCount = unpaidInvoices.length;
    const unpaidTotal = unpaidInvoices.reduce(
      (sum, inv) => sum + Number(inv.patientAmount || 0),
      0
    );

    return Response.json({
      nextAppointment: nextAppointment || null,
      unreadMessages,
      recentDocuments,
      unpaidInvoices: {
        count: unpaidCount,
        totalAmount: unpaidTotal,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
