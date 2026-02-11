import { getGmailClient } from "./oauth";
import { prisma } from "@dentflow/database";

interface GmailMessagePart {
  mimeType?: string;
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
  filename?: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{
      name: string;
      value: string;
    }>;
    parts?: GmailMessagePart[];
    body?: {
      data?: string;
    };
  };
  internalDate?: string;
}

function decodeBase64Url(data: string): string {
  let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error("Invalid base64 string");
    }
    base64 += new Array(5 - pad).join("=");
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBody(parts: GmailMessagePart[] | undefined): {
  html?: string;
  text?: string;
} {
  if (!parts) return {};

  let html = "";
  let text = "";

  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data) {
      html = decodeBase64Url(part.body.data);
    } else if (part.mimeType === "text/plain" && part.body?.data) {
      text = decodeBase64Url(part.body.data);
    } else if (part.parts) {
      const nested = extractBody(part.parts);
      if (nested.html) html = nested.html;
      if (nested.text) text = nested.text;
    }
  }

  return { html, text };
}

function parseMessage(message: GmailMessage) {
  const headers = message.payload?.headers || [];
  const from =
    headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
  const to =
    headers
      .find((h) => h.name.toLowerCase() === "to")
      ?.value?.split(",")
      .map((s) => s.trim()) || [];
  const cc =
    headers
      .find((h) => h.name.toLowerCase() === "cc")
      ?.value?.split(",")
      .map((s) => s.trim()) || [];
  const bcc =
    headers
      .find((h) => h.name.toLowerCase() === "bcc")
      ?.value?.split(",")
      .map((s) => s.trim()) || [];
  const subject =
    headers.find((h) => h.name.toLowerCase() === "subject")?.value || "";
  const date = headers.find((h) => h.name.toLowerCase() === "date")?.value;

  const body = extractBody(message.payload?.parts);

  return {
    gmailMessageId: message.id,
    gmailThreadId: message.threadId,
    from,
    to,
    cc,
    bcc,
    subject,
    bodyHtml: body.html || null,
    bodyText: body.text || null,
    snippet: message.snippet || null,
    labels: message.labelIds || [],
    internalDate: date
      ? new Date(date)
      : new Date(parseInt(message.internalDate || "0")),
    isUnread: message.labelIds?.includes("UNREAD") || false,
    isStarred: message.labelIds?.includes("STARRED") || false,
  };
}

export async function syncGmailMessages(
  practiceId: string,
  pageToken?: string,
) {
  const gmail = await getGmailClient(practiceId);

  // Get last sync time or default to 30 days ago
  const lastSync = await prisma.emailMessage.findFirst({
    where: { practiceId },
    orderBy: { internalDate: "desc" },
    select: { internalDate: true },
  });

  const query = lastSync
    ? `after:${Math.floor(lastSync.internalDate.getTime() / 1000)}`
    : undefined;

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100,
    pageToken,
    q: query,
  });

  const messages = response.data.messages || [];
  const syncedCount = { threads: 0, messages: 0 };

  for (const msg of messages) {
    if (!msg.id) continue;

    // Check if message already exists
    const existing = await prisma.emailMessage.findFirst({
      where: {
        practiceId,
        gmailMessageId: msg.id,
      },
    });

    if (existing) continue;

    // Fetch full message
    const fullMessage = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const parsed = parseMessage(fullMessage.data as GmailMessage);

    // Find or create thread
    let thread = await prisma.emailThread.findFirst({
      where: {
        practiceId,
        gmailThreadId: parsed.gmailThreadId,
      },
    });

    if (!thread) {
      thread = await prisma.emailThread.create({
        data: {
          practiceId,
          gmailThreadId: parsed.gmailThreadId,
          subject: parsed.subject,
          participants: [parsed.from, ...parsed.to],
          snippet: parsed.snippet,
          labels: parsed.labels,
          isUnread: parsed.isUnread,
          isStarred: parsed.isStarred,
          lastMessageAt: parsed.internalDate,
        },
      });
      syncedCount.threads++;
    } else {
      // Update thread
      await prisma.emailThread.update({
        where: { id: thread.id },
        data: {
          snippet: parsed.snippet,
          lastMessageAt: parsed.internalDate,
          isUnread: parsed.isUnread || thread.isUnread,
          labels: Array.from(new Set([...thread.labels, ...parsed.labels])),
        },
      });
    }

    // Create message
    await prisma.emailMessage.create({
      data: {
        practiceId,
        threadId: thread.id,
        gmailMessageId: parsed.gmailMessageId,
        from: parsed.from,
        to: parsed.to,
        cc: parsed.cc,
        bcc: parsed.bcc,
        subject: parsed.subject,
        bodyHtml: parsed.bodyHtml,
        bodyText: parsed.bodyText,
        snippet: parsed.snippet,
        labels: parsed.labels,
        isUnread: parsed.isUnread,
        isStarred: parsed.isStarred,
        internalDate: parsed.internalDate,
      },
    });

    syncedCount.messages++;
  }

  return {
    success: true,
    synced: syncedCount,
    nextPageToken: response.data.nextPageToken,
  };
}

