# Email (Gmail) & WhatsApp (Twilio) Integration Plan

## Context
The dentist dashboard currently has no email or messaging features. We're adding:
1. **Gmail integration** — OAuth2 sync so dentists see their real Gmail inbox and can send/reply from DentFlow
2. **WhatsApp via Twilio** — Two-way WhatsApp messaging with patients

Priority: **Email first**, WhatsApp second. Separate sidebar nav items for each.

---

## Phase 1: Gmail Integration

### 1.1 Schema Changes
**File:** `packages/database/prisma/schema.prisma`

- Add `GMAIL` to `CredentialType` enum
- Add `EmailThread` model (gmailThreadId, subject, participants, labels, snippet, patientId link)
- Add `EmailMessage` model (gmailMessageId, from, to, cc, subject, bodyHtml, bodyText, attachments JSON, labels)
- Add relations on `Practice` and `Patient`

OAuth tokens stored in existing `Credential` model (already has `accessToken`, `refreshToken`, `expiresAt`).

### 1.2 Dependencies
```bash
pnpm --filter @dentflow/web add googleapis
```

### 1.3 Gmail Library (`apps/web/src/lib/gmail/`)
- **`oauth.ts`** — `getOAuth2Client()`, `getAuthUrl(state)`, `exchangeCodeForTokens(code)`, `getGmailClient(practiceId)` (auto-refreshes tokens)
- **`sync.ts`** — `syncGmailMessages(practiceId)` (fetch inbox via Gmail API, upsert threads+messages in DB), `sendGmailMessage(practiceId, to, subject, bodyHtml, threadId?)`
- **`index.ts`** — barrel export

### 1.4 API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/gmail/oauth/connect` | GET | Returns Google OAuth URL |
| `/api/gmail/oauth/callback` | GET | Handles OAuth callback, stores tokens in `Credential` |
| `/api/gmail/sync` | POST | Triggers manual sync |
| `/api/gmail/threads` | GET | List threads (label, patientId, pagination) |
| `/api/gmail/threads/[threadId]` | GET | Thread detail with all messages |
| `/api/gmail/send` | POST | Send/reply email |

All routes use `withAuth` + `authFetch` pattern from existing codebase.

### 1.5 Email Page (`apps/web/src/app/(dashboard)/email/page.tsx`)
- **Not connected state**: Connect Gmail button → initiates OAuth
- **Connected state**: 3-column layout:
  - Left: Label sidebar (Inbox, Sent, Starred, Drafts, Trash) + Compose button
  - Center: Thread list with search, sync button, unread indicators
  - Right: Selected thread messages with reply
- Dutch labels (Postvak IN, Verzonden, Concepten, etc.)
- Uses existing dashboard CSS variables and glass styling

### 1.6 Nav Update
**File:** `apps/web/src/app/(dashboard)/layout.tsx` (line 18-26)
- Import `Mail` from lucide-react
- Add `{ icon: Mail, label: 'Email', href: '/email' }` after Agenda

### 1.7 Environment Variables
```
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Phase 2: WhatsApp (Twilio)

### 2.1 Schema Changes
- Add `WhatsAppConversation` model (practiceId, patientId, phoneNumber, lastMessageAt)
- Add `WhatsAppMessage` model (twilioSid, direction, from, to, body, mediaUrl, status, sentBy)
- Add relations on `Practice`, `Patient`, `User`

### 2.2 Dependencies
```bash
pnpm --filter @dentflow/web add twilio
```

### 2.3 WhatsApp Library (`apps/web/src/lib/whatsapp/`)
- **`twilio.ts`** — `getTwilioClient(practiceId)` (reads creds from `Credential`), `sendWhatsAppMessage()`, `processIncomingWhatsApp()`

### 2.4 API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/whatsapp/conversations` | GET | List conversations with last message |
| `/api/whatsapp/conversations/[id]/messages` | GET | Messages for conversation |
| `/api/whatsapp/send` | POST | Send message |
| `/api/whatsapp/webhook` | POST | Twilio incoming webhook |

### 2.5 WhatsApp Page (`apps/web/src/app/(dashboard)/whatsapp/page.tsx`)
- 2-column: conversation list + chat view (WhatsApp-style bubbles)
- Green theme for WhatsApp messages
- Real-time polling for new messages

### 2.6 Nav Update
- Import `MessageSquare` from lucide-react
- Add `{ icon: MessageSquare, label: 'WhatsApp', href: '/whatsapp' }` after Email

---

## Implementation Order

### Step 1: Schema + Dependencies
- Update Prisma schema with all new models (both phases)
- Install `googleapis` and `twilio`
- Run `pnpm db:generate && pnpm db:push`

### Step 2: Gmail OAuth Flow
- Create `lib/gmail/oauth.ts`
- Create `/api/gmail/oauth/connect` and `/api/gmail/oauth/callback` routes
- Test OAuth connection

### Step 3: Gmail Sync + API
- Create `lib/gmail/sync.ts`
- Create thread list/detail/send API routes
- Test sync with real Gmail account

### Step 4: Gmail UI
- Create `/email/page.tsx` with full inbox UI
- Add Email to sidebar nav
- Build compose/reply functionality

### Step 5: WhatsApp Backend
- Create `lib/whatsapp/twilio.ts`
- Create all WhatsApp API routes + webhook

### Step 6: WhatsApp UI
- Create `/whatsapp/page.tsx` with chat interface
- Add WhatsApp to sidebar nav

---

## Key Files to Modify
- `packages/database/prisma/schema.prisma` — new models
- `apps/web/src/app/(dashboard)/layout.tsx` — nav items (lines 3, 18-26)
- `apps/web/package.json` — new dependencies

## Key Files to Create
- `apps/web/src/lib/gmail/oauth.ts`, `sync.ts`, `index.ts`
- `apps/web/src/lib/whatsapp/twilio.ts`, `index.ts`
- `apps/web/src/app/(dashboard)/email/page.tsx`
- `apps/web/src/app/(dashboard)/whatsapp/page.tsx`
- 6 Gmail API routes, 4 WhatsApp API routes

## Existing Code to Reuse
- `Credential` model (`schema.prisma:800`) — stores OAuth tokens + Twilio creds
- `withAuth()` (`src/lib/auth.ts:38`) — route authentication
- `authFetch()` (`src/lib/auth-fetch.ts`) — client-side API calls
- CSS variables from layout (`--bg-primary`, `--accent`, etc.)
- shadcn/ui components from `src/components/ui/`

## Verification
1. `pnpm db:generate && pnpm db:push` — schema pushes cleanly
2. `pnpm --filter @dentflow/web build` — no TypeScript errors
3. Manual test: Gmail OAuth flow → connect → sync → view inbox → send email
4. Manual test: WhatsApp send → receive webhook → view in UI
