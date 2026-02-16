---
phase: 03-billing-declaratie
verified: 2026-02-16T21:50:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 3: Billing & Declaratie Verification Report

**Phase Goal:** Staff can create complete declaraties with NZa codes and generate correct Dutch invoices

**Verified:** 2026-02-16T21:50:00Z

**Status:** PASSED

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Plan 03-01)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Invoice lines store nzaCodeId FK linking to NzaCode table | ✓ VERIFIED | `apps/web/src/app/api/invoices/route.ts:82` accepts and stores `nzaCodeId` in line creation |
| 2 | Invoice number generation is atomic (no race condition) | ✓ VERIFIED | Invoice POST wrapped in `prisma.$transaction` at line 61, calls `generateInvoiceNumber(tx, ...)` inside transaction |
| 3 | Invoice status changes are validated against allowed transitions | ✓ VERIFIED | `ALLOWED_TRANSITIONS` map at line 5-13 in `invoices/[id]/route.ts`, validation at lines 47-54 returns 400 on invalid |
| 4 | Payment completion checks against patientAmount, not total | ✓ VERIFIED | `payments/route.ts:33-35` uses `patientAmount` with fallback to `total` when null/zero |

**Score:** 4/4 truths verified

### Observable Truths (Plan 03-02)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | NewInvoiceModal uses CodeBrowserPanel for NZa code selection with category tree | ✓ VERIFIED | `billing/page.tsx:6` imports CodeBrowserPanel, line 661 renders it, line 595 defines handleCodeSelect |
| 6 | Selected NZa codes pass both code string and nzaCodeId to invoice lines | ✓ VERIFIED | `billing/page.tsx:598` sets `nzaCodeId: code.nzaCodeId`, line 622 passes to API with `nzaCodeId: l.nzaCodeId \|\| undefined` |
| 7 | PDF invoice shows real IBAN and BTW-nummer from practice billingConfig | ✓ VERIFIED | `invoice-pdf.ts:122-125` parses billingConfig, line 125 sets ibanDisplay from `bc.iban`, line 180 adds BTW if configured |
| 8 | Billing page detects and marks overdue invoices on load | ✓ VERIFIED | `billing/page.tsx:116-135` auto-detects overdue (SENT/PARTIALLY_PAID past dueDate), PATCHes status to OVERDUE, re-fetches |

**Score:** 4/4 truths verified

