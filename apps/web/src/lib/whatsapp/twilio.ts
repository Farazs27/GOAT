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

  // Find or create conversation
  let conversation = await prisma.whatsappConversation.findFirst({
    where: {
      practiceId,
      phoneNumber: normalizedTo,
    },
  });

  if (!conversation) {
    // Try to link to patient by phone number
    const patient = await prisma.patient.findFirst({
      where: {
        practiceId,
        phone: {
          contains: normalizedTo.slice(-9), // Match last 9 digits
        },
      },
    });

    conversation = await prisma.whatsappConversation.create({
      data: {
        practiceId,
        patientId: patient?.id || "", // Will need to handle unlinked conversations
        phoneNumber: normalizedTo,
        lastMessageAt: new Date(),
      },
    });
  } else {
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  // Store message in database
  const storedMessage = await prisma.whatsAppMessage.create({
    data: {
      practiceId,
      conversationId: conversation.id,
      twilioSid: message.sid,
      direction: "outbound",
      from: whatsappNumber,
      to: normalizedTo,
      body,
      status: message.status || "sent",
      sentBy,
    },
  });

  return {
    success: true,
    messageId: storedMessage.id,
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
  const from = normalizePhoneNumber(twilioData.From.replace("whatsapp:", ""));
  const to = normalizePhoneNumber(twilioData.To.replace("whatsapp:", ""));

  // Find or create conversation
  let conversation = await prisma.whatsappConversation.findFirst({
    where: {
      practiceId,
      phoneNumber: from,
    },
  });

  if (!conversation) {
    // Try to link to patient by phone number
    const patient = await prisma.patient.findFirst({
      where: {
        practiceId,
        phone: {
          contains: from.slice(-9),
        },
      },
    });

    conversation = await prisma.whatsappConversation.create({
      data: {
        practiceId,
        patientId: patient?.id || "",
        phoneNumber: from,
        lastMessageAt: new Date(),
      },
    });
  } else {
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  // Store message
  const message = await prisma.whatsAppMessage.create({
    data: {
      practiceId,
      conversationId: conversation.id,
      twilioSid: twilioData.MessageSid,
      direction: "inbound",
      from,
      to,
      body: twilioData.Body,
      mediaUrl: twilioData.MediaUrl0,
      mediaType: twilioData.MediaContentType0,
      status: "received",
    },
  });

  return {
    success: true,
    messageId: message.id,
    conversationId: conversation.id,
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
  const [conversations, total] = await Promise.all([
    prisma.whatsappConversation.findMany({
      where: {
        practiceId,
        isActive: true,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            body: true,
            createdAt: true,
            direction: true,
            status: true,
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.whatsappConversation.count({
      where: { practiceId, isActive: true },
    }),
  ]);

  return { conversations, total };
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
  const conversation = await prisma.whatsappConversation.findFirst({
    where: {
      id: conversationId,
      practiceId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const [messages, total] = await Promise.all([
    prisma.whatsAppMessage.findMany({
      where: {
        conversationId,
        practiceId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.whatsAppMessage.count({
      where: { conversationId, practiceId },
    }),
  ]);

  return {
    messages: messages.reverse(), // Return in chronological order
    total,
    conversation,
  };
}

export async function updateMessageStatus(
  twilioSid: string,
  status: string,
  errorCode?: string,
  errorMessage?: string,
) {
  await prisma.whatsAppMessage.update({
    where: { twilioSid },
    data: {
      status,
      errorCode,
      errorMessage,
    },
  });
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
