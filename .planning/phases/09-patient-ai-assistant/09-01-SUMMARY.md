---
phase: 09-patient-ai-assistant
plan: 01
subsystem: database, ai
tags: [prisma, gemini, ai-chat, patient-portal, dutch-nlp]

requires:
  - phase: 07-patient-portal-core
    provides: Patient model with clinical relations
provides:
  - AiChatSession, AiChatMessage, PatientNudge Prisma models
  - fetchPatientContext function for anonymized patient data
  - buildPatientSystemPrompt for Nexiom Assistant Dutch prompt
affects: [09-02, 09-03, 09-04, 09-05]

tech-stack:
  added: []
  patterns: [anonymized-context-fetcher, system-prompt-builder]

key-files:
  created:
    - apps/web/src/lib/ai/patient-data-fetcher.ts
    - apps/web/src/lib/ai/patient-system-prompt.ts
  modified:
    - packages/database/prisma/schema.prisma

key-decisions:
  - "PatientContext strips all PII fields, keeps only clinical/appointment/invoice data"
  - "System prompt in Dutch with scope constraints preventing medical advice"
  - "PracticeAiConfig type supports custom FAQ and nudge settings for per-practice customization"

patterns-established:
  - "Patient AI context: always use fetchPatientContext to get anonymized data before AI calls"
  - "System prompt builder: buildPatientSystemPrompt assembles all personality/scope/context rules"

requirements-completed: [AI-06]

duration: 4min
completed: 2026-02-18
---

# Phase 9 Plan 1: AI Data Layer & System Prompt Summary

**3 Prisma models (AiChatSession, AiChatMessage, PatientNudge) with anonymized patient data fetcher and Dutch Nexiom Assistant system prompt builder**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T23:35:54Z
- **Completed:** 2026-02-17T23:40:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added AiChatSession, AiChatMessage, PatientNudge models with proper indexes and relations
- Created patient data fetcher that strips all PII and returns only clinical context
- Built Dutch system prompt with scope rules, empathy, NZa code explanation, booking capability, and PII guard

## Task Commits

1. **Task 1: Add Prisma models** - `4585bdf` (feat)
2. **Task 2: Patient data fetcher and system prompt builder** - `d6f62d7` (feat)

## Files Created/Modified
- `packages/database/prisma/schema.prisma` - 3 new models with inverse relations on Practice/Patient
- `apps/web/src/lib/ai/patient-data-fetcher.ts` - Anonymized patient context fetcher
- `apps/web/src/lib/ai/patient-system-prompt.ts` - Dutch Nexiom Assistant system prompt builder

## Decisions Made
- PatientContext strips all PII (no name, BSN, DOB, email, phone, address) - keeps gender, insurance, medical alerts, clinical data
- System prompt enforces Dutch language, no medical advice scope, and PII guard instruction
- PracticeAiConfig type allows per-practice FAQ and nudge configuration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Models migrated to database, Prisma client regenerated
- Data fetcher and prompt builder ready for streaming API (09-02) and chat UI (09-03)

---
*Phase: 09-patient-ai-assistant*
*Completed: 2026-02-18*
