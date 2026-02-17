---
phase: 07-patient-portal-core
plan: 01
subsystem: database, ui, api
tags: [prisma, conversations, sidebar, dashboard, lucide-react, patient-portal]

requires:
  - phase: 06-agenda-scheduling
    provides: appointment model and scheduling foundation
provides:
  - Conversation, ConversationMessage, MessageAttachment schema models
  - 7-item portal sidebar with badge counts
  - 4-widget dashboard (appointment, messages, documents, invoices)
  - Enhanced dashboard API with unreadMessages, recentDocuments, unpaidInvoices
  - DocumentApprovalStatus enum for patient document uploads
affects: [07-02, 07-03, 07-04, 07-05]

tech-stack:
  added: []
  patterns: [lucide-react icons for portal sidebar, badge count fetch pattern]

key-files:
  created: []
  modified:
    - packages/database/prisma/schema.prisma
    - apps/web/src/app/(patient)/portal/layout.tsx
    - apps/web/src/app/(patient)/portal/page.tsx
    - apps/web/src/app/api/patient-portal/dashboard/route.ts

key-decisions:
  - "Used ConversationMessage relation for unread count instead of legacy Message model"
  - "Added DocumentApprovalStatus enum to Document model for patient uploads"
  - "Replaced inline SVGs with lucide-react icons for cleaner sidebar code"

patterns-established:
  - "Badge count pattern: layout fetches /api/patient-portal/dashboard for sidebar badges"
  - "Dashboard widget pattern: 2x2 grid of glass cards with icon + count + link"

requirements-completed: [PORT-04, PORT-05]

duration: 4min
completed: 2026-02-17
---

# Phase 07 Plan 01: Portal Shell & Schema Summary

**Threaded messaging schema with 7-item sidebar navigation, badge counts, and 4-widget dashboard using lucide-react icons**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T21:27:05Z
- **Completed:** 2026-02-17T21:31:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added Conversation, ConversationMessage, MessageAttachment models to Prisma schema
- Replaced 14-item sidebar with clean 7-item navigation using lucide-react icons and badge counts
- Rewrote dashboard from complex multi-section layout to focused 4-widget summary grid
- Enhanced dashboard API to return unreadMessages, recentDocuments, and unpaidInvoices data

## Task Commits

1. **Task 1: Add Conversation schema models** - `5d07d7f` (feat)
2. **Task 2: Restructure sidebar and dashboard** - `31d25b8` (feat)

## Files Created/Modified
- `packages/database/prisma/schema.prisma` - Added Conversation, ConversationMessage, MessageAttachment models + DocumentApprovalStatus enum
- `apps/web/src/app/(patient)/portal/layout.tsx` - Replaced 14 nav items with 7 using lucide-react, added badge fetch
- `apps/web/src/app/(patient)/portal/page.tsx` - Rewrote as 4 summary widget cards in 2x2 grid
- `apps/web/src/app/api/patient-portal/dashboard/route.ts` - Enhanced to return unreadMessages, recentDocuments, unpaidInvoices

## Decisions Made
- Used ConversationMessage for unread count (queries STAFF messages where isRead=false) instead of legacy Message model
- Added DocumentApprovalStatus enum and uploadedByPatientId field to Document model for patient upload workflow
- Replaced all inline SVGs with lucide-react icons for maintainability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Conversation schema ready for messaging implementation (07-02)
- Dashboard API ready for real data once messages exist
- Sidebar navigation complete for all portal pages

---
*Phase: 07-patient-portal-core*
*Completed: 2026-02-17*
