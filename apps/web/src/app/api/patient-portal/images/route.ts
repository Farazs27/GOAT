import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const images = await prisma.patientImage.findMany({
      where: { patientId: user.patientId },
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return Response.json({ images });
  } catch (error) {
    return handleError(error);
  }
}
