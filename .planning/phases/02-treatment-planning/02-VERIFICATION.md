---
phase: 02-treatment-planning
verified: 2026-02-16T21:30:00Z
status: passed
score: 7/7 must-haves verified
gaps: []
human_verification:
  - test: "Test invalid status transition returns 400 error"
    expected: "PATCH /api/treatment-plans/{id} with {status: 'DRAFT'} on a COMPLETED plan returns 400 with Dutch error message"
    why_human: "Requires API testing with actual requests"
  - test: "Test COMPLETED status creates invoice with correct line items"
    expected: "Completing a treatment plan creates exactly 1 DRAFT invoice with N invoice lines matching the N completed treatments, each line linked via treatmentId"
    why_human: "Requires database inspection to verify invoice.create was called and nested lines were created atomically"
  - test: "Test patient accept/reject UI in patient portal"
    expected: "Navigate to /portal/behandelplan, see PROPOSED plan with Akkoord and Afwijzen buttons, click Akkoord, plan status changes to ACCEPTED in database"
    why_human: "Requires running dev server, logging in as patient, and clicking buttons in browser"
  - test: "Test overlay creates single plan with multiple treatments"
    expected: "Queue 3 treatments in overlay, click Save, verify database has exactly 1 TreatmentPlan with 3 Treatment records (not 3 separate plans)"
    why_human: "Requires database inspection after manual save operation"
  - test: "Test dentist status action buttons advance plan lifecycle"
    expected: "Click 'Voorstellen' on DRAFT plan -> status becomes PROPOSED. Click 'Start behandeling' on ACCEPTED plan -> status becomes IN_PROGRESS."
    why_human: "Requires UI interaction testing with actual button clicks"
---

# Phase 2: Treatment Planning Verification Report

**Phase Goal:** Dentist can create, approve, and execute treatment plans that connect clinical findings to billing

**Verified:** 2026-02-16T21:30:00Z

**Status:** PASSED ✓

