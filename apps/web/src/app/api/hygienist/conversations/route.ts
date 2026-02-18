import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: Record<string, unknown> = {
      practitionerId: user.id,
      practiceId: user.practiceId,
    };

    if (statusFilter === "OPEN" || statusFilter === "CLOSED") {
      where.status = statusFilter;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderType: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: { isRead: false, senderType: "PATIENT" },
            },
          },
        },
      },
    });

    const formattedConversations = conversations.map((c) => ({
      id: c.id,
      subject: c.subject,
      status: c.status,
      patient: {
        id: c.patient.id,
        name: `${c.patient.firstName} ${c.patient.lastName}`,
      },
      lastMessage: c.messages[0]
        ? {
            content: c.messages[0].content,
            createdAt: c.messages[0].createdAt,
            senderType: c.messages[0].senderType,
          }
        : null,
      unreadCount: c._count.messages,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, initialMessage, subject } = body;

    if (!patientId || !initialMessage) {
      return NextResponse.json(
        { error: "patientId and initialMessage are required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const conversation = await prisma.conversation.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        practitionerId: user.id,
        subject: subject || `Bericht aan ${patient.firstName} ${patient.lastName}`,
        messages: {
          create: {
            senderType: "STAFF",
            senderId: user.id,
            content: initialMessage,
          },
        },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        messages: true,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
