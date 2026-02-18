---
phase: 10-hygienist-portal-periodontogram
plan: 01
subsystem: database, ui
tags: [prisma, schema, sidebar, role-filtering, periodontal]

requires:
  - phase: 01-clinical-foundation
    provides: Prisma schema with ClinicalNote, PeriodontalChart models
provides:
  - StaffChat, StaffChatMember, StaffChatMessage models for internal messaging
  - NoteFlag model for clinical note flagging
  - HYGIENE NoteType enum value
  - sessionNote field on PeriodontalChart
  - Role-based sidebar nav filtering (HYGIENIST hides Smile Design, Settings)
  - calculateCAL helper function
  - Extended PerioToothData with suppuration, mucogingivalJunction, keratinizedTissueWidth, implant, missing
affects: [10-02, 10-03, 10-04, 10-05, 10-06]

tech-stack:
  added: []
  patterns: [role-based-nav-filtering, client-component-nav-extraction]

key-files:
  created:
    - apps/web/src/components/dashboard/role-nav.tsx
  modified:
    - packages/database/prisma/schema.prisma
    - packages/database/prisma/seed.ts
    - packages/database/prisma/seed.sql
    - packages/shared-types/src/odontogram.ts
    - apps/web/src/app/(dashboard)/layout.tsx

key-decisions:
  - "Nav items moved into client component to avoid React serialization error with Lucide icons"
  - "PerioToothData extended fields kept at top-level object structure (existing format) rather than per-side"
  - "Seed cleanup order fixed for FK constraints across all models including conversations, AI chat, DSD"

patterns-established:
  - "RoleNav pattern: client component reads user role from localStorage, filters nav items"

requirements-completed: [HYG-01, HYG-04]

duration: 7min
completed: 2026-02-18
---

# Phase 10 Plan 01: Schema Extensions & Role-Based Sidebar Summary

**StaffChat/NoteFlag/HYGIENE schema models, extended PerioToothData with CAL helper, and HYGIENIST role-based sidebar nav filtering**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-18T12:49:51Z
- **Completed:** 2026-02-18T12:57:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added StaffChat, StaffChatMember, StaffChatMessage, NoteFlag models and HYGIENE noteType to Prisma schema
- Extended PerioToothData with suppuration, mucogingivalJunction, keratinizedTissueWidth, implant, missing fields plus calculateCAL helper
- Created RoleNav client component that hides Smile Design and Settings for HYGIENIST users while retaining AI Logs access

## Task Commits

1. **Task 1: Schema extensions + seed hygienist** - `14578ce` (feat)
2. **Task 2: Extend PerioToothData + role-based sidebar nav** - `4956c73` (feat)

## Files Created/Modified
- `packages/database/prisma/schema.prisma` - Added StaffChat models, NoteFlag, HYGIENE enum, sessionNote field
- `packages/database/prisma/seed.ts` - Fixed FK-safe cleanup order for new and existing models
- `packages/database/prisma/seed.sql` - Added cleanup for new tables
- `packages/shared-types/src/odontogram.ts` - Added calculateCAL helper
- `apps/web/src/components/dashboard/role-nav.tsx` - New client component for role-based nav filtering
- `apps/web/src/app/(dashboard)/layout.tsx` - Replaced inline nav with RoleNav component

## Decisions Made
- Nav items moved into client component (RoleNav) to avoid React serialization errors when passing Lucide icon components from server to client
- PerioToothData extended fields kept in existing top-level object structure rather than refactoring to per-side
- Seed cleanup order comprehensively fixed for all FK constraints

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed seed cleanup FK ordering**
- **Found during:** Task 1 (Schema extensions + seed)
- **Issue:** Seed cleanup failed with P2003 FK constraint errors for PatientImage (DSD), Patient (conversations, AI chat sessions)
- **Fix:** Added deleteMany calls for dsdDesignVersion, dsdDesign, messageAttachment, conversationMessage, conversation, aiChatMessage, aiChatSession, patientNudge, dentistTask, whatsAppMessage, whatsAppConversation, emailMessage, emailThread, consentTemplate before their parent tables
- **Files modified:** packages/database/prisma/seed.ts
- **Committed in:** 14578ce

**2. [Rule 3 - Blocking] Moved nav items to client component to fix build**
- **Found during:** Task 2 (Role-based sidebar nav)
- **Issue:** Passing navItems array with Lucide icon components from server layout to client RoleNav caused "Functions cannot be passed directly to Client Components" build error
- **Fix:** Defined navItems inside the RoleNav client component instead of passing as props
- **Files modified:** apps/web/src/components/dashboard/role-nav.tsx, apps/web/src/app/(dashboard)/layout.tsx
- **Committed in:** 4956c73

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema foundation ready for hygienist portal features (perio charting, clinical notes, staff chat)
- Role-based nav filtering active for HYGIENIST role
- Hygienist test account available: lisa@tandarts-amsterdam.nl / Welcome123

---
*Phase: 10-hygienist-portal-periodontogram*
*Completed: 2026-02-18*
