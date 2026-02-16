# External Integrations

**Analysis Date:** 2026-02-16

## APIs & External Services

**Payment Processing:**
- Mollie (iDEAL, card payments, Bancontact)
  - SDK/Client: `@mollie/api-client` 4.4.0
  - Auth: `MOLLIE_API_KEY` (env var)
  - Config: Per-practice credentials stored in `Credential` table with type='MOLLIE'
  - Usage: `apps/web/src/lib/mollie.ts`
  - Routes: `apps/web/src/app/api/patient-portal/payments/create/route.ts`, `apps/web/src/app/api/patient-portal/payments/webhook/route.ts`

**Email & Messaging:**
- Resend (Transactional email)
  - SDK/Client: `resend` 6.9.2
  - Auth: `RESEND_API_KEY` (env var)
  - Usage: `apps/web/src/lib/email/service.ts`
  - Config: Optional per-practice credentials in `Credential` table
  - Sends: Appointment confirmations, reminders, invoices, messages
  - Response: Logs to `Notification` table with SENT/FAILED status

- Twilio (SMS and WhatsApp)
  - SDK/Client: `twilio` 5.12.1
  - Auth: Per-practice credentials stored in `Credential` table with type='TWILIO'
  - Config: Requires `accountSid`, `authToken`, and `whatsappNumber` (in config JSON)
  - Usage: `apps/web/src/lib/whatsapp/twilio.ts`
  - Functions: WhatsApp messaging, incoming message webhooks
  - Data: Stores `WhatsAppConversation` and `WhatsAppMessage` records

**AI & Content Generation:**
- Google Gemini API (LLM for clinical notes analysis)
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
  - Auth: `GEMINI_API_KEY` query parameter
  - Usage:
    - `apps/web/src/app/api/ai/analyze-notes/route.ts` - AI code detection from clinical notes
    - `apps/web/src/app/api/ai/chat/route.ts` - General AI chat
    - `apps/web/src/app/api/ai/treatment-chat/route.ts` - Treatment planning chat
    - `apps/web/src/app/api/patient-portal/health-insights/route.ts` - Patient health insights
  - Context: NZA (Dutch health insurance) treatment codes sent as examples for categorization
  - File: `apps/web/src/lib/ai/nza-codebook.ts` contains treatment code catalog

**Google APIs (Potential):**
- googleapis 171.4.0 - Package present but usage not detected in current codebase
- Likely prepared for future Google Calendar or Workspace integration

## Data Storage

**Databases:**
- PostgreSQL (Neon Postgres)
  - Connection: `DATABASE_URL` (pooler endpoint)
  - Direct connection: `DIRECT_URL` (for migrations)
  - Client: Prisma ORM 5.10.0
  - Schema: `apps/web/packages/database/prisma/schema.prisma`
  - Tables: 50+ models including users, patients, appointments, treatments, invoices, audit logs
  - Provider: Neon serverless PostgreSQL
  - Prisma operations:
    - `pnpm db:generate` - Generate Prisma client
    - `pnpm db:push` - Push schema without migrations
    - `pnpm db:migrate` - Create and apply migrations
    - `pnpm db:seed` - Populate test data

**File Storage:**
- Vercel Blob
  - SDK: `@vercel/blob` 2.2.0
  - Auth: `BLOB_READ_WRITE_TOKEN` (env var)
  - Usage:
    - Patient images: `apps/web/src/app/api/patients/[id]/images/route.ts`
    - Referral PDFs: `apps/web/src/app/api/patients/[id]/referrals/route.ts`
    - Smile design STL models: `apps/web/src/app/api/smile-design/[designId]/stl/route.ts`
  - Path structure: `patients/{id}/*`, `referrals/{id}.pdf`, etc.
  - Operations: `put()` for upload, `del()` for deletion

**Caching:**
- Not external service
- SWR library (2.2.5) used client-side for HTTP caching and revalidation

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (no external provider in production)
  - Implementation: `apps/web/src/lib/auth.ts`
  - Signing: jsonwebtoken 9.0.3 + JWT_SECRET
  - Hashing: bcryptjs 3.0.3 for password storage
  - Tokens:
    - `access_token` (1h expiry) - Staff dashboard
    - `refresh_token` (8h expiry) - Token refresh
    - `patient_token` - Patient portal (separate implementation)

