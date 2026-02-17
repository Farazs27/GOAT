import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError, ApiError } from "@/lib/auth";

const ALLOWED_MERGE_FIELDS = ["{patient_name}", "{date}", "{practitioner_name}"];

function validateMergeFields(text: string): boolean {
  const fieldPattern = /\{[^}]+\}/g;
  const found = text.match(fieldPattern) || [];
  return found.every((f) => ALLOWED_MERGE_FIELDS.includes(f));
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const where: Record<string, unknown> = {
      practiceId: user.practiceId,
    };
    if (activeOnly) {
      where.isActive = true;
    }

    const templates = await prisma.consentTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { consentForms: true } },
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { title, contentNl, contentEn, consentType, expiryDays } = body;

    if (!title || !contentNl || !consentType) {
      throw new ApiError("title, contentNl en consentType zijn verplicht", 400);
    }

    if (!validateMergeFields(contentNl)) {
      throw new ApiError(
        "Ongeldige merge fields in Nederlandse content. Toegestaan: {patient_name}, {date}, {practitioner_name}",
        400
      );
    }

    if (contentEn && !validateMergeFields(contentEn)) {
      throw new ApiError(
        "Ongeldige merge fields in Engelse content. Toegestaan: {patient_name}, {date}, {practitioner_name}",
        400
      );
    }

    const template = await prisma.consentTemplate.create({
      data: {
        practiceId: user.practiceId,
        title,
        contentNl,
        contentEn: contentEn || null,
        consentType,
        expiryDays: expiryDays ? Number(expiryDays) : null,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
