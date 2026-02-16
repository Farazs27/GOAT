---
phase: 04-ai-declaratie-engine
plan: 01
subsystem: ai, api
tags: [gemini, nza, opmerkingen, pii, validation]

requires:
  - phase: 03-billing-declaratie
    provides: NZa code database and invoice pipeline
provides:
  - Shared CATEGORY_TRIGGERS module for AI code detection
  - NZa opmerkingen validator with 12 rejection risk rules
  - PII guard preventing patient data leakage to Gemini
affects: [04-02-PLAN, ai-review-ui, declaratie-frontend]

tech-stack:
  added: []
  patterns: [shared-ai-utilities, opmerkingen-rule-engine, pii-guard-pattern]

key-files:
  created:
    - apps/web/src/lib/ai/category-triggers.ts
    - apps/web/src/lib/ai/opmerkingen-validator.ts
    - apps/web/src/lib/ai/pii-guard.ts
  modified:
    - apps/web/src/app/api/ai/analyze-notes/route.ts
    - apps/web/src/app/api/ai/treatment-chat/route.ts

key-decisions:
  - "12 hard-coded NZa opmerkingen rules covering frequency, age, combination, and indication checks"
  - "PII guard checks BSN, email, phone, and Dutch PII field markers before Gemini calls"
  - "enrichSuggestionsWithWarnings pattern adds warnings array to each suggestion without breaking existing response shape"

patterns-established:
  - "Shared AI utility pattern: category-triggers.ts as single source of truth for both routes"
  - "Opmerkingen rule engine: array of rule objects with codes + check function returning typed warnings"
  - "PII guard as pre-send safety net on all AI API routes"

requirements-completed: [AI-02, AI-03]

duration: 4min
completed: 2026-02-16
---

# Phase 04 Plan 01: AI Shared Utilities Summary

**Shared category-triggers, PII guard, and 12-rule NZa opmerkingen validator integrated into both AI API routes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T17:35:28Z
- **Completed:** 2026-02-16T17:39:28Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extracted duplicated CATEGORY_TRIGGERS (~100 lines each) from both AI routes into shared module
- Created PII guard blocking BSN, email, phone, and Dutch PII field markers before Gemini API calls
- Built opmerkingen validator with 12 NZa rules: X10/X21 frequency, C11/C13 limits, V+R combination block, M01/M02/M03 preventie, E97 indication, T21/T22 frequency, A15+A10 exclusion
- Both AI routes now return suggestions with attached `warnings` array

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract shared category-triggers and add PII guard** - `d462b60` (feat)
2. **Task 2: Build opmerkingen validator and integrate into AI pipeline** - `c7fe024` (feat)

## Files Created/Modified
- `apps/web/src/lib/ai/category-triggers.ts` - Shared CATEGORY_TRIGGERS, getRelevantCategories, buildCodebookPrompt
- `apps/web/src/lib/ai/pii-guard.ts` - assertNoPII with BSN/email/phone/field marker detection
- `apps/web/src/lib/ai/opmerkingen-validator.ts` - 12-rule NZa validator with enrichSuggestionsWithWarnings
- `apps/web/src/app/api/ai/analyze-notes/route.ts` - Uses shared imports, PII guard, opmerkingen enrichment
- `apps/web/src/app/api/ai/treatment-chat/route.ts` - Uses shared imports, PII guard, opmerkingen enrichment

## Decisions Made
- 12 hard-coded NZa rules selected based on most common rejection reasons in Dutch dental billing
- PII guard uses regex patterns (not ML) for deterministic blocking
- enrichSuggestionsWithWarnings adds warnings without breaking existing response shape

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AI routes now return structured warnings alongside suggestions
- Ready for 04-02: Review UI can display warnings to dentist before submission
- Opmerkingen rules can be extended as more NZa rules are mapped

---
*Phase: 04-ai-declaratie-engine*
*Completed: 2026-02-16*
