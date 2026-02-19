import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, patientId: user.patientId },
      include: {
        practitioner: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            attachments: true,
            sender: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Gesprek niet gevonden" },
        { status: 404 }
      );
    }

    // Mark all staff messages as read
    await prisma.conversationMessage.updateMany({
      where: {
        conversationId: id,
        senderType: "STAFF",
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
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

    if (conversation.status === "CLOSED") {
      return NextResponse.json(
        { error: "Dit gesprek is gesloten. Heropen het gesprek om te reageren." },
        { status: 400 }
      );
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Bericht mag niet leeg zijn" },
        { status: 400 }
      );
    }

    const message = await prisma.conversationMessage.create({
      data: {
        conversationId: id,
        senderType: "PATIENT",
        senderId: null,
        content: content.trim(),
        isRead: false,
      },
      include: { attachments: true },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
