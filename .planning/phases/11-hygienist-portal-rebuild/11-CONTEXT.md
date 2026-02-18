# Phase 11: Hygienist Portal Rebuild - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild the entire mondhygiëniste portal as a fully independent, standalone portal within the existing `(hygienist)/` route group. This includes: dedicated pages for all hygienist workflows, a rebuilt periodontogram with professional-grade charting, own messaging UI with patient-facing communication, proper relational perio data persistence, advanced reports, recall management, and full billing/declaratie capabilities. Builds on Phase 10 foundation but replaces simplified implementations with production-quality features.

</domain>

<decisions>
## Implementation Decisions

### Portal Page Structure
- Full standalone portal: dashboard, agenda, patients, perio, clinical notes, messaging, billing/declaratie, reports, consent management, referrals, documents, settings
- Same staff login (`/login`) with role-based routing to `/hygienist/dashboard` for HYGIENIST role
- Completely separate sidebar nav — no overlap with dentist sidebar items
- Same visual design as dentist dashboard (identical Tailwind styling, different pages/nav)
- Patient list shows all practice patients (not filtered to hygienist's patients)
- Agenda shows own schedule + toggle to see dentist's schedule for coordination
- Patient detail page is hygienist-focused: perio tab prominent, clinical notes, simplified treatment view — no odontogram restoration editing
- Full CRUD on appointments (create, edit, cancel like dentist)
- Full access to anamnesis forms (create, view, update)
- View + upload patient images (X-rays, intra-oral photos)
- Full AI tools (clinical note expansion + treatment suggestions)
- Advanced reports page: perio trends, treatment stats, patient compliance — all report types
- Full consent form management (create templates, send, track)
- Can create referral letters
- Full treatment plan capabilities (same as dentist)
- Full document management (upload, download, categorize)
- Full recall management: track recalls, send reminders, auto-suggest booking, integrated with compliance reports
- Settings page: profile (name, photo, contact, password) + preferences (perio defaults, preferred chart view, notifications)
- No practice settings access (admin/dentist only)
- Own declaratie: same billing/invoice system as dentist — full declaratie workflow for hygiene P-codes

### Periodontogram Experience
- Major improvements to both data entry speed and visualization quality
- **Data entry:** Sequential auto-advance — start at tooth 18, enter 6 probing depths per site, auto-advance to next tooth
- **Probing order:** Buccal sites first (18→28), then lingual sites (18→28) — common clinical practice
- BOP recorded during probing (after depth for each site, mark BOP yes/no before advancing)
- Auto-skip missing teeth during sequential entry (based on tooth status from odontogram)
- Voice input is secondary/optional — keyboard sequential entry is primary
- On-screen numeric keypad for tablet + physical keyboard support (detect device type)
- Undo/redo support during charting session
- Auto-save as you chart (no manual save required)
- **Visualization:** 2D traditional periodontogram (not 3D) — tooth silhouettes in a row with depth bars, BOP dots, recession lines
- Modern/custom design — clean, professional, not copying a specific product
- Both buccal and lingual views always visible (buccal row on top, lingual row on bottom)
- Entry panel and visualization on the same page — see results as you enter
- Color coding probing depths by severity: green <4mm, yellow 4-5mm, orange/red 6+mm (standard clinical thresholds)
- Mark implants separately from natural teeth (shown differently on chart)
- Furcation involvement with Grade I/II/III classification
- Recession: both direct entry and CAL-based calculation available — hygienist chooses
- Keratinized tissue width measurement per site
- Plaque index per site (6 sites/tooth) — full O'Leary plaque index with plaque % calculation
- Suppuration: NOT per site — per tooth only or not tracked
- Missing teeth: skip/collapse (not shown on chart, only present teeth visible)
- Tooth-level notes field (free text per tooth for clinical observations)
- **Historical comparison:** Both overlay and side-by-side views available (toggle between them)
- EFP/AAP periodontal classification: auto-calculated and shown on chart
- Prominent risk score per patient (high/medium/low) with color coding at top of chart
- Summary stats prominently displayed: BOP%, Plaque%, Mean pocket depth, Sites ≥6mm count
- Trends shown only in historical comparison view (no inline trend arrows)
- Multi-visit protocol tracking: initial exam → scaling Q1/Q2 → re-evaluation → scaling Q3/Q4
- No PDF export needed — digital-only

### Messaging & Communication
- Reuse Phase 10 staff team chat system as-is for staff-to-staff messaging
- Hygienist can message patients directly (patient-facing messaging)
- Separate conversation threads — patient can message dentist and hygienist independently
- Message templates: hardcoded set for common scenarios (post-scaling care, recall reminders, etc.) — personal per hygienist
- Attachments: files + images supported
- Patients see the hygienist's name and photo (personal identity, not practice identity)
- Unread count badges on messaging nav item + per-conversation
- No quick-reply from patient list — all messaging from dedicated messaging page
- Separate tabs: Patient messages tab + Staff chat tab
- Conversation handoff: can transfer/escalate a patient conversation to the dentist with a note
- No read receipts

### Perio Data & Persistence
- **Structured relational schema:** Separate PerioSession, PerioSite tables (not JSON fields) — proper 6-sites-per-tooth model
- Perio sessions linked to appointments
- Clean migration from Phase 10's PerioToothData — migrate existing data, drop old schema
- Full access from both hygienist and dentist portals (view + edit)
- **Formal protocol model:** PerioProtocol table with steps, statuses, and linked sessions
- **Dedicated RecallSchedule model:** per patient with interval (months), next due date, status (due/overdue/completed)
- Message templates: hardcoded in code (not database)
- Reports: calculated on-the-fly from raw data (no pre-computation)
- Tooth-level notes: stored as field on perio site/tooth data (separate from SOAP clinical notes)
- Keratinized tissue width and furcation: tracked per-session (historical, not just current state)
- Hygienist billing: same invoice/declaratie system as dentist

### Claude's Discretion
- Exact dashboard widget design and metrics
- Sidebar nav icon choices and ordering
- Perio visualization styling details (exact colors, spacing, typography)
- Error states and loading states throughout portal
- On-screen keypad layout
- Exact protocol step definitions
- Report chart types and layouts
- Default perio preferences for settings

</decisions>

<specifics>
## Specific Ideas

- Periodontogram should feel like a professional dental tool — clean, efficient, modern (not copying ParoStatus or Florida Probe but on par with them)
- Sequential auto-advance with buccal-then-lingual order mirrors actual clinical probing workflow
- BOP recorded inline during probing (not as separate pass) because that's how hygienists actually work
- Full declaratie/billing capabilities are essential — hygienists need the same billing system as dentists for P-codes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-hygienist-portal-rebuild*
*Context gathered: 2026-02-18*
