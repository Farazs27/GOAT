---
phase: 08-patient-portal-advanced
verified: 2026-02-17T18:30:00Z
status: passed
score: 7/7 truths verified
re_verification:
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "Staff can create, edit, and deactivate consent form templates via dedicated page"
  gaps_remaining: []
  regressions: []
---

# Phase 8: Patient Portal Advanced Verification Report

**Phase Goal:** Patients can sign documents digitally and book appointments online
**Verified:** 2026-02-17
**Status:** passed
**Re-verification:** Yes -- after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Patient can digitally sign consent forms | VERIFIED | consent/page.tsx has scroll-to-bottom gating, signature canvas, fetches /consent/[id]/sign |
| 2 | Patient can sign treatment plans | VERIFIED | behandelplan/page.tsx fetches /treatment-plans/[id]/sign (line 199) |
| 3 | Patient can book appointments online | VERIFIED | book/page.tsx has type->practitioner->slot flow, fetches availability + book APIs |
| 4 | Bookings require staff approval | VERIFIED | book API creates with PENDING_APPROVAL, approve API validates and updates status |
| 5 | Staff can manage consent templates and overview | VERIFIED | templates/page.tsx (375 lines) has full CRUD: create, edit, toggle active, deactivate. Overview links to it. |
| 6 | Patient portal shows unsigned consent badge | VERIFIED | layout.tsx fetches consent forms, counts PENDING, shows badge on sidebar |
| 7 | Signed consent PDF downloadable | VERIFIED | consent/[id]/pdf/route.ts uses jsPDF with embedded signature |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `packages/database/prisma/schema.prisma` (ConsentTemplate) | VERIFIED | Model exists with contentNl, contentEn, expiryDays, consentType, isActive |
| `schema.prisma` (ConsentForm enhanced fields) | VERIFIED | templateId, signedUserAgent, signerRelation, signatureUrl, version all present |
| `api/patient-portal/consent/[id]/sign/route.ts` | VERIFIED | Uses @vercel/blob put() to upload signature PNG to signatures/ path |
| `api/patient-portal/treatment-plans/[id]/sign/route.ts` | VERIFIED | File exists, exports POST |
| `api/patient-portal/consent/[id]/pdf/route.ts` | VERIFIED | Uses jsPDF for PDF generation |
| `(patient)/portal/consent/page.tsx` | VERIFIED | Scroll-to-bottom gating, signature flow, PDF download |
| `(patient)/portal/behandelplan/page.tsx` | VERIFIED | Signing flow for treatment plans |
| `(patient)/portal/appointments/book/page.tsx` | VERIFIED | Multi-step booking: type, practitioner, availability, confirm |
| `api/patient-portal/appointments/book/route.ts` | VERIFIED | Max pending check, PENDING_APPROVAL status |
| `api/patient-portal/appointments/availability/route.ts` | VERIFIED | File exists |
| `api/dashboard/consent-templates/route.ts` | VERIFIED | CRUD API for templates |
| `api/dashboard/consent-templates/[id]/route.ts` | VERIFIED | Individual template operations |
| `api/dashboard/consent/route.ts` | VERIFIED | Global consent overview with filters |
| `api/dashboard/consent/send/route.ts` | VERIFIED | Bulk create via createMany |
| `api/dashboard/consent/export/route.ts` | VERIFIED | CSV export with headers |
| `(dashboard)/dashboard/consent/page.tsx` | VERIFIED | Overview with filters, export, template links |
| `(dashboard)/dashboard/consent/templates/page.tsx` | VERIFIED | 375 lines. Full CRUD: create/edit/toggle/deactivate templates via authFetch to /api/dashboard/consent-templates. Modal editor with all fields (title, type, contentNl, contentEn, expiryDays). Grid card layout with usage counts. |
| `api/dashboard/appointments/approve/route.ts` | VERIFIED | Validates PENDING_APPROVAL, updates status |
| `(patient)/portal/layout.tsx` (consent badge) | VERIFIED | Fetches consent forms, counts unsigned, shows badge |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| consent sign API | @vercel/blob | put() for signature PNG | WIRED |
| consent PDF API | jspdf | new jsPDF() | WIRED |
| consent page | /consent/[id]/sign | fetch POST | WIRED |
| behandelplan page | /treatment-plans/[id]/sign | fetch POST | WIRED |
| book page | /appointments/availability | fetch GET | WIRED |
| book API | prisma.appointment | PENDING_APPROVAL create | WIRED |
| approve API | prisma.appointment | PENDING_APPROVAL update | WIRED |
| dashboard consent page | /api/dashboard/consent | authFetch GET | WIRED |
| dashboard consent send | prisma.consentForm.createMany | bulk create | WIRED |
| dashboard consent overview | /dashboard/consent/templates | Link href (line 191) | WIRED |
| templates page | /api/dashboard/consent-templates | authFetch GET/POST/PATCH/DELETE | WIRED |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| PORT-06: Patient can digitally sign consent forms and treatment approvals | SATISFIED | Full signing flow + staff template management |
| AGND-05: Patient can book appointments online through portal | SATISFIED | Full booking flow with approval |

### Anti-Patterns Found

None found in scanned files.

### Human Verification Required

### 1. Consent Signing E2E Flow
**Test:** Log in as patient, navigate to consent, scroll content to bottom, draw signature, submit
**Expected:** Signature uploads, consent status changes to SIGNED, toast confirmation shown
**Why human:** Requires canvas interaction and visual confirmation

### 2. Appointment Booking Flow
**Test:** Log in as patient, navigate to book appointment, select type/practitioner/slot, confirm
**Expected:** Appointment created with PENDING_APPROVAL, shown as "Wacht op bevestiging"
**Why human:** Multi-step UI flow with state transitions

### 3. Staff Booking Approval
**Test:** Log in as staff, find pending booking, approve it
**Expected:** Status changes to CONFIRMED, patient sees updated status
**Why human:** Cross-portal flow

### 4. Consent Template Management
**Test:** Log in as staff, navigate to Consent > Sjablonen, create a new template, edit it, toggle active status
**Expected:** Template appears in grid, edits persist, toggle changes opacity/icon
**Why human:** Modal interaction and visual state changes

---

_Verified: 2026-02-17_
_Verifier: Claude (gsd-verifier)_
