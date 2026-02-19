import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { id } = await params;

    // Only allow marking staff messages as read
    const message = await prisma.message.updateMany({
      where: {
        id,
        patientId: user.patientId,
        senderType: "STAFF",
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (message.count === 0) {
      return Response.json(
        { message: "Bericht niet gevonden of al gelezen" },
        { status: 404 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
