# Codebase Concerns

**Analysis Date:** 2026-02-16

## Security Concerns

**Hardcoded JWT Secret:**
- Issue: Default JWT secret in production (`'dev-secret-change-in-production'`)
- Files: `apps/web/src/lib/auth.ts:4`
- Impact: All JWT tokens can be forged if environment variable not set
- Fix approach: Add startup validation to reject missing JWT_SECRET in production; use strong secret generation

**BSN (Dutch ID) Handling - Incomplete Encryption:**
- Issue: BSN stored in plaintext in database. Schema shows `bsn`, `bsnEncrypted`, and `bsnHash` fields but only `bsn` is populated
- Files: `packages/database/prisma/schema.prisma:139-143`, `apps/web/src/app/api/patients/[id]/bsn/route.ts:39`
- Impact: Sensitive PII at risk if database is compromised; violates GDPR/AVG requirements
- Fix approach: Implement BSN encryption on write, decrypt on authorized access only. Complete migration to `bsnEncrypted` field

**Direct localStorage Access Without SSR Guard:**
- Issue: Multiple files access `localStorage` without checking `typeof window !== 'undefined'`
- Files: `apps/web/src/lib/auth-fetch.ts:12,27,40,64-67`, `apps/web/src/components/Periodontogram.tsx:85,106`, `apps/web/src/app/login/page.tsx:33-35`
- Impact: Next.js server-side rendering fails with "localStorage is not defined" errors
- Fix approach: Wrap all localStorage calls with `typeof window !== 'undefined'` check; create a wrapper utility

**Credentials Stored in JSON Fields:**
- Issue: API credentials (Mollie, Twilio, etc) stored in `Credential.apiKey`, `Credential.apiSecret`, `Credential.accessToken` fields as plain text
- Files: `packages/database/prisma/schema.prisma:829-832`
- Impact: Credentials exposed if database is compromised; violates security best practices
- Fix approach: Implement field-level encryption for all credential fields; integrate with secrets management system

**Missing Authorization Checks on Patient Portal:**
- Issue: Patient portal uses `patient_token` but some endpoints may not verify `patientId` matches authenticated user
- Files: `apps/web/src/app/api/patient-portal/profile/route.ts` (correctly scoped), but verify all `patient-portal/*` routes
- Impact: Potential data leakage between patients if patientId filtering is missing
- Fix approach: Audit all patient-portal routes to ensure `user.patientId` matches request patientId

## Tech Debt

**Complex Page Components - Low Maintainability:**
- Issue: Very large page components with mixed concerns (UI, data fetching, business logic)
- Files: `apps/web/src/app/(dashboard)/agenda/page.tsx:2652 lines`, `apps/web/src/app/(patient)/portal/anamnesis/page.tsx:1998 lines`, `apps/web/src/app/(dashboard)/patients/new/page.tsx:2070 lines`
- Impact: Hard to test, debug, and modify; performance issues from re-renders
- Fix approach: Break into smaller components; extract data fetching to custom hooks; use React Query or similar for state management

**Inconsistent Error Handling:**
- Issue: Generic error catches with `console.error(err)` throughout codebase; no structured error logging
- Files: `apps/web/src/components/treatments/treatment-plan-builder.tsx:81,95,108,121,132`, `apps/web/src/components/odontogram/odontogram.tsx:120,145`
- Impact: Hard to diagnose production issues; errors not tracked in monitoring system
- Fix approach: Implement centralized error boundary; use structured logging with error tracking (Sentry, etc)

**No Test Coverage:**
- Issue: Zero test files in source code (only node_modules tests)
- Files: Entire codebase
- Impact: Cannot verify changes don't break functionality; regression risk is high
- Fix approach: Set up Jest/Vitest; add tests for critical paths (auth, payments, patient data access)

**Missing Input Validation:**
- Issue: Many API routes accept JSON without schema validation
- Files: `apps/web/src/app/api/patients/[id]/bsn/route.ts:13-14` (minimal validation), other routes
- Impact: Invalid data can corrupt database; potential injection attacks
- Fix approach: Add Zod schemas to validate all request bodies; centralize validation middleware

