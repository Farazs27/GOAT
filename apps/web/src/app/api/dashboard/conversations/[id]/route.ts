import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError, ApiError } from "@/lib/auth";

export async function GET(
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
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        practitioner: {
          select: { id: true, firstName: true, lastName: true },
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
      throw new ApiError("Gesprek niet gevonden", 404);
    }

    // Mark patient messages as read
    await prisma.conversationMessage.updateMany({
      where: {
        conversationId: id,
        senderType: "PATIENT",
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
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, practitionerId: user.id },
    });

    if (!conversation) {
      throw new ApiError("Gesprek niet gevonden", 404);
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      throw new ApiError("Bericht mag niet leeg zijn", 400);
    }

    const message = await prisma.conversationMessage.create({
      data: {
        conversationId: id,
        senderType: "STAFF",
        senderId: user.id,
        content: content.trim(),
        isRead: false,
      },
      include: { attachments: true },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, practitionerId: user.id },
    });

    if (!conversation) {
      throw new ApiError("Gesprek niet gevonden", 404);
    }

    const { status } = await request.json();

    if (status !== "CLOSED" && status !== "OPEN") {
      throw new ApiError("Ongeldige status", 400);
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
