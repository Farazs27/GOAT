import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminder } from "@/lib/email/triggers";
import {
  sendAppointmentReminderSms,
  sendAppointmentReminderWhatsApp,
  isSmsConfigured,
  isWhatsAppConfigured,
} from "@/lib/whatsapp/twilio";

// This endpoint should be called by a cron job scheduler (e.g., Vercel Cron)
// It sends reminder emails for appointments scheduled in the next 24 hours
// and SMS/WhatsApp reminders when Twilio is configured

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
      emailSent: 0,
      smsSent: 0,
      whatsappSent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const appointment of appointments) {
      // 1. Send email reminder (existing flow)
      try {
        const result = await sendAppointmentReminder(appointment.id);
        if (result.success) {
          results.emailSent++;
        } else {
          results.failed++;
          results.errors.push(`Email ${appointment.id}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Email ${appointment.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // 2. Send SMS/WhatsApp reminders if patient has a phone number
      const phone = appointment.patient.phone;

      if (phone && appointment.practice) {
        const practiceId = appointment.practice.id;
        const patientName = `${appointment.patient.firstName || ""} ${appointment.patient.lastName || ""}`.trim();
        const appointmentTime = new Date(appointment.startTime).toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const practiceName = appointment.practice.name;

        // SMS
        try {
          const smsConfigured = await isSmsConfigured(practiceId);
          if (smsConfigured) {
            const smsResult = await sendAppointmentReminderSms(
              practiceId,
              patientName,
              appointmentTime,
              practiceName,
              phone,
            );
            if (smsResult.success) {
              results.smsSent++;
            } else {
              console.log(`[Cron] SMS failed for ${appointment.id}: ${smsResult.error}`);
            }
          } else {
            console.log(`[Cron] SMS not configured for practice ${practiceId}, skipping`);
          }
        } catch (error) {
          console.log(
            `[Cron] SMS error for ${appointment.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }

        // WhatsApp
        try {
          const waConfigured = await isWhatsAppConfigured(practiceId);
          if (waConfigured) {
            const waResult = await sendAppointmentReminderWhatsApp(
              practiceId,
              patientName,
              appointmentTime,
              practiceName,
              phone,
            );
            if (waResult.success) {
              results.whatsappSent++;
            } else {
              console.log(`[Cron] WhatsApp failed for ${appointment.id}: ${waResult.error}`);
            }
          } else {
            console.log(`[Cron] WhatsApp not configured for practice ${practiceId}, skipping`);
          }
        } catch (error) {
          console.log(
            `[Cron] WhatsApp error for ${appointment.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    return Response.json({
      success: true,
      message: `Processed ${results.total} appointments. Email: ${results.emailSent}, SMS: ${results.smsSent}, WhatsApp: ${results.whatsappSent}, Failed: ${results.failed}`,
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
