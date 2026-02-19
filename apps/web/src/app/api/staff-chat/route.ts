import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await withAuth(request);

    const chats = await prisma.staffChat.findMany({
      where: {
        practiceId: user.practiceId,
        members: { some: { userId: user.id } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await prisma.staffChatMessage.count({
          where: {
            chatId: chat.id,
            senderId: { not: user.id },
            isRead: false,
          },
        });

        const otherMembers = chat.members.filter((m) => m.userId !== user.id);
        const displayName =
          chat.name ||
          (otherMembers.length === 1
            ? [otherMembers[0].user.firstName, otherMembers[0].user.lastName].filter(Boolean).join(' ')
            : otherMembers.map((m) => [m.user.firstName, m.user.lastName].filter(Boolean).join(' ')).join(", "));

        const lastMessage = chat.messages[0] || null;

        return {
          id: chat.id,
          name: displayName,
          isGroup: chat.isGroup,
          members: chat.members.map((m) => m.user),
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderName: [lastMessage.sender.firstName, lastMessage.sender.lastName].filter(Boolean).join(' '),
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
          updatedAt: chat.updatedAt,
        };
      })
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: e.statusCode || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { memberIds, name, isGroup } = body as {
      memberIds: string[];
      name?: string;
      isGroup?: boolean;
    };

    if (!memberIds || memberIds.length === 0) {
      return NextResponse.json(
        { error: "memberIds is required" },
        { status: 400 }
      );
    }

    const allMemberIds = Array.from(new Set([user.id, ...memberIds]));

    // For 1-on-1, check existing chat
    if (allMemberIds.length === 2 && !isGroup) {
      const existing = await prisma.staffChat.findFirst({
        where: {
          practiceId: user.practiceId,
          isGroup: false,
          members: { every: { userId: { in: allMemberIds } } },
          AND: [
            { members: { some: { userId: allMemberIds[0] } } },
            { members: { some: { userId: allMemberIds[1] } } },
          ],
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
          },
        },
      });

      if (existing && existing.members.length === 2) {
        return NextResponse.json(existing);
      }
    }

    const chat = await prisma.staffChat.create({
      data: {
        practiceId: user.practiceId,
        name: name || null,
        isGroup: isGroup || allMemberIds.length > 2,
        members: {
          create: allMemberIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: e.statusCode || 500 }
    );
  }
}
