# Project Research Summary

**Project:** Nexiom (DentFlow) - Remaining Features
**Domain:** Dutch dental practice management SaaS
**Researched:** 2026-02-16
**Confidence:** MEDIUM

## Executive Summary

Nexiom is a Dutch dental practice management system with a strong existing foundation (Next.js 15, Prisma, 3D odontogram, patient portal, NZa codebook). The remaining work falls into two categories: completing table-stakes features that make the software usable in a real clinic (agenda polish, Vecozo insurance integration, declaratie workflow), and building AI-powered differentiators that justify switching from incumbent systems like Simplex and Exquise. The AI declaratie engine -- where a dentist types natural language and gets correctly coded NZa billing lines -- is the core value proposition and should be built first.

The recommended approach is to layer features by dependency and risk. AI declaratie builds on existing infrastructure (Gemini API key, NZa codebook) with no external blockers. Vecozo integration, by contrast, requires UZI certificates, a SOAP proxy service, and a signed agreement with Vecozo -- all of which take months to procure. Start the Vecozo administrative process immediately but build the code last. DICOM viewing (Cornerstone.js), digital signatures (pdf-lib + canvas), and subscription tiers (Mollie) are self-contained modules that slot in between.

The three biggest risks are: (1) AI hallucinating wrong NZa codes leading to insurance rejections or fraud allegations -- mitigate with mandatory human review and expanded validation rules; (2) sending unmasked patient PII to Gemini API violating GDPR/AVG special-category data rules -- mitigate by stripping all identifiers before API calls; (3) Vecozo certificate procurement delays blocking the entire billing pipeline -- mitigate by starting the application process now, before any code is written.

## Key Findings

### Recommended Stack

The existing stack (Next.js 15, React 19, Prisma, Tailwind, Three.js, Mollie, Zustand) remains unchanged. New additions are scoped to specific features.

**Core new technologies:**
- **Vercel AI SDK + @ai-sdk/google**: Streaming AI responses with structured output -- Next.js native, uses existing Gemini key
- **Cornerstone.js v2**: Industry-standard web DICOM rendering -- only serious option for clinical-grade X-ray viewing
- **pdf-lib + react-signature-canvas**: Digital signature capture and PDF embedding -- simple, no external service dependency
- **fast-xml-parser**: Vecozo SOAP/XML parsing -- lightweight, no callback overhead
- **Mollie Subscriptions API**: Recurring billing for subscription tiers -- already integrated for payments

**Critical stack note:** Vecozo requires a dedicated proxy service (Railway/Fly.io) because Vercel serverless functions cannot do mutual TLS with client certificates.

### Expected Features

**Must have (table stakes -- without these, no practice will use it):**
- Complete agenda/scheduling with drag-drop and multi-practitioner views
- Vecozo COV check (insurance eligibility verification)
- Complete declaratie workflow (NZa code selection, line creation, totals)
- Vecozo declaratie submission (electronic billing to insurers)
- Complete invoice generation with correct Dutch formatting

**Should have (differentiators -- the reason to switch from Simplex):**
- AI declaratie from natural language (the killer feature)
- AI NZa combinatie rules and real-time validation
- AI clinical note generation
- DICOM X-ray viewer with measurement tools
- Digital signatures for consent and treatment approval
- Patient AI chatbot
- Online appointment booking and payments

**Defer entirely:**
- Lab order management, mobile native app, multi-language, inventory, plugin system, video consultations, email marketing, complex BI dashboards

### Architecture Approach

New features follow a service-layer pattern: business logic in `src/lib/services/`, thin API route handlers, feature-gated by subscription tier. Heavy client components (DICOM viewer, signature canvas) use `next/dynamic` with SSR disabled, matching the existing Three.js pattern. Vecozo is architecturally isolated behind a proxy service to contain SOAP/mTLS complexity.