**Hardcoded Technician Data:**
- Issue: Hardcoded technician names (Marcos Gatti/Nucci, ACA) in declaratie code
- Files: `apps/web/src/components/declaratie/technician-browser-panel.tsx` (line 147 - inferred from search)
- Impact: Cannot serve multiple practices; technician data not managed through admin panel
- Fix approach: Move technician data to database; fetch from `User` or separate `Technician` model

**Unimplemented Gmail Features:**
- Issue: Gmail sync functions return `null` with comments "For now, return null"
- Files: `apps/web/src/lib/gmail/sync.ts:234-236,248,266`
- Impact: Gmail integration partially incomplete; attachment handling not working
- Fix approach: Complete implementation of attachment extraction; test with real Gmail messages

## Performance Concerns

**Large JavaScript Bundles - 3D Rendering:**
- Issue: Three.js and related 3D libraries increase bundle size significantly
- Files: `apps/web/src/components/odontogram/`, `apps/web/src/components/smile-design/three/`
- Impact: Slow initial page load on dental chart pages; poor performance on mobile
- Fix approach: Code-split 3D components with dynamic imports (already done); implement lazy rendering

**Missing Database Indexes on Foreign Keys:**
- Issue: Many join queries without explicit indexes
- Files: `packages/database/prisma/schema.prisma` (many models lack @index on FK fields)
- Impact: Slow queries on large datasets (invoices, appointments, clinical notes)
- Fix approach: Add @index decorators on frequently-joined fields: `patientId`, `practiceId`, `appointmentId`

**N+1 Query Problems Possible:**
- Issue: Odontogram fetches tooth data; may not batch queries efficiently
- Files: `apps/web/src/components/odontogram/odontogram.tsx:120-145` (inferred API calls)
- Impact: Slow patient charts if many teeth or treatments
- Fix approach: Add batch endpoint `/api/patients/[id]/odontogram/batch` for full chart data

**Unoptimized X-Ray Viewer:**
- Issue: Large X-ray images loaded into memory; no lazy loading or virtual scrolling
- Files: `apps/web/src/components/xray-viewer/DentalXRayViewer.tsx:1296 lines`
- Impact: Memory leaks on galleries with many images; slow scrolling
- Fix approach: Implement virtual scrolling; load images on-demand; add image compression

## Known Bugs & Fragile Areas

**BSN Last-4 Patient Login:**
- Issue: Patient login requires `email + last 4 BSN digits` but BSN validation is minimal
- Files: `apps/web/src/app/(patient)/patient-login/page.tsx:10,23,68,98-120`
- Impact: Could allow brute-force attacks (only 10,000 combinations per email)
- Fix approach: Add rate limiting; consider adding CAPTCHA after N attempts; validate BSN format

**Recurring Appointments Reference Issue:**
- Issue: Schema allows `Appointment.parentId` self-reference but no unique constraint on recurring rules
- Files: `packages/database/prisma/schema.prisma:427-440`
- Impact: Could create duplicate recurring appointments; orphaned parent records
- Fix approach: Add unique constraint on parent + date combinations; add cascade delete logic

**Treatment Plan Floating Point Precision:**
- Issue: Invoice amounts stored as Decimal(10,2) but calculations may lose precision
- Files: `packages/database/prisma/schema.prisma:548-552` (Decimal definitions)
- Impact: Billing discrepancies over time; especially with discounts/splits
- Fix approach: Use integer cents throughout; convert to euros only for display

**Missing Concurrent Appointment Checks:**
- Issue: No validation preventing practitioner double-booking
- Files: `apps/web/src/app/api/appointments/route.ts` (inferred - no implementation seen)
- Impact: Overlapping appointments can be created
- Fix approach: Add database-level unique constraint; validate time windows on CREATE/UPDATE

## Missing Critical Features

