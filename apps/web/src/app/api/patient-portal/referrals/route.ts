import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const referrals = await prisma.referral.findMany({
      where: { patientId: user.patientId },
      orderBy: { referralDate: "desc" },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
    });

    return Response.json({
      referrals: referrals.map((r) => ({
        id: r.id,
        specialistType: r.specialistType,
        specialistName: r.specialistName,
        specialistPractice: r.specialistPractice,
        reason: r.reason,
        urgency: r.urgency,
        status: r.status,
        referralDate: r.referralDate,
        appointmentMadeAt: r.appointmentMadeAt,
        completedAt: r.completedAt,
        pdfUrl: r.pdfUrl,
        referringDentist: r.creator
          ? `${r.creator.firstName || ""} ${r.creator.lastName || ""}`.trim()
          : null,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
