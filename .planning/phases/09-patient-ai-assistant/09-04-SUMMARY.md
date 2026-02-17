---
phase: 09-patient-ai-assistant
plan: 04
subsystem: ai, ui
tags: [booking, state-machine, rich-cards, glass-ui, conversational-ai, patient-portal]

requires:
  - phase: 09-patient-ai-assistant
    provides: AI chat API endpoints, AiChatSession/AiChatMessage models
provides:
  - BookingOrchestrator state machine for conversational appointment booking
  - RichCards component (5 types) for inline chat data display
  - BookingConfirmationCard with confirm/cancel and .ics download
affects: [09-05, 09-06]

tech-stack:
  added: []
  patterns: [booking-state-machine, rich-card-rendering, natural-language-date-parsing]

key-files:
  created:
    - apps/web/src/lib/ai/booking-orchestrator.ts
    - apps/web/src/components/patient/ai-rich-cards.tsx
    - apps/web/src/components/patient/ai-booking-flow.tsx
  modified: []

key-decisions:
  - "Booking state machine with 8 steps persisted in AiChatSession.metadata.bookingState"
  - "Natural language Dutch date parsing for volgende week, ochtend, middag, na X:00"
  - "Consent form check before booking confirmation (blocks if PENDING consent exists)"
  - "Slot picker returns up to 5 slots across date range with time filtering"

patterns-established:
  - "Booking orchestrator: processStep returns {response, newState, richCards} for chat integration"
  - "Rich cards: JSON richCards field on AiChatMessage drives card type rendering"

requirements-completed: [AI-07]

duration: 3min
completed: 2026-02-18
---

# Phase 9 Plan 4: Booking Flow & Rich Cards Summary

**Conversational booking state machine with Dutch NLP date parsing and 5 rich card types (appointment, treatment plan, invoice, xray, slot picker) for inline AI chat display**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T23:46:03Z
- **Completed:** 2026-02-17T23:49:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Multi-turn booking orchestrator handling intent detection through slot selection to confirmation with consent validation
- Rich card components for 5 data types with glass UI theme and X-ray enlarge modal
- Booking confirmation card with confirm/cancel buttons and .ics calendar download

## Task Commits

1. **Task 1: Build booking orchestrator state machine** - `3db58ee` (feat)
2. **Task 2: Build rich card components and booking confirmation card** - `80fc017` (feat)

## Files Created/Modified
- `apps/web/src/lib/ai/booking-orchestrator.ts` - 8-step state machine with NLP date parsing, consent/pending validation
- `apps/web/src/components/patient/ai-rich-cards.tsx` - RichCards component rendering appointment, treatment plan, invoice, xray, slot picker cards
- `apps/web/src/components/patient/ai-booking-flow.tsx` - BookingConfirmationCard with confirm/cancel and success state with .ics link

## Decisions Made
- Booking state persisted in AiChatSession.metadata.bookingState (no new DB model needed)
- Natural language date parsing handles Dutch day names, time-of-day filters, and relative dates
- Consent form check blocks booking if patient has PENDING consent forms
- Premature booking warning (same type within 3 months) shown but not blocked

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed nullable firstName/lastName in practitioner matching**
- **Found during:** Task 1
- **Issue:** Prisma User.firstName/lastName are nullable, causing TS error on .toLowerCase()
- **Fix:** Added null coalescing (p.firstName ?? '')
- **Files modified:** apps/web/src/lib/ai/booking-orchestrator.ts
- **Committed in:** 3db58ee

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor null-safety fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - uses existing appointment availability and booking APIs from Phase 8.

## Next Phase Readiness
- Booking orchestrator ready for integration into AI chat streaming endpoint
- Rich cards ready for rendering in chat UI (09-05/09-06)

---
*Phase: 09-patient-ai-assistant*
*Completed: 2026-02-18*
