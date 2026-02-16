# Feature Landscape

**Domain:** Dental Practice Management Software (Dutch market)
**Researched:** 2026-02-16
**Confidence:** MEDIUM (based on domain knowledge + codebase analysis; web search unavailable for competitor verification)

## Table Stakes

Features users expect. Missing = product feels incomplete. Dutch dentists will not switch from Simplex/Exquise without these.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Patient CRUD with BSN | Legal requirement for Dutch healthcare | Low | Already exists |
| Appointment scheduling (agenda) | Core daily workflow; dentists live in the agenda | High | Partially built. Needs drag-drop, recurring slots, multi-practitioner views |
| Odontogram (dental chart) | Clinical documentation standard | High | Already exists with 3D |
| NZa code browser and lookup | Dentists must find and apply correct billing codes daily | Medium | Already exists |
| Declaratie line creation | Every treatment must be billed; this is the revenue engine | High | Partially built |
| Invoice generation + PDF | Patients and insurers need invoices | Medium | Partially built |
| Vecozo COV check (insurance eligibility) | Every Dutch practice checks insurance before treatment | High | NOT built. Critical blocker |
| Vecozo declaratie submission | How Dutch dentists get paid by insurers; no alternative | High | NOT built. Without this, software is unusable for billing |
| Patient anamnesis (health questionnaire) | Required before treatment; legal/clinical necessity | Medium | Exists in patient portal |
| Clinical notes per visit | Legal documentation requirement | Medium | Partially built |
| Treatment plan creation and tracking | Standard workflow: diagnose, plan, approve, execute, bill | High | Partially built |
| Multi-practitioner support | Most practices have multiple dentists, hygienists, assistants | Medium | Exists via user roles |
| User roles and permissions | Dentist vs assistant vs hygienist vs admin have different access | Medium | Already exists |
| Audit trail | Dutch healthcare regulation requires action logging | Low | Already exists |
| Patient communication (reminders) | Appointment reminders reduce no-shows | Medium | Partially built (Resend + Twilio) |
| Periodontal charting | Standard clinical workflow for hygienists | High | Partially built |
| X-ray image viewing | Dentists need to view radiographs alongside patient record | High | Basic viewer exists; DICOM not integrated |
| Consent forms | Legal requirement before invasive procedures | Medium | Templates exist |
| Referral letters | Specialists need referral documentation | Medium | Exists (PDF generation) |
| Practice-level settings | Multi-tenant config (practice info, working hours, rooms) | Medium | Partially exists |
| Kostenraming (cost estimate) | Dutch regulation: patient must approve costs before treatment over threshold | Medium | Page exists in patient portal |

## Differentiators

Features that set Nexiom apart. Not expected in legacy systems, but high value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI declaratie from natural language | Killer feature. Dentist says "composiet vulling 36 MOD" and system generates all NZa lines (A10 + V30 + R34 + rubberdam) | Very High | Core differentiator. NZa codebook already in system |
| AI clinical note generation | Dentist dictates shorthand, AI expands to proper clinical notes | High | Reduces documentation burden by 70%+ |
| AI treatment plan suggestions | Based on diagnosis/odontogram state, AI suggests treatment options with NZa codes | High | Builds on AI declaratie engine |
| Patient portal AI assistant | Patient asks "what does my treatment plan mean?" and gets plain-language explanation | High | Unique in Dutch market |
| 3D odontogram (React Three Fiber) | Visual, interactive, modern. Legacy systems use flat 2D charts | Already built | Already a differentiator |
| Online appointment booking | Patient self-service booking through portal | Medium | Competitors are slowly adding this |
| Online payments (iDEAL via Mollie) | Patient pays eigen bijdrage online | Medium | Mollie already integrated |
| Glass UI patient portal | Modern, Apple-quality patient experience | Already built | No competitor has this design quality |
| Digital signatures | E-sign consent forms and treatment approvals | Medium | Modern alternative to paper |
| AI-powered NZa combinatie rules | System knows which codes can/must be combined, prevents rejections | High | Insurance rejections cost practices money and time |
| Real-time declaratie validation | Before submission: check codes are valid, combinations allowed, tariffs correct | High | Prevents rejections |
| WhatsApp integration | Direct messaging patients via WhatsApp (Dutch preferred channel) | Medium | Already partially built |
| Smart recall system | AI-powered patient recall based on treatment history and risk profile | Medium | Beyond simple "6 month reminder" |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Lab order management system | Complex domain, labs have own portals, low ROI for v1 | Simple order form that emails lab later |
| Custom hardware drivers (X-ray sensors) | Sensor manufacturers provide own capture software; rabbit hole | Support DICOM import. View, don't capture |
| Real-time video consultations | Not core to in-clinic workflow; separate product | Link to existing video tools if needed |
| Full EHR/EPD certification | Expensive, slow. Not required for dental-only software in NL | Follow GDPR/AVG best practices. Certify later |
| Mobile native app | Web-first is correct. Dental workflows happen on desktop/tablet | Responsive design + PWA if needed later |
| Multi-country/multi-language | NZa codes are NL-specific. Internationalization adds complexity | Hardcode Dutch. Add i18n only if expanding |
| Built-in email marketing | Dentists don't run email campaigns | Simple reminders + follow-ups via Resend/Twilio |
| Complex reporting/BI dashboard | Dentists want "how much did I bill" not pivot tables | Simple KPI widgets: revenue, appointments, patients |
| Integration marketplace/plugin system | Premature abstraction | Build direct integrations. Plugins at 1000+ practices |
| Inventory/stock management | Handled by separate systems (Henry Schein, etc.) | Out of scope entirely |

