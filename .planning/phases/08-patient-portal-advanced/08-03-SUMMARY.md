---
phase: 08-patient-portal-advanced
plan: 03
subsystem: api, ui
tags: [booking, availability, appointments, patient-portal, glass-ui]

requires:
  - phase: 07-patient-portal-core
    provides: Patient portal shell, appointment model with PENDING_APPROVAL status
provides:
  - Availability API with schedule-based slot calculation
  - Enhanced booking API with max pending check and booking window validation
  - 4-step booking UI (type -> practitioner -> date/time -> confirm)
  - IN_APP notification on booking request
affects: [08-patient-portal-advanced]

tech-stack:
  added: []
  patterns: [practitioner-first booking flow, practice settings-based booking window, transaction-based appointment+notification creation]

key-files:
  created:
    - apps/web/src/app/api/patient-portal/appointments/availability/route.ts
  modified:
    - apps/web/src/app/api/patient-portal/appointments/book/route.ts
    - apps/web/src/app/(patient)/portal/appointments/book/page.tsx

key-decisions:
  - "CLEANING maps to HYGIENE enum in database (no schema change needed)"
  - "Full-day schedule exceptions detected by null startTime/endTime rather than DAY_OFF type"
  - "Booking window defaults: 1 day min notice, 90 days max, 2 max pending"

metrics:
  duration: 5min
  completed: 2026-02-17
  tasks: 2
  files: 3
---

# Phase 08 Plan 03: Online Booking Flow Summary

Practitioner-first booking flow with availability API, max pending enforcement, and PENDING_APPROVAL workflow using practice settings for configurable booking window.

## Task Completion

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Availability API + enhanced booking API | a619ec1 | availability/route.ts, book/route.ts |
| 2 | Booking page UI with practitioner-first flow | 00884c7 | book/page.tsx |

## What Was Built

### Availability API
- GET endpoint with practitionerId, date, durationMinutes params
- Reads PractitionerSchedule for day of week, calculates 15-min granularity slots
- Filters out existing appointments (conflict detection)
- Respects schedule exceptions (HOLIDAY/SICK = no slots)
- Validates booking window from practice settings
- ListPractitioners mode for step 2 of booking flow

### Enhanced Booking API
- Max pending bookings check (default 2) with Dutch error message
- Booking window validation (min notice + max days ahead)
- Double-check slot availability before creating
- Transaction: creates PENDING_APPROVAL appointment + IN_APP notification
- CLEANING -> HYGIENE enum mapping

### Booking Page (4-step flow)
- Step 1: Type selection (Controle 30min, Reiniging 45min, Spoed 15min)
- Step 2: Practitioner selection with role labels
- Step 3: Calendar + time slot grid from availability API
- Step 4: Summary card, optional notes, "Afspraak Aanvragen" button
- Pending bookings warning (info at 1, blocked at 2)
- Glass UI with summary chips showing previous selections

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ExceptionType enum mismatch**
- Found during: Task 1
- Issue: Plan referenced "DAY_OFF" but enum has HOLIDAY/SICK/TRAINING/CUSTOM
- Fix: Check for HOLIDAY or SICK exceptions instead
- Files: availability/route.ts

## Self-Check: PASSED
