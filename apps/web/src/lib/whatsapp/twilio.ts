import twilio from "twilio";
import { prisma } from "@dentflow/database";

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
  smsNumber: string;
}

async function getTwilioCredentials(
  practiceId: string,
): Promise<TwilioCredentials | null> {
  const credential = await prisma.credential.findFirst({
    where: {
      practiceId,
      type: "TWILIO",
      isActive: true,
    },
  });

  if (!credential?.apiKey || !credential?.apiSecret) {
    return null;
  }

  // Parse config for WhatsApp and SMS numbers
  const config = credential.config as { whatsappNumber?: string; smsNumber?: string } | null;

  return {
    accountSid: credential.apiKey,
    authToken: credential.apiSecret,
    whatsappNumber: config?.whatsappNumber || "",
    smsNumber: config?.smsNumber || "",
  };
}

export async function getTwilioClient(practiceId: string) {
  const credentials = await getTwilioCredentials(practiceId);

  if (!credentials) {
    throw new Error("Twilio not configured for this practice");
  }

  return {
    client: twilio(credentials.accountSid, credentials.authToken),
    whatsappNumber: credentials.whatsappNumber,
    smsNumber: credentials.smsNumber,
    accountSid: credentials.accountSid,
  };
}

export async function sendWhatsAppMessage(
  practiceId: string,
  to: string,
  body: string,
  sentBy?: string,
) {
  const { client, whatsappNumber } = await getTwilioClient(practiceId);

  // Normalize phone number
  const normalizedTo = normalizePhoneNumber(to);

  // Send message via Twilio
  const message = await client.messages.create({
    body,
    from: `whatsapp:${whatsappNumber}`,
    to: `whatsapp:${normalizedTo}`,
  });

  // Store message in database (skip conversation logic for now)
  // This will be implemented when WhatsApp models are properly set up

  return {
    success: true,
    twilioSid: message.sid,
    status: message.status,
  };
}

export async function processIncomingWhatsApp(
  practiceId: string,
  twilioData: {
    MessageSid: string;
    From: string;
    To: string;
    Body: string;
    NumMedia: string;
    MediaUrl0?: string;
    MediaContentType0?: string;
  },
) {
  // Process incoming message
  // This will be implemented when WhatsApp models are properly set up

  return {
    success: true,
    messageId: twilioData.MessageSid,
  };
}

export async function getWhatsAppConversations(
  practiceId: string,
  {
    limit = 50,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  },
) {
  // This will be implemented when WhatsApp models are properly set up
  return { conversations: [], total: 0 };
}

export async function getWhatsAppMessages(
  practiceId: string,
  conversationId: string,
  {
    limit = 50,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  },
) {
  // This will be implemented when WhatsApp models are properly set up
  return {
    messages: [],
    total: 0,
    conversation: null,
  };
}

export async function updateMessageStatus(
  twilioSid: string,
  status: string,
  errorCode?: string,
  errorMessage?: string,
) {
  // This will be implemented when WhatsApp models are properly set up
}

function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Ensure it starts with country code (assume NL +31 if not present)
  if (cleaned.startsWith("0")) {
    return `+31${cleaned.slice(1)}`;
  }

  if (!cleaned.startsWith("+")) {
    return `+${cleaned}`;
  }

  return cleaned;
}

export async function sendSms(
  practiceId: string,
  to: string,
  body: string,
): Promise<{ success: boolean; twilioSid?: string; error?: string }> {
  try {
    const { client, smsNumber } = await getTwilioClient(practiceId);

    if (!smsNumber) {
      return { success: false, error: "SMS number not configured for this practice" };
    }

    const normalizedTo = normalizePhoneNumber(to);
    const message = await client.messages.create({
      body,
      to: normalizedTo,
      from: smsNumber,
    });

    return { success: true, twilioSid: message.sid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendAppointmentReminderSms(
  practiceId: string,
  patientName: string,
  appointmentTime: string,
  practiceName: string,
  phone: string,
): Promise<{ success: boolean; twilioSid?: string; error?: string }> {
  const body = `Beste ${patientName}, u heeft morgen om ${appointmentTime} een afspraak bij ${practiceName}. Neem contact op als u wilt afzeggen.`;
  return sendSms(practiceId, phone, body);
}

export async function sendAppointmentReminderWhatsApp(
  practiceId: string,
  patientName: string,
  appointmentTime: string,
  practiceName: string,
  phone: string,
): Promise<{ success: boolean; twilioSid?: string; error?: string }> {
  const body = `Beste ${patientName}, u heeft morgen om ${appointmentTime} een afspraak bij ${practiceName}. Neem contact op als u wilt afzeggen.`;
  try {
    const result = await sendWhatsAppMessage(practiceId, phone, body);
    return { success: result.success, twilioSid: result.twilioSid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function isSmsConfigured(
  practiceId: string,
): Promise<boolean> {
  const credentials = await getTwilioCredentials(practiceId);
  return !!credentials && !!credentials.smsNumber;
}

export async function isWhatsAppConfigured(
  practiceId: string,
): Promise<boolean> {
  const credentials = await getTwilioCredentials(practiceId);
  return !!credentials && !!credentials.whatsappNumber;
}
