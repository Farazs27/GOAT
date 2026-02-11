import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const messages = await prisma.message.findMany({
      where: { patientId: user.patientId },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        patientId: user.patientId,
        senderType: "STAFF",
        isRead: false,
      },
    });

    // Get practice info for display
    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return Response.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderType: msg.senderType,
        senderName:
          msg.senderType === "STAFF"
            ? msg.sender
              ? `${msg.sender.firstName || ""} ${msg.sender.lastName || ""}`.trim() ||
                "Tandartspraktijk"
              : "Tandartspraktijk"
            : "U",
        isRead: msg.isRead,
        createdAt: msg.createdAt.toISOString(),
      })),
      unreadCount,
      practiceName: patient?.practice?.name || "Tandartspraktijk",
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const { content } = body;

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      throw new ApiError("Bericht is verplicht", 400);
    }

    if (content.trim().length > 2000) {
      throw new ApiError("Bericht is te lang (max 2000 tekens)", 400);
    }

    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId },
      select: { practiceId: true },
    });

    if (!patient) {
      throw new ApiError("Patiënt niet gevonden", 404);
    }

    const message = await prisma.message.create({
      data: {
        practiceId: patient.practiceId,
        patientId: user.patientId!,
        senderType: "PATIENT",
        content: content.trim(),
        isRead: true, // Patient messages are automatically read on the patient side
      },
    });

    return Response.json(
      {
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        senderName: "U",
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
