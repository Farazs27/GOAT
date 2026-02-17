---
phase: 06-agenda-scheduling
verified: 2026-02-17T19:00:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
human_verification:
  - test: "Drag appointment block to new time slot in day view"
    expected: "Appointment moves visually and re-appears at new time after page refresh. No console errors."
    why_human: "Drag-drop interaction with mouse events cannot be verified via static grep."
  - test: "Drag appointment across practitioner columns in Team view"
    expected: "Appointment reassigned to target practitioner column; PATCH fires with new practitionerId."
    why_human: "Cross-column drag involves pointer coordinates and runtime DOM state."
  - test: "Toggle Enkel / Team button in agenda day view"
    expected: "Team view shows one column per practitioner side-by-side; Enkel shows original single view."
    why_human: "Visual layout correctness requires browser rendering."
  - test: "Open Roosters panel and create a recurring slot"
    expected: "Slide-out panel opens, practitioner selector populated, slot form submits and new slot appears grouped by day."
    why_human: "Panel interaction and API round-trip require browser session."
---

# Phase 06: Agenda Scheduling Verification Report

**Phase Goal:** Practice has a complete, functional scheduling system with automated patient reminders
**Verified:** 2026-02-17T19:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Staff can see a column for each practitioner in the day view | VERIFIED | `MultiPractitionerGrid` renders one column per practitioner (lines 119-211), fetched via `authFetch('/api/schedules?listPractitioners=true')` |
| 2 | Appointments appear in the correct practitioner column | VERIFIED | `appointmentsByPractitioner` map in `multi-practitioner-grid.tsx` (lines 76-87) groups by `a.practitioner.id` |
| 3 | Staff can switch between single-practitioner and multi-practitioner views | VERIFIED | `teamView` state in `agenda/page.tsx` line 216; Enkel/Team toggle buttons lines 974-980; conditional `MultiPractitionerGrid` render line 1281 |
| 4 | Staff can drag an appointment block to a different time slot to reschedule it | VERIFIED | `useDraggable` on `AppointmentBlock` (line 92); `DroppableSlot` in `TimeGrid`; `onDragEnd` PATCH handler lines 288-330 in `agenda/page.tsx` |
| 5 | Staff can drag an appointment to a different practitioner column in team view | VERIFIED | `DroppableCell` in `multi-practitioner-grid.tsx` stores `practitionerId` in droppable data (line 29); `handleDragEnd` sends `practitionerId` in PATCH body (lines 310-311) |
| 6 | Dragged appointment updates in the database via PATCH API | VERIFIED | `authFetch('/api/appointments/${appointment.id}', { method: 'PATCH' })` in `handleDragEnd` (lines 315-320); response triggers `fetchAppointments()` refresh |
| 7 | Visual feedback shown during drag (ghost, drop target highlight) | VERIFIED | `DragOverlay` renders `AppointmentBlock isOverlay` (lines 1283-1287, 1310-1314); `isOver` highlight in `DroppableSlot` (line 15 of time-grid.tsx) and `DroppableCell` (line 35 of multi-practitioner-grid.tsx) |
| 8 | Staff can view, create, edit, and delete recurring schedule slots | VERIFIED | `ScheduleManager` (363 lines) implements full CRUD: GET list (line 69), POST create (line 102), PATCH edit (line 96), DELETE (line 127), toggle-active PATCH (line 135) |
| 9 | Roosters panel is accessible from the agenda toolbar | VERIFIED | "Roosters" button at line 988-990 of `agenda/page.tsx`; `ScheduleManager` rendered at line 946 |
| 10 | Cron endpoint sends SMS reminders to patients with phone numbers | VERIFIED | `appointment-reminders/route.ts` checks `appointment.patient.phone` (line 83), calls `isSmsConfigured` then `sendAppointmentReminderSms` (lines 96-104) |
| 11 | System gracefully degrades when Twilio is not configured | VERIFIED | `isSmsConfigured`/`isWhatsAppConfigured` checked before calling; SMS/WhatsApp errors caught and logged, never throw (lines 113-117); email flow independent |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Status | Line Count | Key Evidence |
|----------|--------|------------|-------------|
| `apps/web/src/components/agenda/appointment-block.tsx` | VERIFIED | 175 lines | `useDraggable`, static type-color maps, `AppointmentBlockData` type exported |
| `apps/web/src/components/agenda/time-grid.tsx` | VERIFIED | 88 lines | `DroppableSlot` with `useDroppable`, `droppable` prop, `isOver` highlight |
| `apps/web/src/components/agenda/multi-practitioner-grid.tsx` | VERIFIED | 212 lines | `DroppableCell` per practitioner, `appointmentsByPractitioner` grouping, `authFetch` for data |
| `apps/web/src/app/(dashboard)/agenda/schedule-manager.tsx` | VERIFIED | 363 lines | Full CRUD with `authFetch`, Dutch labels, day-grouped display, delete confirmation |
| `apps/web/src/lib/whatsapp/twilio.ts` | VERIFIED | 229 lines | Exports `sendSms`, `sendAppointmentReminderSms`, `sendAppointmentReminderWhatsApp`, `isSmsConfigured` |
| `apps/web/src/app/api/cron/appointment-reminders/route.ts` | VERIFIED | 161 lines | Multi-channel sending (email + SMS + WhatsApp), results counts, graceful degradation |

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `multi-practitioner-grid.tsx` | `/api/appointments` | `authFetch` with date param | WIRED | Line 65: `authFetch('/api/appointments?date=...')` + response stored in `allAppointments` state |
| `multi-practitioner-grid.tsx` | `appointment-block.tsx` | `AppointmentBlock` per column | WIRED | Import line 7; rendered for each appointment in column (lines 173-182) |
| `agenda/page.tsx` | `multi-practitioner-grid.tsx` | Import + conditional render in DndContext | WIRED | Import line 62; rendered at lines 1281-1288 in team view |
| `agenda/page.tsx` | `/api/appointments/[id]` | PATCH on `handleDragEnd` | WIRED | Lines 315-320; includes startTime, endTime, optional practitionerId |
| `appointment-block.tsx` | `time-grid.tsx` | `DndContext onDragEnd` | WIRED | Both wrapped in `<DndContext>` in `agenda/page.tsx` lines 1296, 1281; `onDragEnd={handleDragEnd}` |
| `schedule-manager.tsx` | `/api/schedules` | GET/POST/PATCH/DELETE via `authFetch` | WIRED | GET line 69, POST line 102, PATCH line 96/135, DELETE line 127 |
| `agenda/page.tsx` | `schedule-manager.tsx` | Import + render with `open` prop | WIRED | Import line 59; rendered line 946; Roosters button sets `showScheduleManager(true)` line 988 |
| `cron/appointment-reminders` | `lib/whatsapp/twilio.ts` | Named imports | WIRED | Lines 4-9: `import { sendAppointmentReminderSms, sendAppointmentReminderWhatsApp, isSmsConfigured, isWhatsAppConfigured }` |
| `lib/whatsapp/twilio.ts` | `twilio` SDK | `twilio(accountSid, authToken)` | WIRED | Line 1: `import twilio from "twilio"`; used at line 45 in `getTwilioClient` |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|---------|
| AGND-01 | Staff can create, edit, and delete appointments with drag-drop | SATISFIED | Drag-drop rescheduling implemented (plan 02). Existing create/edit/delete preserved in agenda page. `useDraggable`/`useDroppable` wired with PATCH on drop. |
| AGND-02 | Staff can set recurring appointment slots | SATISFIED | `ScheduleManager` (plan 03) provides full CRUD for weekly schedule slots per practitioner. Roosters button in toolbar. |
| AGND-03 | Staff can view multi-practitioner calendar side-by-side | SATISFIED | `MultiPractitionerGrid` (plan 01) renders one column per practitioner in day view. Enkel/Team toggle implemented. |
| AGND-04 | Patient receives appointment reminders via SMS/email/WhatsApp | SATISFIED | Cron endpoint (plan 04) sends email + SMS + WhatsApp. `sendAppointmentReminderSms` and `sendAppointmentReminderWhatsApp` with Dutch message. Graceful degradation verified. |

