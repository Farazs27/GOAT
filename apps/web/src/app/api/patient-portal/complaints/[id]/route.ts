import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(req);
    requireRoles(user, [UserRole.PATIENT]);

    const { id } = await params;

    const complaint = await prisma.complaint.findFirst({
      where: {
        id,
        patientId: user.patientId,
      },
    });

    if (!complaint) {
      throw new ApiError("Melding niet gevonden", 404);
    }

    return Response.json({ complaint });
  } catch (error) {
    return handleError(error);
  }
}
