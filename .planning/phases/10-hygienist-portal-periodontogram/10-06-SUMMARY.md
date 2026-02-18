---
phase: 10-hygienist-portal-periodontogram
plan: 06
subsystem: hygienist-dashboard-patient-care-notes
tags: [hygienist, dashboard, patient-portal, care-notes, perio-sync]
dependency-graph:
  requires: ["10-03", "10-04", "10-05"]
  provides: ["hygienist-dashboard", "patient-care-notes", "perio-auto-sync"]
  affects: ["dashboard-page", "patient-portal-layout", "periodontal-route"]
tech-stack:
  added: []
  patterns: ["role-conditional-dashboard", "perio-to-clinical-note-sync"]
key-files:
  created:
    - apps/web/src/app/api/dashboard/hygienist/route.ts
    - apps/web/src/components/dashboard/HygienistDashboard.tsx
    - apps/web/src/app/api/patient-portal/hygienist-notes/route.ts
    - apps/web/src/app/(patient)/portal/care-notes/page.tsx
  modified:
    - apps/web/src/app/(dashboard)/dashboard/page.tsx
    - apps/web/src/app/(patient)/portal/layout.tsx
    - apps/web/src/app/api/patients/[id]/odontogram/periodontal/route.ts
decisions:
  - "Hygienist dashboard rendered conditionally based on JWT role decode from localStorage"
  - "BOP trends displayed as color-coded bar chart (green/amber/red) without chart library"
  - "Perio chart POST auto-creates HYGIENE clinical note with BOP% calculated from chart data"
metrics:
  duration: 5min
  completed: 2026-02-18
---

# Phase 10 Plan 06: Hygienist Dashboard & Patient Care Notes Summary

Hygienist-specific dashboard with 4 widgets (today's appointments, pending perio charts, overdue patients, BOP trends) plus patient portal care notes page and perio-to-clinical-note auto-sync.

## Task 1: Hygienist dashboard + API

Created `/api/dashboard/hygienist` returning hygienist-specific widget data: today's appointments, pending perio charts (appointments without follow-up charts), overdue patients (>6 months since last hygiene visit), and BOP trends from recent perio charts. Updated `dashboard/page.tsx` to decode user role from JWT and conditionally render `HygienistDashboard` component with 2x2 card grid. Dentist dashboard code path is completely unchanged.

**Files created:**
- `apps/web/src/app/api/dashboard/hygienist/route.ts`
- `apps/web/src/components/dashboard/HygienistDashboard.tsx`

**Files modified:**
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`

## Task 2: Patient portal hygienist notes + perio auto-sync

Created `/api/patient-portal/hygienist-notes` returning simplified view of HYGIENE clinical notes (only home care instructions, next visit recommendation, date, author name -- no clinical internals exposed). Created `portal/care-notes/page.tsx` with glass card styling. Added "Verzorgingsadvies" nav item with Heart icon to patient portal layout. Modified perio chart POST to auto-create a HYGIENE clinical note with calculated BOP%, linking back to the chart ID.

**Files created:**
- `apps/web/src/app/api/patient-portal/hygienist-notes/route.ts`
- `apps/web/src/app/(patient)/portal/care-notes/page.tsx`

**Files modified:**
- `apps/web/src/app/(patient)/portal/layout.tsx`
- `apps/web/src/app/api/patients/[id]/odontogram/periodontal/route.ts`

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PENDING

Build verification and git commits could not be completed due to Bash tool permission issues. All files have been written to disk correctly. Manual verification needed:
- Run `pnpm --filter @dentflow/web build` to verify compilation
- Stage and commit the files listed above
