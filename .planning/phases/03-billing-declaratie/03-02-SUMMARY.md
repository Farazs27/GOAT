---
phase: 03-billing-declaratie
plan: 02
subsystem: ui
tags: [react, pdf, nza-codes, billing, invoices]

requires:
  - phase: 03-01
    provides: "Invoice API with status transitions, payments, PDF endpoint, billingConfig on Practice model"
provides:
  - "CodeBrowserPanel integrated in invoice creation modal"
  - "nzaCodeId FK linkage in invoice lines"
  - "PDF invoices using real practice billingConfig (IBAN, BTW)"
  - "Automatic overdue invoice detection on page load"
affects: [04-ai-declaratie, 03-billing-declaratie]

tech-stack:
  added: []
  patterns: ["Two-column modal layout with code browser + line items"]

key-files:
  created: []
  modified:
    - "apps/web/src/app/(dashboard)/billing/page.tsx"
    - "apps/web/src/lib/pdf/invoice-pdf.ts"

key-decisions:
  - "CodeBrowserPanel replaces inline NZa search for richer category browsing"
  - "Overdue detection runs on page load with re-fetch after updates"
  - "PDF falls back to 'IBAN niet geconfigureerd' when billingConfig.iban is not set"

patterns-established:
  - "Two-column modal: code browser left, line items right for NZa code selection"

requirements-completed: [BILL-01, BILL-03, BILL-04]

duration: 3min
completed: 2026-02-16
---

# Phase 3 Plan 2: Billing Frontend Enhancements Summary

**CodeBrowserPanel in invoice modal with NZa category tree, billingConfig-driven PDF invoices, and auto overdue detection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-16T17:49:53Z
- **Completed:** 2026-02-16T17:53:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Integrated full CodeBrowserPanel with KNMT category tree into invoice creation modal
- PDF invoices now use real IBAN, BTW-nummer, bank name from practice billingConfig
- Billing page auto-detects and marks overdue invoices on load

## Task Commits

Each task was committed atomically:

1. **Task 1: Integrate CodeBrowserPanel into NewInvoiceModal and add overdue detection** - `88253c5` (feat)
2. **Task 2: Use practice billingConfig in PDF generation** - `5c97bb7` (feat)

## Files Created/Modified
- `apps/web/src/app/(dashboard)/billing/page.tsx` - Invoice modal with CodeBrowserPanel, overdue detection on load
- `apps/web/src/lib/pdf/invoice-pdf.ts` - PDF using billingConfig for IBAN, BTW, bank name, payment terms, footer

## Decisions Made
- CodeBrowserPanel replaces inline NZa code search input for full category browsing experience
- Overdue detection uses simple on-load check with re-fetch after marking (no cron needed)
- PDF shows "IBAN niet geconfigureerd" as fallback when billingConfig.iban is not set
- BTW-nummer line omitted from PDF when not configured (dental care typically BTW-exempt)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Billing frontend complete with professional NZa code browsing and accurate PDF generation
- Ready for Phase 4 (AI declaratie) which will auto-generate invoice lines from clinical notes

---
*Phase: 03-billing-declaratie*
*Completed: 2026-02-16*
