# Requirements: Nexiom

**Defined:** 2026-02-16
**Core Value:** AI-powered declaratie and clinical note generation from natural language, eliminating the most painful part of dental practice management.
**Approach:** Improve and complete existing implementations — not rebuild. Fix what's broken, complete what's partial, add only where nothing exists.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Agenda & Scheduling

- [ ] **AGND-01**: Staff can create, edit, and delete appointments with drag-drop
- [ ] **AGND-02**: Staff can set recurring appointment slots
- [ ] **AGND-03**: Staff can view multi-practitioner calendar side-by-side
- [ ] **AGND-04**: Patient receives appointment reminders via SMS/email/WhatsApp
- [ ] **AGND-05**: Patient can book appointments online through portal

### AI Features

- [ ] **AI-01**: Dentist can type natural language description and AI generates correct NZa declaratie lines
- [ ] **AI-02**: AI understands NZa combinatie rules (filling auto-includes rubberdam, anesthesia, X-ray, materials)
- [ ] **AI-03**: AI validates declaratie against NZa opmerkingen before submission
- [ ] **AI-04**: Dentist can dictate shorthand clinical notes and AI expands to proper documentation
- [ ] **AI-05**: AI suggests treatment plans based on odontogram diagnosis
- [ ] **AI-06**: Patient can chat with AI assistant in portal (explains treatment, answers questions in Dutch)
- [ ] **AI-07**: Patient AI can book appointments on behalf of patient
- [ ] **AI-08**: Patient AI sends follow-up nudges to motivate treatment completion

### Billing & Declaratie

- [ ] **BILL-01**: Staff can create declaratie lines with NZa code selection
- [ ] **BILL-02**: Staff can review and approve AI-suggested declaratie lines before submission
- [ ] **BILL-03**: System generates invoices with correct Dutch formatting as PDF
- [ ] **BILL-04**: Staff can track invoice status (draft, sent, paid)

### Clinical

- [ ] **CLIN-01**: Odontogram is reactive — clicking teeth records status, visually updates (do NOT change existing design)
- [ ] **CLIN-02**: Restoration tracking linked to teeth and surfaces
- [ ] **CLIN-03**: Treatment plan creation with multiple treatments per plan
- [ ] **CLIN-04**: Treatment plan approval workflow (create, approve, execute, complete)
- [ ] **CLIN-05**: Treatment plans link to declaratie for billing
- [x] **CLIN-06**: Complete periodontogram with probing depths, bleeding, recession, mobility
- [x] **CLIN-07**: Periodontogram improvements for hygienist workflow (fast data entry, visual charting)

### Hygienist Portal

- [x] **HYG-01**: Dental hygienist has a dedicated portal view (separate from dentist dashboard)
- [x] **HYG-02**: Hygienist can view and record periodontal data on the periodontogram
- [x] **HYG-03**: Hygienist and dentist can see each other's clinical notes on the same patient
- [x] **HYG-04**: Hygienist portal does NOT include smile design section
- [x] **HYG-05**: Hygienist and dentist can communicate within the system (internal notes/messages)

### Patient Portal

- [ ] **PORT-01**: Patient can view upcoming and past appointments
- [ ] **PORT-02**: Patient can view treatment plans and cost estimates
- [ ] **PORT-03**: Patient can view and download invoices
- [ ] **PORT-04**: Patient can send and receive messages with practice
- [ ] **PORT-05**: Patient can view and update personal information
- [ ] **PORT-06**: Patient can digitally sign consent forms and treatment approvals
- [ ] **PORT-07**: Patient can view documents and X-ray images

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Insurance Integration

- **INS-01**: Vecozo COV check (insurance eligibility verification via BSN)
- **INS-02**: Vecozo electronic declaratie submission to insurers
- **INS-03**: Real-time declaratie validation before Vecozo submission

### Clinical (Advanced)

- **CLIN-08**: DICOM X-ray import and viewer with measurement tools

### Business

- **BUS-01**: Subscription tier system with feature-based access control
- **BUS-02**: Online payments via Mollie (iDEAL for eigen bijdrage)
- **BUS-03**: Complete practice settings (working hours, rooms, config)
- **BUS-04**: Kostenraming (cost estimates per Dutch regulation)
- **BUS-05**: Smart recall system (AI-powered patient follow-ups)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Lab order management | Labs have own portals; low ROI for v1 |
| Custom hardware drivers (X-ray sensors) | Manufacturers provide capture software; DICOM import is sufficient |
| Real-time video consultations | Not core to in-clinic workflow |
| Full EHR/EPD certification | Expensive, slow; follow GDPR/AVG best practices instead |
| Mobile native app | Web-first; responsive design sufficient |
| Multi-country/multi-language | NZa codes are NL-specific; hardcode Dutch |
| Email marketing campaigns | Dentists don't run campaigns; simple reminders sufficient |
| Complex BI/reporting dashboard | Simple KPI widgets sufficient |
| Plugin/integration marketplace | Premature abstraction |
| Inventory/stock management | Handled by separate systems |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGND-01 | Phase 6 | Pending |
| AGND-02 | Phase 6 | Pending |
| AGND-03 | Phase 6 | Pending |
| AGND-04 | Phase 6 | Pending |
| AGND-05 | Phase 8 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 5 | Pending |
| AI-05 | Phase 5 | Pending |
| AI-06 | Phase 9 | Pending |
| AI-07 | Phase 9 | Pending |
| AI-08 | Phase 9 | Pending |
| BILL-01 | Phase 3 | Pending |
| BILL-02 | Phase 4 | Pending |
| BILL-03 | Phase 3 | Pending |
| BILL-04 | Phase 3 | Pending |
| CLIN-01 | Phase 1 | Pending |
| CLIN-02 | Phase 1 | Pending |
| CLIN-03 | Phase 2 | Pending |
| CLIN-04 | Phase 2 | Pending |
| CLIN-05 | Phase 2 | Pending |
| PORT-01 | Phase 7 | Pending |
| PORT-02 | Phase 7 | Pending |
| PORT-03 | Phase 7 | Pending |
| PORT-04 | Phase 7 | Pending |
| PORT-05 | Phase 7 | Pending |
| CLIN-06 | Phase 10 | Complete |
| CLIN-07 | Phase 10 | Complete |
| HYG-01 | Phase 10 | Complete |
| HYG-02 | Phase 10 | Complete |
| HYG-03 | Phase 10 | Complete |
| HYG-04 | Phase 10 | Complete |
| HYG-05 | Phase 10 | Complete |
| PORT-06 | Phase 8 | Pending |
| PORT-07 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after roadmap creation*
