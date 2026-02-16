# Coding Conventions

**Analysis Date:** 2026-02-16

## Naming Patterns

**Files:**
- React components (`.tsx`): PascalCase - `Odontogram.tsx`, `WidgetDetailSlideout.tsx`, `Button.tsx`
- TypeScript utilities (`.ts`): camelCase or descriptive kebab-case - `auth.ts`, `auth-fetch.ts`, `audit.ts`, `tooth-shapes.ts`
- API routes: kebab-case with directory structure - `api/auth/login/route.ts`, `api/patient-portal/appointments/route.ts`
- Shared type files: PascalCase or descriptive - `auth.ts`, `patient.ts`, `odontogram.ts`

**Functions:**
- Async functions handling HTTP/data: camelCase - `withAuth()`, `refreshAccessToken()`, `handleError()`
- API response handlers: descriptive imperative - `POST()`, `GET()`, `PATCH()`, `DELETE()`
- React event handlers: camelCase with `handle` prefix - `handleToothSelect()`, `handleContextMenu()`, `handleClose()`
- Utility functions: camelCase - `maskBsn()`, `comparePassword()`, `getClientIp()`
- Component lifecycle hooks: camelCase - `useCallback()`, `useEffect()`, `useState()`

**Variables:**
- State variables: camelCase - `selectedTooth`, `perioData`, `treatmentHistory`, `isLoading`
- Constants (enumerations, configs): UPPERCASE or PascalCase enum - `UserRole.DENTIST`, `Permission.VIEW_PATIENT`
- Configuration objects: camelCase - `typeLabels`, `statusConfig`, `widgetConfig`
- Type/interface names: PascalCase - `JwtPayload`, `AuthUser`, `OdontogramProps`, `Appointment`

**Types:**
- Interfaces: PascalCase, prefix with `I` if ambiguous - `AuthUser`, `JwtPayload`, `OdontogramProps`, `ButtonProps`
- Enums: PascalCase with values in UPPER_SNAKE_CASE - `UserRole`, `Permission` (values: `DENTIST`, `MANAGE_PRACTICES`)
- Type aliases: PascalCase - `OdontogramMode = 'overview' | 'perio' | 'quickselect'`
- Union types: descriptive lowercase with pipes - `'overview' | 'perio' | 'quickselect'`

## Code Style

**Formatting:**
- Prettier configured for automatic formatting (script: `pnpm format`)
- Print width: default (80-120 chars)
- Quote style: double quotes in JSX/HTML, single quotes in JS/TS where not conflicting
- Semicolons: always included
- Trailing commas: ES5 compatible (not in function parameters)

**Linting:**
- ESLint present (package installed: `eslint@8.56.0`, `eslint-config-next@15.1.0`)
- Next.js ESLint config used via `extends: 'next/core-web-vitals'` (implicit in app)
- IMPORTANT: No explicit ESLint config file in repository root or `apps/web` - using Next.js defaults
- TypeScript strict mode enabled - `"strict": true` in `tsconfig.json`

## Import Organization

**Order:**
1. External packages and Node.js built-ins: `import jwt from 'jsonwebtoken'`, `import { NextRequest } from 'next/server'`
2. React/framework imports: `import { useState, useCallback } from 'react'`, `import Link from 'next/link'`
3. Internal type imports: `import type { PerioToothData } from '@/../../packages/shared-types'`
4. Internal utility/lib imports: `import { prisma } from '@/lib/prisma'`, `import { withAuth } from '@/lib/auth'`
5. Internal component imports: `import OverviewMode from './modes/overview-mode'`
6. Styles/CSS: `import './odontogram.css'`

**Path Aliases:**
- `@/*` maps to `apps/web/src/*` (defined in `apps/web/tsconfig.json`)
- Use `@/` for all internal imports from src directory
- Cross-package imports: `@dentflow/shared-types`, `@dentflow/database`, `@dentflow/crypto`
- Relative imports only for sibling/adjacent files in same component directory

**Example import block from** `apps/web/src/components/odontogram/odontogram.tsx`:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { PerioToothData } from '@/../../packages/shared-types/src/odontogram';
import OverviewMode from './modes/overview-mode';
import PerioMode from './modes/perio-mode';
import QuickselectMode from './modes/quickselect-mode';
import RestorationPanel from './restoration/restoration-panel';
import { authFetch } from '@/lib/auth-fetch';
import './odontogram.css';
```

## Error Handling

**Patterns:**
- Custom error classes extend `Error` with status codes: `AuthError`, `ApiError` (see `apps/web/src/lib/auth.ts`)
- API routes catch errors and use `handleError()` utility to normalize responses
- Auth errors return `401 Unauthorized` with Dutch message: `throw new AuthError('Ongeldige of verlopen token', 401)`
- Business logic errors return appropriate HTTP status: `404`, `403`, etc.
- Unhandled errors logged with `console.error()` and return generic `500` response

**Error handling pattern in API routes:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    // ... business logic
    return Response.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
```

