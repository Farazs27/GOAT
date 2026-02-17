# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** AI-powered declaratie and clinical note generation from natural language
**Current focus:** Phase 9: Patient AI Assistant

## Current Position

Phase: 9 of 9 (Patient AI Assistant)
Plan: 6 of 6 in current phase
Status: Executing phase 09
Last activity: 2026-02-18 — Completed 09-02 AI Chat API Endpoints

Progress: [█████████░] 97%

## Performance Metrics

**Velocity:**
- Total plans completed: 17
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
| Phase 06 P02 | 4min | 1 tasks | 4 files |
| Phase 07 P01 | 4min | 2 tasks | 4 files |
| Phase 07 P02 | 4min | 2 tasks | 4 files |
| Phase 07 P04 | 5min | 2 tasks | 5 files |
| Phase 07 P03 | 5min | 2 tasks | 5 files |
| Phase 07 P05 | 3min | 2 tasks | 5 files |
| Phase 08 P03 | 5min | 2 tasks | 3 files |
| Phase 08 P01 | 5min | 2 tasks | 4 files |
| Phase 08 P05 | 5min | 2 tasks | 5 files |

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
- [Phase 07]: Used ConversationMessage for unread count instead of legacy Message model
- [Phase 07]: Added DocumentApprovalStatus enum to Document model for patient uploads
- [Phase 07]: Replaced inline SVGs with lucide-react icons for portal sidebar
- [Phase 07]: Reschedule scans next 14 days for same-practitioner availability
- [Phase 07]: 24h modification rule enforced on both client and server
- [Phase 07]: Vercel Blob for patient document uploads with PENDING_REVIEW approval workflow
- [Phase 07]: Computed totalEstimate from treatment prices when not set on plan
- [Phase 07]: Staff conversations scoped to practitioner's own patients only
- [Phase 07]: Reassign transfers conversation to another practitioner in same practice
- [Phase 07]: Attachment flow sends message first then attaches file to message ID
- [Phase 08]: CLEANING maps to HYGIENE enum; booking window defaults 1/90/2
- [Phase 08]: Re-signing consent creates new versioned ConsentForm record
- [Phase 08]: APPROVED added to TreatmentPlanStatus for patient-signed approval
- [Phase 08]: Signature PNG uploaded to Vercel Blob with signatureData fallback
- [Phase 09]: CRON_SECRET Bearer auth for nudge cron endpoint (not patient/staff JWT)
- [Phase 09]: PII-safe Gemini prompts: patient name never sent to AI, prepended after generation
- [Phase 09]: Dual nudge records per patient (whatsapp + in_app channels tracked separately)
- [Phase 09]: hasBookedSince outcome computed from appointments created after nudge sentAt
- [Phase 09]: In-memory rate limiting (30/hr, 200/day) for AI chat; no Redis dependency
- [Phase 09]: Gemini SSE streaming with ReadableStream transform; messages persisted post-stream
- [Phase 09]: AI handoff creates IN_APP Notification for most recent practitioner

### Pending Todos

None yet.

### Blockers/Concerns

- Research flagged: AI PII leakage risk -- must strip patient identifiers before Gemini API calls (affects Phase 4+)
- Research flagged: NZa combinatie rules not fully mapped in codebase (affects Phase 4)

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 09-02-PLAN.md (AI Chat API Endpoints)
Resume file: None
