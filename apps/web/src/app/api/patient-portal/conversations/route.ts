import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const conversations = await prisma.conversation.findMany({
      where: { patientId: user.patientId },
      orderBy: { updatedAt: "desc" },
      include: {
        practitioner: {
          select: { id: true, firstName: true, lastName: true, role: true },
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
              where: { isRead: false, senderType: "STAFF" },
            },
          },
        },
      },
    });

    const formattedConversations = conversations.map((c) => ({
      id: c.id,
      subject: c.subject,
      status: c.status,
      practitioner: {
        id: c.practitioner.id,
        name: `${c.practitioner.firstName} ${c.practitioner.lastName}`,
        role: c.practitioner.role,
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

    // Get practitioners for new conversation selector
    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId! },
      select: { practiceId: true },
    });

    const practitioners = await prisma.user.findMany({
      where: {
        practiceId: patient!.practiceId,
        role: { in: ["DENTIST", "HYGIENIST"] },
      },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json({
      conversations: formattedConversations,
      practitioners: practitioners.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        role: p.role,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { practitionerId, subject, message } = await request.json();

    if (!practitionerId || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "practitionerId, subject en message zijn verplicht" },
        { status: 400 }
      );
    }

    // Verify practitioner belongs to patient's practice
    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId! },
      select: { practiceId: true },
    });

    const practitioner = await prisma.user.findFirst({
      where: {
        id: practitionerId,
        practiceId: patient!.practiceId,
        role: { in: ["DENTIST", "HYGIENIST"] },
      },
    });

    if (!practitioner) {
      return NextResponse.json(
        { error: "Behandelaar niet gevonden" },
        { status: 404 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        practiceId: patient!.practiceId,
        patientId: user.patientId!,
        practitionerId,
        subject: subject.trim(),
        messages: {
          create: {
            senderType: "PATIENT",
            senderId: null,
            content: message.trim(),
            isRead: false,
          },
        },
      },
      include: {
        practitioner: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        messages: {
          include: { attachments: true },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
