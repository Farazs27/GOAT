# DentFlow Agent Guidelines

> For agentic coding agents working in this repository

## Build & Development Commands

### Core Commands

```bash
# Development
pnpm --filter @dentflow/web dev          # Start Next.js dev server (port 3000)
pnpm dev                                  # Start all packages via Turbo

# Build & Verify (REQUIRED before claiming completion)
pnpm --filter @dentflow/web build         # Build web app
pnpm type-check                           # TypeScript check across all packages
pnpm lint                                 # ESLint check

# Database
pnpm db:generate                          # Regenerate Prisma client after schema changes
pnpm db:push                              # Push schema to database (no migration)
pnpm db:seed                              # Seed database
pnpm db:studio                            # Open Prisma Studio GUI
pnpm db:migrate                           # Create + apply migration

# After schema changes, ALWAYS run both:
pnpm db:generate && pnpm db:push

# Restart dev server (kill old, clear cache, restart):
kill $(lsof -ti :3000) 2>/dev/null; rm -rf apps/web/.next; pnpm --filter @dentflow/web dev

# Code formatting
pnpm format                               # Format with Prettier (if configured)
```

### Testing

No test framework is configured. Manual testing required:

1. **Patient Portal**: Use credentials displayed on `/patient-login` page
   - Email: `peter.jansen@email.nl`, BSN last 4: `6782`
   - Test at `/patient-login` and `/portal`

2. **Dentist Portal**: Use credentials displayed on `/login` page
   - Dentist: `faraz@tandarts-amsterdam.nl` / `Sharifi1997`
   - Admin: `admin@dentflow.nl` / `Welcome123`
   - Test at `/login` and `/dashboard`

## Code Style Guidelines

### Import Organization

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from "react";
import { NextRequest, NextResponse } from "next/server";
import Link from "next/link";

// 2. Third-party libraries
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";

// 3. Internal workspace packages
import { authFetch } from "@/lib/auth-fetch";
import { type Patient } from "@dentflow/shared-types";

// 4. Relative imports
import { Button } from "@/components/ui/button";
import { Odontogram } from "@/components/odontogram/odontogram";
```

### ESLint Rules

The project uses Next.js ESLint configuration. Common rules:

- Use `@next/next/no-img-element` when using `<img>` tags (instead of Next.js `<Image>`)
- Proper TypeScript typing for all functions and components
- Follow React hooks rules and best practices
- Use proper imports and no unused variables

### TypeScript Rules

- **Strict mode enabled** - all types must be properly defined
- **Use interface for objects**, type for primitives/unions
- **Always type API route responses**: `Promise<NextResponse<{...}>`
- **Use Zod for runtime validation** in API routes
- **Prefer explicit returns** over implicit returns in complex functions

### Naming Conventions

- **Components**: PascalCase (e.g., `PatientCard`, `TreatmentPlanBuilder`)
- **Files**: kebab-case for utilities (e.g., `auth-fetch.ts`), PascalCase for components
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names (e.g., `PatientRecord`, `AppointmentData`)
- **API routes**: kebab-case in paths, PascalCase in filenames

### Error Handling

```typescript
// API Routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // validation and processing
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Client-side
const { data, error } = await fetch("/api/endpoint").then((r) => r.json());
if (error) {
  // Handle error appropriately
  toast.error(error);
}
```

### File Structure Patterns

```
apps/web/src/
├── app/(dashboard)/     # Dentist portal (NEVER MODIFY during patient work)
├── app/(patient)/       # Patient portal
├── app/api/             # API routes (dentist portal)
├── components/          # Shared components (read-only for patient work)
├── components/patient-portal/  # Patient-specific components
├── lib/                 # Utilities, auth, helpers
└── types/               # TypeScript type definitions
```

## Critical Rules

### DO NOT

- Modify dentist portal files (`(dashboard)/` routes) during patient portal work
- Use dynamic Tailwind classes: `bg-${color}-500` → use static class maps
- Mix teal/cyan colors in patient portal (theme is warm orange/amber `#e8945a`)
- Commit or push unless explicitly asked
- Add heavy animations or floating orbs to patient portal

### MUST DO

