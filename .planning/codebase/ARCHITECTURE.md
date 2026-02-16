# Architecture

**Analysis Date:** 2026-02-16

## Pattern Overview

**Overall:** Multi-tenant SaaS with role-based access control, dual authentication flows (staff vs. patient), and layered API-first design.

**Key Characteristics:**
- Monorepo (pnpm workspaces + Turborepo) with clear package boundaries
- Next.js 15 App Router for both staff dashboard and patient portal
- Route group separation: `(dashboard)` for dentists, `(patient)` for patients, `(admin)` for super-admins
- JWT-based authentication with dual token schemes (access + refresh for staff, single patient_token for patients)
- Prisma ORM on Neon Postgres with multi-tenant data scoping (all queries filtered by practiceId)
- Client-side state via localStorage; no middleware auth layer
- RESTful APIs via Next.js route handlers at `src/app/api/*`

## Layers

**Presentation Layer (UI):**
- Location: `src/app/(dashboard)/*`, `src/app/(patient)/*`, `src/components/*`
- Contains: Page components (RSC), interactive client components, UI primitives
- Depends on: API layer via `authFetch` (staff) or plain `fetch` with Bearer token (patient)
- Used by: Browser clients

**API Layer:**
- Location: `src/app/api/*`
- Contains: 119 route handlers (GET/POST/PATCH/DELETE) for all resources
- Depends on: Auth (`lib/auth.ts`), Database (Prisma), external services (Gmail, Mollie, Gemini AI)
- Used by: Presentation layer, external webhooks

**Authentication Layer:**
- Location: `src/lib/auth.ts`, `src/lib/auth-fetch.ts`
- Contains: JWT signing/verification, role-based checks, token refresh logic
- Depends on: `jsonwebtoken`, `bcryptjs`
- Used by: All API routes, client-side token management

**Data Access Layer:**
- Location: `packages/database/` (Prisma schema, client generation)
- Contains: Prisma schema definition (`schema.prisma`), seed script (`seed.ts`)
- Depends on: Neon Postgres, environment URLs
- Used by: API layer for all database operations

**Business Logic / Utilities:**
- Location: `src/lib/*` (non-auth utilities)
- Contains: Codebook data (KNMT, NZA codes), PDF generation, email templates, AI prompt builders
- Depends on: External APIs (Gmail, Gemini), rendering libraries
- Used by: API layer, components

**Shared Types & Crypto:**
- Location: `packages/shared-types/`, `packages/crypto/`
- Contains: TypeScript types (User, Patient, Treatment, Appointment, etc.), BSN encryption utilities
- Depends on: CryptoJS
- Used by: All packages in monorepo

## Data Flow

**Staff Dashboard Authentication Flow:**

1. User submits email/password on `/login` page (SSR)
2. `POST /api/auth/login` verifies credentials, returns `{ access_token, refresh_token, user }`
3. Client stores both tokens in localStorage
4. Subsequent API calls use `authFetch()` wrapper which:
   - Adds `Authorization: Bearer {access_token}` header
   - On 401 response, calls `POST /api/auth/refresh` with stored `refresh_token`
   - Retries request with new token or redirects to `/login` if refresh fails
5. Staff accesses practice data filtered by `user.practiceId`

**Patient Portal Authentication Flow:**

1. Patient submits email + last 4 BSN digits on `/patient-login` page
2. `POST /api/patient-portal/auth/login` validates credentials, returns `{ patient_token }`
3. Client stores single `patient_token` in localStorage
4. Subsequent API calls use plain `fetch` with `Authorization: Bearer {patient_token}` header
5. Patient API routes validate token and scope all queries to `patientId`

**Patient Data Read Flow:**

1. Dashboard page component calls `authFetch('/api/patients/[id]')`
2. Route handler validates staff JWT, checks practiceId match
3. Queries `Patient` with included relations (teeth, appointments, clinical notes)
4. Masks sensitive fields (BSN) before returning
5. Component renders data or updates local state

**Patient Data Write Flow:**

1. Component form submission → `authFetch()` with PATCH body
2. Route handler validates JWT + permission check (e.g., DENTIST role)
3. Validates incoming body (shape, constraints)
4. Updates Prisma record with practice isolation
5. Returns updated object or 403/404/500 error

**State Management:**

- **Staff Dashboard:** Component-level state + localStorage (user, tokens, UI preferences)
- **Patient Portal:** Component-level state + localStorage (patient_token, portal preferences)
- **No global state management:** Direct API calls from components, data refetching on route changes
- **Odontogram (tooth data):** Complex state managed within `src/components/odontogram/` hierarchy; 3D models loaded from `/public/models/teeth/`

## Key Abstractions

**Practice (Tenant):**
- Purpose: Isolate data for independent dental practices; multi-tenancy boundary
- Examples: `packages/database/prisma/schema.prisma` (Practice model), `src/app/api/patients/[id]/route.ts` (line 12: `where: { id, practiceId: user.practiceId }`)
- Pattern: All queries include `practiceId` filter; practice stored in JWT payload and user context

