---
phase: 02-treatment-planning
plan: 01
subsystem: api
tags: [prisma, treatment-plans, invoicing, patient-portal, status-workflow]

requires:
  - phase: 01-clinical-foundation
    provides: Treatment model wired to TreatmentPlan and odontogram
provides:
  - Treatment plan status transition validation with ALLOWED_TRANSITIONS map
  - Atomic side effects on status change (treatment cascading, invoice creation)
  - Patient portal PATCH endpoint for accept/reject
affects: [02-treatment-planning, 03-billing]

tech-stack:
  added: []
  patterns: [prisma.$transaction for multi-table atomic updates, ALLOWED_TRANSITIONS state machine map]

key-files:
  created: []
  modified:
    - apps/web/src/app/api/treatment-plans/[id]/route.ts
    - apps/web/src/app/api/patient-portal/treatment-plans/[id]/route.ts

key-decisions:
  - "Invoice auto-creation uses same F{year}-{seq} pattern as manual invoices/route.ts POST"
  - "CANCELLED transition cascades to all non-COMPLETED treatments (preserves completed work)"

patterns-established:
  - "Status machine: ALLOWED_TRANSITIONS record pattern for validated state changes"
  - "Side effects inside $transaction for atomicity across treatment plan + treatments + invoice"

requirements-completed: [CLIN-04, CLIN-05]

duration: 6min
completed: 2026-02-16
---

# Phase 02 Plan 01: Treatment Plan Status Workflow Summary

**Status transition validation with ALLOWED_TRANSITIONS map, atomic side effects (treatment cascading, DRAFT invoice on completion), and patient portal accept/reject endpoint**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-16T19:58:48Z
- **Completed:** 2026-02-16T20:04:22Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Treatment plan PATCH validates status transitions against state machine, returning Dutch error messages for invalid moves
- COMPLETED transition atomically creates DRAFT invoice with treatment-linked lines, auto-generating invoice number
- Patient portal PATCH endpoint allows patients to accept or reject PROPOSED treatment plans
- All status changes cascade to child treatments (IN_PROGRESS, COMPLETED, CANCELLED)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add status transition validation and side effects to treatment plan PATCH** - `3f7aa5e` (feat)
2. **Task 2: Add patient approval PATCH endpoint to patient portal** - `cff6976` (feat, pre-existing from 02-02 plan)

## Files Created/Modified
- `apps/web/src/app/api/treatment-plans/[id]/route.ts` - Enhanced PATCH with ALLOWED_TRANSITIONS, $transaction, side effects
- `apps/web/src/app/api/patient-portal/treatment-plans/[id]/route.ts` - Added PATCH for patient accept/reject

## Decisions Made
- Used same invoice number generation pattern (F{year}-{0001}) as existing invoices/route.ts POST for consistency
- CANCELLED cascades to all non-COMPLETED treatments, preserving already-completed work
- Patient portal PATCH validates both ownership (patientId) and status (PROPOSED) before allowing action

## Deviations from Plan

**Task 2 was already partially implemented** by a prior commit (cff6976 from plan 02-02). The PATCH endpoint for patient accept/reject already existed in the file. My edit overwrote it with an equivalent implementation matching the plan spec exactly. No functional change was needed.

No other deviations - plan executed as written.

## Issues Encountered
- Stale `.next` cache caused false build failures unrelated to changes; resolved by clearing cache directory

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Status workflow enforcement is active for all treatment plan status changes
- Auto-invoice creation ready for billing phase to build upon
- Patient portal approval flow ready for UI integration

---
*Phase: 02-treatment-planning*
*Completed: 2026-02-16*
