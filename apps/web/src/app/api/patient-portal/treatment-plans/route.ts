import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    if (!user.patientId) {
      return Response.json({ message: "Geen patient ID gevonden" }, { status: 400 });
    }

    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where: {
        patientId: user.patientId,
        status: {
          in: ["ACCEPTED", "IN_PROGRESS", "COMPLETED"],
        },
      },
      orderBy: { createdAt: "desc" },
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

    return Response.json(treatmentPlans);
  } catch (error) {
    return handleError(error);
  }
}
