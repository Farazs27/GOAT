import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        bigNumber: true,
        agbCode: true,
        specialization: true,
        role: true,
        practice: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            addressStreet: true,
            addressCity: true,
            addressPostal: true,
            kvkNumber: true,
            agbCode: true,
            avgCode: true,
          },
        },
      },
    });

    return Response.json(profile);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { firstName, lastName, phone, bigNumber, agbCode } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { firstName, lastName, phone, bigNumber, agbCode },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        bigNumber: true,
        agbCode: true,
        specialization: true,
        role: true,
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
