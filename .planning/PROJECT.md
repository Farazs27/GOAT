# Nexiom — Dental Practice Management Software

## What This Is

Nexiom is a next-generation dental practice management system for the Dutch market, replacing outdated systems like Simplex and Exquise Next Gen. Built by a dentist for the new generation of dentists, it combines modern UI/UX with AI-powered clinical workflows. The system handles the full patient journey from check-in to checkout — agenda, odontogram, treatment planning, declaratie, X-rays, billing, and a patient portal — all in one platform.

## Core Value

AI-powered declaratie and clinical note generation: the dentist describes what they did in natural language, and the system automatically generates correct NZa codes, clinical notes, and complete declaratie lines — eliminating the most painful part of dental practice management.

## Requirements

### Validated

<!-- Existing capabilities inferred from current codebase (40% complete across all features) -->

- ✓ Staff authentication with JWT (login, refresh, role-based access) — existing
- ✓ Patient authentication with BSN-based login — existing
- ✓ Multi-tenant practice isolation (practiceId scoping) — existing
- ✓ Patient CRUD with clinical data (teeth, surfaces, notes) — existing
- ✓ Odontogram with 3D visualization (32 teeth, FDI numbering, click-to-inspect) — existing
- ✓ Treatment plan creation and tracking — existing (partial)
- ✓ NZa codebook in system (codes, descriptions, opmerkingen) — existing
- ✓ Declaratie/billing UI with code browser — existing (partial)
- ✓ Invoice generation with PDF export — existing (partial)
- ✓ Appointment scheduling and agenda — existing (partial)
- ✓ Patient portal with glass UI (appointments, profile, messages) — existing (partial)
- ✓ Patient images and document storage (Vercel Blob) — existing
- ✓ Mollie payment integration — existing (partial)
- ✓ Email via Resend, SMS/WhatsApp via Twilio — existing (partial)
- ✓ Admin panel (users, practices, audit logs) — existing
- ✓ AI clinical note analysis via Gemini — existing (non-functional)
- ✓ Dashboard with widgets and slideout panels — existing

### Active

<!-- What needs to be built/completed to reach 100% -->

- [ ] Complete odontogram clinical workflow (tooth status recording, restoration tracking, history)
- [ ] Complete treatment planning (create, approve, track, link to declaratie)
- [ ] AI declaratie assistant — natural language input to NZa code generation
- [ ] AI understands full NZa codebook (codes + descriptions + opmerkingen + combinatie rules)
- [ ] AI auto-generates complete declaratie lines (filling → rubberdam + anesthesia + X-ray + composiet)
- [ ] AI clinical note generation from natural language description
- [ ] AI treatment plan suggestions based on diagnosis
- [ ] Declaratie review workflow (AI suggests, dentist confirms before submission)
- [ ] Full DICOM X-ray integration (capture + viewer)
- [ ] Patient portal AI assistant (explains treatment, answers questions, books appointments, follow-up nudges)
- [ ] Online appointment booking (patient self-service)
- [ ] Online payments via Mollie (iDEAL)
- [ ] Digital signatures (consent forms, treatment approvals)
- [ ] Complete billing/invoicing workflow
- [ ] Vecozo integration (COV/BSN checks, declaratie submission)
- [ ] Complete patient portal (all features functional)
- [ ] Complete agenda/scheduling system
- [ ] Subscription tier system (feature-based access control)
- [ ] Periodontal charting (probing data entry and tracking)
- [ ] Clinical notes with AI-powered documentation
- [ ] Patient communication automation (reminders, follow-ups)

### Out of Scope

- Mobile native app — web-first, responsive design only
- Integration with other EU dental systems — Netherlands only for v1
- Custom hardware integration — use standard DICOM-compatible devices
- Real-time video consultations — not core to in-clinic workflow
- Lab order management — defer to future version

## Context

- **Market:** Dutch dental practices currently use Simplex, Exquise Next Gen, and similar legacy systems that are feature-bloated with poor UI/UX
- **Builder:** Owner is a practicing dentist who understands the clinical workflow firsthand
- **Current state:** ~40% complete across all features — UI exists for most areas but functionality is incomplete
- **Testing plan:** Test in owner's clinic first, then sell to other Dutch dental clinics
- **Business model:** Subscription-based SaaS with feature-based tiers (more features = higher tier)
- **Patient flow:** Standard Dutch dental flow — arrival → anamnesis check → treatment → declaratie → next appointment
- **NZa codes:** Already imported into system; AI must learn all codes, descriptions, and opmerkingen to auto-generate declaraties
- **Key frustration:** NZa code management is the #1 pain point — finding codes, knowing combinations, avoiding rejections

## Constraints

- **Tech stack**: Next.js 15 + React 19 + Prisma + Neon Postgres (already established, no migration)
- **Market**: Netherlands only — must comply with Dutch dental regulations, NZa codes, Vecozo
- **Payments**: Mollie (already integrated, needs completion)
- **AI provider**: Google Gemini (already configured)
- **Auth**: JWT-based dual auth (staff + patient) — no middleware, no change
- **3D**: React Three Fiber for odontogram — locked orientation, do not change
- **Hosting**: Vercel (Next.js optimized)
- **Privacy**: GDPR + Dutch healthcare data regulations (AVG)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI declaratie: always review before submit | Dentist must confirm AI suggestions — medical liability | — Pending |
| Mollie for payments | Dutch market standard, iDEAL support, already integrated | — Pending |
| Feature-based subscription tiers | More flexible than role-based; scales with clinic size | — Pending |
| Full DICOM for X-rays | Not just import — direct capture + viewer for complete workflow | — Pending |
| Patient AI assistant in portal | Differentiator: AI that talks to patients, explains treatment, books appointments | — Pending |
| Vecozo for insurance | Required for Dutch dental declaratie submission | — Pending |
| NZa AI understanding | AI must know all codes + opmerkingen + combinatie rules, not just code lookup | — Pending |

---
*Last updated: 2026-02-16 after initialization*
