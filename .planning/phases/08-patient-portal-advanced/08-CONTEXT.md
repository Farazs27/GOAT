# Phase 8: Patient Portal Advanced - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Patients can digitally sign consent forms and treatment plans within the portal, and book appointments online. Staff can manage consent form templates and approve online bookings. Signed documents are stored with audit trail. AI chatbot and advanced AI features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Signature capture
- Canvas-based draw signature (finger on mobile, mouse on desktop)
- One-shot drawing — no clear/redo button, submit or cancel
- Inline within page (no full-screen landscape mode on mobile)
- Signature stored as PNG image
- Must-scroll-to-bottom required before signature pad enables (read confirmation)
- Same signature flow for both consent forms and treatment plan approvals
- Confirmation toast after signing, PDF available later in documents section (no immediate download)
- Staff receives notification/badge when patient signs something
- Supports dependent signing — signer can indicate relationship (parent/guardian), stored in audit trail
- Re-signing supported: staff can send updated version, patient signs again, both versions kept
- Captures timestamp + IP address + user agent alongside signature for legal validity

### Online booking flow
- Patient picks practitioner first, then sees available slots
- Patient selects appointment type (checkup, cleaning, emergency) before seeing slots — determines duration
- Booking window and minimum notice period configurable by practice in settings
- Staff approval required — booking is pending until staff confirms, patient sees "awaiting confirmation"
- Patient can add optional free-text note/reason when booking
- Max 2 pending (unconfirmed) bookings per patient
- Confirmation email sent automatically after booking + visible in portal appointments

### Consent form design
- Template library — practice maintains reusable consent form templates
- Templates support merge fields: {patient_name}, {date}, {practitioner_name} (basic fields only, no treatment data)
- Dutch + English language support for templates
- Consent forms can be linked to specific appointments — patient sees it as a to-do before the visit
- Linked consent blocks check-in if unsigned — staff sees warning, can override but it's flagged
- Bulk send supported — staff can send same consent form to multiple patients at once
- Configurable expiry on unsigned consent forms — practice sets expiry period, unsigned forms expire and staff notified
- Badge count on documents/consent section in sidebar for unsigned forms (not prominent banner)

### Audit & storage
- Patients see basic signing info ("Signed on [date]") — full audit trail (IP, user agent) only visible to staff
- Patients can download signed documents as PDF — signature embedded inline at bottom of document
- Consent withdrawal handled offline — patient contacts practice, not self-service
- Global consent overview for staff — page showing all signed/pending/expired consent forms across all patients
- Global overview supports full filters: status (signed/pending/expired), template, date range, patient
- Staff can export consent report as CSV/PDF for compliance audits
- 20-year retention per Dutch WGBO healthcare law
- Storage must comply with Dutch healthcare regulations (AVG/GDPR, WGBO) — researcher to investigate compliant options

### Claude's Discretion
- Calendar UI for booking slot picker (list vs week view)
- Consent form creation method (rich text editor vs PDF upload vs both)
- Loading states and error handling
- Exact notification email content and styling
- Progress indicators during signature submission

</decisions>

<specifics>
## Specific Ideas

- Consent form read confirmation: signature pad only enables after scrolling to bottom — prevents "sign without reading"
- Staff global consent overview should feel like a compliance dashboard — filterable, exportable
- Booking flow: practitioner first, then type, then slots — mirrors how patients think about dental visits
- Dependent signing captures relationship role for legal audit trail

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-patient-portal-advanced*
*Context gathered: 2026-02-17*
