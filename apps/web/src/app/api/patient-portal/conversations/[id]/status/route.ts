import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, patientId: user.patientId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Gesprek niet gevonden" },
        { status: 404 }
      );
    }

    const { status } = await request.json();

    // Patient can only reopen closed conversations
    if (status !== "OPEN") {
      return NextResponse.json(
        { error: "U kunt alleen gesloten gesprekken heropenen" },
        { status: 400 }
      );
    }

    if (conversation.status !== "CLOSED") {
      return NextResponse.json(
        { error: "Dit gesprek is al open" },
        { status: 400 }
      );
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { status: "OPEN" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
