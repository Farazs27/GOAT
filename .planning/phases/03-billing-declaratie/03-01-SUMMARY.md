---
phase: 03-billing-declaratie
plan: 01
subsystem: api
tags: [prisma, transactions, invoice, billing, status-machine]

requires:
  - phase: 02-treatment-planning
    provides: "ALLOWED_TRANSITIONS pattern, auto-invoice on COMPLETED"
provides:
  - "Shared generateInvoiceNumber utility for atomic invoice numbering"
  - "Invoice status transition validation (ALLOWED_TRANSITIONS)"
  - "Payment completion check against patientAmount"
  - "nzaCodeId support on invoice line creation"
affects: [03-billing-declaratie]

tech-stack:
  added: []
  patterns: ["Shared utility extraction for cross-route logic", "prisma.$transaction for atomic operations"]

key-files:
  created:
    - apps/web/src/lib/invoice-number.ts
  modified:
    - apps/web/src/app/api/invoices/route.ts
    - apps/web/src/app/api/invoices/[id]/route.ts
    - apps/web/src/app/api/invoices/payments/route.ts
    - apps/web/src/app/api/treatment-plans/[id]/route.ts

key-decisions:
  - "Used lightweight PrismaClient type alias instead of importing full Prisma types for invoice-number utility"
  - "Payment completion falls back to invoice.total when patientAmount is 0 or null"

patterns-established:
  - "Invoice status state machine: ALLOWED_TRANSITIONS map with validated transitions"
  - "Shared utility pattern: extract duplicated logic to lib/ and import in multiple routes"

requirements-completed: [BILL-01, BILL-04]

duration: 3min
completed: 2026-02-16
---

# Phase 3 Plan 01: Billing Backend Fixes Summary

**Atomic invoice number generation, status transition validation, and correct payment completion check against patientAmount**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-16T15:25:18Z
- **Completed:** 2026-02-16T15:28:14Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extracted shared generateInvoiceNumber utility eliminating duplicate logic across 2 routes
- Wrapped invoice creation in prisma.$transaction for race-condition-free number generation
- Added ALLOWED_TRANSITIONS state machine for invoice status changes (returns 400 on invalid)
- Fixed payment completion to compare against patientAmount instead of total

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract shared invoice number utility and fix invoice creation** - `2577549` (feat)
2. **Task 2: Add invoice status transition validation and fix payment completion** - `587ee94` (feat)

## Files Created/Modified
- `apps/web/src/lib/invoice-number.ts` - Shared atomic invoice number generation utility
- `apps/web/src/app/api/invoices/route.ts` - POST now uses $transaction and accepts nzaCodeId on lines
- `apps/web/src/app/api/invoices/[id]/route.ts` - PATCH validates status transitions via ALLOWED_TRANSITIONS
- `apps/web/src/app/api/invoices/payments/route.ts` - Completion check uses patientAmount (falls back to total)
- `apps/web/src/app/api/treatment-plans/[id]/route.ts` - Uses shared generateInvoiceNumber utility

## Decisions Made
- Used lightweight type alias for PrismaClient in shared utility to avoid tight coupling to Prisma internals
- Payment completion falls back to invoice.total when patientAmount is 0 or null (handles edge case of no insurance split)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend billing APIs are now correct and ready for frontend enhancements in Plan 02
- Invoice status state machine enables proper UI status flow

---
*Phase: 03-billing-declaratie*
*Completed: 2026-02-16*
