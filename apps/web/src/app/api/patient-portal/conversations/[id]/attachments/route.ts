import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const messageId = formData.get("messageId") as string | null;

    if (!file || !messageId) {
      return NextResponse.json(
        { error: "file en messageId zijn verplicht" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Bestand mag maximaal 10MB zijn" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Bestandstype niet toegestaan. Toegestaan: afbeeldingen, PDF, Word." },
        { status: 400 }
      );
    }

    // Verify message belongs to this conversation
    const message = await prisma.conversationMessage.findFirst({
      where: { id: messageId, conversationId: id },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Bericht niet gevonden" },
        { status: 404 }
      );
    }

    const blob = await put(`conversations/${id}/${file.name}`, file, {
      access: "public",
    });

    const attachment = await prisma.messageAttachment.create({
      data: {
        messageId,
        fileName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
