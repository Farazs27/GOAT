import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const user = await withAuth(request);

    // Only PRACTICE_ADMIN or DENTIST can update practice settings
    if (user.role !== 'PRACTICE_ADMIN' && user.role !== 'DENTIST') {
      return Response.json(
        { error: 'Onvoldoende rechten om praktijkgegevens te wijzigen' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phone, email, addressStreet, addressCity, addressPostal, kvkNumber, agbCode, avgCode } = body;

    const updated = await prisma.practice.update({
      where: { id: user.practiceId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(addressStreet !== undefined && { addressStreet }),
        ...(addressCity !== undefined && { addressCity }),
        ...(addressPostal !== undefined && { addressPostal }),
        ...(kvkNumber !== undefined && { kvkNumber }),
        ...(agbCode !== undefined && { agbCode }),
        ...(avgCode !== undefined && { avgCode }),
      },
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
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
