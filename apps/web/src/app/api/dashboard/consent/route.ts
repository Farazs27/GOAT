import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const templateId = searchParams.get("templateId");
    const patientId = searchParams.get("patientId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));

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

    const [forms, total] = await Promise.all([
      prisma.consentForm.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          template: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.consentForm.count({ where }),
    ]);

    return NextResponse.json({
      forms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
