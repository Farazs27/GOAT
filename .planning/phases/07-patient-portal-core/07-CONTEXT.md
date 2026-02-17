# Phase 7: Patient Portal Core - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Patients can view all their dental information and communicate with the practice. Covers: appointments (view/cancel/reschedule), treatment plans with costs, invoices (view/download PDF), messaging with practitioners, personal info management, and document/X-ray viewing. Online booking and digital signatures are Phase 8. AI chatbot is Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Appointment Views
- Card-based layout for appointments (not timeline or list)
- Detailed cards: date/time, practitioner name, appointment type, duration, location/room, notes preview
- Two tabs: Upcoming / Past
- Cancel and reschedule allowed, but **only 24+ hours before** the appointment
- Cancel flow requires a cancellation reason selection before confirming
- Reschedule shows next 5 available slots (list, not calendar), filtered to same practitioner only
- Practice always receives notification on cancel/reschedule
- Past appointment cards are expandable — show treatments performed (not clinical notes)
- Treatment summary synced from dentist portal data (same source, not a copy) — no interactive 3D odontogram for patients
- Reminder status badge shown on upcoming appointment cards (sent via SMS/email/WhatsApp)
- "Add to Calendar" button generating .ics file for Google/Apple calendar
- Empty state: friendly message + "Book an appointment" CTA button

### Messaging Experience
- Chat-style UI (bubbles, conversational feel like WhatsApp)
- Patient selects which practitioner to message
- Separate conversation threads with free-text subject lines
- Patient can start new conversations
- Attachments: images + documents supported
- No read receipts, no typing indicators — keep it simple
- In-app unread badge only (no email notifications for messages)
- Threads have open/closed status — staff can mark resolved, patient can reopen
- Staff can reassign conversations to a different practitioner
- **Staff side (dashboard):** Each practitioner sees only their own conversations
- **Patient file:** All sent/received messages shown in a dedicated messages section within the patient record
- **Admin portal:** Full view of all conversations across all practitioners and patients

### Document & X-ray Viewing
- Organized by category (auto-detected from file type and context)
- X-ray viewer: full-screen with zoom/pan (keep existing built viewer as-is)
- All documents and X-rays are downloadable
- Patients can upload documents (referral letters, insurance docs, etc.)
- Patient uploads require practice review/approval before appearing in patient file (pending status)

### Portal Navigation & Layout
- Same navigation pattern as dentist dashboard (sidebar nav) with glass UI styling
- Dashboard home page with summary widgets: next appointment, unread messages, recent documents, outstanding invoices
- Sidebar sections (Dutch): Home, Afspraken, Berichten, Behandelplannen, Facturen, Documenten, Profiel
- Unread/count badges on sidebar items (Berichten count, unpaid Facturen)

### Claude's Discretion
- Exact card spacing, typography, and animation within glass UI
- Loading skeletons and error states
- Mobile responsive breakpoints
- Dashboard widget layout and ordering
- Auto-detect logic for document categorization

</decisions>

<specifics>
## Specific Ideas

- Treatment data shown in patient portal must be synced from the same data the dentist records — single source of truth
- Messaging mirrors the dentist dashboard pattern but scoped to patient context
- Existing X-ray viewer (built in-house) should be reused as-is for now
- Patient portal follows established Apple iOS glassmorphism design system

</specifics>

<deferred>
## Deferred Ideas

- **Visiquick integration** — Once dev docs are received from Visiquick, replace/enhance the X-ray viewer with their system. Not in scope for this phase.
- **Email notifications for messages** — Currently in-app only; could add email/push notifications in a future iteration
- **Full 3D odontogram in patient portal** — Patients see treatment summary only; interactive 3D view could be added later

</deferred>

---

*Phase: 07-patient-portal-core*
*Context gathered: 2026-02-17*
