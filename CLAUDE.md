# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm --filter @dentflow/web dev          # Start Next.js dev server (port 3000)
pnpm dev                                  # Start all packages via Turbo

# Build & Verify
pnpm --filter @dentflow/web build         # Build web app (run before saying changes are done)
pnpm type-check                           # TypeScript check across all packages

# Database
pnpm db:generate                          # Regenerate Prisma client after schema changes
pnpm db:push                              # Push schema to database (no migration)
pnpm db:seed                              # Seed database (tsx prisma/seed.ts)
pnpm db:studio                            # Open Prisma Studio GUI
pnpm db:migrate                           # Create + apply migration (prisma migrate dev)

# After schema changes, always run both:
pnpm db:generate && pnpm db:push

# Restart dev server (kill old, clear cache, restart):
kill $(lsof -ti :3000) 2>/dev/null; rm -rf apps/web/.next; pnpm --filter @dentflow/web dev
```

No test framework is configured. No ESLint config exists.

## Architecture

**Monorepo**: pnpm workspaces + Turborepo. Next.js 15, React 19, Tailwind CSS.

### Packages
- `packages/database/` — Prisma schema, client, seed script (Neon Postgres)
- `packages/shared-types/` — TypeScript types for auth, patient, appointment, billing, odontogram
- `packages/crypto/` — BSN (Dutch national ID) encryption with CryptoJS

### App Route Groups (`apps/web/src/app/`)
- `(dashboard)/` — Staff portal: agenda, patients, billing, reports, settings
- `(patient)/` — Patient portal: appointments, profile, anamnesis, consent, messages, documents
- `(admin)/` — Admin panel: users, practices, audit logs, credentials
- Root: `/login` (staff), `/patient-login` (patient), `/select-portal`

### Auth Pattern
- **Staff dashboard**: `access_token` + `refresh_token` in localStorage. All API calls go through `authFetch` wrapper (`src/lib/auth-fetch.ts`) which auto-refreshes on 401.
- **Patient portal**: `patient_token` in localStorage. Does NOT use `authFetch`.
- Backend: JWT via `jsonwebtoken` + `bcryptjs`. No Next.js middleware file.

### API Routes (`apps/web/src/app/api/`)
Major domains: auth, users, practices, patients (with nested clinical data: odontogram, anamnesis, images), appointments, schedules, invoices, clinical-notes, treatment-plans, consent, credentials, audit-logs, patient-portal/*, nza-codes, ai/analyze-notes.

## Critical Rules

### Tailwind CSS
- **NEVER** use dynamic class interpolation: `bg-${color}-500` will NOT work in production
- **ALWAYS** use static class maps: `const classes = { blue: 'bg-blue-500', red: 'bg-red-500' }`

### Prisma
- All relations must have **both sides** defined (model field + inverse on related model)
- Seed cleanup must include **all tables** in FK-safe order

### Git
- **Do NOT** commit or push unless the user explicitly asks
- User pushes through GitHub Desktop

## Login Credentials (from seed)
- Staff: `faraz@tandarts-amsterdam.nl` / `Sharifi1997` (DENTIST)
- Staff: `admin@dentflow.nl` / `Welcome123` (PRACTICE_ADMIN)
- Patient: use patient email + last 4 digits of BSN

## ⚠️ Patient Portal Development Rules
- NEVER modify files in `app/(dashboard)/` during patient portal work
- NEVER modify existing API routes — create new ones under `api/portal/`
- NEVER modify existing shared components — create patient-specific wrappers
- Patient auth uses `patient_token` in localStorage, NOT `access_token`
- See `apps/web/PORTAL-SYNC.md` for full details

## Portal Sync Rules

When developing the patient portal, these rules are mandatory:

1. **DO NOT modify dentist portal pages** — no changes to files in `app/(dashboard)/`
2. **DO NOT modify existing API routes** — patient portal uses separate endpoints under `app/api/portal/`
3. **DO NOT alter Prisma schema** without verifying all existing relations still work
4. **Shared components** in `src/components/` can be USED but not MODIFIED — create patient-portal wrappers if needed
5. **Auth separation**: Dentist portal uses `access_token` via `authFetch`, Patient portal uses `patient_token` — never mix these

See `apps/web/PORTAL-SYNC.md` for full documentation.

## Environment Variables
- `DATABASE_URL` — Neon Postgres pooler URL
- `DIRECT_URL` — Neon Postgres direct URL
- `JWT_SECRET` — JWT signing secret
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage token
- `GEMINI_API_KEY` — Google Gemini API key (for AI features)
