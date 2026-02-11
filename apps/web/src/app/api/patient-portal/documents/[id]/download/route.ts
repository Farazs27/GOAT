import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        patientId: user.patientId,
      },
    });

    if (!document) {
      throw new ApiError("Document niet gevonden", 404);
    }

    // Return the file info for client-side download
    return Response.json({
      downloadUrl: document.s3Key,
      fileName: document.title,
      mimeType: document.mimeType,
    });
  } catch (error) {
    return handleError(error);
  }
}
