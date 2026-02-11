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
- **Patient portal**: `patient_token` in localStorage. Does NOT use `authFetch`. Uses plain fetch with Bearer token.
- Backend: JWT via `jsonwebtoken` + `bcryptjs`. No Next.js middleware file.

### API Routes (`apps/web/src/app/api/`)
- Staff routes: auth, users, practices, patients (with nested clinical data: odontogram, anamnesis, images), appointments, schedules, invoices, clinical-notes, treatment-plans, consent, credentials, audit-logs, nza-codes, ai/analyze-notes
- Patient routes: `api/patient-portal/*` — separate endpoints scoped to authenticated patient

## Critical Rules

### Tailwind CSS
- **NEVER** use dynamic class interpolation: `bg-${color}-500` will NOT work in production
- **ALWAYS** use static class maps: `const classes = { blue: 'bg-blue-500', red: 'bg-red-500' }`

### Prisma
- All relations must have **both sides** defined (model field + inverse on related model)
- Seed cleanup must include **all tables** in FK-safe order
- After schema changes, run `pnpm db:generate && pnpm db:push` then verify with `pnpm --filter @dentflow/web build`

### Git
- **Do NOT** commit or push unless the user explicitly asks
- User pushes through GitHub Desktop

## Patient Portal Development Rules

When developing the patient portal, these rules are mandatory. See `apps/web/PORTAL-SYNC.md` for full details.

1. **NEVER modify files in `app/(dashboard)/`** — dentist portal is stable and must not be affected
2. **NEVER modify existing API routes** — create new ones under `api/patient-portal/`
3. **NEVER modify existing shared components** — create patient-specific wrappers in `src/components/patient/` or co-locate in `(patient)/`
4. **Auth separation**: Patient portal uses `patient_token` in localStorage, NOT `access_token`. Patient API routes validate `patient_token`, not `access_token`.
5. **Data scoping**: Every patient portal query MUST filter by the authenticated patient's `patientId`

## Patient Portal Glass UI
The patient portal uses Apple iOS-style glassmorphism. When adding new patient portal pages, use these patterns:
- **Glass cards**: `bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl`
- **Hover**: `hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300`
- **Inputs**: `bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20`
- **Primary buttons**: `bg-[#e8945a] hover:bg-[#d4864a] shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 rounded-2xl`
- **Accent color**: `#e8945a` (warm orange) throughout

## Login Credentials (from seed)
- Staff: `faraz@tandarts-amsterdam.nl` / `Sharifi1997` (DENTIST)
- Staff: `admin@dentflow.nl` / `Welcome123` (PRACTICE_ADMIN)
- Patient: use patient email + last 4 digits of BSN

## UI Components
- `src/components/ui/` — shadcn/ui primitives (Radix UI + Tailwind): button, input, dialog, select, tabs, etc.
- Icons: `lucide-react`
- Three.js: `@react-three/fiber` + `@react-three/drei` for 3D rendering (used in odontogram)
- Three.js components must use `next/dynamic` with `{ ssr: false }` — no SSR support

### Odontogram (Dental Chart)
Complex subsystem at `src/components/odontogram/`:
- `odontogram.tsx` — Main orchestrator with mode tabs (overview/perio/quickselect)
- `modes/overview-mode.tsx` — Dual view: DentalArch3D (full arch) + ToothDetail3D (click to inspect)
- `modes/perio-mode.tsx` — Periodontal probing data with 3D tooth models (buccal view)
- `restoration/restoration-panel.tsx` — Side panel for tooth treatment details
- `svg/tooth-renderer.tsx` — SVG tooth renderer (occlusal surfaces)
- `svg/tooth-paths.ts` — SVG path data for all 8 tooth types
- `three/tooth-3d.tsx` — Individual 3D tooth renderer (used in perio mode)
- `three/dental-arch-3d.tsx` — Full arch 3D scene with all 32 teeth in flat rows
- `three/tooth-detail-3d.tsx` — Large single-tooth 3D viewer with auto-rotate
- `three/model-paths.ts` — Maps FDI numbers to glTF model paths
- `perio/indicator-rows.tsx` — Dot rows for plaque, bleeding, pus indicators
- `perio/probing-panel.tsx` — Right-side panel for probing data entry
- 3D models: `public/models/teeth/` (16 dirs: 8 maxillary + 8 mandibular, glTF format)
- **Model orientation**: Tooth long axis is along Z. For buccal view, rotate -90° around X (upper) or +90° (lower).

## Environment Variables
- `DATABASE_URL` — Neon Postgres pooler URL
- `DIRECT_URL` — Neon Postgres direct URL
- `JWT_SECRET` — JWT signing secret
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage token
- `GEMINI_API_KEY` — Google Gemini API key (for AI features)
