# Roadmap: Nexiom

## Overview

Nexiom is 40% complete -- UI exists across most areas but functionality is incomplete. This roadmap completes the system bottom-up: clinical data first (odontogram, treatment plans), then billing, then AI on top of solid data, then agenda, then patient portal. Each phase delivers a working capability that builds on the previous.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Clinical Foundation** - Complete odontogram with tooth status recording, restoration tracking, and history
- [ ] **Phase 2: Treatment Planning** - Full treatment plan lifecycle from creation through execution to billing linkage
- [ ] **Phase 3: Billing & Declaratie** - Complete manual declaratie and invoicing workflow
- [ ] **Phase 4: AI Declaratie Engine** - Natural language to NZa codes with human review
- [ ] **Phase 5: AI Clinical Intelligence** - AI-powered clinical notes and treatment plan suggestions
- [ ] **Phase 6: Agenda & Scheduling** - Complete scheduling system with multi-practitioner views and reminders
- [ ] **Phase 7: Patient Portal Core** - All basic patient-facing features functional
- [ ] **Phase 8: Patient Portal Advanced** - Digital signatures, online booking, consent workflows
- [ ] **Phase 9: Patient AI Assistant** - Patient-facing AI chatbot with booking and follow-up capabilities
- [ ] **Phase 10: Hygienist Portal & Periodontogram** - Dedicated hygienist view with improved periodontogram and shared clinical notes

## Phase Details

### Phase 1: Clinical Foundation
**Goal**: Dentist can record complete clinical status on every tooth and track restoration history
**Depends on**: Nothing (first phase)
**Requirements**: CLIN-01, CLIN-02
**Success Criteria** (what must be TRUE):
  1. Dentist can click any tooth in the odontogram and record its clinical status (caries, missing, crown, etc.)
  2. Dentist can record restorations linked to specific teeth and surfaces
  3. Dentist can view the full history of status changes and restorations for any tooth
  4. Tooth status visually updates in the odontogram after recording
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Wire Treatment record creation into save flows and fix treatment history endpoint

### Phase 2: Treatment Planning
**Goal**: Dentist can create, approve, and execute treatment plans that connect clinical findings to billing
**Depends on**: Phase 1
**Requirements**: CLIN-03, CLIN-04, CLIN-05
**Success Criteria** (what must be TRUE):
  1. Dentist can create a treatment plan with multiple treatments, each linked to specific teeth
  2. Treatment plan moves through statuses: draft, approved, in-progress, completed
  3. Patient can see and approve treatment plans (approval workflow)
  4. Completed treatments automatically create linked declaratie lines ready for billing
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Status workflow enforcement, side effects, patient approval endpoint, auto-invoice on completion
- [ ] 02-02-PLAN.md — Fix overlay to create single plan with multiple treatments, add status action buttons

### Phase 3: Billing & Declaratie
**Goal**: Staff can create complete declaraties with NZa codes and generate correct Dutch invoices
**Depends on**: Phase 2
**Requirements**: BILL-01, BILL-03, BILL-04
**Success Criteria** (what must be TRUE):
  1. Staff can browse NZa codes and create declaratie lines for any treatment
  2. System generates PDF invoices with correct Dutch formatting (BTW, practice details, patient info)
  3. Staff can track invoice lifecycle: draft, sent, paid, overdue
  4. Declaratie lines show correct NZa code, description, and tariff
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Backend fixes: atomic invoice numbers, nzaCodeId on lines, status transition validation, payment fix
- [ ] 03-02-PLAN.md — Frontend: CodeBrowserPanel in invoice modal, billingConfig in PDF, overdue detection

