import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@dentflow.nl";

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(
  data: EmailData,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!resend) {
    console.warn("[Email] Resend not configured, email not sent");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    if (result.error) {
      console.error("[Email] Send failed:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Sent successfully:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function shouldSendEmail(
  patientId: string,
  type:
    | "APPOINTMENT_CONFIRMATION"
    | "APPOINTMENT_REMINDER"
    | "INVOICE"
    | "MESSAGE",
): Promise<boolean> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      email: true,
      emailPreferences: true,
    },
  });

  if (!patient?.email) {
    return false;
  }

  const prefs = (patient.emailPreferences as Record<string, boolean>) || {};

  switch (type) {
    case "APPOINTMENT_CONFIRMATION":
      return prefs.appointmentConfirmation !== false;
    case "APPOINTMENT_REMINDER":
      return prefs.appointmentReminder !== false;
    case "INVOICE":
      return prefs.invoiceNotification !== false;
    case "MESSAGE":
      return prefs.messageNotification !== false;
    default:
      return true;
  }
}

export async function logNotification(
  practiceId: string,
  patientId: string,
  template: string,
  subject: string,
  content: string,
  externalId?: string,
  errorMessage?: string,
) {
  try {
    await prisma.notification.create({
      data: {
        practiceId,
        patientId,
        channel: "EMAIL",
        template,
        subject,
        content,
        status: errorMessage ? "FAILED" : "SENT",
        sentAt: new Date(),
        externalId,
        errorMessage,
      },
    });
  } catch (error) {
    console.error("[Email] Failed to log notification:", error);
  }
}
