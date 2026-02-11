import { prisma } from "@/lib/prisma";
import { sendEmail, shouldSendEmail, logNotification } from "./service";
import {
  getAppointmentConfirmationEmail,
  getAppointmentReminderEmail,
  getInvoiceNotificationEmail,
  getMessageNotificationEmail,
} from "./templates";

export async function sendAppointmentConfirmation(appointmentId: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        practitioner: true,
        practice: true,
      },
    });

    if (!appointment || !appointment.patient.email) {
      console.log("[Email] No appointment or patient email found");
      return { success: false, error: "No patient email" };
    }

    const canSend = await shouldSendEmail(
      appointment.patientId,
      "APPOINTMENT_CONFIRMATION",
    );

    if (!canSend) {
      console.log(
        "[Email] Patient has disabled appointment confirmation emails",
      );
      return { success: false, error: "Emails disabled by patient" };
    }

    const { subject, html, text } = getAppointmentConfirmationEmail({
      patient: appointment.patient,
      appointment,
      practice: appointment.practice,
    });

    const result = await sendEmail({
      to: appointment.patient.email,
      subject,
      html,
      text,
    });

    // Log notification
    await logNotification(
      appointment.practiceId,
      appointment.patientId,
      "appointment-confirmation",
      subject,
      text || html,
      result.messageId,
      result.error,
    );

    // Update appointment to track confirmation sent
    if (result.success) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { confirmationSentAt: new Date() },
      });
    }

    return result;
  } catch (error) {
    console.error("[Email] Error sending appointment confirmation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendAppointmentReminder(appointmentId: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        practitioner: true,
        practice: true,
      },
    });

    if (!appointment || !appointment.patient.email) {
      console.log("[Email] No appointment or patient email found");
      return { success: false, error: "No patient email" };
    }

    const canSend = await shouldSendEmail(
      appointment.patientId,
      "APPOINTMENT_REMINDER",
    );

    if (!canSend) {
      console.log("[Email] Patient has disabled appointment reminder emails");
      return { success: false, error: "Emails disabled by patient" };
    }

    const { subject, html, text } = getAppointmentReminderEmail({
      patient: appointment.patient,
      appointment,
      practice: appointment.practice,
    });

    const result = await sendEmail({
      to: appointment.patient.email,
      subject,
      html,
      text,
    });

    // Log notification
    await logNotification(
      appointment.practiceId,
      appointment.patientId,
      "appointment-reminder",
      subject,
      text || html,
      result.messageId,
      result.error,
    );

    // Update appointment to track reminder sent
    if (result.success) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { reminderSentAt: new Date() },
      });
    }

    return result;
  } catch (error) {
    console.error("[Email] Error sending appointment reminder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendInvoiceNotification(
  invoiceId: string,
  paymentUrl?: string,
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
        practice: true,
      },
    });

    if (!invoice || !invoice.patient.email) {
      console.log("[Email] No invoice or patient email found");
      return { success: false, error: "No patient email" };
    }

    const canSend = await shouldSendEmail(invoice.patientId, "INVOICE");

    if (!canSend) {
      console.log("[Email] Patient has disabled invoice notification emails");
      return { success: false, error: "Emails disabled by patient" };
    }

    const { subject, html, text } = getInvoiceNotificationEmail({
      patient: invoice.patient,
      invoice,
      practice: invoice.practice,
      paymentUrl,
    });

    const result = await sendEmail({
      to: invoice.patient.email,
      subject,
      html,
      text,
    });

    // Log notification
    await logNotification(
      invoice.practiceId,
      invoice.patientId,
      "invoice-notification",
      subject,
      text || html,
      result.messageId,
      result.error,
    );

    return result;
  } catch (error) {
    console.error("[Email] Error sending invoice notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendMessageNotification(
  patientId: string,
  senderId: string,
  messageContent: string,
  messageId: string,
  portalUrl?: string,
) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { practice: true },
    });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!patient || !sender || !patient.email) {
      console.log("[Email] No patient, sender, or patient email found");
      return { success: false, error: "No patient email" };
    }

    const canSend = await shouldSendEmail(patientId, "MESSAGE");

    if (!canSend) {
      console.log("[Email] Patient has disabled message notification emails");
      return { success: false, error: "Emails disabled by patient" };
    }

    const { subject, html, text } = getMessageNotificationEmail({
      patient,
      sender,
      messagePreview: messageContent,
      practice: patient.practice,
      messageId,
      portalUrl:
        portalUrl || `${process.env.NEXT_PUBLIC_APP_URL}/portal/messages`,
    });

    const result = await sendEmail({
      to: patient.email,
      subject,
      html,
      text,
    });

    // Log notification
    await logNotification(
      patient.practiceId,
      patientId,
      "message-notification",
      subject,
      text || html,
      result.messageId,
      result.error,
    );

    return result;
  } catch (error) {
    console.error("[Email] Error sending message notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
