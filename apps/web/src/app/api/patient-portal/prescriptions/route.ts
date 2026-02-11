import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: user.patientId },
      orderBy: { prescribedAt: "desc" },
      include: {
        appointment: {
          select: {
            startTime: true,
          },
        },
        prescriber: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json(prescriptions);
  } catch (error) {
    return handleError(error);
  }
}
