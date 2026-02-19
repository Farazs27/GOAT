import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id: chatId } = await params;

    // Verify membership
    const membership = await prisma.staffChatMember.findUnique({
      where: { chatId_userId: { chatId, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    }

    const url = new URL(request.url);
    const before = url.searchParams.get("before");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    const messages = await prisma.staffChatMessage.findMany({
      where: {
        chatId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return NextResponse.json(messages);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: e.statusCode || 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id: chatId } = await params;

    // Verify membership
    const membership = await prisma.staffChatMember.findUnique({
      where: { chatId_userId: { chatId, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body as { content: string };

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const message = await prisma.staffChatMessage.create({
      data: {
        chatId,
        senderId: user.id,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Update chat timestamp
    await prisma.staffChat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: e.statusCode || 500 }
    );
  }
}