**No Soft Delete Implementation:**
- Issue: Patient records can be permanently deleted; no audit trail or recovery
- Files: `packages/database/prisma/schema.prisma` (no `deletedAt` field pattern)
- Impact: GDPR compliance risk; accidental data loss
- Fix approach: Add `deletedAt` nullable DateTime fields to all models; scope queries to WHERE deletedAt IS NULL

**Missing API Rate Limiting:**
- Issue: No rate limiting on API endpoints
- Files: All API routes (`apps/web/src/app/api/**`)
- Impact: Vulnerable to DoS attacks; brute force attacks possible
- Fix approach: Implement rate limiting middleware using Redis or in-memory store

**No Automated Backup Verification:**
- Issue: No evidence of backup testing or restoration procedures
- Files: N/A (operational concern)
- Impact: Data loss risk if backups are corrupted
- Fix approach: Document backup strategy; implement automated backup testing

**Missing HIPAA/GDPR Audit Logging for All Access:**
- Issue: Audit logs exist but may not capture all sensitive data access
- Files: `apps/web/src/lib/audit.ts`, `packages/database/prisma/schema.prisma:750-771`
- Impact: Compliance violations; cannot prove audit trail
- Fix approach: Audit all patient data reads (not just writes); implement immutable audit log

## Scaling Limits

**Single Database Connection Pool:**
- Issue: Prisma client not optimized for high concurrency
- Files: `apps/web/src/lib/prisma.ts`
- Impact: Connection pool exhaustion under load
- Fix approach: Use Neon's serverless driver; implement connection pooling middleware; add caching layer

**Email Sending Synchronously:**
- Issue: Email sending may block API responses
- Files: `apps/web/src/lib/email/triggers.ts` (all triggers use await)
- Impact: Slow API responses when email service is slow
- Fix approach: Move email sending to async queue (Bull, RabbitMQ); implement retry logic

**Hardcoded NZA Codebook in Memory:**
- Issue: Large NZA code lookup table loaded as TypeScript constant
- Files: `apps/web/src/lib/ai/nza-codebook.ts:4028 lines`
- Impact: Large JavaScript bundle; memory usage increases with code count
- Fix approach: Move to database table; implement caching; use trie or similar for fast lookup

## Dependency Concerns

**Three.js Version - Potential Breaking Changes:**
- Issue: Three.js is frequently updated; dental arch 3D rendering is complex and fragile
- Files: `apps/web/src/components/odontogram/three/dental-arch-3d.tsx` (see locked values in CLAUDE.md)
- Impact: Updates may break 3D rendering
- Fix approach: Pin Three.js version; add regression tests for 3D rendering

**Prisma Version Compatibility:**
- Issue: Using Prisma 5.22.0 with potential edge cases around relations
- Files: Package dependency
- Impact: Potential data inconsistency issues
- Fix approach: Regular security updates; test migrations before deploying

## Data Integrity Gaps

**Missing Cascade Delete Constraints:**
- Issue: Some models have cascade deletes (EmailMessage, DsdDesignVersion) but others don't
- Files: `packages/database/prisma/schema.prisma:1170,1221,1321` (cascade examples), but not all
- Impact: Orphaned records; data inconsistency
- Fix approach: Audit all foreign key relationships; add cascade or restrict constraints consistently

**No Transaction Wrapping for Multi-Step Operations:**
- Issue: Invoice creation + payment processing not wrapped in transaction
- Files: `apps/web/src/app/api/invoices/route.ts`, payment routes
- Impact: Partial failures leave database in inconsistent state
- Fix approach: Use Prisma transactions for multi-step operations

**Email Thread Patient Linkage Optional:**
- Issue: `EmailThread.patientId` is nullable; emails may not link to patient records
- Files: `packages/database/prisma/schema.prisma:1123-1135`
- Impact: Patient emails not associated with correct patient; lost context
- Fix approach: Implement email-to-patient matching logic; add validation on insert

---

*Concerns audit: 2026-02-16*
