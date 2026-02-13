import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError, ApiError } from "@/lib/auth";
import { sendEmail, logNotification } from "@/lib/email/service";
import { getFollowupReminderEmail } from "@/lib/email/templates";

function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id: patientId } = await params;

    // Fetch patient + practice
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError("Patiënt niet gevonden", 404);
    if (!patient.email) throw new ApiError("Patiënt heeft geen e-mailadres", 400);

    const practice = await prisma.practice.findUnique({
      where: { id: user.practiceId },
    });
    if (!practice) throw new ApiError("Praktijk niet gevonden", 404);

    // Find next 5 days with availability
    const practitioners = await prisma.user.findMany({
      where: {
        practiceId: user.practiceId,
        role: { in: ["DENTIST", "HYGIENIST"] },
        isActive: true,
      },
      select: { id: true },
    });

    const practitionerIds = practitioners.map((p) => p.id);

    const schedules = await prisma.practitionerSchedule.findMany({
      where: {
        practiceId: user.practiceId,
        practitionerId: { in: practitionerIds },
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });

    // Look 30 days ahead to find 5 available days
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const exceptions = await prisma.scheduleException.findMany({
      where: {
        practiceId: user.practiceId,
        practitionerId: { in: practitionerIds },
        exceptionDate: { gte: now, lte: endDate },
      },
    });

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        practiceId: user.practiceId,
        practitionerId: { in: practitionerIds },
        startTime: { gte: now, lte: endDate },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { practitionerId: true, startTime: true, endTime: true },
    });

    const availableDays: string[] = [];
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + 1); // Start from tomorrow

    while (availableDays.length < 5 && checkDate <= endDate) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const dayOfWeek = getDayOfWeek(checkDate);

      let hasSlots = false;

      for (const practId of practitionerIds) {
        // Check exceptions
        const dayException = exceptions.find(
          (e) =>
            e.practitionerId === practId &&
            e.exceptionDate.toISOString().split("T")[0] === dateStr
        );
        if (
          dayException?.exceptionType === "HOLIDAY" ||
          dayException?.exceptionType === "SICK"
        ) {
          continue;
        }

        // Check schedule
        const daySchedule = schedules.find(
          (s) => s.practitionerId === practId && s.dayOfWeek === dayOfWeek
        );
        if (!daySchedule) continue;

        // Check if there are open slots (at least 1 slot of 20 min for a checkup)
        const dayAppointments = existingAppointments.filter(
          (a) =>
            a.practitionerId === practId &&
            new Date(a.startTime).toISOString().split("T")[0] === dateStr
        );

        // Simple check: if total booked time < available time, there are slots
        const [startH, startM] = (dayException?.startTime || daySchedule.startTime).split(":").map(Number);
        const [endH, endM] = (dayException?.endTime || daySchedule.endTime).split(":").map(Number);
        const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        const bookedMinutes = dayAppointments.reduce((sum, a) => {
          return sum + (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000;
        }, 0);

        if (bookedMinutes + 20 <= totalMinutes) {
          hasSlots = true;
          break;
        }
      }

      if (hasSlots) {
        const formatted = checkDate.toLocaleDateString("nl-NL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        availableDays.push(formatted);
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    if (availableDays.length === 0) {
      throw new ApiError("Geen beschikbare dagen gevonden in de komende 30 dagen", 400);
    }

    // Build booking URL
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/appointments/book`;

    // Generate email
    const { subject, html, text } = getFollowupReminderEmail({
      patient,
      practice,
      availableDays,
      bookingUrl,
    });

    // Send email
    const result = await sendEmail({
      to: patient.email,
      subject,
      html,
      text,
    });

    // Log notification
    await logNotification(
      user.practiceId,
      patientId,
      "followup-reminder",
      subject,
      text || html,
      result.messageId,
      result.error
    );

    if (!result.success) {
      throw new ApiError(`E-mail verzenden mislukt: ${result.error}`, 500);
    }

    return Response.json({
      success: true,
      emailedAt: new Date().toISOString(),
      availableDays,
    });
  } catch (error) {
    return handleError(error);
  }
}