export async function sendGmailMessage(
  practiceId: string,
  {
    to,
    cc,
    bcc,
    subject,
    bodyHtml,
    bodyText,
    threadId,
  }: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    threadId?: string;
  },
) {
  const gmail = await getGmailClient(practiceId);

  // Build email content
  const boundary = "----=_Part_" + Math.random().toString(36).substring(2);

  let email = "MIME-Version: 1.0\n";
  email += "To: " + to.join(", ") + "\n";
  if (cc?.length) email += "Cc: " + cc.join(", ") + "\n";
  if (bcc?.length) email += "Bcc: " + bcc.join(", ") + "\n";
  email += "Subject: " + subject + "\n";
  email += 'Content-Type: multipart/alternative; boundary="' + boundary + '"\n';
  email += "\n";

  if (bodyText) {
    email += "--" + boundary + "\n";
    email += 'Content-Type: text/plain; charset="UTF-8"\n';
    email += "\n";
    email += bodyText + "\n";
  }

  if (bodyHtml) {
    email += "--" + boundary + "\n";
    email += 'Content-Type: text/html; charset="UTF-8"\n';
    email += "\n";
    email += bodyHtml + "\n";
  }

  email += "--" + boundary + "--";

  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Build request body
  const requestBody: { raw: string; threadId?: string } = {
    raw: encodedEmail,
  };

  if (threadId) {
    requestBody.threadId = threadId;
  }

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody,
  });

  return {
    success: true,
    gmailMessageId: response.data.id,
    threadId: response.data.threadId,
  };
}

export async function getEmailThreads(
  practiceId: string,
  {
    label,
    patientId,
    limit = 50,
    offset = 0,
    search,
  }: {
    label?: string;
    patientId?: string;
    limit?: number;
    offset?: number;
    search?: string;
  },
) {
  const where: {
    practiceId: string;
    labels?: { has: string };
    patientId?: string;
    OR?: Array<{
      subject?: { contains: string; mode: "insensitive" };
      snippet?: { contains: string; mode: "insensitive" };
    }>;
  } = { practiceId };

  if (label) {
    where.labels = { has: label };
  }

  if (patientId) {
    where.patientId = patientId;
  }

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { snippet: { contains: search, mode: "insensitive" } },
    ];
  }

  const [threads, total] = await Promise.all([
    prisma.emailThread.findMany({
      where,
      include: {
        messages: {
          orderBy: { internalDate: "asc" },
          select: {
            id: true,
            from: true,
            to: true,
            subject: true,
            snippet: true,
            internalDate: true,
            isUnread: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.emailThread.count({ where }),
  ]);

  return { threads, total };
}

export async function getThreadDetail(practiceId: string, threadId: string) {
  const thread = await prisma.emailThread.findFirst({
    where: {
      id: threadId,
      practiceId,
    },
    include: {
      messages: {
        orderBy: { internalDate: "asc" },
        select: {
          id: true,
          from: true,
          to: true,
          cc: true,
          bcc: true,
          subject: true,
          bodyHtml: true,
          bodyText: true,
          snippet: true,
          internalDate: true,
          isUnread: true,
          isStarred: true,
          labels: true,
          attachments: true,
        },
      },
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return thread;
}

export async function markThreadAsRead(practiceId: string, threadId: string) {
  await prisma.emailThread.update({
    where: { id: threadId, practiceId },
    data: { isUnread: false },
  });

  await prisma.emailMessage.updateMany({
    where: { threadId, practiceId },
    data: { isUnread: false },
  });
}

export async function toggleThreadStarred(
  practiceId: string,
  threadId: string,
) {
  const thread = await prisma.emailThread.findFirst({
    where: { id: threadId, practiceId },
  });

  if (!thread) return;

  await prisma.emailThread.update({
    where: { id: threadId },
    data: { isStarred: !thread.isStarred },
  });

  return { isStarred: !thread.isStarred };
}

export async function archiveThread(practiceId: string, threadId: string) {
  const thread = await prisma.emailThread.findFirst({
    where: { id: threadId, practiceId },
  });

  if (!thread) return;

  const newLabels = thread.labels.filter((l: string) => l !== "INBOX");

  await prisma.emailThread.update({
    where: { id: threadId },
    data: { labels: newLabels },
  });

  // Also sync with Gmail
  const gmail = await getGmailClient(practiceId);

  try {
    await gmail.users.threads.modify({
      userId: "me",
      id: thread.gmailThreadId,
      requestBody: {
        removeLabelIds: ["INBOX"],
      },
    });
  } catch (error) {
    console.error("Failed to archive in Gmail:", error);
  }
}