**Error wrapping:**
- Database/auth errors wrapped in `ApiError` or `AuthError`
- Validation errors return early with `Response.json({ message: 'validation msg' }, { status: 400 })`

## Logging

**Framework:** `console` object - no external logging library configured

**Patterns:**
- Error logging: `console.error('Context:', error instanceof Error ? error.message : error)`
- Debug info: `console.log()` during development (removed before production)
- Auth/security events: logged with context - `console.error('LOGIN ERROR: DATABASE_URL is not configured')`
- No structured logging format enforced - log messages are descriptive Dutch/English depending on context

**Example from** `apps/web/src/app/api/auth/login/route.ts`:
```typescript
console.error('LOGIN ERROR: DATABASE_URL is not configured');
console.error('Login error:', error instanceof Error ? error.message : error);
```

## Comments

**When to Comment:**
- Complex business logic or dental terminology explanations
- Non-obvious algorithm choices (e.g., 3D model transformations in odontogram)
- Integration points with external services
- Security-sensitive operations (BSN handling, auth token refresh)
- TODOs/FIXMEs very rare - zero instances found in active code

**JSDoc/TSDoc:**
- Minimal usage - focus on types via TypeScript
- Used for exported utility functions and public APIs
- Example from `apps/web/src/lib/auth-fetch.ts`:
```typescript
/**
 * Authenticated fetch wrapper with automatic token refresh.
 *
 * If a request returns 401, it silently refreshes the access token
 * using the stored refresh token and retries once. If the refresh
 * also fails the user is redirected to /login.
 */
```

## Function Design

**Size:** Small, focused functions (most < 50 lines)
- API route handlers 50-100 lines (including error handling)
- Component functions 100-300 lines (with internal helper hooks)
- Utility functions 10-30 lines

**Parameters:**
- Explicit named parameters over objects when 1-2 arguments
- Destructured object parameters for multiple related options: `function authFetch(url: string, options?: RequestInit)`
- Type-first parameters for TypeScript functions: `function withAuth(request: Request): Promise<AuthUser>`

**Return Values:**
- Async functions return `Promise<T>` explicitly
- HTTP handlers return `Response` (Next.js convention)
- Void returns rare - most functions return data or status
- Nullable returns used: `string | null`, `Promise<AuthUser | null>` (though usually throw errors instead)

**Example from** `apps/web/src/lib/auth.ts`:
```typescript
export function signAccessToken(
  payload: Omit<JwtPayload, 'permissions'>,
  expiresIn = '1h'
): string {
  const permissions = RolePermissions[payload.role] || [];
  return jwt.sign(
    { ...payload, permissions },
    JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}
```

## Module Design

**Exports:**
- Named exports preferred: `export function withAuth()`, `export class AuthError`
- Default exports for React components: `export default function Odontogram()`
- Mixed when appropriate: `export { Button, buttonVariants }` (UI components)

**Barrel Files:**
- Selective use - `apps/web/src/components/ui/` has index pattern
- `apps/web/src/lib/email/index.ts` exports common email utilities
- Not used for large directories (components, API routes)

**Module responsibilities (single responsibility):**
- `auth.ts` - JWT sign/verify and auth middleware only
- `audit.ts` - Audit logging utilities
- `auth-fetch.ts` - Fetch wrapper with token refresh
- `passwords.ts` - Password hashing/comparison
- Each module focused on one domain

## Client vs Server Components

**Client Components (`'use client'`):**
- React state management with `useState`, `useCallback`
- Event handlers and interactivity
- Local UI state (collapsed panels, selected tabs)
- Examples: `Odontogram.tsx`, `WidgetDetailSlideout.tsx`, `Button.tsx`

**Server Components (default in Next.js 15):**
- API route handlers (no directive needed - always server)
- Database queries via Prisma
- Sensitive operations (BSN access, auth verification)
- Page layouts and data fetching

## Tailwind CSS

**Critical Rule:**
- **NEVER use dynamic class interpolation**: `bg-${color}-500` will NOT work in production
- **ALWAYS use static class maps** for variant styling

**Pattern (from CLAUDE.md):**
```typescript
const classes = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
};
className={classes[variableName]}
```

**Glass UI Pattern (Patient Portal):**
- Glass cards: `bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl`
- Hover: `hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300`
- Inputs: `bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20`
- Buttons: `bg-[#e8945a] hover:bg-[#d4864a] shadow-lg shadow-[#e8945a]/25 rounded-2xl`

---

*Convention analysis: 2026-02-16*
