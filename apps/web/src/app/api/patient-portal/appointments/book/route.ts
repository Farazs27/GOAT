import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole, AppointmentType } from "@nexiom/shared-types";

const DURATION_MINUTES: Record<string, number> = {
  CHECKUP: 30,
  CLEANING: 45,
  EMERGENCY: 15,
  TREATMENT: 45,
  CONSULTATION: 30,
  HYGIENE: 45,
};

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const { date, startTime: time, appointmentType, practitionerId, notes } = body;

    // Validation
    if (!date || !time || !appointmentType || !practitionerId) {
      throw new ApiError("Datum, tijd, type en behandelaar zijn verplicht", 400);
    }

    if (!Object.keys(DURATION_MINUTES).includes(appointmentType)) {
      throw new ApiError("Ongeldig afspraaktype", 400);
    }

    // Get practice settings
    const practice = await prisma.practice.findUnique({
      where: { id: user.practiceId },
      select: { settings: true },
    });

    const settings = (practice?.settings as Record<string, unknown>) || {};
    const booking = (settings.booking as Record<string, number>) || {};
    const maxPendingBookings = booking.maxPendingBookings || 2;
    const bookingWindowDays = booking.bookingWindowDays || 90;
    const minNoticeDays = booking.minNoticeDays || 1;

    // Max pending check
    const pendingCount = await prisma.appointment.count({
      where: {
        patientId: user.patientId!,
        status: "PENDING_APPROVAL",
      },
    });

    if (pendingCount >= maxPendingBookings) {
      throw new ApiError(
        `U heeft al ${maxPendingBookings} afspraken in afwachting van goedkeuring.`,
        400,
      );
    }

    // Parse date and time
    const [hours, minutes] = time.split(":").map(Number);
    const startTime = new Date(date + "T00:00:00");
    startTime.setHours(hours, minutes, 0, 0);

    // Booking window validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + minNoticeDays);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingWindowDays);

    const requestedDate = new Date(date + "T00:00:00");
    if (requestedDate < minDate) {
      throw new ApiError(
        `Afspraak moet minimaal ${minNoticeDays} dag(en) in de toekomst liggen`,
        400,
      );
    }

    if (requestedDate > maxDate) {
      throw new ApiError(
        `Afspraak mag maximaal ${bookingWindowDays} dagen in de toekomst liggen`,
        400,
      );
    }

    const duration = DURATION_MINUTES[appointmentType];
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Verify practitioner exists and belongs to practice
    const practitioner = await prisma.user.findFirst({
      where: {
        id: practitionerId,
        practiceId: user.practiceId,
        role: { in: ["DENTIST", "HYGIENIST"] },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!practitioner) {
      throw new ApiError("Behandelaar niet gevonden", 404);
    }

    // Double-check slot availability
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        practitionerId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    if (existingAppointment) {
      throw new ApiError("Dit tijdstip is niet meer beschikbaar", 409);
    }

    // Map CLEANING to HYGIENE for the enum (CLEANING is not in AppointmentType enum)
    const dbType = appointmentType === "CLEANING" ? "HYGIENE" : appointmentType;

    // Get patient info for notification
    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId! },
      select: { firstName: true, lastName: true },
    });

    // Create appointment + notification in transaction
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          practiceId: user.practiceId,
          patientId: user.patientId!,
          practitionerId,
          startTime,
          endTime,
          durationMinutes: duration,
          appointmentType: dbType as AppointmentType,
          status: "PENDING_APPROVAL",
          patientNotes: notes || null,
        },
        include: {
          practitioner: { select: { firstName: true, lastName: true } },
        },
      });

      // Create notification for staff
      const dateStr = requestedDate.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      await tx.notification.create({
        data: {
          practiceId: user.practiceId,
          userId: practitionerId,
          patientId: user.patientId!,
          channel: "IN_APP",
          template: "BOOKING_REQUEST",
          subject: "Nieuwe afspraak aanvraag",
          content: `Patient ${patient?.firstName} ${patient?.lastName} wil een afspraak op ${dateStr} om ${time}`,
          status: "PENDING",
          metadata: {
            appointmentId: appointment.id,
            appointmentType,
          },
        },
      });

      return appointment;
    });

    return Response.json({
      message: "Afspraak aangevraagd — wacht op bevestiging",
      appointment: result,
    });
  } catch (error) {
    return handleError(error);
  }
}
