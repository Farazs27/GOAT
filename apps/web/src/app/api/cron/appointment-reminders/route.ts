import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminder } from "@/lib/email/triggers";

// This endpoint should be called by a cron job scheduler (e.g., Vercel Cron)
// It sends reminder emails for appointments scheduled in the next 24 hours

export async function GET(request: NextRequest) {
  // Verify cron secret if configured
  const cronSecret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 1 hour buffer

    // Find appointments scheduled between 23-25 hours from now (next 24h window)
    // that haven't had a reminder sent yet
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: tomorrow,
          lt: tomorrowEnd,
        },
        status: {
          in: ["SCHEDULED", "CONFIRMED"],
        },
        reminderSentAt: null,
        patient: {
          email: {
            not: null,
          },
        },
      },
      include: {
        patient: true,
        practitioner: true,
        practice: true,
      },
    });

    console.log(
      `[Cron] Found ${appointments.length} appointments requiring reminders`,
    );

    const results = {
      total: appointments.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const appointment of appointments) {
      try {
        const result = await sendAppointmentReminder(appointment.id);
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Appointment ${appointment.id}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Appointment ${appointment.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return Response.json({
      success: true,
      message: `Processed ${results.total} appointments. Sent: ${results.sent}, Failed: ${results.failed}`,
      details: results,
    });
  } catch (error) {
    console.error("[Cron] Error sending appointment reminders:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
