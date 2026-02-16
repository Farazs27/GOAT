# Codebase Structure

**Analysis Date:** 2026-02-16

## Directory Layout

```
/Users/farazsharifi/GOAT/
├── packages/                           # Shared packages (Turborepo workspaces)
│   ├── database/                       # Prisma schema + client generation
│   │   ├── prisma/
│   │   │   └── schema.prisma           # All data models (Practice, User, Patient, Tooth, etc.)
│   │   ├── src/
│   │   │   ├── index.ts                # Exports prisma client
│   │   │   └── rls.ts                  # Row-level security utilities
│   │   └── seed.ts                     # Database seed script
│   ├── shared-types/                   # TypeScript type definitions
│   │   └── src/
│   │       ├── index.ts                # Exports all types
│   │       └── auth.ts                 # UserRole, RolePermissions enums
│   └── crypto/                         # BSN encryption utilities
│       └── src/
│           ├── index.ts                # maskBsn, encryptBsn, decryptBsn
│           └── ...
├── apps/web/                           # Next.js 15 web application
│   ├── src/
│   │   ├── app/                        # Next.js App Router
│   │   │   ├── layout.tsx              # Root layout with ThemeProvider
│   │   │   ├── page.tsx                # Root page (redirects or landing)
│   │   │   ├── globals.css             # Global styles + CSS variables
│   │   │   ├── login/                  # Staff login page
│   │   │   ├── select-portal/          # Portal selector (staff/patient toggle)
│   │   │   ├── (dashboard)/            # STAFF PORTAL (protected route group)
│   │   │   │   ├── layout.tsx          # Sidebar, navigation, header
│   │   │   │   ├── dashboard/          # /dashboard root
│   │   │   │   ├── patients/           # /patients list, [id] detail
│   │   │   │   ├── agenda/             # /agenda appointment calendar
│   │   │   │   ├── billing/            # /billing invoices
│   │   │   │   ├── payments/           # /payments management
│   │   │   │   ├── email/              # /email campaigns
│   │   │   │   ├── whatsapp/           # /whatsapp messages
│   │   │   │   ├── reports/            # /reports analytics
│   │   │   │   ├── smile-design/       # /smile-design AI tool
│   │   │   │   ├── settings/           # /settings practice config
│   │   │   │   └── credentials/        # /credentials API keys
│   │   │   ├── (patient)/              # PATIENT PORTAL (separate auth)
│   │   │   │   ├── layout.tsx          # Patient nav (glass design)
│   │   │   │   ├── patient-login/      # /patient-login email + BSN
│   │   │   │   ├── register/           # /register new patient signup
│   │   │   │   └── portal/             # /portal root + sub-pages
│   │   │   │       ├── page.tsx        # Dashboard home
│   │   │   │       ├── appointments/   # /portal/appointments
│   │   │   │       ├── treatments/     # /portal/treatments (read-only)
│   │   │   │       ├── invoices/       # /portal/invoices billing view
│   │   │   │       ├── profile/        # /portal/profile patient info
│   │   │   │       ├── anamnesis/      # /portal/anamnesis health form
│   │   │   │       ├── prescriptions/  # /portal/prescriptions medications
│   │   │   │       ├── documents/      # /portal/documents file downloads
│   │   │   │       ├── messages/       # /portal/messages from dentist
│   │   │   │       ├── betalen/        # /portal/betalen payment page
│   │   │   │       ├── consent/        # /portal/consent forms
│   │   │   │       ├── behandelplan/   # /portal/behandelplan treatment view
│   │   │   │       ├── klachten/       # /portal/klachten complaints
│   │   │   │       ├── kostenraming/   # /portal/kostenraming quote
│   │   │   │       ├── praktijk/       # /portal/praktijk practice info
│   │   │   │       ├── verwijzingen/   # /portal/verwijzingen referrals
│   │   │   │       └── layout.tsx      # Portal layout wrapper
│   │   │   ├── (admin)/                # ADMIN PANEL (super-admin only)
│   │   │   │   └── ...
│   │   │   └── api/                    # RESTful API routes (119 handlers)
│   │   │       ├── auth/               # /api/auth/login, refresh, logout
│   │   │       ├── patient-portal/     # /api/patient-portal/* (separate auth)
│   │   │       ├── patients/           # /api/patients GET/POST/PATCH/DELETE
│   │   │       │   └── [id]/           # /api/patients/[id]/{odontogram,teeth,images}
│   │   │       ├── appointments/       # /api/appointments CRUD
│   │   │       ├── invoices/           # /api/invoices CRUD + PDF export
│   │   │       ├── treatment-plans/    # /api/treatment-plans CRUD
│   │   │       ├── treatments/         # /api/treatments CRUD
│   │   │       ├── clinical-notes/     # /api/clinical-notes CRUD
│   │   │       ├── prescriptions/      # /api/prescriptions CRUD
│   │   │       ├── audit-logs/         # /api/audit-logs GET (read-only)
│   │   │       ├── users/              # /api/users admin CRUD
│   │   │       ├── practices/          # /api/practices admin CRUD
│   │   │       ├── ai/                 # /api/ai/analyze-notes Gemini integration
│   │   │       ├── dashboard/          # /api/dashboard stats endpoint
│   │   │       ├── smile-design/       # /api/smile-design AI design rendering
│   │   │       ├── nza-codes/          # /api/nza-codes code browser
│   │   │       ├── cron/               # /api/cron internal scheduled tasks
│   │   │       ├── email/              # /api/email campaign sends (Gmail)
│   │   │       └── ...
│   │   ├── components/                 # Reusable React components
│   │   │   ├── ui/                     # shadcn/ui primitives (button, input, dialog, etc.)
│   │   │   ├── dashboard/              # Dashboard-specific components
│   │   │   │   ├── top-widgets.tsx     # 4 clickable dashboard cards
│   │   │   │   ├── sidebar.tsx         # Sidebar (if extracted)
│   │   │   │   └── ...
│   │   │   ├── patient-portal/         # Patient portal glass-design components
│   │   │   ├── odontogram/             # COMPLEX: Dental chart subsystem
│   │   │   │   ├── odontogram.tsx      # Main orchestrator (mode tabs)
│   │   │   │   ├── odontogram.css      # Custom 3D viewer styles
│   │   │   │   ├── modes/              # Different viewing modes
│   │   │   │   │   ├── overview-mode.tsx   # Dual view: full arch + detail
│   │   │   │   │   └── perio-mode.tsx      # Periodontal chart
│   │   │   │   ├── three/              # React Three Fiber 3D components
│   │   │   │   │   ├── dental-arch-3d.tsx # Full 32-tooth 3D scene
│   │   │   │   │   ├── tooth-3d.tsx       # Single tooth renderer
│   │   │   │   │   ├── tooth-detail-3d.tsx # Large tooth viewer
│   │   │   │   │   ├── model-paths.ts     # FDI → GLB mapping
│   │   │   │   │   └── ...
│   │   │   │   ├── svg/                # SVG tooth rendering
│   │   │   │   │   ├── tooth-renderer.tsx # Occlusal surface SVG
│   │   │   │   │   └── tooth-paths.ts     # SVG path data
│   │   │   │   ├── perio/              # Periodontal tools
│   │   │   │   │   ├── indicator-rows.tsx # Plaque/bleeding/pus dots
│   │   │   │   │   └── probing-panel.tsx  # Data entry form
│   │   │   │   ├── restoration/        # Treatment overlay UI
│   │   │   │   ├── tooth-detail-panel.tsx # Side panel for tooth info
│   │   │   │   └── zoom-controls.tsx   # Zoom/pan buttons
│   │   │   ├── treatments/             # Treatment plan components
│   │   │   ├── clinical/               # Clinical data forms
│   │   │   ├── consent/                # Consent form rendering
│   │   │   ├── smile-design/           # AI smile design tool
│   │   │   ├── declaratie/             # Billing declaration UI
│   │   │   ├── patient-history/        # Timeline of patient records
│   │   │   ├── prescriptions/          # Prescription UI
│   │   │   ├── xray-viewer/            # X-ray image viewer
│   │   │   ├── CameraCapture.tsx       # Photo upload from patient portal
│   │   │   ├── PatientPhotoGallery.tsx # Photo browsing
│   │   │   ├── Periodontogram.tsx      # Perio chart rendering
│   │   │   ├── AiChat.tsx              # Floating AI chat button
│   │   │   ├── ThemeProvider.tsx       # Light/dark mode
│   │   │   ├── ThemeToggle.tsx         # Theme switcher button
│   │   │   └── ...
│   │   └── lib/                        # Utilities and services
│   │       ├── auth.ts                 # JWT signing/verification, role checks
│   │       ├── auth-fetch.ts           # Authenticated fetch wrapper + auto-refresh
│   │       ├── prisma.ts               # Prisma client singleton
│   │       ├── audit.ts                # Audit logging utilities
│   │       ├── knmt-codes-2026.ts      # Dutch billing codes database (large)
│   │       ├── knmt-codebook.ts        # Code lookup utilities
│   │       ├── nza-detection.ts        # Healthcare code classification
│   │       ├── consent-templates.ts    # Legal consent form templates
│   │       ├── treatment-models.ts     # 3D model path mappings
│   │       ├── passwords.ts            # Password validation rules
│   │       ├── utils.ts                # General utilities
│   │       ├── task-navigation.ts      # Task routing logic
│   │       ├── ai/                     # AI-related utilities
│   │       │   ├── analyze-notes.ts    # Gemini prompt for note analysis
│   │       │   └── ...
│   │       ├── email/                  # Email composition
│   │       │   ├── templates/          # HTML email templates
│   │       │   └── ...
│   │       ├── gmail/                  # Gmail API integration
│   │       │   ├── sender.ts           # Send email via Gmail
│   │       │   └── ...
│   │       ├── pdf/                    # PDF generation (invoices, treatment plans)
│   │       │   ├── invoice-generator.ts
│   │       │   └── ...
│   │       ├── smile-design/           # Smile design rendering
│   │       ├── whatsapp/               # WhatsApp integration
│   │       └── ...
│   ├── public/                         # Static assets
│   │   ├── images/                     # Brand logos, icons
│   │   └── models/                     # 3D tooth models
│   │       └── teeth/                  # 16 directories with GLB models
│   │           ├── maxillary-right-central/
│   │           ├── maxillary-right-lateral/
│   │           ├── ... (8 maxillary types)
│   │           ├── mandibular-left-central/
│   │           └── ... (8 mandibular types)
│   ├── next.config.js                  # Next.js configuration
│   ├── tailwind.config.ts              # Tailwind CSS config
│   ├── tsconfig.json                   # TypeScript config
│   └── package.json                    # Web app dependencies
├── .planning/codebase/                 # GSD planning documents (THIS DIR)
│   ├── ARCHITECTURE.md                 # This document
│   ├── STRUCTURE.md                    # (companion)
│   └── ...
├── pnpm-workspace.yaml                 # Monorepo workspace config
├── turbo.json                          # Turborepo build config
├── package.json                        # Root package.json (pnpm)
└── CLAUDE.md                           # Project instructions
```

