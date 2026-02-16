---
phase: 04-ai-declaratie-engine
verified: 2026-02-16T22:30:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification: false
human_verification:
  - test: "Type treatment description and verify AI suggestions appear"
    expected: "AI returns NZa codes with confidence badges, warnings, and companion codes"
    why_human: "End-to-end integration with Gemini API requires live testing"
  - test: "Verify opmerkingen warnings display correctly"
    expected: "Frequency/age/combination warnings show in Dutch for relevant codes"
    why_human: "Visual verification of warning display and Dutch message formatting"
  - test: "Confirm AI suggestions become invoice lines"
    expected: "Selected suggestions merge into invoice line items with correct data"
    why_human: "State mutation and data flow requires UI interaction testing"
---

# Phase 04: AI Declaratie Engine Verification Report

**Phase Goal:** Dentist types what they did in plain Dutch and gets correct, complete NZa declaratie lines

**Verified:** 2026-02-16T22:30:00Z

**Status:** human_needed

**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AI suggestions are checked against NZa opmerkingen rules and return warnings for rejection risks | ✓ VERIFIED | `opmerkingen-validator.ts` exports `validateOpmerkingen` with 12 hard-coded rules; `enrichSuggestionsWithWarnings` called in both AI routes (treatment-chat:333, analyze-notes:235) |
| 2 | CATEGORY_TRIGGERS is maintained in one place, not duplicated across routes | ✓ VERIFIED | Extracted to `lib/ai/category-triggers.ts`; both routes import from shared module; no local definitions in route files |
| 3 | PII patterns in prompt text are detected and blocked before reaching Gemini | ✓ VERIFIED | `pii-guard.ts` exports `assertNoPII`; called in both routes before Gemini fetch (treatment-chat:230, analyze-notes:163) |
| 4 | Dentist can type a natural language description and receive NZa code suggestions with confidence and warnings | ✓ VERIFIED | `AIDeclaratiePanel` textarea posts to `/api/ai/treatment-chat` (line 63); response includes suggestions with confidence, warnings, corrections, companion flags |
| 5 | Dentist reviews all AI suggestions (with reasoning, corrections, companion codes, opmerkingen warnings) before committing to invoice | ✓ VERIFIED | AI panel renders confidence badges (217-219), companion labels (220-224), correction tooltips (225-235), warning messages (250-266), reasoning collapsible (269-282) |
| 6 | Confirmed suggestions become actual invoice lines in the billing system | ✓ VERIFIED | `handleAIConfirm` callback (billing page:608-621) maps confirmed lines to invoice line items and merges into `lines` state |
| 7 | AI automatically includes related codes (rubberdam, anesthesie, rontgen, materiaal) based on NZa combinatie rules | ✓ VERIFIED | `treatment-validator.ts` contains `COMPANION_RULES` (line 113) and auto-injection logic with `isCompanion: true` (line 365); verified in plan task 2 |
| 8 | No patient PII is sent to the AI provider | ✓ VERIFIED | PII guard with BSN/email/phone/field markers blocks before Gemini calls; routes only receive clinical text (patientId used for context lookup, not sent to AI) |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/lib/ai/category-triggers.ts` | Shared CATEGORY_TRIGGERS and getRelevantCategories | ✓ VERIFIED | 82 lines; exports CATEGORY_TRIGGERS (15 categories, ~200 keywords), getRelevantCategories, buildCodebookPrompt; imported by both AI routes |
| `apps/web/src/lib/ai/opmerkingen-validator.ts` | NZa opmerkingen validation with rejection risk flagging | ✓ VERIFIED | 323 lines; exports OpmerkingenWarning type, validateOpmerkingen function, enrichSuggestionsWithWarnings; 12 hard-coded rules (X10, X21, C11, C13, V+R conflict, M01/M02/M03, E97, T21/T22, A15+A10, age checks) |
| `apps/web/src/lib/ai/pii-guard.ts` | PII detection guard for AI prompts | ✓ VERIFIED | 36 lines; exports assertNoPII function; detects BSN (9 digits), email, phone (06/+31), Dutch PII field markers (naam, geboortedatum, adres, postcode); throws on match |
| `apps/web/src/components/declaratie/ai-declaratie-panel.tsx` | AI declaratie input + review panel component | ✓ VERIFIED | 320 lines; exports AIDeclaratiePanel; textarea input, authFetch to treatment-chat API, suggestion cards with checkbox selection, confidence badges, warnings, corrections, companion labels, reasoning toggle, total calculation, confirm callback |
| `apps/web/src/app/(dashboard)/billing/page.tsx` | Billing page with AI declaratie integration | ✓ VERIFIED | Imports AIDeclaratiePanel (line 7); renders in NewInvoiceModal with manual/AI toggle (line 711); handleAIConfirm callback maps confirmed lines to invoice items (lines 608-621) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `apps/web/src/app/api/ai/treatment-chat/route.ts` | `lib/ai/opmerkingen-validator.ts` | import validateOpmerkingen | ✓ WIRED | Import on line 6; enrichSuggestionsWithWarnings called on line 333 with patientAge and recentCodes context |
| `apps/web/src/app/api/ai/analyze-notes/route.ts` | `lib/ai/category-triggers.ts` | import shared triggers | ✓ WIRED | Import on line 4; getRelevantCategories and buildCodebookPrompt used in route logic |
| `apps/web/src/app/api/ai/treatment-chat/route.ts` | `lib/ai/category-triggers.ts` | import shared triggers | ✓ WIRED | Import on line 4; getRelevantCategories and buildCodebookPrompt used in route logic |
| `apps/web/src/components/declaratie/ai-declaratie-panel.tsx` | `/api/ai/treatment-chat` | authFetch POST | ✓ WIRED | authFetch call on line 63 with message, patientId, context; response parsed for suggestions array (line 72); rendered in suggestion cards |
| `apps/web/src/components/declaratie/ai-declaratie-panel.tsx` | `apps/web/src/app/(dashboard)/billing/page.tsx` | onConfirm callback passing confirmed lines | ✓ WIRED | onConfirm prop passed to AIDeclaratiePanel (line 715); handleAIConfirm callback (line 608) maps ConfirmedLine[] to invoice line items and updates state |
| Both AI routes | `lib/ai/pii-guard.ts` | assertNoPII calls | ✓ WIRED | Import on line 5 (both routes); assertNoPII called before Gemini fetch (treatment-chat:230, analyze-notes:163) |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| AI-01: Dentist can type natural language description and AI generates correct NZa declaratie lines | ✓ SATISFIED | All supporting truths verified; AIDeclaratiePanel textarea -> treatment-chat API -> Gemini -> suggestions with DB enrichment -> UI display |
| AI-02: AI understands NZa combinatie rules (filling auto-includes rubberdam, anesthesia, X-ray, materials) | ✓ SATISFIED | COMPANION_RULES in treatment-validator.ts auto-injects related codes; isCompanion flag set and displayed in UI |
| AI-03: AI validates declaratie against NZa opmerkingen before submission | ✓ SATISFIED | opmerkingen-validator.ts with 12 rules validates suggestions; warnings displayed in UI before dentist confirms |
| BILL-02: Staff can review and approve AI-suggested declaratie lines before submission | ✓ SATISFIED | AIDeclaratiePanel shows all suggestions with confidence/warnings/corrections/reasoning; dentist checks/unchecks; only selected lines confirmed |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| N/A | - | - | - | No anti-patterns found |

**Note:** No TODOs, FIXMEs, or placeholder implementations detected in any created files. All return null statements are legitimate early returns in validation rule logic.

### Human Verification Required

#### 1. End-to-End AI Suggestion Flow

**Test:**
1. Log into billing page as dentist (faraz@tandarts-amsterdam.nl / Sharifi1997)
2. Open invoice creation modal
3. Click "AI Assistent" toggle
4. Type: "composiet vulling 36 MOD met verdoving"
5. Click "Analyseer"

**Expected:**
- Loading spinner appears during API call
- AI returns 3-5 suggestions including:
  - V72 or V73 (composiet vulling) for tooth 36 with surfaces MOD
  - A10 (infiltratieanesthesie) auto-added as companion code with "Automatisch toegevoegd" label
  - Confidence badges: "Hoog" (green) for main codes
  - No opmerkingen warnings (frequency rules not triggered for new patient)
- All suggestions display with NZa code, description, tariff, tooth number
- Reasoning toggle expands to show AI explanation

**Why human:** Requires live Gemini API call and visual verification of UI rendering; automated testing cannot verify API key validity or Gemini response quality

#### 2. Opmerkingen Warnings Display

**Test:**
1. Continue from test 1
2. In AI panel, type: "X10 bitewing links"
3. Click "Analyseer"
4. If patient has 2+ X10 codes in last 12 months AND age >= 18, verify warning appears

**Expected:**
- X10 suggestion shows orange warning badge
- Warning message in Dutch: "X10: maximaal 2x per jaar voor patiënten ≥18 jaar (NZa opmerking)"
- Warning does NOT prevent selection (dentist can override)

**Why human:** Opmerkingen validation requires patient history context (recentCodes) which is dynamic; visual verification of Dutch message formatting and warning badge color/placement needed

#### 3. AI Suggestions to Invoice Lines

**Test:**
1. Continue from test 1 or 2
2. Check 2-3 AI suggestions (e.g., V72 + A10)
3. Verify total updates at bottom
4. Click "Bevestigen"

**Expected:**
- Modal switches back to "Handmatig" mode
- Confirmed suggestions appear in right-side line items list
- Each line has: NZa code badge, description, tooth number, unit price, quantity=1
- Dentist can still manually add more codes or edit quantities
- Total at bottom reflects confirmed lines

**Why human:** State mutation and data flow across components requires UI interaction testing; need to verify line items persist after confirmation and can be edited

---

## Gaps Summary

No gaps found. All must-haves verified at artifact level (exists, substantive, wired). Human verification required to confirm end-to-end integration with Gemini API and visual UI correctness.

## Technical Details

### Artifacts Verified (Level 1-3)

**Level 1 (Exists):** All 5 artifacts exist at expected paths

**Level 2 (Substantive):**
- `category-triggers.ts`: 82 lines, 15 categories, ~200 keywords, 3 exports
- `opmerkingen-validator.ts`: 323 lines, 12 rules with Dutch messages, 3 exports
- `pii-guard.ts`: 36 lines, 7 PII patterns, throws on detection
- `ai-declaratie-panel.tsx`: 320 lines, full UI implementation with state management
- `billing/page.tsx`: Imports and renders AIDeclaratiePanel with toggle and callback

**Level 3 (Wired):**
- Both AI routes import shared utilities (no local duplicates)
- Both AI routes call assertNoPII before Gemini
- Both AI routes call enrichSuggestionsWithWarnings after validation
- AI panel calls authFetch with correct endpoint and payload
- Billing page passes onConfirm callback that merges into invoice state
- All key links verified via grep (imports + usage)

### Build Verification

```bash
pnpm --filter @dentflow/web build
```

**Result:** ✓ Build passed with no TypeScript errors

**Output:** All route files compile successfully; AI panel component exports correctly; no type errors in shared utilities

### Code Quality Checks

**TODOs/FIXMEs:** None found (only legitimate placeholder text in UI)

**Empty implementations:** None found (only early returns in validation logic)

**Duplication removal verified:**
- grep for "export const CATEGORY_TRIGGERS" in routes: 0 results
- grep for "const CATEGORY_TRIGGERS" in routes: 0 results
- Shared module is single source of truth

### Requirements Traceability

All 4 requirements (AI-01, AI-02, AI-03, BILL-02) mapped to Phase 4 in REQUIREMENTS.md are satisfied by verified truths and artifacts. No requirements unmapped or blocked.

---

_Verified: 2026-02-16T22:30:00Z_

_Verifier: Claude (gsd-verifier)_