All 4 required IDs (AGND-01 through AGND-04) are accounted for and satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/whatsapp/twilio.ts` | 71, 93, 111, 126, 140 | "This will be implemented when WhatsApp models are properly set up" | Info | Pre-existing stubs in `processIncomingWhatsApp`, `getWhatsAppConversations`, `getWhatsAppMessages`, `updateMessageStatus`. These functions are NOT phase 06 deliverables and do not affect any phase 06 truth. The four required functions (`sendSms`, `sendAppointmentReminderSms`, `sendAppointmentReminderWhatsApp`, `isSmsConfigured`) are fully implemented. |
| `schedule-manager.tsx` | 151, 283 | `return null` | Info | Legitimate UI guards: panel hides when closed (line 151), empty day row skipped (line 283). Not stubs. |

No blocker or warning anti-patterns found in phase 06 deliverables.

### Human Verification Required

#### 1. Drag-Drop Time Slot Rescheduling

**Test:** In the agenda day view (Enkel mode), drag an appointment block to a different hour slot.
**Expected:** The appointment block moves, a ghost overlay appears during drag, the target slot highlights blue, and after release the appointment re-appears at the new time.
**Why human:** Pointer interaction and visual DOM state cannot be verified statically.

#### 2. Cross-Practitioner Drag in Team View

**Test:** In Team view, drag an appointment from one practitioner column to another.
**Expected:** The appointment disappears from the original practitioner's column and appears in the target column. The PATCH call includes the target practitionerId.
**Why human:** Cross-column drag involves runtime drag coordinates and practitioner column droppable IDs.

#### 3. Enkel / Team View Toggle

**Test:** In day view, click the "Team" button then the "Enkel" button.
**Expected:** Team view shows all practitioners side-by-side with appointment counts in column headers. Enkel restores the original single-practitioner time grid.
**Why human:** Visual layout correctness (column widths, scrolling, header display) requires browser rendering.

#### 4. Schedule Manager CRUD Flow

**Test:** Click "Roosters" button, select a practitioner, add a new schedule slot (e.g., Maandag 08:00-17:00, 15 min), then edit it, toggle it inactive, and delete it.
**Expected:** Slide-out panel opens; slot appears in day-grouped list after creation; edit pre-fills form; inactive slots show dimmed; delete requires two-click confirmation.
**Why human:** Full UI interaction flow with API round-trips requires browser session with valid auth.

### Gaps Summary

No gaps found. All 11 observable truths are verified at all three levels (exists, substantive, wired). All four requirement IDs (AGND-01 through AGND-04) are satisfied. Commits for all deliverables are present in git history (59ac32e, ee593e7, bd0f058, 28636c0, 258094f).

---

_Verified: 2026-02-17T19:00:00Z_
_Verifier: Claude (gsd-verifier)_