- Read files before editing them
- Run `pnpm --filter @dentflow/web build` and `pnpm type-check` before completion
- After Prisma schema changes: `pnpm db:generate && pnpm db:push`
- Keep all user-facing labels in Dutch
- Define both sides of Prisma relations
- Use `authFetch` for dentist portal, `patient_token` for patient portal

### Design System

**Patient Portal**: Dark glassmorphism with warm orange/amber accents

- Glass cards: `bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl`
- Accent: `#e8945a` (orange), hover: `#f0a06a`
- Text: white primary, `text-white/60` secondary, `text-white/40` tertiary
- Background: `patient-gradient-bg` class

## Database & API Patterns

### Prisma Relations

Always define both sides:

```prisma
model Patient {
  appointments Appointment[]
}

model Appointment {
  patient     Patient @relation(fields: [patientId], references: [id])
  patientId   String
}
```

### API Route Structure

```typescript
// apps/web/src/app/api/endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@dentflow/database";

const schema = z.object({
  // validation schema
});

export async function POST(request: NextRequest) {
  // implementation
}
```

## Performance Considerations

### Dynamic Imports

Use for heavy components:

```typescript
const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <div>Loading...</div>
});
```

### Bundle Size

- Import specific icons: `import { Calendar, User } from 'lucide-react'`
- Use `dynamic()` for large charts, PDF generators, image viewers
- Avoid importing entire libraries for single functions

## Project Architecture

### Monorepo Structure

```
DentFlow/
├── apps/web/                 # Next.js 15 application
│   ├── src/app/(dashboard)/ # Dentist portal (NEVER MODIFY during patient work)
│   ├── src/app/(patient)/  # Patient portal
│   └── src/app/api/         # API routes
├── packages/
│   ├── database/             # Prisma schema and client
│   ├── shared-types/        # Shared TypeScript types
│   └── crypto/              # Encryption utilities
└── AGENTS.md               # This file
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5.3, Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: JWT tokens (separate for staff/patients)
- **Styling**: Tailwind CSS with custom CSS variables
- **Package Manager**: pnpm with Turborepo

### Key Configuration Files

- `package.json`: Main monorepo scripts and pnpm config
- `turbo.json`: Build system configuration
- `tsconfig.json`: TypeScript strict mode enabled
- `globals.css`: CSS variables for light/dark themes

## Portal Sync Rules (CRITICAL)

When working on patient portal:

1. **NEVER** modify dentist portal pages in `app/(dashboard)/`
2. **NEVER** modify existing API routes — create new ones under `app/api/portal/`
3. **NEVER** alter shared components in `src/components/` — create patient-specific wrappers
4. **Auth separation**: Dentist uses `access_token` via `authFetch`, Patient uses `patient_token`

See `apps/web/PORTAL-SYNC.md` for full documentation.

## Security & Compliance

### Authentication Patterns

```typescript
// Dentist portal authentication
import { authFetch } from "@/lib/auth-fetch";

// Patient portal authentication
const token = localStorage.getItem("patient_token");
const response = await fetch("/api/endpoint", {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Data Protection

- **BSN handling**: Store encrypted in production, plain text in development
- **Medical data**: All patient data access must be logged
- **Audit trail**: Maintain audit logs for sensitive operations

### Authentication Best Practices

- Never expose tokens in client-side code
- Use HTTPS for all API communications
- Implement proper token refresh mechanisms
- Validate all user inputs server-side

## Debugging & Development

### Browser DevTools

1. **Network Tab**: Monitor API calls and authentication headers
2. **Console**: Check for authentication errors
3. **Application Tab**: Verify token storage in localStorage

### Common Issues

- **Build errors**: Usually TypeScript type mismatches or missing imports
- **Database connection**: Check DATABASE_URL in .env.local
- **Authentication failures**: Verify token format and API headers

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in required environment variables
3. Run `pnpm install` to install dependencies
4. Start development server with `pnpm dev`

## Final Checklist Before Completion

- [ ] Code follows import organization guidelines
- [ ] All TypeScript types are properly defined
- [ ] Build succeeds: `pnpm --filter @dentflow/web build`
- [ ] Type check passes: `pnpm type-check`
- [ ] ESLint passes: `pnpm lint`
- [ ] Database migrations applied (if schema changed)
- [ ] Manual testing completed for all user flows
- [ ] All user-facing text is in Dutch
- [ ] Portal sync rules followed (no cross-portal modifications)
