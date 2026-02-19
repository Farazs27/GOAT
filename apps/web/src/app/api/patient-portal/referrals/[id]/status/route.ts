import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;
    const { status } = await request.json();

    if (status !== "APPOINTMENT_MADE") {
      throw new ApiError("Ongeldige status", 400);
    }

    const referral = await prisma.referral.findFirst({
      where: { id, patientId: user.patientId },
    });
    if (!referral) throw new ApiError("Verwijzing niet gevonden", 404);

    const updated = await prisma.referral.update({
      where: { id },
      data: {
        status: "APPOINTMENT_MADE",
        appointmentMadeAt: new Date(),
      },
    });

    return Response.json({ success: true, status: updated.status });
  } catch (error) {
    return handleError(error);
  }
}