**Major components:**
1. **AI Declaratie Engine** -- NL input to NZa codes via Gemini, with rule validation and human review
2. **DICOM Viewer** -- Cornerstone.js client rendering, Blob storage, metadata in Prisma
3. **Vecozo Client** -- Isolated SOAP adapter behind mTLS proxy, COV check + declaratie submission
4. **Patient AI Chatbot** -- Gemini with anonymized patient context, strict non-diagnostic boundaries
5. **Digital Signatures** -- Canvas capture, PDF embedding, audit trail
6. **Subscription Guard** -- Feature gating at API and UI level, Mollie recurring billing

### Critical Pitfalls

1. **AI hallucinating wrong NZa codes** -- Extend treatment-validator.ts to ALL categories, mandatory dentist confirmation, never auto-submit. Track acceptance rates.
2. **Patient PII sent to Gemini API** -- Strip all identifiers before external API calls. This is a GDPR special-category data violation. Must be fixed before any AI feature goes live.
3. **Vecozo certificate procurement delays** -- Apply for Vecozo developer access immediately. Budget 2-3 months. The bottleneck is administrative, not technical.
4. **NZa codebook staleness** -- Build an admin update tool alongside AI declaratie. Codes change annually. Without updates, billing breaks silently.
5. **DICOM treated as image gallery** -- Use Cornerstone.js properly. Preserve windowing, measurements, metadata. Never convert to JPEG for storage.

## Implications for Roadmap

### Phase 1: AI Declaratie Engine
**Rationale:** Core differentiator, builds on existing Gemini key and NZa codebook, zero external blockers.
**Delivers:** Natural language to NZa billing codes with human review workflow.
**Addresses:** AI declaratie, NZa combinatie rules, real-time validation, clinical note generation.
**Avoids:** Hallucinated codes (extended validator), PII leakage (anonymization layer), codebook staleness (admin update tool built alongside).
**Stack:** Vercel AI SDK, @ai-sdk/google.
**Schema:** DeclaratieDraft + DeclaratieLine models.

### Phase 2: Digital Signatures + Subscription Tiers
**Rationale:** Self-contained, no external APIs. Signatures enable consent workflows. Subscriptions enable monetization and feature gating for all subsequent phases.
**Delivers:** E-signed consent forms, treatment plan approval with audit trail, tiered access control, Mollie recurring billing.
**Addresses:** Digital signatures, subscription billing, feature gating infrastructure.
**Avoids:** Legal insufficiency (eIDAS AES minimum with audit trail).
**Stack:** pdf-lib, react-signature-canvas, Mollie Subscriptions API.
**Schema:** Subscription model on Practice.

### Phase 3: DICOM X-ray Viewer
**Rationale:** Independent of other features, well-documented library (Cornerstone.js), extends existing patient image infrastructure.
**Delivers:** Clinical-grade DICOM viewing with windowing, measurements, zoom/pan. Upload and metadata extraction.
**Addresses:** X-ray image viewing (table stakes), annotation storage.
**Avoids:** Image gallery trap (use Cornerstone.js properly), storage cost explosion (evaluate S3/R2 for DICOM files vs Vercel Blob).
**Stack:** Cornerstone.js v2, sharp (thumbnails).
**Schema:** DicomStudy + DicomAnnotation models.

### Phase 4: Patient AI Chatbot + Online Booking
**Rationale:** Depends on proven Gemini integration from Phase 1. Depends on existing patient portal.
**Delivers:** Conversational AI for patients (explain treatments, booking help, billing questions). Enhanced online booking.
**Addresses:** Patient AI assistant, online appointment booking, online payments.
**Avoids:** Medical advice liability (hard system prompt boundaries), cross-practice data leakage (practiceId enforcement), PII to API (anonymization).
**Stack:** Vercel AI SDK (reused from Phase 1).
**Schema:** ChatMessage model.

