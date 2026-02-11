# DentFlow Project Handoff

> Last updated: 2026-02-11

## Project Overview
DentFlow is a dental practice management system (Dutch market). Monorepo with pnpm + Turborepo, Next.js 15, React 19, Prisma on Neon Postgres, Tailwind CSS.

## What's Been Completed

### Dentist Portal (DO NOT MODIFY)
All dentist-facing features are complete and deployed to Vercel. **Do not touch any files outside the patient portal directories.**

- **Agenda** — Full appointment management with expandable details, 6 tabs (Afspraken, Behandelingen, Declaratie, Notities, Paro, Recepten), AI-powered NZa code detection via Gemini
- **Dashboard** — Stats overview with clickable appointment detail modals, "Eerdere afspraken" section
- **Patients** — Full patient records with enhanced 2D odontogram (SVG, 5 surfaces per tooth, right-click treatments), treatment history dropdowns, prescriptions, outstanding balance banner
- **Billing (Facturen)** — Invoice list with line details, professional PDF generation with practice credentials
- **Payments (Betalingen)** — Payment tracking, reminder emails, status filters
- **Settings** — Editable practice info (name, address, KvK, AGB, AVG, BIG codes) that feed into PDF templates
- **PDF Templates** — Professional medical templates for invoices, prescriptions (Rx), and offertes (quotes)
- **AI Notes** — KNMT codebook integration, 300+ keyword rules, Gemini few-shot prompting for NZa detection

### Patient Portal (UI Redesign DONE, Features Partially Complete)
Full UI redesign completed with warm orange/amber (#e8945a) glassmorphism theme on dark backgrounds.

**Pages redesigned:**
- Login (`/patient-login`) — Glass inputs, orange gradient button
- Registration (`/register`) — Multi-step with orange progress dots, selectable medical conditions
- Portal Layout (`/portal/layout.tsx`) — Warm orange sidebar navigation
- Dashboard (`/portal/page.tsx`) — Bento grid with stat cards
- Appointments (`/portal/appointments/page.tsx`) — Glass cards with orange accent bars
- Profile (`/portal/profile/page.tsx`) — Bento grid with editable sections
- Anamnesis (`/portal/anamnesis/page.tsx`) — Orange step progress, condition cards
- Consent (`/portal/consent/page.tsx`) — Status-colored borders, orange signature canvas
- Documents (`/portal/documents/page.tsx`) — Tab switcher with orange active indicator
- Messages (`/portal/messages/page.tsx`) — Premium "coming soon" placeholder

**Patient portal features NOT yet built:**
- Messages/chat system (real-time or async)
- Online appointment booking
- Invoice PDF download for patients
- Treatment/prescription/x-ray viewing from patient side
- Online payments integration
- Email notifications to patients
- Push notifications

## Architecture & Key Files

| Area | Path |
|------|------|
| Schema | `packages/database/prisma/schema.prisma` |
| Auth (staff) | `apps/web/src/lib/auth.ts`, `apps/web/src/lib/auth-fetch.ts` |
| Auth (patient) | Uses `patient_token` in localStorage (not `authFetch`) |
| Login API (staff) | `apps/web/src/app/api/auth/login/route.ts` |
| Login API (patient) | `apps/web/src/app/api/auth/patient-login/route.ts` |
| Agenda | `apps/web/src/app/(dashboard)/agenda/page.tsx` |
| Patient detail | `apps/web/src/app/(dashboard)/patients/[id]/page.tsx` |
| Patient portal | `apps/web/src/app/(patient)/portal/` |
| Portal layout | `apps/web/src/app/(patient)/portal/layout.tsx` |
| NZa detection | `apps/web/src/lib/nza-detection.ts` |
| KNMT codebook | `apps/web/src/lib/knmt-codebook.ts` |
| PDF generators | `apps/web/src/lib/pdf/` (invoice-pdf.ts, prescription-pdf.ts, quote-pdf.ts) |
| Global CSS | `apps/web/src/app/globals.css` |

## Critical Rules

### DO NOT
- Modify any dentist portal files (`(dashboard)/` routes, `api/` routes used by dentist portal)
- Use dynamic Tailwind classes like `bg-${color}-500` — always use static class maps
- Use teal/cyan colors in patient portal — the theme is warm orange/amber `#e8945a`
- Commit or push unless explicitly asked — user pushes via GitHub Desktop
- Add floating animated orbs or heavy animations to patient portal

### MUST DO
- Read files before editing them
- Run `pnpm --filter @dentflow/web build` before declaring changes done
- After schema changes: `pnpm db:generate && pnpm db:push`
- Restart dev server after changes: `kill $(lsof -ti :3000) 2>/dev/null; rm -rf apps/web/.next; pnpm --filter @dentflow/web dev`
- Keep all user-facing labels in Dutch
- Define both sides of Prisma relations
- Clean all tables in FK-safe order in seed

### Design System
- **Dentist portal**: Light/dark mode via CSS variables in `globals.css`, accent `#e8945a`
- **Patient portal**: Dark glassmorphism with warm orange/amber accents
  - Glass cards: `bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl`
  - Accent color: `#e8945a` (orange), hover: `#f0a06a`
  - Background: `patient-gradient-bg` class (dark with subtle warm tones)
  - Text: white primary, `text-white/60` secondary, `text-white/40` tertiary

## Login Credentials (from seed)
- **Staff (DENTIST):** `faraz@tandarts-amsterdam.nl` / `Sharifi1997`
- **Staff (ADMIN):** `admin@dentflow.nl` / `Welcome123`
- **Patient:** `peter.jansen@email.nl` / `6782` (last 4 of BSN)

## Deployment
- Hosted on Vercel at `goat-web-gilt.vercel.app`
- Prisma requires `@prisma/nextjs-monorepo-workaround-plugin` for pnpm monorepo on Vercel
- `output: 'standalone'` in `next.config.ts`
- Environment vars needed: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`

## What to Work on Next
The patient portal UI is redesigned but many features are placeholder/read-only. Priority order:
1. Patient appointment booking flow
2. Treatment/prescription viewing for patients
3. Invoice viewing + PDF download for patients
4. Messages system
5. Email notifications