**Combined Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/lib/invoice-number.ts` | Shared invoice number generation utility | ✓ VERIFIED | 26 lines, exports `generateInvoiceNumber(prisma, practiceId)`, generates F{year}-{seq} atomically |
| `apps/web/src/app/api/invoices/route.ts` | Invoice creation with nzaCodeId and atomic number generation | ✓ VERIFIED | POST uses $transaction (line 61), imports generateInvoiceNumber (line 4), accepts nzaCodeId (line 82) |
| `apps/web/src/app/api/invoices/[id]/route.ts` | Status transition validation | ✓ VERIFIED | ALLOWED_TRANSITIONS map defined (lines 5-13), validation in PATCH (lines 47-54), sentAt set on SENT (line 58) |
| `apps/web/src/app/api/invoices/payments/route.ts` | Payment completion against patientAmount | ✓ VERIFIED | Uses patientAmount with fallback to total (lines 33-35), sets PAID when totalPaid >= amountOwed (line 41) |
| `apps/web/src/app/(dashboard)/billing/page.tsx` | Enhanced invoice modal with CodeBrowserPanel and overdue detection | ✓ VERIFIED | Imports CodeBrowserPanel (line 6), renders in modal (line 661), overdue detection on load (lines 116-135) |
| `apps/web/src/lib/pdf/invoice-pdf.ts` | PDF with practice billingConfig (IBAN, BTW) | ✓ VERIFIED | Parses billingConfig (lines 122-124), uses iban (line 125), adds BTW if configured (line 180) |

**Artifact Score:** 6/6 verified

### Key Link Verification

#### Link 1: Invoice API → Invoice Number Utility

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `apps/web/src/app/api/invoices/route.ts` | `apps/web/src/lib/invoice-number.ts` | import generateInvoiceNumber | ✓ WIRED | Import at line 4, called inside transaction at line 62 |

#### Link 2: Invoice API → Status Validation

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `apps/web/src/app/api/invoices/[id]/route.ts` | ALLOWED_TRANSITIONS map | status validation check | ✓ WIRED | Map defined at lines 5-13, accessed at line 50: `ALLOWED_TRANSITIONS[currentStatus]`, validation at lines 52-54 |

#### Link 3: Billing Page → CodeBrowserPanel

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `apps/web/src/app/(dashboard)/billing/page.tsx` | `apps/web/src/components/declaratie/code-browser-panel.tsx` | import + onSelectCode | ✓ WIRED | Import at line 6, rendered at line 661 with `onSelectCode={handleCodeSelect}`, handleCodeSelect defined at line 595 |

#### Link 4: Invoice Creation → nzaCodeId

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `billing/page.tsx` (handleSubmit) | API `/api/invoices` | nzaCodeId in POST body | ✓ WIRED | Line 622 maps `nzaCodeId: l.nzaCodeId \|\| undefined` in request body, API route line 82 stores it |

#### Link 5: PDF Generation → billingConfig

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `apps/web/src/lib/pdf/invoice-pdf.ts` | practice.billingConfig JSON field | direct property access | ✓ WIRED | Line 122 parses `practice.billingConfig`, line 125 uses `bc.iban`, line 180 uses `bc.btwNumber` |

#### Link 6: Treatment Plans → Shared Invoice Utility

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `apps/web/src/app/api/treatment-plans/[id]/route.ts` | `apps/web/src/lib/invoice-number.ts` | import generateInvoiceNumber | ✓ WIRED | Import at line 4, called at line 102 with transaction client `tx` |

**Key Links Score:** 6/6 verified

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| **BILL-01** | Staff can create declaratie lines with NZa code selection | ✓ SATISFIED | CodeBrowserPanel integrated in invoice modal (billing/page.tsx:661), nzaCodeId FK stored (invoices/route.ts:82) |
| **BILL-03** | System generates invoices with correct Dutch formatting as PDF | ✓ SATISFIED | PDF uses billingConfig for IBAN, BTW-nummer, bank name (invoice-pdf.ts:122-180), fallback text when not configured |
| **BILL-04** | Staff can track invoice status (draft, sent, paid) | ✓ SATISFIED | Status transition validation enforces state machine (invoices/[id]/route.ts:5-54), overdue auto-detection (billing/page.tsx:116-135) |

**Requirements Score:** 3/3 satisfied

### Anti-Patterns Found

No blocker anti-patterns found.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `billing/page.tsx` | 558 | Informational comment "placeholder — will create quick invoice form" | ℹ️ Info | Historical comment, modal is fully implemented below |

**Severity Legend:**
- 🛑 Blocker: Prevents goal achievement
- ⚠️ Warning: Incomplete implementation
- ℹ️ Info: Notable but not blocking

### Human Verification Required

#### 1. PDF Invoice Layout and Dutch Formatting

**Test:** Create an invoice with multiple line items, generate PDF, open in PDF viewer.

**Expected:**
- Practice IBAN displays correctly (no hardcoded placeholder)
- BTW-nummer appears in practice details when configured
- Invoice lines show NZa codes, descriptions, quantities, tariffs
- Totals section shows subtotal, insurance amount, patient amount correctly
- Dutch formatting for currency (€), dates (dd-MM-yyyy)
- Footer shows payment terms and IBAN

**Why human:** Visual layout, typography, spacing, and professional appearance cannot be verified programmatically. PDF generation requires visual inspection.

#### 2. NZa Code Browser Interaction Flow

**Test:**
1. Click "Nieuwe factuur" button
2. Select a patient from dropdown
3. Browse NZa codes using category tree in left panel
4. Click a code (e.g., "J02 - Periodontale behandeling")
5. Verify line item appears on right side with code, description, tariff pre-filled
6. Add multiple codes
7. Submit invoice

**Expected:**
- Code browser shows full KNMT category tree
- Clicking category expands/collapses children
- Clicking code adds line item immediately
- Line items show correct nzaCode, nzaCodeId, description, tariff
- Subtotal calculates correctly
- Invoice creation succeeds and appears in list

**Why human:** Complex UI interaction flow with state management, visual feedback, and modal layout requires manual testing.

#### 3. Invoice Status Lifecycle and Overdue Detection

**Test:**
1. Create invoice (status: DRAFT)
2. Mark as SENT (status changes to SENT, sentAt timestamp recorded)
3. Manually set dueDate in database to yesterday
4. Reload billing page
5. Verify invoice automatically marked OVERDUE
6. Add payment (partial amount)
7. Verify status changes to PARTIALLY_PAID
8. Add remaining payment
9. Verify status changes to PAID

**Expected:**
- Each status transition follows allowed state machine rules
- Invalid transitions return 400 error
- Overdue detection runs on page load
- Payment completion correctly uses patientAmount (not total)

**Why human:** Multi-step workflow with database manipulation and state transitions requires manual verification of each step.

#### 4. Invoice Number Atomicity Under Concurrent Load

**Test:** Open multiple browser tabs, create invoices simultaneously from different tabs (same practice).

**Expected:**
- No duplicate invoice numbers
- Sequence increments correctly without gaps
- All invoices saved successfully

**Why human:** Race condition testing requires concurrent requests, which is difficult to verify programmatically without load testing tools.

### Gaps Summary

No gaps found. All must-haves verified. All requirements satisfied.

---

**Phase 03 Goal Achieved:** Staff can create complete declaraties with NZa codes and generate correct Dutch invoices.

**Evidence:**
- Backend APIs support atomic invoice number generation, nzaCodeId FK, status state machine, and patientAmount-based payment completion
- Frontend integrates CodeBrowserPanel for rich NZa code browsing with category tree
- PDF generation uses practice billingConfig for IBAN, BTW-nummer, and payment terms
- Overdue detection runs automatically on page load
- Build passes cleanly with no TypeScript errors

**Commits:**
- `2577549` - Extract shared invoice number utility, atomic creation, nzaCodeId support
- `587ee94` - Add status transition validation, fix payment completion
- `88253c5` - Integrate CodeBrowserPanel, add overdue detection
- `5c97bb7` - Use practice billingConfig in PDF generation

**Next Steps:** Phase 04 (AI Declaratie) can now build on this foundation to auto-generate invoice lines from clinical notes.

---

_Verified: 2026-02-16T21:50:00Z_
_Verifier: Claude (gsd-verifier)_
