import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError, ApiError } from "@/lib/auth";

function resolveMergeFields(
  content: string,
  patientName: string,
  practitionerName: string
): string {
  return content
    .replace(/\{patient_name\}/g, patientName)
    .replace(/\{date\}/g, new Date().toLocaleDateString("nl-NL"))
    .replace(/\{practitioner_name\}/g, practitionerName);
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { templateId, patientIds, appointmentId, language } = body;

    if (!templateId || !patientIds?.length) {
      throw new ApiError("templateId en patientIds zijn verplicht", 400);
    }

    const lang = language === "en" ? "en" : "nl";

    const template = await prisma.consentTemplate.findFirst({
      where: { id: templateId, practiceId: user.practiceId, isActive: true },
    });

    if (!template) {
      throw new ApiError("Sjabloon niet gevonden of niet actief", 404);
    }

    const contentSource =
      lang === "en" && template.contentEn ? template.contentEn : template.contentNl;

    // Get sender name
    const sender = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true },
    });
    const practitionerName = [sender?.firstName, sender?.lastName]
      .filter(Boolean)
      .join(" ") || "Behandelaar";

    // Get patients
    const patients = await prisma.patient.findMany({
      where: {
        id: { in: patientIds },
        practiceId: user.practiceId,
      },
      select: { id: true, firstName: true, lastName: true },
    });

    if (patients.length === 0) {
      throw new ApiError("Geen geldige patienten gevonden", 400);
    }

    const expiresAt = template.expiryDays
      ? new Date(Date.now() + template.expiryDays * 24 * 60 * 60 * 1000)
      : null;

    // Create consent forms
    const formData = patients.map((patient) => {
      const patientName = [patient.firstName, patient.lastName]
        .filter(Boolean)
        .join(" ");
      const resolvedContent = resolveMergeFields(
        contentSource,
        patientName,
        practitionerName
      );

      return {
        practiceId: user.practiceId,
        patientId: patient.id,
        consentType: template.consentType,
        title: template.title,
        content: resolvedContent,
        description: template.title,
        templateId: template.id,
        language: lang,
        status: "PENDING",
        expiresAt,
        appointmentId: appointmentId || null,
      };
    });

    const result = await prisma.consentForm.createMany({
      data: formData,
    });

    // Create notifications for each patient
    await prisma.notification.createMany({
      data: patients.map((patient) => ({
        practiceId: user.practiceId,
        patientId: patient.id,
        channel: "IN_APP" as const,
        template: "CONSENT_REQUEST",
        subject: "Nieuw toestemmingsformulier",
        content: `U heeft een nieuw toestemmingsformulier ontvangen: ${template.title}`,
        status: "PENDING" as const,
      })),
    });

    return NextResponse.json(
      { created: result.count, templateTitle: template.title },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
