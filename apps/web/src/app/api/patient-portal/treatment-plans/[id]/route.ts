import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

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

export async function PATCH(
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
    const body = await request.json();
    const { action } = body;

    if (!action || !["accept", "reject"].includes(action)) {
      throw new ApiError("Ongeldige actie. Gebruik 'accept' of 'reject'", 400);
    }

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id },
    });

    if (!treatmentPlan || treatmentPlan.patientId !== user.patientId) {
      throw new ApiError("Behandelplan niet gevonden", 404);
    }

    if (treatmentPlan.status !== "PROPOSED") {
      throw new ApiError("Behandelplan is niet in voorgestelde status", 400);
    }

    const updateData =
      action === "accept"
        ? { status: "ACCEPTED" as const, acceptedAt: new Date() }
        : { status: "CANCELLED" as const };

    const updated = await prisma.treatmentPlan.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { firstName: true, lastName: true } },
        treatments: {
          orderBy: { createdAt: "asc" },
          include: {
            tooth: { select: { toothNumber: true } },
            nzaCode: { select: { code: true, descriptionNl: true } },
          },
        },
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