## Feature Dependencies

```
Vecozo COV check --> Vecozo declaratie submission (same integration, COV first)
NZa code browser --> Declaratie line creation --> Invoice generation
AI NZa codebook understanding --> AI declaratie from natural language --> AI declaratie validation
Odontogram tooth status --> AI treatment plan suggestions
Clinical notes --> AI clinical note generation (needs data model first)
Patient auth --> Patient portal --> Online booking --> Online payments
Patient portal --> Patient AI assistant (needs portal context)
Treatment plan creation --> Kostenraming --> Digital signatures (approve plan)
Appointment scheduling --> Patient reminders --> Smart recall system
DICOM viewer --> X-ray annotation (future)
```

## MVP Recommendation

For production readiness (testing in owner's clinic), prioritize:

### Phase 1: Complete Core Workflow (table stakes to be usable)
1. **Complete agenda/scheduling** - dentists cannot work without this
2. **Vecozo COV check** - must verify insurance before treatment
3. **Complete declaratie workflow** - manual NZa code selection, line creation, totals
4. **Complete invoice generation** - PDF with correct Dutch formatting

### Phase 2: AI Differentiators (the reason to switch)
5. **AI declaratie from natural language** - the killer feature
6. **AI NZa combinatie rules** - prevent insurance rejections
7. **AI clinical note generation** - reduce documentation burden
8. **Real-time declaratie validation** - catch errors before submission

### Phase 3: Vecozo Submission + Patient Features
9. **Vecozo declaratie submission** - electronic billing to insurers
10. **Online appointment booking** - patient self-service
11. **Online payments via Mollie** - collect eigen bijdrage
12. **Digital signatures** - consent and treatment approval

### Phase 4: Advanced AI + Polish
13. **Patient AI assistant** - explain treatments, answer questions
14. **AI treatment plan suggestions** - diagnosis to plan
15. **Smart recall system** - intelligent patient follow-up
16. **DICOM X-ray viewer** - view imported radiographs

**Defer entirely:** Lab orders, mobile app, multi-language, inventory, plugin system.

### Rationale
- Phases 1-2 make the software usable in the owner's clinic and demonstrate the AI advantage
- Phase 3 makes it sellable (electronic billing is non-negotiable for other practices)
- Phase 4 adds polish and advanced features for higher-tier subscriptions

## Vecozo Integration Notes

**Confidence: MEDIUM** (domain knowledge; could not verify current API docs)

Vecozo is the central Dutch healthcare communication platform. Two critical integrations:

1. **COV (Controle Op Verzekeringsrecht)** - Check if patient is insured, which insurer, coverage
   - Required before every treatment session
   - Uses BSN to query
   - Returns insurer code, policy number, coverage type

2. **Declaratie submission** - Submit billing claims electronically
   - Standardized Dutch healthcare message format
   - Includes NZa codes, patient BSN, practitioner AGB code, treatment dates
   - Returns acceptance/rejection with reason codes

Both require: practice Vecozo registration, AGB code, UZI-pas or server certificate, compliance with Dutch healthcare message standards.

This is the most complex integration and the biggest blocker for production use outside the owner's clinic.

## Sources

- Codebase analysis: existing PROJECT.md, code structure, NZa codebook
- Domain knowledge of Dutch dental practice workflows (MEDIUM confidence - training data)
- Competitor feature comparisons based on training data knowledge of Simplex and Exquise (not verified against current websites)

---
*Feature landscape: 2026-02-16*
