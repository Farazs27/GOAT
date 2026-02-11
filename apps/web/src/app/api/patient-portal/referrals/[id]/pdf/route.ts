import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const referral = await prisma.referral.findFirst({
      where: { id, patientId: user.patientId },
    });
    if (!referral) throw new ApiError("Verwijzing niet gevonden", 404);
    if (!referral.pdfUrl) throw new ApiError("PDF niet beschikbaar", 404);

    return Response.redirect(referral.pdfUrl);
  } catch (error) {
    return handleError(error);
  }
}
