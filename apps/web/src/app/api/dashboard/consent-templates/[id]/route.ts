import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError, ApiError } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const template = await prisma.consentTemplate.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        _count: { select: { consentForms: true } },
        consentForms: {
          select: { status: true },
        },
      },
    });

    if (!template) {
      throw new ApiError("Sjabloon niet gevonden", 404);
    }

    const stats = {
      total: template.consentForms.length,
      signed: template.consentForms.filter((f) => f.status === "SIGNED").length,
      pending: template.consentForms.filter((f) => f.status === "PENDING").length,
      expired: template.consentForms.filter((f) => f.status === "EXPIRED").length,
      revoked: template.consentForms.filter((f) => f.status === "REVOKED").length,
    };

    const { consentForms: _, ...rest } = template;
    return NextResponse.json({ ...rest, stats });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;
    const body = await request.json();

    const template = await prisma.consentTemplate.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        consentForms: {
          where: { status: "SIGNED" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!template) {
      throw new ApiError("Sjabloon niet gevonden", 404);
    }

    const hasSignedForms = template.consentForms.length > 0;

    const { title, contentNl, contentEn, consentType, expiryDays, isActive } = body;

    const updated = await prisma.consentTemplate.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(contentNl !== undefined && { contentNl }),
        ...(contentEn !== undefined && { contentEn }),
        ...(consentType !== undefined && { consentType }),
        ...(expiryDays !== undefined && { expiryDays: expiryDays ? Number(expiryDays) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      ...updated,
      warning: hasSignedForms
        ? "Dit sjabloon heeft ondertekende formulieren. Wijzigingen gelden alleen voor nieuwe formulieren."
        : undefined,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const template = await prisma.consentTemplate.findFirst({
      where: { id, practiceId: user.practiceId },
    });

    if (!template) {
      throw new ApiError("Sjabloon niet gevonden", 404);
    }

    await prisma.consentTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Sjabloon gedeactiveerd" });
  } catch (error) {
    return handleError(error);
  }
}
