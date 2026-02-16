# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** AI-powered declaratie and clinical note generation from natural language
**Current focus:** Phase 3: Billing & Declaratie

## Current Position

Phase: 3 of 9 (Billing & Declaratie)
Plan: 2 of N in current phase
Status: Plan 03-02 complete
Last activity: 2026-02-16 — Executed 03-02 Billing Frontend Enhancements

Progress: [████░░░░░░] 33%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 3min
- Total execution time: 0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-clinical-foundation | 1 | 2min | 2min |
| 02-treatment-planning | 2 | 7min | 3.5min |
| 03-billing-declaratie | 2 | 6min | 3min |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 02-02: Overlay creates 1 plan then loops N treatment POSTs (partial save on failure)
- 02-02: Patient reject maps to CANCELLED status (no new enum)
- 02-02: Builder uses per-status action arrays with style variants
- 01-01: Used prisma.$transaction for atomic Treatment + ToothSurface creation in odontogram POST
- 01-01: Added fallback surface-grouping in treatments GET for backward compatibility with pre-Treatment data
- Roadmap: Clinical foundation first (odontogram/restorations), then treatment plans, then billing, then AI on top
- Roadmap: Phase 6 (Agenda) is independent and can be parallelized with clinical/AI track
- Research: Start Vecozo admin process now (deferred to v2 but long lead time)
- [Phase 02]: Used ALLOWED_TRANSITIONS state machine pattern for status validation
- [Phase 02]: Auto-invoice on COMPLETED uses same F{year}-{seq} pattern as manual invoice creation
- [Phase 03]: Extracted shared generateInvoiceNumber utility for atomic invoice numbering
- [Phase 03]: Invoice ALLOWED_TRANSITIONS state machine mirrors treatment plan pattern
- [Phase 03]: Payment completion checks patientAmount (not total) with fallback
- [Phase 03]: CodeBrowserPanel replaces inline NZa search in invoice modal for full category browsing
- [Phase 03]: PDF billingConfig fallback shows "IBAN niet geconfigureerd" when not set

### Pending Todos

None yet.

### Blockers/Concerns

- Research flagged: AI PII leakage risk -- must strip patient identifiers before Gemini API calls (affects Phase 4+)
- Research flagged: NZa combinatie rules not fully mapped in codebase (affects Phase 4)

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed 03-02-PLAN.md (Billing Frontend Enhancements)
Resume file: None
