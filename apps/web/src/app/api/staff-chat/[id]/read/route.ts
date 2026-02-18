import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    await prisma.staffChatMessage.updateMany({
      where: {
        chatId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: e.statusCode || 500 }
    );
  }
}
