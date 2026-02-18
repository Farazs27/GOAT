# Phase 10: Hygienist Portal & Periodontogram - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Dedicated hygienist view with improved periodontogram, fast perio data entry (click + voice), shared clinical notes with dentist, and staff-to-staff chat. Hygienist logs in via the same staff login, gets a role-specific dashboard and navigation. The periodontogram is a classic line graph overlay with full measurement recording, historical comparison, and auto-classification.

</domain>

<decisions>
## Implementation Decisions

### Hygienist View Scope
- New HYGIENIST role enum added to the system
- Navigation: Claude's discretion on sidebar structure — hide Smile Design completely, show own schedule only in Agenda
- Full odontogram access but read-only (only perio tab is editable)
- Full declaratie and invoicing access (can create declaraties and facturen)
- Full treatment plan access (can create, edit, manage)
- Full AI access (declaratie suggestions, note expansion, treatment suggestions)
- Full patient list (all patients in practice)
- Full patient messaging access + staff-to-staff messaging
- Documents and X-ray images: view-only (cannot upload)
- Reports: own performance only (not practice-wide analytics)
- No Settings access (admin manages hygienist accounts)
- Admin creates hygienist accounts in Settings > Users with HYGIENIST role
- Admin can change user roles (e.g., promote to hygienist)
- Hygienist is a full practitioner in the agenda (patients can book hygiene appointments)
- Seed data includes a test hygienist account

### Periodontogram UX
- Data entry: click on tooth + side panel (primary), voice input as alternative
- Voice input format: "tooth 16: 3 2 4 3 2 3" (tooth number + 6 site values)
- Voice technology: Claude's discretion (Web Speech API vs dedicated service)
- Full measurement set always (no quick/screening mode): probing depth, recession, BOP, plaque index, mobility, furcation, suppuration, mucogingival junction, keratinized tissue width
- Clinical attachment level auto-calculated from probing + recession
- Visualization: classic line graph overlay on tooth silhouettes, color-coded by severity
- Color coding: standard clinical — green (1-3mm), yellow (4-5mm), red (6+mm)
- Chart layout: separate rows for buccal (3 sites) and lingual/palatal (3 sites) per jaw
- Historical comparison: overlay current vs previous measurements on same chart (different colors/opacity)
- Auto-classify periodontal diagnosis: Stage I-IV, Grade A-C per 2018 EFP/AAP classification
- Missing teeth shown as gaps (maintaining positional context)
- Implants shown with distinct visual marker (threaded screw icon instead of root)
- Per-session free-text note field for overall assessment
- PDF export: Claude's discretion

### Shared Clinical Notes
- Separate tabs: "Dentist Notes" and "Hygienist Notes" on patient page
- Read-only cross-role (each role edits only their own notes)
- Custom hygienist note format (not SOAP): oral hygiene score (1-5), BOP percentage, home care instructions, compliance notes, next visit recommendation
- Hygiene-specific AI shorthand vocabulary (e.g., 'sc' = scaling, 'rp' = root planing, 'fi' = fluoride)
- Perio session notes auto-sync to Hygienist Notes tab as summary cards (date, BOP%, avg probing depth, diagnosis, session note text, link to full chart)
- Flag system: fixed flags ('Needs follow-up', 'Noted', 'Urgent', 'Discuss at next visit') + free-text comment
- Flagged notes trigger in-app notification to the other role
- Patient portal: simplified view of hygienist notes (home care instructions, next visit)

### Login & Role Flow
- Same login page as dentist/admin (Claude's discretion on routing)
- Custom hygienist dashboard with widgets: today's appointments, pending perio charts, patients overdue for cleaning, recent BOP % trends
- Staff chat: new sidebar section "Team Chat" (separate from patient Berichten)
- Team chat supports groups + 1-on-1 (e.g., 'All Hygienists', 'Full Team', plus direct messages)

### Visual Design
- Full Apple iOS-style glassmorphism across entire hygienist view
- Same glass patterns as patient portal: `bg-white/[0.06] backdrop-blur-2xl`, `border-white/[0.12]`, accent `#e8945a`
- Applies to dashboard, patients, agenda, perio, notes — all pages

### Claude's Discretion
- Sidebar structure and navigation layout
- Voice input technology choice (Web Speech API vs external)
- PDF export for periodontogram
- Login routing after role detection
- Exact dashboard widget design and layout

</decisions>

<specifics>
## Specific Ideas

- Glass/liquid UI across the entire hygienist portal (same glassmorphism as patient portal)
- Periodontogram should feel like a professional dental charting tool — classic line graph overlay is the standard
- Voice input says "tooth 16: 3 2 4 3 2 3" for natural hands-free perio charting
- Perio session auto-syncs as summary cards in clinical notes — keep dentist informed without extra work
- Flag system enables async clinical communication between dentist and hygienist on patient notes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-hygienist-portal-periodontogram*
*Context gathered: 2026-02-18*
