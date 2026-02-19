import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const image = await prisma.patientImage.findFirst({
      where: {
        id,
        patientId: user.patientId,
      },
    });

    if (!image) {
      throw new ApiError("Afbeelding niet gevonden", 404);
    }

    // Return the file path for client-side download
    return Response.json({
      downloadUrl: image.filePath,
      fileName: image.fileName,
      mimeType: image.mimeType,
    });
  } catch (error) {
    return handleError(error);
  }
}
