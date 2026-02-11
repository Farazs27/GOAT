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

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100,
    pageToken,
  });

  const messages = response.data.messages || [];

  // For now, just return the messages without saving to database
  // This will be implemented when Email models are properly set up
  return {
    success: true,
    messages: messages.length,
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
  // For now, return empty array
  // This will be implemented when Email models are properly set up
  return { threads: [], total: 0 };
}

export async function getThreadDetail(practiceId: string, threadId: string) {
  // For now, return null
  // This will be implemented when Email models are properly set up
  return null;
}

export async function markThreadAsRead(practiceId: string, threadId: string) {
  // For now, do nothing
  // This will be implemented when Email models are properly set up
}

export async function toggleThreadStarred(
  practiceId: string,
  threadId: string,
) {
  // For now, return null
  // This will be implemented when Email models are properly set up
  return { isStarred: false };
}

export async function archiveThread(practiceId: string, threadId: string) {
  // For now, just sync with Gmail
  const gmail = await getGmailClient(practiceId);

  try {
    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        removeLabelIds: ["INBOX"],
      },
    });
  } catch (error) {
    console.error("Failed to archive in Gmail:", error);
  }
}