**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Treatment plan status can only move through valid transitions (DRAFT→PROPOSED→ACCEPTED→IN_PROGRESS→COMPLETED, with CANCELLED from any non-terminal state) | ✓ VERIFIED | `ALLOWED_TRANSITIONS` map at line 5-12 in treatment-plans/[id]/route.ts. Validation at lines 46-53 throws 400 on invalid transition. |
| 2 | Invalid status transitions return 400 error with descriptive message | ✓ VERIFIED | Line 52: `throw new ApiError(\`Ongeldige statusovergang van ${currentStatus} naar ${newStatus}\`, 400);` |
| 3 | Patient can accept a PROPOSED treatment plan via the patient portal | ✓ VERIFIED | PATCH handler at line 76-132 in patient-portal/treatment-plans/[id]/route.ts validates status=PROPOSED (line 104), sets status=ACCEPTED on accept action (line 110). UI at behandelplan/page.tsx line 315-338 shows Akkoord button for PROPOSED plans. |
| 4 | Completing a treatment plan auto-creates a DRAFT invoice with lines linked to each completed treatment | ✓ VERIFIED | Lines 83-144 in treatment-plans/[id]/route.ts: COMPLETED transition fetches treatments (line 94), generates invoice number (lines 101-109), creates invoice with nested lines (lines 112-142). Each line has `treatmentId: t.id` (line 119). |
| 5 | Status changes and invoice creation happen atomically (all or nothing) | ✓ VERIFIED | All side effects wrapped in `prisma.$transaction` starting at line 55 in treatment-plans/[id]/route.ts. Invoice creation happens inside same transaction (line 131). |
| 6 | Saving multiple queued treatments in the overlay creates ONE treatment plan with all treatments under it | ✓ VERIFIED | Overlay handleSave (line 300-378 in treatment-plan-overlay.tsx) creates single plan (line 313-326), then loops to POST each treatment to that plan (lines 329-347). |
| 7 | Dentist can change plan status via action buttons in the treatment plan builder UI | ✓ VERIFIED | Builder getStatusActions (line 158-179 in treatment-plan-builder.tsx) returns contextual actions per status. updatePlanStatus (line 124-133) calls PATCH with status. Buttons rendered at line 371-379. |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/app/api/treatment-plans/[id]/route.ts` | Status transition validation and side effects in PATCH handler | ✓ VERIFIED | ALLOWED_TRANSITIONS map present (lines 5-12). PATCH handler validates transitions (lines 46-53), applies side effects in $transaction (lines 55-157). Invoice creation on COMPLETED (lines 131-142). |
| `apps/web/src/app/api/patient-portal/treatment-plans/[id]/route.ts` | Patient approval PATCH endpoint | ✓ VERIFIED | PATCH handler exported (lines 76-132). Validates action='accept'/'reject' (lines 92-94), checks status=PROPOSED (lines 104-106), updates to ACCEPTED or CANCELLED (lines 108-111). |
| `apps/web/src/components/treatments/treatment-plan-overlay.tsx` | Single-plan creation with multiple treatments | ✓ VERIFIED | handleSave creates 1 plan via POST /api/treatment-plans (line 313), then loops treatments to POST to /api/treatment-plans/{id}/treatments (line 334). |
| `apps/web/src/components/treatments/treatment-plan-builder.tsx` | Status action buttons for plan lifecycle | ✓ VERIFIED | getStatusActions map (lines 158-179) defines buttons per status. updatePlanStatus calls PATCH /api/treatment-plans/{id} with status (lines 124-133). Buttons rendered (lines 371-379). |
| `apps/web/src/app/(patient)/portal/behandelplan/page.tsx` | Patient accept/reject UI | ✓ VERIFIED | handlePlanAction (lines 140-161) calls PATCH /api/patient-portal/treatment-plans/{id} with action. Accept/Reject buttons rendered for PROPOSED plans (lines 315-338). |

**All artifacts substantive and wired.**

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| treatment-plans/[id]/route.ts | prisma.invoice.create | Auto-invoice on COMPLETED transition | ✓ WIRED | Line 131: `await tx.invoice.create({...})` inside $transaction. Lines 112-127 build invoice lines from treatments. |
| patient-portal/treatment-plans/[id]/route.ts | prisma.treatmentPlan.update | Patient accepts plan (PROPOSED→ACCEPTED) | ✓ WIRED | Line 113: `prisma.treatmentPlan.update` with status=ACCEPTED when action='accept' (line 110). |
| treatment-plan-overlay.tsx | /api/treatment-plans | POST one plan then POST treatments to it | ✓ WIRED | Line 313: POST to `/api/treatment-plans` creates plan. Line 334: POST to `/api/treatment-plans/${plan.id}/treatments` adds each treatment. |
| treatment-plan-builder.tsx | /api/treatment-plans/[id] | PATCH with status field | ✓ WIRED | Line 126: `fetch(\`/api/treatment-plans/${planId}\`, { method: 'PATCH', body: JSON.stringify({ status }) })` |
| behandelplan/page.tsx | /api/patient-portal/treatment-plans/[id] | PATCH with accept/reject action | ✓ WIRED | Line 145: `fetch(\`/api/patient-portal/treatment-plans/${planId}\`, { method: 'PATCH', body: JSON.stringify({ action }) })` |

**All key links wired and functional.**

---

### Requirements Coverage

Phase 02 requirements from REQUIREMENTS.md:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **CLIN-03**: Treatment plan creation with multiple treatments per plan | ✓ SATISFIED | Overlay creates 1 plan with N treatments (overlay.tsx lines 313-347). Builder shows plans with treatment tables (builder.tsx lines 257-293). |
| **CLIN-04**: Treatment plan approval workflow (create, approve, execute, complete) | ✓ SATISFIED | Full lifecycle enforced: ALLOWED_TRANSITIONS map defines DRAFT→PROPOSED→ACCEPTED→IN_PROGRESS→COMPLETED flow. Status action buttons in builder UI (lines 158-179). Patient accept in portal (behandelplan/page.tsx lines 315-338). |
| **CLIN-05**: Treatment plans link to declaratie for billing | ✓ SATISFIED | COMPLETED transition auto-creates DRAFT invoice with lines (treatment-plans/[id]/route.ts lines 131-142). Each InvoiceLine has `treatmentId` linking back (line 119). |

**All 3 requirements satisfied.**

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

**No TODO/FIXME/HACK/placeholder code detected.** All "placeholder" strings are legitimate input field placeholders (e.g., `placeholder="Diagnose en bevindingen..."`), not stub implementations.

**No empty implementations detected.** All API route handlers have substantive logic with database queries and business logic.

**Build verification:** `pnpm --filter @dentflow/web build` passes with no TypeScript errors.

---

### Human Verification Required

The following items cannot be verified programmatically and require manual testing:

#### 1. Status Transition Validation in Browser

**Test:** Create a DRAFT treatment plan, transition it to COMPLETED via builder buttons, then attempt to transition back to DRAFT via API PATCH.

**Expected:** API returns 400 with Dutch error message "Ongeldige statusovergang van COMPLETED naar DRAFT" because COMPLETED→DRAFT is not in ALLOWED_TRANSITIONS.

**Why human:** Requires API testing with actual HTTP requests or browser DevTools network inspection to verify 400 response body.

---

#### 2. Auto-Invoice Creation on Completion

**Test:** Create a treatment plan with 3 treatments (each with tooth, NZA code, unit price). Advance plan to IN_PROGRESS, then click "Afronden" to complete it.

**Expected:**
1. Plan status becomes COMPLETED
2. Database shows exactly 1 new Invoice record with status=DRAFT
3. Invoice has invoiceNumber format `F2026-0001` (or next sequence)
4. Invoice has 3 InvoiceLine records, each with `treatmentId` matching one of the 3 treatments
5. Invoice `subtotal` = sum of line totals

**Why human:** Requires database inspection (Prisma Studio or SQL query) to verify invoice.create was called and nested lines were created. Also needs verification that the operation was atomic (no partial invoice if one line fails).

---

#### 3. Patient Accept/Reject Workflow

**Test:**
1. Log in as dentist, create treatment plan, advance to PROPOSED status
2. Log out, log in as patient (use patient email + last 4 BSN digits)
3. Navigate to /portal/behandelplan
4. Verify plan shows with "Akkoord" and "Afwijzen" buttons (green and muted styling)
5. Click "Akkoord"
6. Verify success feedback and plan status changes to ACCEPTED in UI
7. Verify database TreatmentPlan.status = 'ACCEPTED' and acceptedAt is set

**Expected:** Patient sees PROPOSED plan with glass-styled buttons. Clicking Akkoord sends PATCH with `{action: 'accept'}` to `/api/patient-portal/treatment-plans/{id}`, updates plan to ACCEPTED, and refreshes UI.

**Why human:** Requires running dev server, authenticating as patient (not dentist), and clicking buttons in browser. Visual verification of glass UI styling and button behavior.

---

#### 4. Single-Plan Creation from Overlay

**Test:**
1. Open treatment plan overlay from patient detail page
2. Queue 3 different treatments (e.g., "Composiet vulling 36", "Kroon 46", "Controle")
3. Click "Opslaan"
4. Check database: count TreatmentPlan records with this patientId and recent createdAt

**Expected:** Exactly 1 new TreatmentPlan record with title like "Behandelplan: 3 behandelingen". That plan's ID appears in 3 Treatment records as `treatmentPlanId`. NOT 3 separate TreatmentPlan records.

**Why human:** Requires database inspection after manual save operation. Need to verify the fix from plan 02-02 (overlay was creating N plans, now creates 1 plan with N treatments).

---

#### 5. Dentist Status Action Buttons

**Test:**
1. Create a DRAFT treatment plan via overlay
2. Verify builder shows "Voorstellen" and "Annuleren" buttons (plan 02-02 fix)
3. Click "Voorstellen" → plan status becomes PROPOSED, buttons change to "Goedkeuren", "Terug naar concept", "Annuleren"
4. Click "Goedkeuren" → plan status becomes ACCEPTED, buttons change to "Start behandeling", "Annuleren"
5. Click "Start behandeling" → plan status becomes IN_PROGRESS, buttons change to "Afronden", "Annuleren"
6. Click "Afronden" → plan status becomes COMPLETED, no action buttons shown (terminal state)

**Expected:** Each status shows contextual action buttons as defined in getStatusActions map. Primary actions (blue), secondary (muted), danger (red). Buttons call updatePlanStatus which sends PATCH with status field.

**Why human:** Requires UI interaction testing with actual button clicks. Visual verification of button styling and state transitions in browser.

---

## Summary

**Phase 2 goal ACHIEVED.** All 7 observable truths verified, all 5 artifacts substantive and wired, all 5 key links functional, all 3 requirements satisfied.

**Backend:** Treatment plan lifecycle enforcement is complete with state machine validation, atomic side effects (treatment status cascading, invoice auto-creation), and patient approval endpoint.

**Frontend:** Overlay creates single plans with multiple treatments (CLIN-03 fix). Builder has full status action buttons (CLIN-04). Patient portal has accept/reject UI (CLIN-04).

**Billing integration:** COMPLETED transition auto-generates DRAFT invoices with treatment-linked lines (CLIN-05). Invoice creation happens atomically inside $transaction.

**No gaps found.** All automated checks passed. 5 items flagged for human verification (API response testing, database inspection, UI interaction).

**Build status:** ✓ PASSED — `pnpm --filter @dentflow/web build` completes with no errors.

**Ready to proceed to Phase 3 (Billing & Declaratie).**

---

*Verified: 2026-02-16T21:30:00Z*

*Verifier: Claude (gsd-verifier)*
