import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const treatments = await prisma.treatment.findMany({
      where: { patientId: user.patientId },
      orderBy: { performedAt: "desc" },
      include: {
        tooth: { select: { toothNumber: true } },
        appointment: {
          select: {
            startTime: true,
            practitioner: { select: { firstName: true, lastName: true } },
          },
        },
        performer: { select: { firstName: true, lastName: true } },
        nzaCode: { select: { code: true, descriptionNl: true } },
      },
    });

    return Response.json(treatments);
  } catch (error) {
    return handleError(error);
  }
}
