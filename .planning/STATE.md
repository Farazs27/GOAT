# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** AI-powered declaratie and clinical note generation from natural language
**Current focus:** Phase 6: Agenda & Scheduling

## Current Position

Phase: 6 of 9 (Agenda & Scheduling)
Plan: 4 of 4 in current phase
Status: Executing phase 06
Last activity: 2026-02-17 — Executed 06-01 Multi-Practitioner Agenda View

Progress: [██████░░░░] 65%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 3min
- Total execution time: 0.50 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-clinical-foundation | 1 | 2min | 2min |
| 02-treatment-planning | 2 | 7min | 3.5min |
| 03-billing-declaratie | 2 | 6min | 3min |
| 04-ai-declaratie-engine | 2 | 8min | 4min |
| 05-ai-clinical-intelligence | 3 | 8min | 2.7min |
| 06-agenda-scheduling | 2 | 6min | 3min |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 05 P02 | 2min | 1 tasks | 1 files |
| Phase 06 P03 | 3min | 1 tasks | 3 files |
| Phase 06 P01 | 7min | 2 tasks | 4 files |

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
- [Phase 04]: 12 hard-coded NZa opmerkingen rules for rejection risk flagging
- [Phase 04]: PII guard with regex-based BSN/email/phone detection before Gemini calls
- [Phase 04]: enrichSuggestionsWithWarnings pattern preserves existing response shape
- [Phase 04]: AI/manual toggle in invoice modal left panel; high confidence auto-selected, confirmed lines merge into invoice
- [Phase 05]: Extracted shared Gemini client (callGemini/parseGeminiJson) for reuse across AI endpoints
- [Phase 05]: suggest-treatment filters recent 6-month treatments to avoid re-suggesting
- [Phase 05]: NZa code validation filters out AI-hallucinated codes not in active DB
- [Phase 05]: AI suggestion accept flow lazy-creates treatment plan, reuses for subsequent accepts
- [Phase 05]: Shorthand mode as toggle rather than separate tab to keep single form component
- [Phase 05]: Amber color scheme for AI UI elements to distinguish from standard blue
- [Phase 06]: SMS from number stored in Credential config.smsNumber field
- [Phase 06]: SMS/WhatsApp failures logged but do not block email sending
- [Phase 06]: Added listPractitioners param to schedules API to avoid admin-only users endpoint
- [Phase 06]: MultiPractitionerGrid fetches practitioners via /api/schedules?listPractitioners=true
- [Phase 06]: AppointmentBlock compact prop for week/multi-practitioner views

### Pending Todos

None yet.

### Blockers/Concerns

- Research flagged: AI PII leakage risk -- must strip patient identifiers before Gemini API calls (affects Phase 4+)
- Research flagged: NZa combinatie rules not fully mapped in codebase (affects Phase 4)

## Session Continuity

Last session: 2026-02-17
Stopped at: Completed 06-01-PLAN.md (Multi-Practitioner Agenda View)
Resume file: None
