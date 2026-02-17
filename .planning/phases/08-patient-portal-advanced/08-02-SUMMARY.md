---
plan: 08-02
phase: 08-patient-portal-advanced
status: complete
started: 2026-02-17
completed: 2026-02-17
duration: 5min
---

## What was built

Patient-facing consent signing UI with scroll-to-bottom gating, one-shot signature canvas, dependent signing (self/parent/guardian), and PDF download. Treatment plan signing flow added to behandelplan page.

## Key files

### Created
- `apps/web/src/components/patient/signature-widget.tsx` — Shared signature canvas component with signer relation selection

### Modified
- `apps/web/src/app/(patient)/portal/consent/page.tsx` — Scroll-to-bottom gating, signature flow, PDF download button
- `apps/web/src/app/(patient)/portal/behandelplan/page.tsx` — Treatment plan signing for PROPOSED plans

## Commits
- `94aea18`: feat(08-02): patient consent signing UI with scroll-to-bottom gating and treatment plan signing

## Deviations
- Extracted SignatureWidget to `components/patient/signature-widget.tsx` instead of exporting from page file (Next.js page files cannot have named exports)

## Self-Check: PASSED
