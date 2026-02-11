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
```

### Testing

No test framework is configured. Manual testing required:

1. Use provided login credentials from HANDOFF.md
2. Test patient portal at `/patient-login` and `/portal`
3. Test dentist portal at `/login`

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

## Portal Sync Rules (CRITICAL)

When working on patient portal:

1. **NEVER** modify dentist portal pages in `app/(dashboard)/`
2. **NEVER** modify existing API routes — create new ones under `app/api/portal/`
3. **NEVER** alter shared components in `src/components/` — create patient-specific wrappers
4. **Auth separation**: Dentist uses `access_token` via `authFetch`, Patient uses `patient_token`

See `apps/web/PORTAL-SYNC.md` for full documentation.