## Directory Purposes

**packages/database/:**
- Purpose: Single source of truth for schema; generates Prisma client for all apps
- Contains: `schema.prisma` (45+ models), seed script, migration history
- Key files: `schema.prisma`, `seed.ts`, `.env.local` (DATABASE_URL, DIRECT_URL)

**packages/shared-types/:**
- Purpose: Centralized TypeScript types shared across packages
- Contains: UserRole, permissions, API request/response types, Patient/Treatment/Appointment shapes
- Key files: `src/index.ts`, `src/auth.ts`

**packages/crypto/:**
- Purpose: Encrypt/decrypt sensitive data (BSN, medical records)
- Contains: CryptoJS-based encryption, masking utilities
- Key files: `src/index.ts` exports `maskBsn()`, `encryptBsn()`, `decryptBsn()`

**apps/web/src/app/:**
- Purpose: Next.js App Router pages and API routes
- Contains: 3 route groups (dashboard, patient, admin), 119 API endpoints, root layout
- Key files: `layout.tsx` (root), `(dashboard)/layout.tsx`, `api/**/route.ts`

**apps/web/src/components/:**
- Purpose: Reusable UI components organized by domain
- Contains: 22+ subdirectories, odontogram subsystem is most complex
- Key files: `ui/` (shadcn primitives), `odontogram/` (tooth chart), `dashboard/` (staff widgets)

