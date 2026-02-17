import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError } from "@/lib/auth";

function escapeCsv(value: string | null | undefined): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const templateId = searchParams.get("templateId");
    const patientId = searchParams.get("patientId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Record<string, unknown> = {
      practiceId: user.practiceId,
    };

    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (patientId) where.patientId = patientId;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo + "T23:59:59.999Z") }),
      };
    }

    const forms = await prisma.consentForm.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const headers = [
      "Patient Name",
      "Form Title",
      "Type",
      "Status",
      "Signed Date",
      "Signed By",
      "Signer Relation",
      "Expires At",
    ];

    const rows = forms.map((form) => [
      escapeCsv([form.patient.firstName, form.patient.lastName].filter(Boolean).join(" ")),
      escapeCsv(form.title),
      escapeCsv(form.consentType),
      escapeCsv(form.status),
      escapeCsv(form.signedAt?.toISOString() || ""),
      escapeCsv(form.signedByName),
      escapeCsv(form.signerRelation),
      escapeCsv(form.expiresAt?.toISOString() || ""),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="consent-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
