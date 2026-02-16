---
phase: 01-clinical-foundation
plan: 01
subsystem: api
tags: [prisma, transaction, treatment, odontogram, clinical]

requires:
  - phase: none
    provides: existing Prisma schema with Treatment + ToothSurface models
provides:
  - Treatment record creation on restoration save (POST odontogram)
  - Treatment record creation on tooth status change (PATCH teeth)
  - Treatment history endpoint querying real Treatment records
  - ToothSurface-to-Treatment linkage via treatmentId FK
affects: [billing, treatment-plans, clinical-notes]

tech-stack:
  added: []
  patterns: [prisma-transaction-for-multi-record-clinical-writes, fallback-query-for-legacy-data]

key-files:
  created: []
  modified:
    - apps/web/src/app/api/patients/[id]/odontogram/route.ts
    - apps/web/src/app/api/patients/[id]/teeth/[toothNumber]/route.ts
    - apps/web/src/app/api/patients/[id]/teeth/[toothNumber]/treatments/route.ts

key-decisions:
  - "Used prisma.$transaction for atomic Treatment + ToothSurface creation in odontogram POST"
  - "Added fallback surface-grouping in treatments GET for backward compatibility with pre-Treatment data"

patterns-established:
  - "Clinical write pattern: always create Treatment record alongside clinical data changes"
  - "Backward-compatible queries: check Treatment records first, fall back to legacy grouping"

requirements-completed: [CLIN-01, CLIN-02]

duration: 2min
completed: 2026-02-16
---

# Phase 1 Plan 1: Treatment Record Wiring Summary

**Wired Treatment record creation into odontogram save flow and replaced fake treatment history with real Treatment queries**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T06:41:25Z
- **Completed:** 2026-02-17T06:43:19Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- POST odontogram now atomically creates Treatment + linked ToothSurface records in a prisma.$transaction
- PATCH teeth creates a Treatment record documenting every status change (MISSING, IMPLANT, ENDO, etc.)
- GET treatments endpoint queries real Treatment records with performer names and linked surfaces
- Legacy surface-only data still renders via fallback grouping logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire Treatment record creation into odontogram POST and teeth PATCH routes** - `1ddc34f` (feat)
2. **Task 2: Replace treatment history with real Treatment queries** - `114678b` (feat)

## Files Created/Modified
- `apps/web/src/app/api/patients/[id]/odontogram/route.ts` - POST handler now uses $transaction to create Treatment + linked ToothSurface records
- `apps/web/src/app/api/patients/[id]/teeth/[toothNumber]/route.ts` - PATCH handler creates Treatment record for status changes
- `apps/web/src/app/api/patients/[id]/teeth/[toothNumber]/treatments/route.ts` - GET handler queries real Treatment records with fallback

## Decisions Made
- Used prisma.$transaction for atomicity in odontogram POST (Treatment + surfaces must succeed or fail together)
- Added fallback surface-grouping in treatments GET for backward compatibility with existing data that lacks Treatment records

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Treatment records now created on every clinical save action
- Ready for treatment plan linkage (treatmentPlanId FK already exists on Treatment model)
- Ready for billing linkage (nzaCodeId FK already exists on Treatment model)

---
*Phase: 01-clinical-foundation*
*Completed: 2026-02-16*
