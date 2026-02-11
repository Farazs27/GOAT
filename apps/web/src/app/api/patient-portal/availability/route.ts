import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

const DURATION_MINUTES: Record<string, number> = {
  CHECKUP: 20,
  TREATMENT: 45,
  CONSULTATION: 30,
  HYGIENE: 30,
  EMERGENCY: 30,
};

function getDayOfWeek(date: Date): number {
  // 0 = Monday, 6 = Sunday
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
  durationNeeded: number,
): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  for (
    let i = startMinutes;
    i + durationNeeded <= endMinutes;
    i += slotDuration
  ) {
    const hours = Math.floor(i / 60);
    const mins = i % 60;
    slots.push(
      `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`,
    );
  }

  return slots;
}

function formatTimeLocal(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const practitionerId = searchParams.get("practitionerId");
    const appointmentType = searchParams.get("type") || "CHECKUP";

    if (!startDateParam || !endDateParam) {
      throw new ApiError("Start- en einddatum zijn verplicht", 400);
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);

    const durationNeeded = DURATION_MINUTES[appointmentType] || 30;

    // Get all dentists and hygienists
    const practitioners = await prisma.user.findMany({
      where: {
        practiceId: user.practiceId,
        role: { in: ["DENTIST", "HYGIENIST"] },
        isActive: true,
        ...(practitionerId ? { id: practitionerId } : {}),
      },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (practitioners.length === 0) {
      throw new ApiError("Geen behandelaars beschikbaar", 404);
    }

    // Get practitioner schedules
    const schedules = await prisma.practitionerSchedule.findMany({
      where: {
        practiceId: user.practiceId,
        practitionerId: { in: practitioners.map((p) => p.id) },
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });

    // Get schedule exceptions (holidays, etc.)
    const exceptions = await prisma.scheduleException.findMany({
      where: {
        practiceId: user.practiceId,
        practitionerId: { in: practitioners.map((p) => p.id) },
        exceptionDate: { gte: startDate, lte: endDate },
      },
    });

    // Get existing appointments in the date range
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        practiceId: user.practiceId,
        practitionerId: { in: practitioners.map((p) => p.id) },
        startTime: { gte: startDate, lte: endDate },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: {
        practitionerId: true,
        startTime: true,
        endTime: true,
      },
    });

    // Build availability map
    const availability: Record<
      string,
      { slots: string[]; practitioners: { id: string; name: string }[] }
    > = {};

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = getDayOfWeek(d);

      // Find available slots for this date
      const dateSlots: string[] = [];
      const availablePractitioners: { id: string; name: string }[] = [];

      for (const practitioner of practitioners) {
        // Check if practitioner has an exception this day
        const dayException = exceptions.find(
          (e) =>
            e.practitionerId === practitioner.id &&
            e.exceptionDate.toISOString().split("T")[0] === dateStr,
        );

        if (
          dayException?.exceptionType === "HOLIDAY" ||
          dayException?.exceptionType === "SICK"
        ) {
          continue;
        }

        // Get schedule for this day
        const daySchedule = schedules.find(
          (s) =>
            s.practitionerId === practitioner.id && s.dayOfWeek === dayOfWeek,
        );

        if (!daySchedule) continue;

        // Get practitioner's appointments for this day
        const practitionerAppointments = existingAppointments.filter(
          (a) =>
            a.practitionerId === practitioner.id &&
            new Date(a.startTime).toISOString().split("T")[0] === dateStr,
        );

        // Generate all possible slots
        let slots = generateTimeSlots(
          dayException?.startTime || daySchedule.startTime,
          dayException?.endTime || daySchedule.endTime,
          daySchedule.slotDuration,
          durationNeeded,
        );

        // Filter out slots that conflict with existing appointments
        slots = slots.filter((slot) => {
          const slotStart = formatTimeLocal(new Date(dateStr), slot);
          const slotEnd = new Date(
            slotStart.getTime() + durationNeeded * 60000,
          );

          // Don't allow booking in the past
          if (slotStart < new Date()) return false;

          // Check for conflicts
          const hasConflict = practitionerAppointments.some((appt) => {
            const apptStart = new Date(appt.startTime);
            const apptEnd = new Date(appt.endTime);
            return slotStart < apptEnd && slotEnd > apptStart;
          });

          return !hasConflict;
        });

        if (slots.length > 0) {
          availablePractitioners.push({
            id: practitioner.id,
            name: `${practitioner.firstName} ${practitioner.lastName}`,
          });
          dateSlots.push(...slots);
        }
      }

      // Remove duplicate slots and sort
      const uniqueSlots = [...new Set(dateSlots)].sort();

      if (uniqueSlots.length > 0) {
        availability[dateStr] = {
          slots: uniqueSlots,
          practitioners: availablePractitioners,
        };
      }
    }

    return Response.json({
      availability,
      duration: durationNeeded,
    });
  } catch (error) {
    return handleError(error);
  }
}
