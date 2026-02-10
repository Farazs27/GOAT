import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const [invoices, consentForms] = await Promise.all([
      prisma.invoice.findMany({
        where: { patientId: user.patientId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          total: true,
          patientAmount: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.consentForm.findMany({
        where: { patientId: user.patientId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          signedAt: true,
          createdAt: true,
        },
      }),
    ]);

    // Map consent forms to a generic "documents" list for the frontend
    const documents = consentForms.map((cf) => ({
      id: cf.id,
      title: cf.title,
      documentType: cf.status === 'SIGNED' ? 'Getekend formulier' : 'Toestemmingsformulier',
      createdAt: cf.createdAt,
    }));

    return Response.json({ invoices, documents });
  } catch (error) {
    return handleError(error);
  }
}
