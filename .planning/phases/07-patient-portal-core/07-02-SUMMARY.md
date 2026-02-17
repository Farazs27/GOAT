---
phase: 07-patient-portal-core
plan: 02
subsystem: ui, api
tags: [appointments, reschedule, ics, calendar, patient-portal, glass-ui]

requires:
  - phase: 07-patient-portal-core
    provides: "Patient portal layout and appointments listing API"
provides:
  - "Appointment self-service: cancel with reason, reschedule with slot picker, ICS download"
  - "Upcoming/Past tab view with expandable past cards showing treatments"
affects: [08-patient-portal-advanced]

tech-stack:
  added: [ics]
  patterns: [modal-based-actions, slot-availability-algorithm, ics-calendar-generation]

key-files:
  created:
    - apps/web/src/app/api/patient-portal/appointments/[id]/reschedule/route.ts
    - apps/web/src/app/api/patient-portal/appointments/[id]/ics/route.ts
  modified:
    - apps/web/src/app/(patient)/portal/appointments/page.tsx
    - apps/web/src/app/api/patient-portal/appointments/route.ts

key-decisions:
  - "Reschedule scans next 14 days for same-practitioner availability using PractitionerSchedule"
  - "24h modification rule enforced on both client (greyed buttons) and server (403)"
  - "Past appointments include treatments via Prisma include for expandable cards"

patterns-established:
  - "Slot availability: query schedule + existing appointments, find gaps, return N slots"
  - "Modal action pattern: open modal -> fetch data -> select -> confirm -> toast"

requirements-completed: [PORT-01]

duration: 4min
completed: 2026-02-17
---

# Phase 07 Plan 02: Appointment Self-Service Summary

**Appointment cancel/reschedule/ICS calendar with tabbed view, 24h policy enforcement, and expandable past treatment cards**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T18:47:13Z
- **Completed:** 2026-02-17T18:51:13Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Reschedule API finds 5 available slots from same practitioner over next 14 days with conflict checking
- ICS calendar download using ics package with Dutch appointment details
- Full appointment page rewrite with Upcoming/Past tabs, cancel dialog with reason dropdown, reschedule modal with slot picker
- Reminder/confirmation status badges, expandable past cards with treatment history

## Task Commits

1. **Task 1: Build reschedule and .ics API routes** - `1702d49` (feat)
2. **Task 2: Rewrite appointments page with tabs, reschedule, .ics, expandable past cards** - `ccbf44e` (feat)

## Files Created/Modified
- `apps/web/src/app/api/patient-portal/appointments/[id]/reschedule/route.ts` - GET available slots + POST reschedule with 24h rule
- `apps/web/src/app/api/patient-portal/appointments/[id]/ics/route.ts` - ICS calendar file generation and download
- `apps/web/src/app/(patient)/portal/appointments/page.tsx` - Full rewrite with tabs, modals, actions
- `apps/web/src/app/api/patient-portal/appointments/route.ts` - Added treatments include for past appointments

## Decisions Made
- Reschedule algorithm scans 14 days ahead using PractitionerSchedule model, returns first 5 open slots
- Cancel reason uses predefined Dutch options: "Kan niet komen", "Voel me niet lekker", "Wil andere datum", "Andere reden"
- Existing cancel route already met all requirements (24h rule, reason field) -- no modification needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Treatment model field names in past card expansion**
- **Found during:** Task 2 (appointments page rewrite)
- **Issue:** Plan referenced `treatmentType` and `toothNumber` fields that don't exist on Treatment model
- **Fix:** Used actual fields: `description`, `toothId`, `status`
- **Files modified:** appointments/route.ts, appointments/page.tsx
- **Verification:** Build passes
- **Committed in:** ccbf44e (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added treatments include to appointments API**
- **Found during:** Task 2 (expandable past cards need treatment data)
- **Issue:** Past appointments API didn't include treatment relations needed for card expansion
- **Fix:** Added `treatments: { select: { description, toothId, status } }` to past query include
- **Files modified:** apps/web/src/app/api/patient-portal/appointments/route.ts
- **Verification:** Build passes
- **Committed in:** ccbf44e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correct treatment display. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Appointment self-service complete, ready for patient portal advanced features
- Booking flow (Phase 8) can link from the empty state CTA

---
*Phase: 07-patient-portal-core*
*Completed: 2026-02-17*
