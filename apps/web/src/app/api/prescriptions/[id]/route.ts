import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const prescription = await prisma.prescription.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        prescriber: { select: { firstName: true, lastName: true } },
      },
    });

    if (!prescription) throw new ApiError('Recept niet gevonden', 404);

    return Response.json(prescription);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const prescription = await prisma.prescription.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!prescription) throw new ApiError('Recept niet gevonden', 404);

    const body = await request.json();
    const data: any = {};

    if (body.status) {
      data.status = body.status;
      if (body.status === 'DISCONTINUED') {
        data.discontinuedAt = new Date();
      }
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data,
      include: {
        prescriber: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const prescription = await prisma.prescription.findFirst({
      where: { id, practiceId: user.practiceId },
    });
    if (!prescription) throw new ApiError('Recept niet gevonden', 404);

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        prescriber: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
