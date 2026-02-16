# Technology Stack

**Analysis Date:** 2026-02-16

## Languages

**Primary:**
- TypeScript 5.3.3 - Application code, API routes, components
- JavaScript (ES2017) - Configuration files, scripts

**Secondary:**
- SQL - Prisma schema and database queries (Neon Postgres)

## Runtime

**Environment:**
- Node.js >= 20

**Package Manager:**
- pnpm 9.0.0
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core:**
- Next.js 15.1.0 - Full-stack React application (React 19)
- React 19.0.0 - UI component library
- Tailwind CSS 3.4.1 - Utility-first CSS styling

**Database:**
- Prisma 5.10.0 - ORM for PostgreSQL, client generation, migrations
- @prisma/client 5.10.0 - Generated database client

**Testing:**
- Not configured - No test framework present

**Build/Dev:**
- Turborepo 2.0.0 - Monorepo task orchestration
- Autoprefixer 10.4.17 - CSS vendor prefixing
- PostCSS 8.4.35 - CSS transformation pipeline

**Linting:**
- ESLint 8.56.0 - Code quality (Next.js config)

## Key Dependencies

**Critical:**
- jsonwebtoken 9.0.3 - JWT token generation and verification for authentication
- bcryptjs 3.0.3 - Password hashing and comparison (server-side only)
- crypto-js 4.2.0 - BSN encryption for Dutch national ID numbers
- @dentflow/database - Prisma client and schema (internal workspace package)
- @dentflow/shared-types - Shared TypeScript types for auth/patient/billing (internal)
- @dentflow/crypto - BSN encryption utilities (internal)

**UI Components:**
- @radix-ui/* (11 packages) - Accessible component primitives (accordion, dialog, select, tabs, toast, etc.)
- shadcn/ui components built on Radix UI + Tailwind
- lucide-react 0.563.0 - Icon library
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Class name conditional utility
- tailwind-merge 2.6.1 - Tailwind class merging utility
- tailwindcss-animate 1.0.7 - Animation utilities

**State Management:**
- zustand 5.0.11 - Lightweight React state management
- swr 2.2.5 - Data fetching and caching with React hooks

**Forms:**
- react-hook-form 7.51.0 - Form state management
- @hookform/resolvers 3.3.4 - Validation schema resolvers
- zod 3.22.4 - Schema validation library

**Data & Charting:**
- recharts 2.12.0 - React charting component library
- date-fns 3.3.1 - Date manipulation utilities

**File & Document Handling:**
- jspdf 2.5.2 - PDF generation
- jspdf-autotable 3.8.4 - PDF table generation plugin
- pdf-parse 2.4.5 - PDF content extraction for imports

**3D Graphics:**
- three 0.182.0 - 3D graphics library (WebGL)
- @react-three/fiber 9.5.0 - React renderer for Three.js
- @react-three/drei 10.7.7 - Useful helpers for Three.js
- konva 10.2.0 - 2D canvas library for smile design
- react-konva 19.2.2 - React wrapper for Konva
- three-mesh-bvh 0.8.3 - Bounding volume hierarchy for Three.js

**Media & Vision:**
- @mediapipe/tasks-vision 0.10.32 - Google MediaPipe for facial/dental vision tasks

**External APIs & Services:**
- @mollie/api-client 4.4.0 - Mollie iDEAL payment processing
- twilio 5.12.1 - SMS and WhatsApp messaging
- resend 6.9.2 - Transactional email service
- googleapis 171.4.0 - Google APIs (integration hooks present)
- @vercel/blob 2.2.0 - File storage on Vercel Blob
- next-auth 4.24.5 - Authentication (dependency present but not primary auth)

**Utilities:**
- axios 1.6.7 - HTTP client
- next-themes 0.4.6 - Dark mode theming
- next-env.d.ts - Next.js type definitions

## Configuration

**Environment:**
- Variables configured via:
  - `.env` file (present - contains DATABASE_URL, JWT_SECRET, API keys)
  - `.env.local` file (present - local overrides)
  - Turbo global environment variables in `turbo.json`

**Key configs required:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `DIRECT_URL` - Neon direct connection (for migrations)
- `JWT_SECRET` - Secret key for JWT signing
- `GEMINI_API_KEY` - Google Gemini API key (for AI features)
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `MOLLIE_API_KEY` - Mollie payment gateway API key (optional/configurable per practice)
- `RESEND_API_KEY` - Resend email service API key
- `TWILIO_*` - Twilio credentials (optional per practice)
- `FROM_EMAIL` - Email sender address

**Build:**
- `next.config.ts` - Next.js configuration with:
  - React strict mode enabled
  - Standalone output for containerization
  - Transpilation of internal workspace packages
  - Prisma monorepo workaround plugin for serverless
- `tsconfig.json` - TypeScript configuration with:
  - Path alias `@/*` → `./src/*`
  - ES2017 target
  - Strict mode enabled
- `tailwind.config.ts` - Tailwind CSS with dark mode support
- `postcss.config.mjs` - PostCSS with Tailwind and Autoprefixer

## Platform Requirements

**Development:**
- Node.js >= 20
- pnpm 9.0.0
- Git (for Turbo operations)

**Production:**
- Next.js 15 compatible hosting (Vercel or Node.js 20+ server)
- PostgreSQL 13+ (Neon Postgres pooler)
- External services integrated via API keys:
  - Mollie (payment processing)
  - Twilio (SMS/WhatsApp)
  - Resend (email)
  - Vercel Blob (file storage)
  - Google Gemini (AI/LLM)

---

*Stack analysis: 2026-02-16*
