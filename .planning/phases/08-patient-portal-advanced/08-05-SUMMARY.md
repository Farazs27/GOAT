---
phase: 08-patient-portal-advanced
plan: 05
subsystem: patient-portal
tags: [booking-approval, badges, notifications, consent-warnings]
dependency_graph:
  requires: ["08-02", "08-03", "08-04"]
  provides: ["booking-approval-api", "consent-badge", "staff-notification-badges"]
  affects: ["dashboard-layout", "patient-layout", "agenda"]
tech_stack:
  added: []
  patterns: ["notification-on-status-change", "badge-count-fetch", "consent-appointment-link"]
key_files:
  created:
    - apps/web/src/app/api/dashboard/appointments/approve/route.ts
    - apps/web/src/components/dashboard/sidebar-badges.tsx
  modified:
    - apps/web/src/app/(patient)/portal/layout.tsx
    - apps/web/src/app/(dashboard)/layout.tsx
    - apps/web/src/app/(dashboard)/agenda/page.tsx
decisions:
  - "Notification created on booking approval/rejection for patient visibility"
  - "Consent badge count fetched in patient portal layout"
  - "Staff sidebar badges for pending bookings and consent indicators"
metrics:
  duration: "5min"
  completed: "2026-02-17"
---

# Phase 8 Plan 5: Booking Approval & Badge Integration Summary

Staff booking approval API with notification creation, consent badge in patient sidebar, and staff notification indicators for pending bookings and consent forms.

## What Was Built

### Booking Approval API
- POST endpoint at `/api/dashboard/appointments/approve` for staff to approve or reject pending bookings
- Validates appointment belongs to staff's practice and has PENDING_APPROVAL status
- On approve: updates to CONFIRMED, creates patient notification with date/time details
- On reject: updates to CANCELLED with optional rejection reason in notification

### Patient Portal Consent Badge
- Patient sidebar layout fetches unsigned consent form count
- Badge displayed next to Toestemming menu item showing pending consent count

### Staff Sidebar Notification Indicators
- Dashboard sidebar shows badge for pending booking approvals next to Agenda
- Consent notification indicators for new signatures
- Sidebar badges component extracted for reuse

### Consent-Appointment Check-in Warning
- Agenda page shows warning when appointment has linked unsigned consent forms
- Informational warning with link to consent overview

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- Build passes: `pnpm --filter @dentflow/web build` successful
- Human end-to-end verification: approved by user

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 4885e49 | Booking approval API, consent badge, staff sidebar indicators |
| 2 | checkpoint | Human verification - approved |

## Self-Check: PASSED