**Tooth & Surfaces (Odontogram):**
- Purpose: Clinical data model for individual teeth and treatment recording
- Examples: `packages/database/prisma/schema.prisma` (Tooth, ToothSurface models), `src/components/odontogram/` (rendering + state)
- Pattern: FDI numbering system (1-32); surfaces stored separately; 3D models at `public/models/teeth/{name}.glb`

**Treatment Plan & Treatments:**
- Purpose: Multi-step treatment sequences with estimated costs and patient communication
- Examples: `src/app/api/treatment-plans/route.ts`, `src/app/(dashboard)/patients/[id]/treatments/` pages
- Pattern: Plans contain multiple treatments; treatments link to tooth surfaces; separate endpoints for planning vs. execution

**Invoice & Billing:**
- Purpose: Financial records tied to treatments or fixed codes (KNMT codes from Dutch health system)
- Examples: `src/app/api/invoices/[id]/route.ts`, `src/lib/knmt-codes-2026.ts`
- Pattern: Lines reference treatments or custom code categories; PDF generation via `lib/pdf/`

**Patient Portal Token:**
- Purpose: Separate auth track for patient self-service; no dashboard access
- Examples: `src/app/api/patient-portal/auth/login/route.ts`, `src/app/(patient)/portal/layout.tsx`
- Pattern: Uses `patient_token` (not `access_token`); API routes at `api/patient-portal/*` validate `patientId` from token

**Odontogram 3D Scene:**
- Purpose: Interactive dental chart with 3D tooth visualization and restoration overlay
- Examples: `src/components/odontogram/three/dental-arch-3d.tsx`, `src/components/odontogram/odontogram.tsx`
- Pattern: React Three Fiber scene; 32 teeth in flat rows (maxilla/mandible); FDI mapping to GLB models; click-to-inspect tooth detail panel

## Entry Points

**Staff Dashboard Root:**
- Location: `src/app/(dashboard)/dashboard/page.tsx`
- Triggers: User navigates to `/dashboard` after login
- Responsibilities: Render dashboard with 4 top widgets (clickable with slideouts), navigation sidebar, practice data overview

**Patient Portal Root:**
- Location: `src/app/(patient)/portal/page.tsx`
- Triggers: Patient navigates to `/portal` after patient login
- Responsibilities: Glass-morphism design home, show appointments, treatment plans, invoices, messages

**Staff Login:**
- Location: `src/app/login/page.tsx`
- Triggers: User arrives unauthenticated; also `/select-portal` redirects here
- Responsibilities: Email + password form; calls `POST /api/auth/login`; stores tokens; redirects to `/dashboard`

**Patient Login:**
- Location: `src/app/(patient)/patient-login/page.tsx`
- Triggers: Patient portal entry point
- Responsibilities: Email + last 4 BSN form; calls `POST /api/patient-portal/auth/login`; stores `patient_token`

**API Auth Routes:**
- Location: `src/app/api/auth/*`, `src/app/api/patient-portal/auth/*`
- Triggers: Login forms, token refresh, logout
- Responsibilities: JWT issuance, token verification, credential validation

**Patient Detail Page (Staff):**
- Location: `src/app/(dashboard)/patients/[id]/page.tsx`
- Triggers: Click on patient in patients list
- Responsibilities: Load full patient profile, display odontogram, show history, allow edits

## Error Handling

**Strategy:** Centralized error classes (`AuthError`, `ApiError`) with HTTP status codes. Client-side `authFetch()` handles 401 refresh logic.

**Patterns:**

- **Auth errors (401):** `authFetch()` retries with refresh; on 2nd fail, clears tokens + redirects to `/login`
- **Permission errors (403):** `requireRoles()` check in route handlers; returns 403 JSON response
- **Not found (404):** Explicit checks for resource existence before reads/updates (e.g., line 38-39 in `patients/[id]/route.ts`)
- **Server errors (500):** Caught by `handleError()` in try-catch; logs error, returns generic "Internal server error" to client
- **Validation errors:** Route handlers validate request body before processing; malformed JSON returns 400 automatically by Next.js

## Cross-Cutting Concerns

**Logging:**
- Ad-hoc `console.error()` / `console.log()` calls in route handlers
- No centralized logging service; relies on platform logs (Vercel)
- Audit logs stored in `AuditLog` table for GDPR compliance

**Validation:**
- Prisma schema constraints (required fields, unique emails, FK relationships)
- Manual validation in route handlers (e.g., checking role before delete)
- Request body shape assumed to match types; no schema validation library (like Zod)

**Authentication:**
- JWT-based; single secret (`process.env.JWT_SECRET`) for all tokens
- Roles embedded in token payload; permissions derived from role at signing time
- Practice isolation via `practiceId` in token + query filters
- No middleware; auth check happens in each route handler via `withAuth(request)`

**Multi-tenancy:**
- Practice-level isolation only (no user-level data separation within practice)
- All users in a practice see all patients/data for that practice (staff roles control granularity)
- No row-level security (RLS) in Postgres; filtering via application logic

**External Services:**
- Gmail API for email campaigns and sending
- Gemini AI API for clinical note analysis
- Mollie for payments (webhook integration)
- Vercel Blob for file storage (patient images, documents)

---

*Architecture analysis: 2026-02-16*
