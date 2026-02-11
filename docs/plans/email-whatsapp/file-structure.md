# File Structure for Email & WhatsApp

## New Files to Create

```
apps/web/src/
├── lib/
│   ├── gmail/
│   │   ├── index.ts          # Barrel export
│   │   ├── oauth.ts          # OAuth2 client, getAuthUrl, exchangeCode, getGmailClient
│   │   └── sync.ts           # syncGmailMessages, saveEmailMessage, sendGmailMessage
│   └── whatsapp/
│       ├── index.ts          # Barrel export
│       └── twilio.ts         # getTwilioClient, sendWhatsAppMessage, processIncomingWhatsApp
├── app/
│   ├── (dashboard)/
│   │   ├── email/
│   │   │   └── page.tsx      # Gmail inbox UI (3-column: labels | threads | detail)
│   │   └── whatsapp/
│   │       └── page.tsx      # WhatsApp chat UI (2-column: conversations | messages)
│   └── api/
│       ├── gmail/
│       │   ├── oauth/
│       │   │   ├── connect/route.ts    # GET - returns OAuth URL
│       │   │   └── callback/route.ts   # GET - handles callback, stores tokens
│       │   ├── sync/route.ts           # POST - trigger manual sync
│       │   ├── threads/route.ts        # GET - list threads with pagination
│       │   ├── threads/[threadId]/route.ts  # GET - thread detail + messages
│       │   └── send/route.ts           # POST - send/reply email
│       └── whatsapp/
│           ├── conversations/route.ts                        # GET - list conversations
│           ├── conversations/[conversationId]/messages/route.ts  # GET - messages
│           ├── send/route.ts                                 # POST - send message
│           └── webhook/route.ts                              # POST - Twilio incoming
```

## Files to Modify

1. **`packages/database/prisma/schema.prisma`**
   - Add `GMAIL` to `CredentialType` enum
   - Add 4 new models (EmailThread, EmailMessage, WhatsAppConversation, WhatsAppMessage)
   - Add relations to Practice, Patient, User models

2. **`apps/web/src/app/(dashboard)/layout.tsx`**
   - Line 3: Add `Mail, MessageSquare` to lucide imports
   - Line 21-22: Add Email and WhatsApp nav items

3. **`apps/web/package.json`**
   - Add `googleapis` and `twilio` dependencies

## Existing Code to Reuse (DO NOT recreate)

- **Auth:** `withAuth()` from `src/lib/auth.ts:38` — validates JWT, returns AuthUser
- **API errors:** `ApiError`, `handleError` from `src/lib/auth.ts`
- **Client fetch:** `authFetch()` from `src/lib/auth-fetch.ts` — auto-refreshes tokens
- **Credential model:** `schema.prisma:800` — already has accessToken/refreshToken/expiresAt fields
- **UI components:** `src/components/ui/` (button, input, dialog, select, tabs)
- **CSS variables:** `--bg-primary`, `--bg-secondary`, `--bg-card`, `--accent`, `--border-color`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`
- **Glass classes:** `glass-input`, `glass-card` (used in existing dashboard pages)
