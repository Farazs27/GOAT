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

    if (!user.patientId) {
      return Response.json({ message: "Geen patient ID gevonden" }, { status: 400 });
    }

    const { id } = await params;

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        treatments: {
          orderBy: { createdAt: "asc" },
          include: {
            tooth: {
              select: {
                toothNumber: true,
              },
            },
            nzaCode: {
              select: {
                code: true,
                descriptionNl: true,
              },
            },
            performer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            appointment: {
              select: {
                startTime: true,
                endTime: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!treatmentPlan) {
      throw new ApiError("Behandelplan niet gevonden", 404);
    }

    // Verify ownership
    if (treatmentPlan.patientId !== user.patientId) {
      throw new ApiError("Geen toegang tot dit behandelplan", 403);
    }

    return Response.json(treatmentPlan);
  } catch (error) {
    return handleError(error);
  }
}
