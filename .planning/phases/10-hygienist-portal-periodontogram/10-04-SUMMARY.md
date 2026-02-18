---
phase: 10-hygienist-portal-periodontogram
plan: 04
subsystem: clinical-notes
tags: [clinical-notes, hygienist, flag-system, ai-shorthand, notifications]
dependency_graph:
  requires: [10-01]
  provides: [clinical-notes-api, flag-system, hygiene-shorthand]
  affects: [patient-detail-page]
tech_stack:
  added: []
  patterns: [role-based-note-creation, cross-role-notifications, shorthand-expansion]
key_files:
  created:
    - apps/web/src/app/api/patients/[id]/clinical-notes/route.ts
    - apps/web/src/app/api/patients/[id]/clinical-notes/[noteId]/flags/route.ts
    - apps/web/src/lib/ai/hygiene-shorthand.ts
    - apps/web/src/app/(dashboard)/patients/[id]/notes/page.tsx
    - apps/web/src/components/patient/hygienist-note-form.tsx
  modified:
    - apps/web/src/app/(dashboard)/patients/[id]/page.tsx
decisions:
  - "Role-based note creation: HYGIENIST creates HYGIENE, DENTIST creates SOAP/PROGRESS"
  - "Cross-role notification on flag: notifies all users of opposite role in practice"
  - "Flag deletion restricted to creator or PRACTICE_ADMIN"
  - "AI shorthand uses word-boundary regex for safe expansion"
metrics:
  duration: 6min
  completed: 2026-02-18
---

# Phase 10 Plan 04: Shared Clinical Notes Summary

Tabbed clinical notes with dentist/hygienist role separation, structured hygienist note format with AI shorthand expansion, flag system with cross-role IN_APP notifications, and perio session summary cards.

## What Was Built

### Task 1: Clinical Notes API + Flag System + AI Shorthand

- **Clinical notes API** (`/api/patients/[id]/clinical-notes`): GET with type filtering (HYGIENE, SOAP, PROGRESS), POST with role-based creation rules and HYGIENE JSON validation (oralHygieneScore 1-5, bopPercentage 0-100)
- **Flag system** (`/api/patients/[id]/clinical-notes/[noteId]/flags`): POST creates NoteFlag with 4 fixed types, creates IN_APP Notification for opposite-role users. GET returns all flags. DELETE restricted to creator/admin.
- **AI shorthand** (`hygiene-shorthand.ts`): 15 Dutch dental hygiene abbreviations (sc=scaling, rp=root planing, fi=fluoride applicatie, etc.) with word-boundary regex expansion

### Task 2: Tabbed Notes UI + Hygienist Note Form + Flag UI

- **Notes page** (`/patients/[id]/notes`): Two tabs - "Tandarts Notities" (SOAP+PROGRESS) and "Mondhygienist Notities" (HYGIENE). Role-based create buttons. Glass card styling.
- **Hygienist note form**: Structured fields (oral hygiene score 1-5 selector, BOP%, home care instructions, compliance notes, next visit recommendation). AI shorthand hints panel. Auto-expansion on submit.
- **Flag UI**: Flag icon on each note card opens dropdown with 4 flag types + comment field. Colored badges (Urgent=red, Needs follow-up=orange, etc.). Creator shown on hover.
- **Perio summary cards**: HYGIENE notes with perioChartId show distinctive emerald-bordered card with "Bekijk chart" link
- **Navigation**: Added "Notities" link to patient detail page tabs

## Deviations from Plan

None - plan executed as written.

## Decisions Made

1. **Role-based note creation**: Enforced at API level - HYGIENIST only creates HYGIENE, DENTIST only creates SOAP/PROGRESS. REFERRAL/CONSENT allowed for either role.
2. **Cross-role notifications**: Flag creation triggers Notification for all active users of the opposite role in the same practice.
3. **Flag deletion**: Restricted to the flag creator or PRACTICE_ADMIN role.
4. **AI shorthand**: Word-boundary regex matching prevents partial word replacement. 15 abbreviations covering common Dutch dental hygiene terms.

## Self-Check: PENDING

Build verification and git commits could not be completed due to tool permission issues. Files were created successfully and need manual verification with `pnpm --filter @dentflow/web build`.
