import { google } from "googleapis";
import { prisma } from "@nexiom/database";

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
  // Use raw query to avoid type issues with GMAIL enum
  const credentials = await prisma.$queryRaw`
    SELECT * FROM credentials 
    WHERE practice_id = ${practiceId} 
    AND type = 'GMAIL' 
    AND is_active = true 
    LIMIT 1
  `;

  const credential =
    Array.isArray(credentials) && credentials.length > 0
      ? credentials[0]
      : null;

  if (!credential) {
    throw new Error("Gmail not connected for this practice");
  }

  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: credential.access_token,
    refresh_token: credential.refresh_token,
    expiry_date: credential.expires_at?.getTime(),
  });

  // Check if token needs refresh
  const expiryDate = credential.expires_at;
  if (expiryDate && expiryDate < new Date()) {
    const { credentials: newCreds } = await oauth2Client.refreshAccessToken();

    // Update credentials in database using raw query
    await prisma.$executeRaw`
      UPDATE credentials 
      SET access_token = ${newCreds.access_token},
          refresh_token = ${newCreds.refresh_token || credential.refresh_token},
          expires_at = ${newCreds.expiry_date ? new Date(newCreds.expiry_date) : null},
          last_used_at = ${new Date()}
      WHERE id = ${credential.id}
    `;
  }

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function getUserInfo(practiceId: string) {
  // Use raw query to avoid type issues
  const credentials = await prisma.$queryRaw`
    SELECT * FROM credentials 
    WHERE practice_id = ${practiceId} 
    AND type = 'GMAIL' 
    AND is_active = true 
    LIMIT 1
  `;

  const credential =
    Array.isArray(credentials) && credentials.length > 0
      ? credentials[0]
      : null;

  if (!credential) {
    return null;
  }

  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: credential.access_token,
    refresh_token: credential.refresh_token,
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
  try {
    // Use raw query to avoid type issues
    const credentials = await prisma.$queryRaw`
      SELECT * FROM credentials 
      WHERE practice_id = ${practiceId} 
      AND type = 'GMAIL' 
      AND is_active = true 
      LIMIT 1
    `;

    const credential =
      Array.isArray(credentials) && credentials.length > 0
        ? credentials[0]
        : null;

    return !!credential && !!credential.access_token;
  } catch {
    return false;
  }
}

export async function disconnectGmail(practiceId: string): Promise<void> {
  // Use raw query to avoid type issues
  await prisma.$executeRaw`
    UPDATE credentials 
    SET is_active = false 
    WHERE practice_id = ${practiceId} 
    AND type = 'GMAIL'
  `;
}