**apps/web/src/lib/:**
- Purpose: Business logic, utilities, integrations
- Contains: Auth, database, PDF generation, email templates, AI prompts, billing codes
- Key files: `auth.ts`, `auth-fetch.ts`, `knmt-codes-2026.ts` (large codebook), `ai/`, `email/`, `pdf/`

**apps/web/public/models/teeth/:**
- Purpose: 3D GLB models for odontogram rendering
- Contains: 16 subdirectories (8 maxillary + 8 mandibular tooth types), each with GLB + texture files
- Key files: Model paths referenced in `lib/treatment-models.ts` and `three/model-paths.ts`

## Key File Locations

**Entry Points:**

- `apps/web/src/app/layout.tsx`: Root layout with theme provider
- `apps/web/src/app/(dashboard)/layout.tsx`: Staff sidebar + header
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`: Staff dashboard homepage
- `apps/web/src/app/(patient)/portal/layout.tsx`: Patient nav (glass design)
- `apps/web/src/app/(patient)/portal/page.tsx`: Patient portal homepage
- `apps/web/src/app/login/page.tsx`: Staff login form
- `apps/web/src/app/(patient)/patient-login/page.tsx`: Patient login form

**Configuration:**

- `packages/database/prisma/schema.prisma`: All data models
- `apps/web/tsconfig.json`: TypeScript path aliases (@ = src/, @dentflow/X = packages/X/)
- `apps/web/next.config.js`: Next.js config (experimental features, image domains)
- `apps/web/tailwind.config.ts`: Tailwind CSS theme + color tokens
- `apps/web/src/app/globals.css`: CSS variables for glass design tokens, animations

**Core Logic:**

- `apps/web/src/lib/auth.ts`: JWT signing, verification, role checks (AuthError, ApiError classes)
- `apps/web/src/lib/auth-fetch.ts`: Client-side fetch wrapper with 401 refresh + redirect to login
- `apps/web/src/lib/prisma.ts`: Prisma client singleton
- `apps/web/src/app/api/auth/login/route.ts`: Staff login endpoint
- `apps/web/src/app/api/patient-portal/auth/login/route.ts`: Patient login endpoint
- `apps/web/src/app/api/patients/[id]/route.ts`: Patient CRUD with practice isolation

**Odontogram (Dental Chart):**

- `apps/web/src/components/odontogram/odontogram.tsx`: Main UI orchestrator (mode tabs, state)
- `apps/web/src/components/odontogram/three/dental-arch-3d.tsx`: Full 32-tooth 3D scene (React Three Fiber)
- `apps/web/src/components/odontogram/three/tooth-detail-3d.tsx`: Large single-tooth viewer
- `apps/web/src/components/odontogram/three/model-paths.ts`: FDI number → GLB path mapping
- `apps/web/src/components/odontogram/modes/overview-mode.tsx`: Dual view (arch + detail)
- `apps/web/src/components/odontogram/modes/perio-mode.tsx`: Periodontal probing view
- `apps/web/public/models/teeth/`: 16 directories with 3D models (e.g., `public/models/teeth/maxillary-right-central/model.glb`)

**Integrations:**

- `apps/web/src/lib/gmail/`: Gmail API for email campaigns
- `apps/web/src/lib/ai/`: Gemini API for clinical note analysis
- `apps/web/src/lib/whatsapp/`: WhatsApp message integration
- `apps/web/src/lib/pdf/`: Invoice + document PDF generation
- `apps/web/src/app/api/ai/analyze-notes/route.ts`: AI analysis endpoint
- `apps/web/src/app/api/invoices/[id]/pdf/route.ts`: Invoice PDF export

**Utilities & Data:**

- `apps/web/src/lib/knmt-codes-2026.ts`: Large billing code database (Dutch KNMT codes)
- `apps/web/src/lib/nza-detection.ts`: Healthcare code classification
- `apps/web/src/lib/consent-templates.ts`: Legal consent form templates (20+ templates)
- `apps/web/src/lib/treatment-models.ts`: Treatment type → 3D model path mappings

**Testing:**
- Not detected (no test framework configured)

## Naming Conventions

**Files:**

- Pages: `page.tsx` (Next.js convention; no filename prefix)
- API routes: `route.ts` (Next.js convention)
- Components: PascalCase `ComponentName.tsx` (e.g., `PatientPhotoGallery.tsx`)
- Utilities: camelCase `utilityName.ts` (e.g., `auth.ts`, `audit.ts`)
- Constants: camelCase or UPPER_CASE for exported constants
- Types: PascalCase suffixes when exported (e.g., `AuthUser`, `JwtPayload`)
- Styles: kebab-case `.css` files or inline Tailwind (e.g., `odontogram.css`)

**Directories:**

- Feature domains: PascalCase (e.g., `components/odontogram/`, `components/dashboard/`)
- Utilities: camelCase (e.g., `lib/ai/`, `lib/gmail/`, `lib/pdf/`)
- API routes: kebab-case after `api/` (e.g., `api/clinical-notes/`, `api/patient-portal/`)
- Route groups (App Router): parentheses `(groupName)` per Next.js (e.g., `(dashboard)`, `(patient)`)

**Variables & Functions:**

- Functions: camelCase (e.g., `signAccessToken()`, `refreshAccessToken()`)
- Exported functions: camelCase (e.g., `withAuth()`, `requireRoles()`)
- Component props: camelCase object destructuring
- API response fields: camelCase (e.g., `{ access_token, patient_token }` via snake_case from backend, mapped to camelCase in JS)
- Database field names: snake_case in schema (e.g., `practice_id`, `created_at`), mapped to camelCase by Prisma client

**Types:**

- Interfaces: PascalCase, usually suffixed with context (e.g., `JwtPayload`, `AuthUser`, `ApiError`)
- Enums: PascalCase (e.g., `UserRole`)
- Generic response: `T` for data, `error?: string` for error union types

## Where to Add New Code

**New Feature in Staff Dashboard:**

- Page component: `apps/web/src/app/(dashboard)/feature-name/page.tsx`
- Sub-pages: `apps/web/src/app/(dashboard)/feature-name/[id]/page.tsx`
- API endpoints: `apps/web/src/app/api/feature-name/route.ts` (GET, POST) or nested `[id]/route.ts` (PATCH, DELETE)
- Components: `apps/web/src/components/feature-name/FeatureName.tsx`
- Utilities: `apps/web/src/lib/feature-name.ts` or `apps/web/src/lib/feature-name/`

**New Patient Portal Page:**

- Page component: `apps/web/src/app/(patient)/portal/page-name/page.tsx`
- API endpoint: `apps/web/src/app/api/patient-portal/page-name/route.ts` (validates `patient_token`)
- Components: `apps/web/src/components/patient-portal/PageName.tsx` (glass design)
- Utilities: `apps/web/src/lib/patient-portal.ts` or co-locate in component folder

**New API Endpoint:**

1. Create `apps/web/src/app/api/resource-name/route.ts` for collection (GET all, POST create)
2. Create `apps/web/src/app/api/resource-name/[id]/route.ts` for item (GET one, PATCH update, DELETE)
3. All routes:
   - Import `withAuth` from `lib/auth.ts`
   - Call `const user = await withAuth(request)` at top
   - Add `practiceId: user.practiceId` to WHERE clause
   - Return error via `handleError(error)` for consistent format
4. Types: Use `@dentflow/shared-types` if cross-package, else co-locate in component

**New Component:**

- Presentation component: `apps/web/src/components/domain/ComponentName.tsx`
- Use `"use client"` if interactive (state, event handlers)
- For UI primitives: import from `src/components/ui/` (shadcn/ui)
- For icons: import from `lucide-react`
- For styling: Use Tailwind classes (static, not dynamic interpolation)

**Database Schema Change:**

1. Edit `packages/database/prisma/schema.prisma` (add model or field)
2. Run `pnpm db:generate` (regenerate Prisma client)
3. Run `pnpm db:push` (apply to dev database)
4. Update seed script (`seed.ts`) to populate test data if needed
5. Update API routes to handle new fields (add to include/select, validate in PATCH body)

**Shared Type Addition:**

1. Add type to `packages/shared-types/src/index.ts` or create new file
2. Export from `src/index.ts`
3. Import in web app: `import { TypeName } from '@dentflow/shared-types'`

## Special Directories

**apps/web/public/models/teeth/:**
- Purpose: 3D tooth model assets for odontogram rendering
- Generated: No (manually curated GLB files)
- Committed: Yes (stored in git)
- Structure: 16 subdirectories, each named by tooth type (e.g., `maxillary-right-central/`)
- Contents: `model.glb` (3D mesh), optional texture/material files
- Reference: `src/lib/treatment-models.ts` and `src/components/odontogram/three/model-paths.ts`

**apps/web/.next/:**
- Purpose: Next.js build output (dev cache, production build)
- Generated: Yes (by `pnpm dev` and `pnpm build`)
- Committed: No (in .gitignore)

**packages/database/prisma/migrations/:**
- Purpose: Database migration history (created but not committed in this setup)
- Generated: Yes (by `pnpm db:migrate`)
- Committed: Depends on strategy; typically yes for production

**apps/web/src/app/globals.css:**
- Purpose: Global CSS variables, animations, reset rules
- Contains: `--text-primary`, `--text-secondary`, glass effect definitions, dark mode variables
- Reference: Tailwind config references these variables for theme colors

---

*Structure analysis: 2026-02-16*
