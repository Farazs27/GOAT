import twilio from "twilio";
import { prisma } from "@dentflow/database";

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
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

  // Parse config for WhatsApp number
  const config = credential.config as { whatsappNumber?: string } | null;

  return {
    accountSid: credential.apiKey,
    authToken: credential.apiSecret,
    whatsappNumber: config?.whatsappNumber || "",
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

export async function isWhatsAppConfigured(
  practiceId: string,
): Promise<boolean> {
  const credentials = await getTwilioCredentials(practiceId);
  return !!credentials && !!credentials.whatsappNumber;
}
