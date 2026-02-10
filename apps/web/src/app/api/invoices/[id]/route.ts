import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true, email: true, addressStreet: true, addressCity: true, addressPostal: true } },
        lines: true,
        payments: true,
      },
    });

    if (!invoice) throw new ApiError('Factuur niet gevonden', 404);
    return Response.json(invoice);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.invoice.findFirst({ where: { id, practiceId: user.practiceId } });
    if (!existing) throw new ApiError('Factuur niet gevonden', 404);

    const body = await request.json();
    const updated = await prisma.invoice.update({
      where: { id },
      data: body,
      include: { lines: true, payments: true },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
