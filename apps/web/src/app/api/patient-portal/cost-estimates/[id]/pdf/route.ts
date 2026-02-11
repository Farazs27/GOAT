import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";
import { generateQuotePdf, QuotePdfData } from "@/lib/pdf/quote-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { id } = await params;

    // Fetch treatment plan with full includes
    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        patient: true,
        practice: true,
        creator: true,
        treatments: {
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
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!treatmentPlan) {
      throw new ApiError("Kostenraming niet gevonden", 404);
    }

    // Verify ownership
    if (treatmentPlan.patientId !== user.patientId) {
      throw new ApiError("Geen toegang tot deze kostenraming", 403);
    }

    // Transform data for PDF generator
    const pdfData: QuotePdfData = {
      quoteNumber: `KR-${treatmentPlan.id.slice(0, 8).toUpperCase()}`,
      quoteDate: treatmentPlan.proposedAt || treatmentPlan.createdAt,
      validUntil: new Date(
        new Date(treatmentPlan.proposedAt || treatmentPlan.createdAt).getTime() +
          30 * 24 * 60 * 60 * 1000
      ), // 30 days from proposed date
      patient: {
        firstName: treatmentPlan.patient.firstName,
        lastName: treatmentPlan.patient.lastName,
        patientNumber: treatmentPlan.patient.patientNumber,
        dateOfBirth: treatmentPlan.patient.dateOfBirth,
      },
      practitioner: {
        firstName: treatmentPlan.creator.firstName,
        lastName: treatmentPlan.creator.lastName,
        bigNumber: treatmentPlan.creator.bigNumber,
      },
      practice: {
        name: treatmentPlan.practice.name,
        agbCode: treatmentPlan.practice.agbCode,
        kvkNumber: treatmentPlan.practice.kvkNumber,
        avgCode: treatmentPlan.practice.avgCode,
        addressStreet: treatmentPlan.practice.addressStreet,
        addressCity: treatmentPlan.practice.addressCity,
        addressPostal: treatmentPlan.practice.addressPostal,
        phone: treatmentPlan.practice.phone,
        email: treatmentPlan.practice.email,
      },
      lines: treatmentPlan.treatments.map((treatment) => ({
        code: treatment.nzaCode?.code || "",
        description:
          treatment.description ||
          treatment.nzaCode?.descriptionNl ||
          "Behandeling",
        toothNumber: treatment.tooth?.toothNumber || null,
        quantity: treatment.quantity,
        unitPrice: Number(treatment.unitPrice),
        totalPrice: Number(treatment.totalPrice),
      })),
      subtotal: Number(treatmentPlan.totalEstimate || 0),
      insuranceEstimate: Number(treatmentPlan.insuranceEstimate || 0),
      patientEstimate: Number(treatmentPlan.patientEstimate || 0),
      planTitle: treatmentPlan.title || "Behandelplan",
    };

    // Generate PDF
    const pdfBuffer = generateQuotePdf(pdfData);

    // Return PDF as downloadable file
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="kostenraming-${pdfData.quoteNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
