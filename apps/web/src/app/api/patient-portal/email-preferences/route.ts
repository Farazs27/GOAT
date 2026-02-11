import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId },
      select: { emailPreferences: true },
    });

    if (!patient) throw new ApiError("Patiënt niet gevonden", 404);

    const defaultPreferences = {
      appointmentConfirmation: true,
      appointmentReminder: true,
      invoiceNotification: true,
      messageNotification: true,
    };

    const preferences =
      (patient.emailPreferences as Record<string, boolean>) || {};

    return Response.json({
      ...defaultPreferences,
      ...preferences,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const {
      appointmentConfirmation,
      appointmentReminder,
      invoiceNotification,
      messageNotification,
    } = body;

    // Build preferences object only with provided values
    const newPreferences: Record<string, boolean> = {};
    if (typeof appointmentConfirmation === "boolean") {
      newPreferences.appointmentConfirmation = appointmentConfirmation;
    }
    if (typeof appointmentReminder === "boolean") {
      newPreferences.appointmentReminder = appointmentReminder;
    }
    if (typeof invoiceNotification === "boolean") {
      newPreferences.invoiceNotification = invoiceNotification;
    }
    if (typeof messageNotification === "boolean") {
      newPreferences.messageNotification = messageNotification;
    }

    // Get current preferences
    const current = await prisma.patient.findUnique({
      where: { id: user.patientId },
      select: { emailPreferences: true },
    });

    const currentPrefs =
      (current?.emailPreferences as Record<string, boolean>) || {};

    // Merge preferences
    const mergedPreferences = {
      ...currentPrefs,
      ...newPreferences,
    };

    await prisma.patient.update({
      where: { id: user.patientId },
      data: { emailPreferences: mergedPreferences },
    });

    return Response.json({
      message: "E-mailvoorkeuren bijgewerkt",
      preferences: mergedPreferences,
    });
  } catch (error) {
    return handleError(error);
  }
}