**Staff Authentication:**
- Email + password login at `apps/web/src/app/api/auth/login/route.ts`
- Tokens stored in localStorage
- Auto-refresh on 401 via `authFetch` wrapper in `apps/web/src/lib/auth-fetch.ts`

**Patient Authentication:**
- Patient email + last 4 digits of BSN
- Patient token stored in localStorage (separate from staff)
- Plain fetch with Bearer token (does not use authFetch wrapper)

**BSN Encryption:**
- Dutch national ID (BSN) encryption/decryption
  - Package: `@dentflow/crypto` (internal workspace)
  - Algorithm: CryptoJS 4.2.0
  - Purpose: Secure storage of patient identification

**NextAuth.js:**
- Package `next-auth` 4.24.5 present but not used as primary auth
- Custom JWT solution implemented instead

## Monitoring & Observability

**Error Tracking:**
- Not detected - No external error tracking service configured

**Logs:**
- Browser console logging (development)
- Server-side console.log() throughout codebase
- `AuditLog` table for staff actions (database audit trail)
- `Notification` table for email/message logging
- No external logging service (Sentry, DataDog, etc.) detected

## CI/CD & Deployment

**Hosting:**
- Deployment platform: Vercel (based on `@vercel/blob` and Next.js standalone output)
- Database: Neon Postgres (managed)

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or CI config files found
- Deployment likely manual through Vercel dashboard or Git push

**Build Process:**
- Turbo 2.0.0 orchestration for monorepo tasks
- Next.js standalone build output for containerization
- Prisma codegen in build pipeline
- Global dependencies: `.env.*local` files

## Environment Configuration

**Required env vars (Turbo globalEnv):**
- `DATABASE_URL` - Postgres connection (pooler)
- `DIRECT_URL` - Postgres direct connection (migrations)
- `JWT_SECRET` - JWT signing key
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- `GEMINI_API_KEY` - Google Gemini API key

**Optional env vars (per-practice configurable):**
- `MOLLIE_API_KEY` - Fallback if not in `Credential` table
- `RESEND_API_KEY` - Fallback if not in `Credential` table
- `FROM_EMAIL` - Email sender address (default: noreply@dentflow.nl)

**Secrets location:**
- `.env` and `.env.local` files (git-ignored)
- Contents: DATABASE_URL, DIRECT_URL, JWT_SECRET, API keys
- Production: Vercel environment variables dashboard

**Credentials Management:**
- `Credential` table in Prisma schema stores per-practice integrations:
  - `type`: MOLLIE, TWILIO, RESEND, GOOGLE, etc.
  - `apiKey`: Primary credential
  - `apiSecret`: Secondary credential (auth token, account SID)
  - `environment`: 'development', 'production', 'staging'
  - `isActive`: Boolean flag
  - `config`: JSON field for additional settings (e.g., Twilio WhatsApp number)

## Webhooks & Callbacks

**Incoming:**
- Mollie payment webhooks
  - Endpoint: `apps/web/src/app/api/patient-portal/payments/webhook/route.ts`
  - Triggers on payment status changes (paid, failed, pending, expired)
  - Updates `Payment` table with `molliePaymentId` and `mollieStatus`

- Twilio incoming messages (webhook handler prepared)
  - Implementation: `apps/web/src/lib/whatsapp/twilio.ts`
  - Receives WhatsApp messages for practice conversations

**Outgoing:**
- No detected outgoing webhooks to external services
- Internal notifications via email/SMS (not webhooks)

## Integration Security Notes

**Credential Storage:**
- API keys stored in PostgreSQL `Credential` table (encrypted by design if using HTTPS + TLS)
- Per-practice isolation: Each practice can have different Mollie/Twilio credentials
- Test mode flag: `isTestMode` boolean allows separate test vs production keys

**Rate Limiting:**
- Not detected - No rate limiting middleware or configuration

**Error Handling:**
- Mollie payment errors: Caught and logged, stored in `Payment` table
- Email failures: Logged to `Notification` table with error message
- API responses: Custom `ApiError` and `AuthError` classes in `apps/web/src/lib/auth.ts`

---

*Integration audit: 2026-02-16*
