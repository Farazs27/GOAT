import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { searchParams } = new URL(request.url);

    // Support listing practitioners for the booking flow
    const listPractitioners = searchParams.get("listPractitioners");
    if (listPractitioners === "true") {
      const practitioners = await prisma.user.findMany({
        where: {
          practiceId: user.practiceId,
          role: { in: ["DENTIST", "HYGIENIST"] },
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      return Response.json({
        practitioners: practitioners.map((p) => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          role: p.role,
        })),
      });
    }

    const practitionerId = searchParams.get("practitionerId");
    const date = searchParams.get("date");
    const durationMinutes = parseInt(
      searchParams.get("durationMinutes") || "30",
    );

    if (!practitionerId || !date) {
      throw new ApiError(
        "practitionerId en date zijn verplicht",
        400,
      );
    }

    // Get practice settings for booking window
    const practice = await prisma.practice.findUnique({
      where: { id: user.practiceId },
      select: { settings: true },
    });

    const settings = (practice?.settings as Record<string, unknown>) || {};
    const booking = (settings.booking as Record<string, number>) || {};
    const bookingWindowDays = booking.bookingWindowDays || 90;
    const minNoticeDays = booking.minNoticeDays || 1;

    // Validate date is within booking window
    const requestedDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + minNoticeDays);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingWindowDays);

    if (requestedDate < minDate) {
      throw new ApiError(
        `Datum moet minimaal ${minNoticeDays} dag(en) in de toekomst liggen`,
        400,
      );
    }

    if (requestedDate > maxDate) {
      throw new ApiError(
        `Datum mag maximaal ${bookingWindowDays} dagen in de toekomst liggen`,
        400,
      );
    }

    // Get day of week (0=Monday in our schema)
    const jsDay = requestedDate.getDay(); // 0=Sunday
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    // Get practitioner schedules for this day
    const schedules = await prisma.practitionerSchedule.findMany({
      where: {
        practitionerId,
        practiceId: user.practiceId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (schedules.length === 0) {
      return Response.json({ slots: [], bookingWindow: { minNoticeDays, bookingWindowDays } });
    }

    // Check for schedule exceptions (day off, modified hours)
    const exceptions = await prisma.scheduleException.findMany({
      where: {
        practitionerId,
        practiceId: user.practiceId,
        exceptionDate: {
          gte: new Date(date + "T00:00:00"),
          lt: new Date(date + "T23:59:59"),
        },
      },
    });

    // If there's a HOLIDAY or SICK exception, no slots
    const dayOff = exceptions.find((e) => e.exceptionType === "HOLIDAY" || e.exceptionType === "SICK");
    if (dayOff) {
      return Response.json({ slots: [], bookingWindow: { minNoticeDays, bookingWindowDays } });
    }

    // Get existing appointments for this practitioner on this date
    const dayStart = new Date(date + "T00:00:00");
    const dayEnd = new Date(date + "T23:59:59");

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { startTime: true, endTime: true },
    });

    // Calculate available slots with 15-minute granularity
    const slots: { startTime: string; endTime: string }[] = [];

    for (const schedule of schedules) {
      const [schedStartH, schedStartM] = schedule.startTime
        .split(":")
        .map(Number);
      const [schedEndH, schedEndM] = schedule.endTime
        .split(":")
        .map(Number);
      const schedStartMinutes = schedStartH * 60 + schedStartM;
      const schedEndMinutes = schedEndH * 60 + schedEndM;

      // Generate 15-minute slot starts
      for (
        let slotStart = schedStartMinutes;
        slotStart + durationMinutes <= schedEndMinutes;
        slotStart += 15
      ) {
        const slotEnd = slotStart + durationMinutes;

        // Check for overlap with existing appointments
        const slotStartDate = new Date(date + "T00:00:00");
        slotStartDate.setHours(
          Math.floor(slotStart / 60),
          slotStart % 60,
          0,
          0,
        );
        const slotEndDate = new Date(date + "T00:00:00");
        slotEndDate.setHours(
          Math.floor(slotEnd / 60),
          slotEnd % 60,
          0,
          0,
        );

        const hasConflict = existingAppointments.some((appt) => {
          return appt.startTime < slotEndDate && appt.endTime > slotStartDate;
        });

        if (!hasConflict) {
          const startHH = String(Math.floor(slotStart / 60)).padStart(2, "0");
          const startMM = String(slotStart % 60).padStart(2, "0");
          const endHH = String(Math.floor(slotEnd / 60)).padStart(2, "0");
          const endMM = String(slotEnd % 60).padStart(2, "0");

          slots.push({
            startTime: `${startHH}:${startMM}`,
            endTime: `${endHH}:${endMM}`,
          });
        }
      }
    }

    return Response.json({
      slots,
      bookingWindow: { minNoticeDays, bookingWindowDays },
    });
  } catch (error) {
    return handleError(error);
  }
}
