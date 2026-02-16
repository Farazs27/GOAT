# Testing Patterns

**Analysis Date:** 2026-02-16

## Test Framework

**Status:** Not configured

**Key Finding:** From `CLAUDE.md` line 30: "No test framework is configured."

- No Jest, Vitest, or other test runner installed
- No test scripts in `package.json` (root has `"test": "turbo run test"` but no target packages)
- No test files (`.test.ts`, `.spec.ts`) found in codebase
- No mock libraries (jest, vitest, msw) in dependencies

**Implication:**
- Manual testing only (dev server testing)
- No automated unit/integration test coverage
- No CI test pipeline
- New testing infrastructure required for any automated testing phase

## Test File Organization

**Location:** Not applicable - no tests present

**Naming Convention (when implemented):** Following Next.js convention
- Unit tests: `[module].test.ts` co-located with source
- Example: `apps/web/src/lib/auth.test.ts` would test `apps/web/src/lib/auth.ts`

**Structure (proposal for future):**
```
apps/web/src/
├── lib/
│   ├── auth.ts
│   ├── auth.test.ts
│   ├── auth-fetch.ts
│   ├── auth-fetch.test.ts
│   └── ...
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts
│       │   └── login.test.ts
│       └── ...
└── components/
    ├── odontogram/
    │   ├── odontogram.tsx
    │   └── odontogram.test.tsx
    └── ...
```

## Manual Testing Approach (Current)

**Development Setup:**
```bash
pnpm --filter @dentflow/web dev          # Start Next.js dev server (port 3000)
pnpm type-check                           # TypeScript check across all packages
pnpm --filter @dentflow/web build         # Build before deployment
```

**Manual Test Scenarios (from code inspection):**

**Auth Flow:**
1. POST `/api/auth/login` with `email` + `password`
2. Verify response includes `access_token`, `refresh_token`, `user` object
3. Test 401 on invalid credentials (lowercased email matching)
4. Test 401 on inactive user (`isActive: false`)
5. Verify `lastLoginAt` timestamp updated in database
6. Test token refresh at `/api/auth/refresh` endpoint

**API Error Handling:**
- AuthError (401/403) returns JSON with error message
- ApiError (404/400) returns JSON with error message
- Unhandled errors return 500 with generic message
- Test error responses match expected status codes and message format

**Fetch Wrapper (authFetch):**
1. Request with valid token succeeds
2. Request with 401 triggers token refresh
3. Refresh success retries original request with new token
4. Refresh failure clears tokens and redirects to `/login`
5. Concurrent refresh calls deduplicated (single refresh promise)

**Patient Data:**
1. GET `/api/patients/[id]` returns patient with BSN masked (not full)
2. PATCH updates only allowed fields (firstName, lastName, email, etc.)
3. DELETE cascades to teeth, invoices, treatments, appointments, etc. in FK-safe order
4. Query filtered by `practiceId` (multi-tenant isolation)

## Existing Code Patterns to Test

### Auth Module (`apps/web/src/lib/auth.ts`)

**Functions to test:**
- `signAccessToken()` - creates JWT with 1h default expiry
- `signRefreshToken()` - creates JWT with 8h default expiry
- `verifyToken()` - throws on invalid/expired token
- `withAuth(request)` - extracts Bearer token, returns AuthUser or throws
- `requireRoles(user, roles)` - throws AuthError on permission mismatch
- `handleError()` - normalizes error responses

**Test strategy:**
```typescript
// Would need: jsonwebtoken mock or real JWT library
// Test sign produces valid JWT structure
// Test verify with valid/expired/invalid signatures
// Test withAuth with missing Authorization header
// Test withAuth with Bearer prefix present/missing
```

### Auth Fetch Wrapper (`apps/web/src/lib/auth-fetch.ts`)

**Key behaviors to test:**
- Token included in all requests (localStorage.getItem)
- 401 triggers refresh with refresh_token
- Refresh success deduplicates concurrent calls
- Refresh failure redirects to /login and clears storage
- Original request retried after successful refresh
- Non-401 responses returned as-is

**Challenges:**
- Browser-only (`localStorage`) - would need jsdom or Playwright
- Fetch API interaction - would need MSW (Mock Service Worker) or fetch stub

### API Routes

**Pattern from** `apps/web/src/app/api/auth/login/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request); // Extract & verify JWT
    // ... business logic
    return Response.json({ data });
  } catch (error) {
    return handleError(error); // Normalize error response
  }
}
```

**Test strategy:**
- Mock `NextRequest` with headers/body
- Mock Prisma queries
- Assert response JSON structure
- Assert error status codes (401, 404, 500)

### Prisma Operations

**Transaction pattern from** `apps/web/src/app/api/patients/[id]/route.ts`:

```typescript
await prisma.$transaction(async (tx) => {
  await tx.toothSurface.deleteMany({ where: { tooth: { patientId: id } } });
  await tx.tooth.deleteMany({ where: { patientId: id } });
  await tx.invoice.deleteMany({ where: { patientId: id } });
  // ... delete all related entities in FK-safe order
  await tx.patient.delete({ where: { id } });
});
```

**Test strategy:**
- Mock Prisma client
- Verify delete operations called in correct order
- Verify deletion stops on constraint violation
- Integration test with real database (separate test DB)

## Coverage Gaps Identified

**High Priority (Security/Core):**
- Auth token generation and validation - not tested
- JWT expiration - not tested
- Concurrent refresh handling - not tested
- BSN encryption/masking - not tested
- Audit logging triggers - not tested

**Medium Priority (Data Integrity):**
- API input validation (missing email, invalid date formats) - not tested
- Cascade delete ordering - not tested
- Multi-tenant data isolation (practiceId filtering) - not tested
- Patient data field constraints - not tested

**Lower Priority (UI/Components):**
- React component rendering - not tested
- Interactive features (tooth selection, restoration panel) - not tested
- 3D odontogram rendering - not tested (visual regression best approach)
- Glass UI styling - not tested (visual regression best approach)

## Recommended Test Framework

**For this project (Node.js/Next.js 15):**

Option 1 (Lightweight):
- **Vitest** + **@vitest/ui** - Fast, ESM-native, good IDE support
- **@testing-library/react** - Component testing
- **@testing-library/jest-dom** - DOM matchers

Option 2 (Industry Standard):
- **Jest** - Already in Next.js ecosystem
- **jest-mock-extended** - Better mock typing
- **@testing-library/react** - Component testing

Option 3 (E2E):
- **Playwright** - Browser automation for critical paths
- Good for auth flow, 3D components, cross-browser

## Future Test Organization

**When framework is added:**

```bash
# Run tests
pnpm test                                  # Run all tests
pnpm test --watch                          # Watch mode
pnpm test --coverage                       # Coverage report

# By package
pnpm --filter @dentflow/web test
pnpm --filter @dentflow/database test
```

**Coverage target:**
- Auth module: 90%+ (critical)
- API routes: 80%+ (business logic)
- Components: 60%+ (visual regression preferred)
- Utilities: 100% (small, deterministic functions)

---

*Testing analysis: 2026-02-16*