### Phase 5: Vecozo Integration
**Rationale:** Highest risk, longest lead time. Requires UZI certificate (weeks to obtain), Vecozo agreement (bureaucratic), and SOAP proxy architecture. Build last but START the administrative process during Phase 1.
**Delivers:** COV insurance eligibility check, electronic declaratie submission to insurers.
**Addresses:** Vecozo COV check and declaratie submission (both table stakes for selling to other practices).
**Avoids:** Certificate procurement delays (apply NOW), SOAP complexity leaking into app (isolated proxy service).
**Stack:** fast-xml-parser, Node.js native TLS, proxy on Railway/Fly.io.

### Phase 6: Complete Core Workflow Polish
**Rationale:** Agenda improvements, invoice PDF polish, referral letters, recall system. These are incremental improvements to existing features, best done after the major new systems are in place.
**Delivers:** Production-ready agenda, complete invoicing, smart recall.
**Addresses:** Remaining table-stakes gaps (scheduling polish, invoice formatting, patient reminders).

### Phase Ordering Rationale

- AI Declaratie first because it has zero external blockers and is the product's reason to exist. It also validates the Gemini integration pattern reused in Phase 4.
- Subscriptions in Phase 2 because every subsequent feature needs gating infrastructure.
- Vecozo last in code but first in administrative action -- file the application during Phase 1.
- DICOM is independent and slots in wherever capacity allows; Phase 3 is a natural fit.
- Patient chatbot after declaratie AI because it reuses the same Gemini patterns and learnings.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (AI Declaratie):** NZa combinatie rule logic is complex. Need to map all code combination constraints. The existing treatment-validator covers only 3 categories.
- **Phase 5 (Vecozo):** SOAP message formats, Vektis EI standard structure, UZI certificate setup. Almost no public documentation. Needs Vecozo developer portal access.
- **Phase 3 (DICOM):** Cornerstone.js v2 + Next.js integration specifics. Verify supported DICOM transfer syntaxes for common dental X-ray hardware.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Signatures + Subscriptions):** Well-documented libraries (pdf-lib, Mollie API). Standard patterns.
- **Phase 4 (Patient Chatbot):** Reuses Phase 1 AI patterns. Standard conversational AI with guardrails.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Recommendations from training data. Verify package versions before installing. |
| Features | MEDIUM | Based on domain knowledge of Dutch dental market. Competitor features not verified against current websites. |
| Architecture | MEDIUM-HIGH | Service layer pattern is sound. Vecozo proxy architecture needs validation against actual Vecozo requirements. |
| Pitfalls | HIGH | GDPR, DICOM, and NZa staleness risks are well-established. Vecozo specifics need validation. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Vecozo API specifics:** Cannot verify SOAP message formats, endpoint URLs, or sandbox setup without Vecozo developer portal access. Apply for access immediately.
- **NZa combinatie rules completeness:** The full set of code combination constraints is not documented in the codebase. Need to source from NZa tarievenboekje or experienced billers.
- **Cornerstone.js v2 + Next.js:** No verified integration guide. The SSR-disabled dynamic import pattern should work but needs a spike.
- **eIDAS signature requirements for dental consent:** Legal verification needed on whether AES is sufficient or QES is required for specific procedure types.
- **DICOM storage cost modeling:** Need to calculate actual storage volumes and costs for Vercel Blob vs S3/R2 based on typical practice X-ray volume.
- **Gemini API pricing at scale:** Free tier rate limits will be hit quickly. Need to model costs for paid tier at 10-50 practices.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis (schema, API routes, components, NZa codebook)
- GDPR/AVG medical data classification requirements
- DICOM standard specifications

### Secondary (MEDIUM confidence)
- Cornerstone.js capabilities (training data, not verified against current v2 docs)
- Vecozo authentication requirements (domain knowledge, not verified against current portal)
- NZa tarievenboekje update cycle (domain knowledge)
- Dutch dental market competitor features (Simplex, Exquise -- not verified)

### Tertiary (LOW confidence)
- Vecozo SOAP message format specifics (needs developer portal access to validate)
- eIDAS application to dental consent specifically (needs legal review)

---
*Research completed: 2026-02-16*
*Ready for roadmap: yes*
