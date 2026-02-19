import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    // Fetch treatment plans for this patient with status PROPOSED, ACCEPTED, or CANCELLED
    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where: {
        patientId: user.patientId,
        status: {
          in: ["PROPOSED", "ACCEPTED", "CANCELLED"],
        },
      },
      orderBy: { proposedAt: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatments: {
          include: {
            nzaCode: {
              select: {
                code: true,
                descriptionNl: true,
              },
            },
            tooth: {
              select: {
                toothNumber: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Map results to clean format with converted Decimal fields
    const estimates = treatmentPlans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      status: plan.status,
      proposedAt: plan.proposedAt,
      acceptedAt: plan.acceptedAt,
      totalEstimate: Number(plan.totalEstimate || 0),
      insuranceEstimate: Number(plan.insuranceEstimate || 0),
      patientEstimate: Number(plan.patientEstimate || 0),
      practitioner: {
        firstName: plan.creator.firstName,
        lastName: plan.creator.lastName,
      },
      treatments: plan.treatments.map((treatment) => ({
        id: treatment.id,
        description: treatment.description,
        quantity: treatment.quantity,
        unitPrice: Number(treatment.unitPrice),
        totalPrice: Number(treatment.totalPrice),
        nzaCode: treatment.nzaCode
          ? {
              code: treatment.nzaCode.code,
              description: treatment.nzaCode.descriptionNl,
            }
          : null,
        toothNumber: treatment.tooth?.toothNumber || null,
      })),
    }));

    return Response.json({ estimates });
  } catch (error) {
    return handleError(error);
  }
}