### Phase 4: AI Declaratie Engine
**Goal**: Dentist types what they did in plain Dutch and gets correct, complete NZa declaratie lines
**Depends on**: Phase 3
**Requirements**: AI-01, AI-02, AI-03, BILL-02
**Success Criteria** (what must be TRUE):
  1. Dentist can type a natural language description (e.g., "composiet vulling 36 MOD") and receive suggested NZa declaratie lines
  2. AI automatically includes related codes (rubberdam, anesthesie, rontgen, materiaal) based on NZa combinatie rules
  3. AI validates suggestions against NZa opmerkingen and flags potential rejection risks
  4. Dentist reviews and confirms AI suggestions before they become actual declaratie lines
  5. No patient PII is sent to the AI provider
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: AI Clinical Intelligence
**Goal**: AI assists the dentist with clinical documentation and treatment planning
**Depends on**: Phase 4
**Requirements**: AI-04, AI-05
**Success Criteria** (what must be TRUE):
  1. Dentist can type shorthand clinical notes and AI expands them into proper clinical documentation
  2. AI suggests treatment plans based on recorded odontogram diagnoses
  3. AI-generated content is clearly marked as suggestions, not auto-applied
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Agenda & Scheduling
**Goal**: Practice has a complete, functional scheduling system with automated patient reminders
**Depends on**: Nothing (parallel track, no dependency on clinical/AI phases)
**Requirements**: AGND-01, AGND-02, AGND-03, AGND-04
**Success Criteria** (what must be TRUE):
  1. Staff can create, edit, delete, and drag-drop appointments on the calendar
  2. Staff can set recurring time slots (e.g., weekly checkup blocks)
  3. Staff can view multiple practitioners side-by-side in the calendar
  4. Patients automatically receive appointment reminders via SMS, email, or WhatsApp
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Patient Portal Core
**Goal**: Patients can view all their dental information and communicate with the practice
**Depends on**: Phase 2 (treatment plans), Phase 3 (invoices)
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05, PORT-07
**Success Criteria** (what must be TRUE):
  1. Patient can view upcoming and past appointments in the portal
  2. Patient can view their treatment plans with cost estimates
  3. Patient can view and download their invoices as PDF
  4. Patient can send and receive messages with the practice
  5. Patient can view and update their personal information
  6. Patient can view their documents and X-ray images
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

### Phase 8: Patient Portal Advanced
**Goal**: Patients can sign documents digitally and book appointments online
**Depends on**: Phase 6 (agenda), Phase 7 (portal core)
**Requirements**: PORT-06, AGND-05
**Success Criteria** (what must be TRUE):
  1. Patient can digitally sign consent forms within the portal
  2. Patient can digitally approve treatment plans with a signature
  3. Patient can browse available time slots and book appointments online
  4. Signed documents are stored with audit trail (who, when, what)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Patient AI Assistant
**Goal**: Patients have an AI assistant that explains treatments, answers questions, and helps with appointments
**Depends on**: Phase 4 (AI patterns), Phase 8 (portal advanced)
**Requirements**: AI-06, AI-07, AI-08
**Success Criteria** (what must be TRUE):
  1. Patient can chat with AI assistant in Dutch within the portal
  2. AI can explain the patient's treatments and answer billing questions using their actual data
  3. AI can book appointments on behalf of the patient
  4. AI sends follow-up nudges to patients who have pending treatments
  5. AI never provides medical diagnoses or advice beyond explaining existing treatment plans
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Hygienist Portal & Periodontogram
**Goal**: Dental hygienist has a dedicated portal with an excellent periodontogram and shared notes with the dentist
**Depends on**: Phase 1 (clinical foundation)
**Requirements**: CLIN-06, CLIN-07, HYG-01, HYG-02, HYG-03, HYG-04, HYG-05
**Success Criteria** (what must be TRUE):
  1. Hygienist can log in and see a dedicated view without smile design section
  2. Hygienist can record full periodontal data (probing depths, bleeding, recession, mobility) with fast data entry
  3. Periodontogram visually displays perio data clearly and professionally
  4. Hygienist and dentist can see each other's clinical notes on the same patient
  5. Hygienist and dentist can communicate via internal notes/messages within the system
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD
- [ ] 10-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10
Note: Phase 6 (Agenda) and Phase 10 (Hygienist) can be parallelized with other tracks.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Clinical Foundation | 0/0 | Not started | - |
| 2. Treatment Planning | 0/0 | Not started | - |
| 3. Billing & Declaratie | 0/0 | Not started | - |
| 4. AI Declaratie Engine | 0/0 | Not started | - |
| 5. AI Clinical Intelligence | 0/0 | Not started | - |
| 6. Agenda & Scheduling | 0/0 | Not started | - |
| 7. Patient Portal Core | 0/0 | Not started | - |
| 8. Patient Portal Advanced | 0/0 | Not started | - |
| 9. Patient AI Assistant | 0/0 | Not started | - |
| 10. Hygienist Portal & Perio | 0/0 | Not started | - |
