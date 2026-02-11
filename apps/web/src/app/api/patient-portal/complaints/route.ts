import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

function generateReferenceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `KLACHT-${year}${month}${day}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await req.json();
    const { type, subject, description, anonymous, attachmentUrl } = body;

    if (!type || !subject || !description) {
      throw new ApiError("Type, onderwerp en beschrijving zijn verplicht", 400);
    }

    if (description.length < 20) {
      throw new ApiError("Beschrijving moet minimaal 20 tekens bevatten", 400);
    }

    const referenceNumber = generateReferenceNumber();

    const complaint = await prisma.complaint.create({
      data: {
        practiceId: user.practiceId,
        patientId: anonymous ? null : user.patientId,
        type,
        subject,
        description,
        attachmentUrl: attachmentUrl || null,
        anonymous: anonymous || false,
        referenceNumber,
        status: "ONTVANGEN",
      },
    });

    return Response.json({
      success: true,
      referenceNumber: complaint.referenceNumber,
      id: complaint.id,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    requireRoles(user, [UserRole.PATIENT]);

    const complaints = await prisma.complaint.findMany({
      where: {
        patientId: user.patientId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        referenceNumber: true,
        status: true,
        response: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        attachmentUrl: true,
      },
    });

    return Response.json({ complaints });
  } catch (error) {
    return handleError(error);
  }
}
