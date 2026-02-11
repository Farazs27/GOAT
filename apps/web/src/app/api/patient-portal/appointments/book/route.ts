import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole, AppointmentType } from "@dentflow/shared-types";

const DURATION_MINUTES: Record<string, number> = {
  CHECKUP: 20,
  TREATMENT: 45,
  CONSULTATION: 30,
  HYGIENE: 30,
  EMERGENCY: 30,
};

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const { date, time, appointmentType, practitionerId, notes } = body;

    // Validation
    if (!date || !time || !appointmentType) {
      throw new ApiError("Datum, tijd en type zijn verplicht", 400);
    }

    if (!Object.keys(DURATION_MINUTES).includes(appointmentType)) {
      throw new ApiError("Ongeldig afspraaktype", 400);
    }

    // Parse date and time
    const [hours, minutes] = time.split(":").map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    // Validate start time is in the future
    if (startTime < new Date()) {
      throw new ApiError("Afspraak moet in de toekomst liggen", 400);
    }

    const duration = DURATION_MINUTES[appointmentType];
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Get practitioner - if not specified, find one with availability
    let selectedPractitionerId = practitionerId;

    if (!selectedPractitionerId) {
      // Find available practitioners
      const dayOfWeek = startTime.getDay() === 0 ? 6 : startTime.getDay() - 1;

      const practitioners = await prisma.user.findMany({
        where: {
          practiceId: user.practiceId,
          role: { in: ["DENTIST", "HYGIENIST"] },
          isActive: true,
        },
        select: { id: true },
      });

      // Check schedules and existing appointments
      for (const practitioner of practitioners) {
        const schedule = await prisma.practitionerSchedule.findFirst({
          where: {
            practitionerId: practitioner.id,
            dayOfWeek,
            isActive: true,
          },
        });

        if (!schedule) continue;

        const slotMinutes = hours * 60 + minutes;
        const startMinutes =
          parseInt(schedule.startTime.split(":")[0]) * 60 +
          parseInt(schedule.startTime.split(":")[1]);
        const endMinutes =
          parseInt(schedule.endTime.split(":")[0]) * 60 +
          parseInt(schedule.endTime.split(":")[1]);

        if (slotMinutes < startMinutes || slotMinutes + duration > endMinutes)
          continue;

        // Check for conflicts
        const existingAppt = await prisma.appointment.findFirst({
          where: {
            practitionerId: practitioner.id,
            OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
          },
        });

        if (!existingAppt) {
          selectedPractitionerId = practitioner.id;
          break;
        }
      }
    }

    if (!selectedPractitionerId) {
      throw new ApiError("Geen behandelaar beschikbaar op dit tijdstip", 400);
    }

    // Verify practitioner exists and belongs to practice
    const practitioner = await prisma.user.findFirst({
      where: {
        id: selectedPractitionerId,
        practiceId: user.practiceId,
        role: { in: ["DENTIST", "HYGIENIST"] },
        isActive: true,
      },
    });

    if (!practitioner) {
      throw new ApiError("Behandelaar niet gevonden", 404);
    }

    // Double-check no conflicts exist
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        practitionerId: selectedPractitionerId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    if (existingAppointment) {
      throw new ApiError("Dit tijdstip is niet meer beschikbaar", 409);
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        practiceId: user.practiceId,
        patientId: user.patientId!,
        practitionerId: selectedPractitionerId,
        startTime,
        endTime,
        durationMinutes: duration,
        appointmentType: appointmentType as AppointmentType,
        status: "SCHEDULED",
        patientNotes: notes || null,
      },
      include: {
        practitioner: { select: { firstName: true, lastName: true } },
      },
    });

    return Response.json({
      message: "Afspraak succesvol geboekt",
      appointment,
    });
  } catch (error) {
    return handleError(error);
  }
}
