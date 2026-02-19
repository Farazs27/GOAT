import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError, ApiError } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { practitionerId: user.id },
          { practice: { users: { some: { id: user.id, role: "PRACTICE_ADMIN" } } } },
        ],
      },
    });

    if (!conversation) {
      throw new ApiError("Gesprek niet gevonden", 404);
    }

    const { practitionerId } = await request.json();

    if (!practitionerId) {
      throw new ApiError("practitionerId is verplicht", 400);
    }

    // Verify new practitioner is in same practice
    const practitioner = await prisma.user.findFirst({
      where: {
        id: practitionerId,
        practiceId: conversation.practiceId,
        role: { in: ["DENTIST", "HYGIENIST"] },
      },
    });

    if (!practitioner) {
      throw new ApiError("Behandelaar niet gevonden", 404);
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { practitionerId },
      include: {
        practitioner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
