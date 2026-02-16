---
phase: 02-treatment-planning
plan: 02
subsystem: ui
tags: [react, treatment-plans, patient-portal, status-management]

requires:
  - phase: 01-clinical-foundation
    provides: Treatment record model and API endpoints
provides:
  - Single-plan creation from overlay with multiple treatments
  - Dentist status action buttons (full lifecycle)
  - Patient accept/reject UI for PROPOSED plans
  - Patient portal PATCH API for plan actions
affects: [03-billing, 04-ai-automation]

tech-stack:
  added: []
  patterns: [contextual-action-buttons, patient-portal-patch-pattern]

key-files:
  created: []
  modified:
    - apps/web/src/components/treatments/treatment-plan-overlay.tsx
    - apps/web/src/components/treatments/treatment-plan-builder.tsx
    - apps/web/src/app/(patient)/portal/behandelplan/page.tsx
    - apps/web/src/app/api/patient-portal/treatment-plans/[id]/route.ts

key-decisions:
  - "Overlay creates 1 plan then loops N treatment POSTs (partial save on individual failure)"
  - "Patient reject maps to CANCELLED status (not a separate REJECTED status)"
  - "Builder uses per-status action arrays instead of single next-status pattern"

patterns-established:
  - "Status action buttons: map of status -> action[] with style variants (primary/secondary/danger)"
  - "Patient portal PATCH: action-based body ({ action: 'accept' | 'reject' }) not direct status setting"

requirements-completed: [CLIN-03, CLIN-04]

duration: 4min
completed: 2026-02-16
---

# Phase 02 Plan 02: Treatment Plan UI Summary

**Single-plan overlay creation with N treatments, dentist lifecycle buttons, and patient accept/reject on PROPOSED plans**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T17:18:49Z
- **Completed:** 2026-02-16T17:22:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Overlay now creates exactly 1 TreatmentPlan with N treatments instead of N separate plans
- Dentist sees contextual status buttons per plan state (DRAFT->PROPOSED, PROPOSED->ACCEPTED/DRAFT, etc.)
- Patient portal shows Accept/Reject buttons on PROPOSED plans with glass UI styling
- Added PATCH endpoint for patient portal treatment plan actions

## Task Commits

1. **Task 1: Fix overlay to create one plan with multiple treatments** - `2b6fef1` (feat)
2. **Task 2: Add status action buttons to builder and patient portal** - `cff6976` (feat)

## Files Created/Modified
- `apps/web/src/components/treatments/treatment-plan-overlay.tsx` - Fixed handleSave to create 1 plan with N treatments
- `apps/web/src/components/treatments/treatment-plan-builder.tsx` - Added contextual status action buttons per plan
- `apps/web/src/app/(patient)/portal/behandelplan/page.tsx` - Added accept/reject buttons for PROPOSED plans
- `apps/web/src/app/api/patient-portal/treatment-plans/[id]/route.ts` - Added PATCH handler for accept/reject

## Decisions Made
- Overlay creates 1 plan then loops N treatment POSTs; if individual treatment fails, continues with rest
- Patient reject maps to CANCELLED (reusing existing enum value, no schema change needed)
- Builder uses action arrays per status instead of single next-status, enabling cancel from any non-terminal state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Build cache corruption on first build attempt (pages-manifest.json missing); resolved by clearing .next directory

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Treatment plan lifecycle is complete end-to-end (create, propose, accept/reject, progress, complete)
- Ready for billing integration (Phase 3) and AI automation (Phase 4)

---
*Phase: 02-treatment-planning*
*Completed: 2026-02-16*
