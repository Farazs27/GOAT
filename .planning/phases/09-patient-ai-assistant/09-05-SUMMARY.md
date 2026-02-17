---
phase: 09-patient-ai-assistant
plan: 05
subsystem: api
tags: [cron, gemini, twilio, whatsapp, nudges, notifications]

requires:
  - phase: 05-ai-clinical-intelligence
    provides: Shared Gemini client (callGemini)
  - phase: 06-agenda-scheduling
    provides: Twilio WhatsApp/SMS integration
provides:
  - Daily cron endpoint for overdue patient detection and nudge sending
  - Patient-facing nudge API for in-app banners
  - Click tracking endpoint for booking link engagement
  - Staff nudge log API with outcome tracking
affects: [09-06, patient-portal-dashboard]

tech-stack:
  added: []
  patterns: [cron-secret-auth, gemini-pii-safe-prompt, nudge-frequency-cap]

key-files:
  created:
    - apps/web/src/app/api/patient-portal/nudges/cron/route.ts
    - apps/web/src/app/api/patient-portal/nudges/route.ts
    - apps/web/src/app/api/patient-portal/nudges/track/route.ts
    - apps/web/src/app/api/dashboard/nudge-logs/route.ts
  modified:
    - vercel.json

key-decisions:
  - "CRON_SECRET Bearer auth for cron endpoint (not patient/staff JWT)"
  - "PII-safe Gemini prompts: patient name never sent to AI, prepended after generation"
  - "Dual nudge records per patient: whatsapp + in_app channels tracked separately"
  - "hasBookedSince computed from appointments created after nudge sentAt"

patterns-established:
  - "Cron auth: Bearer CRON_SECRET header validation"
  - "Nudge frequency cap: max nudges + 90-day cooldown between sends"

requirements-completed: [AI-08]

duration: 3min
completed: 2026-02-18
---

# Phase 09 Plan 05: Follow-up Nudge System Summary

**Automated overdue patient detection via daily cron with Gemini-personalized WhatsApp messages, in-app notifications, click tracking, and staff nudge log**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T23:36:12Z
- **Completed:** 2026-02-17T23:39:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Daily cron detects overdue patients (configurable threshold per practice) and sends personalized nudges
- Gemini generates Dutch WhatsApp messages without PII exposure; Twilio sends if configured
- Patient portal API serves active in-app nudges for banner display
- Click tracking records booking link engagement; staff log shows full nudge history with outcomes

## Task Commits

Each task was committed atomically:

1. **Task 1: Build cron endpoint for overdue patient detection and nudge sending** - `91e9c97` (feat)
2. **Task 2: Build patient nudge API, click tracking, and staff nudge log** - `6de5754` (feat)

## Files Created/Modified
- `apps/web/src/app/api/patient-portal/nudges/cron/route.ts` - Daily cron: detects overdue patients, generates messages, sends nudges
- `apps/web/src/app/api/patient-portal/nudges/route.ts` - Patient GET: active in-app nudges
- `apps/web/src/app/api/patient-portal/nudges/track/route.ts` - POST: click tracking for nudge booking links
- `apps/web/src/app/api/dashboard/nudge-logs/route.ts` - Staff GET: nudge log with filters, pagination, outcome tracking
- `vercel.json` - Added cron schedule (daily 9 AM UTC)

## Decisions Made
- CRON_SECRET Bearer auth for cron endpoint instead of JWT (standard Vercel cron pattern)
- Patient name never sent to Gemini; prepended to generated message after AI call
- Two PatientNudge records created per patient per run (whatsapp + in_app channels)
- hasBookedSince outcome computed by checking appointments created after nudge sentAt

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- `CRON_SECRET` environment variable must be set in Vercel for cron authentication
- Practice settings must have `settings.aiAssistant.nudgesEnabled: true` to activate nudges
- Twilio credentials required in Credential table for WhatsApp delivery

## Next Phase Readiness
- Nudge system operational; ready for integration with portal dashboard banner
- Staff nudge log API available for dashboard UI consumption

---
*Phase: 09-patient-ai-assistant*
*Completed: 2026-02-18*
