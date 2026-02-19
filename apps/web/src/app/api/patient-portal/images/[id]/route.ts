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
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!image) {
      throw new ApiError("Afbeelding niet gevonden", 404);
    }

    return Response.json({ image });
  } catch (error) {
    return handleError(error);
  }
}
