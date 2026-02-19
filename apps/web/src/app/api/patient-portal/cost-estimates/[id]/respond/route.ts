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
    const body = await request.json();
    const { action } = body;

    // Validate action
    if (!action || !["accept", "decline"].includes(action)) {
      throw new ApiError("Ongeldige actie. Gebruik 'accept' of 'decline'.", 400);
    }

    // Find the treatment plan and verify ownership + status
    const treatmentPlan = await prisma.treatmentPlan.findFirst({
      where: {
        id,
        patientId: user.patientId,
        status: "PROPOSED",
      },
    });

    if (!treatmentPlan) {
      throw new ApiError(
        "Kostenraming niet gevonden of kan niet worden gewijzigd.",
        404
      );
    }

    // Update based on action
    let newStatus: "ACCEPTED" | "CANCELLED";
    let updateData: any;

    if (action === "accept") {
      newStatus = "ACCEPTED";
      updateData = {
        status: newStatus,
        acceptedAt: new Date(),
      };
    } else {
      newStatus = "CANCELLED";
      updateData = {
        status: newStatus,
      };
    }

    await prisma.treatmentPlan.update({
      where: { id },
      data: updateData,
    });

    return Response.json({
      success: true,
      status: newStatus,
    });
  } catch (error) {
    return handleError(error);
  }
}
