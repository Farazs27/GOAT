import { google } from "googleapis";
import { prisma } from "@dentflow/database";

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const REDIRECT_URI = `${NEXT_PUBLIC_APP_URL}/api/gmail/oauth/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getOAuth2Client() {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    throw new Error(
      "GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be configured",
    );
  }

  return new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: state,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}

export async function getGmailClient(practiceId: string) {
  const credential = await prisma.credential.findFirst({
    where: {
      practiceId,
      type: "GMAIL",
      isActive: true,
    },
  });

  if (!credential) {
    throw new Error("Gmail not connected for this practice");
  }

  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: credential.accessToken,
    refresh_token: credential.refreshToken,
    expiry_date: credential.expiresAt?.getTime(),
  });

  // Set up token refresh handler
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.credential.update({
        where: { id: credential.id },
        data: {
          accessToken: tokens.access_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          lastUsedAt: new Date(),
        },
      });
    }
  });

  // Check if token needs refresh
  const expiryDate = credential.expiresAt;
  if (expiryDate && expiryDate < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    await prisma.credential.update({
      where: { id: credential.id },
      data: {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || credential.refreshToken,
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
        lastUsedAt: new Date(),
      },
    });
  }

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function getUserInfo(practiceId: string) {
  const credential = await prisma.credential.findFirst({
    where: {
      practiceId,
      type: "GMAIL",
      isActive: true,
    },
  });

  if (!credential) {
    return null;
  }

  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: credential.accessToken,
    refresh_token: credential.refreshToken,
  });

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

export async function isGmailConnected(practiceId: string): Promise<boolean> {
  const credential = await prisma.credential.findFirst({
    where: {
      practiceId,
      type: "GMAIL",
      isActive: true,
    },
  });

  return !!credential && !!credential.accessToken;
}

export async function disconnectGmail(practiceId: string): Promise<void> {
  const credential = await prisma.credential.findFirst({
    where: {
      practiceId,
      type: "GMAIL",
      isActive: true,
    },
  });

  if (credential) {
    await prisma.credential.update({
      where: { id: credential.id },
      data: { isActive: false },
    });
  }
}
