# Domain Pitfalls

**Domain:** Dutch dental practice management SaaS (AI declaratie, DICOM, Vecozo, patient AI)
**Researched:** 2026-02-16

## Critical Pitfalls

### Pitfall 1: AI Declaratie Hallucinating Valid-Looking But Wrong NZa Codes

**What goes wrong:** The AI generates plausible NZa codes that pass format validation but are clinically incorrect -- wrong surface count for vullingen, wrong canal count for endo, or codes from the wrong category entirely. The current system already has a treatment-validator safety net, but it only covers vulling/endo/extractie rules. The AI can still hallucinate codes in uncovered categories (orthodontie, implantologie, gnathologie) where no hard rule validation exists.

**Why it happens:** LLMs pattern-match on text similarity, not clinical logic. "Implantaat kroon" might trigger both implantology AND crown codes. Dutch dental abbreviations are ambiguous ("ext" could be extractie or extensie). The current `CATEGORY_TRIGGERS` keyword matching sends relevant codebook sections, but overlapping terminology across categories causes confusion.

**Consequences:** Incorrect declaraties submitted to insurance. Financial liability for the practice. Possible fraud allegations if systematic over-billing occurs. Loss of Vecozo accreditation.

**Prevention:**
- Extend `treatment-validator.ts` to cover ALL NZa categories, not just vullingen/endo/extractie
- Add a mandatory dentist confirmation step -- never auto-submit AI suggestions
- Log every AI suggestion vs. dentist final selection to build accuracy metrics
- Add combination rules (codes that cannot coexist on the same tooth/session)
- Add per-code tariff ceiling alerts when total exceeds typical session amounts

**Detection:** Track AI suggestion acceptance rate. If dentists reject >30% of suggestions, the model prompt needs rework. Monitor for codes the validator never corrects (blind spots).

**Phase:** AI Declaratie phase -- must be addressed before any production use.

---

### Pitfall 2: Sending Full Patient Data to External AI APIs Without Anonymization

**What goes wrong:** The current `ai/chat/route.ts` sends raw patient data (names, BSN-linked IDs, DOB, medical history, allergies, medications) directly to Gemini API via `JSON.stringify(patientData)`. This violates GDPR Article 28 (processor agreements) and Dutch WGBO medical confidentiality requirements.

**Why it happens:** Fast prototyping -- getting the feature working first, compliance later. Google's Gemini API terms may allow data processing, but the Dutch AP (Autoriteit Persoonsgegevens) requires explicit DPIA for medical data sent to US cloud providers. The AVG (Dutch GDPR) classifies dental records as "bijzondere persoonsgegevens" (special category data).

**Consequences:** Regulatory fines up to 4% of revenue. Practice license risk. Patient trust destruction. Potential criminal liability under WGBO for unauthorized disclosure of medical records.

**Prevention:**
- Strip all PII before sending to external AI: replace names with "Patient A", remove BSN references, use relative dates ("3 months ago" not "2025-11-15")
- For declaratie AI: only send clinical notes + NZa codebook, never patient identifiers (current analyze-notes route is OK here -- it only sends notes text)
- For chat AI: anonymize patient data before prompt injection, de-anonymize in response
- Document a DPIA (Data Protection Impact Assessment) before launching any AI feature
- Consider EU-hosted AI alternatives or self-hosted models for sensitive queries

**Detection:** Audit all AI API calls -- grep for patient names/BSN/DOB in outgoing request bodies. Add middleware that blocks requests containing PII patterns.

**Phase:** Must be addressed in EVERY phase that touches AI. Blocking issue for patient-facing AI chatbot.

---

### Pitfall 3: DICOM Viewer Treating It as "Just Another Image Format"

**What goes wrong:** Teams build a DICOM viewer as a fancy image gallery. DICOM files contain critical metadata (patient ID, study date, modality, window/level settings, pixel spacing for measurements) that gets lost when converting to PNG/JPEG for display. Dentists need to measure distances (implant length), adjust contrast (periapical pathology), and cross-reference with treatment records.

**Why it happens:** Web DICOM rendering is genuinely hard. DICOM files use custom binary encoding, 12-16 bit grayscale (not 8-bit RGB), and various compression schemes (JPEG2000, RLE, raw). The temptation is to server-side convert to JPEG and display that.

**Consequences:** Clinically useless viewer -- dentists keep using separate DICOM software. Measurements are impossible without pixel spacing metadata. Wrong window/level makes pathology invisible. Regulatory risk if diagnostic decisions are made on lossy-compressed images.

**Prevention:**
- Use Cornerstone.js (cornerstonejs.org) -- the de facto standard for web DICOM rendering. It handles windowing, measurements, and DICOM parsing client-side
- Keep DICOM files in their original format in storage (Vercel Blob or S3), never convert to JPEG for storage
- Parse DICOM tags server-side only for metadata indexing (patient matching, study organization)
- Support only the DICOM formats your target X-ray machines produce (dental: usually intraoral sensors producing uncompressed DICOM or JPEG-LS)

**Detection:** If the viewer cannot adjust window/level or make ruler measurements, it is a glorified image gallery, not a DICOM viewer.

**Phase:** DICOM viewer phase. Research Cornerstone.js integration with Next.js (client-side only, no SSR -- same pattern as existing Three.js components with `dynamic({ ssr: false })`).

---

### Pitfall 4: NZa Codebook Becoming Stale Without Update Mechanism

**What goes wrong:** NZa publishes new tarievenboekje annually (usually effective January 1). Codes get added, removed, tariffs change. The current system has `nza-codebook.ts` with hardcoded examples and `NzaCode` DB records. If these are not updated, the system suggests deprecated codes or wrong prices.

**Why it happens:** The initial import works perfectly. Nobody builds the annual update process. A year later, codes are wrong and nobody notices until a dentist complains about rejected declaraties.

**Consequences:** Incorrect billing. Insurance rejections. Dentist loses trust in the system. If the system charges old (lower) tariffs, the practice loses revenue. If it charges new (higher) tariffs for deprecated codes, insurance rejects claims.

**Prevention:**
- Build an NZa code import/update admin tool, not just a one-time seed
- Track `validFrom` and `validUntil` dates on every NzaCode (already in schema -- good)
- Add a dashboard warning when codes are approaching expiry or when a new tarievenboekje is available
- Version the `nza-codebook.ts` examples so AI prompts use the correct year's examples
- Automated test: "no active code has validUntil in the past"

**Detection:** Calendar reminder for January NZa update. Dashboard metric showing count of codes expiring within 60 days.

**Phase:** Should be built alongside AI declaratie, not deferred.

---

### Pitfall 5: Vecozo Integration Underestimating Certificate Complexity

**What goes wrong:** Vecozo (the Dutch healthcare clearinghouse) requires UZI-pas (smartcard) or server certificates for authentication. Developers assume it is a standard REST API with API keys. It is not. Vecozo uses mutual TLS with X.509 certificates issued by CIBG, SOAP-based messaging for COV (coverage checks) and declaratie submission, and has a sandbox environment with different certificates than production.

**Why it happens:** Limited public documentation. Vecozo's developer portal requires a signed agreement. Most info online is from legacy system vendors who built integrations years ago.

**Consequences:** Months of unexpected work. Possibly needing a UZI-server certificate (costs money, takes weeks to obtain). Architecture that assumed REST needs rework for SOAP/XML.

**Prevention:**
- Apply for Vecozo developer access IMMEDIATELY -- before writing any integration code
- Budget 2-3 months for Vecozo integration, not 2-3 weeks
- Plan for SOAP/XML message handling (use a library like `soap` or `strong-soap` for Node.js)
- Design the integration as an isolated service/module so SOAP complexity does not leak into the rest of the app
- Start with COV-check (coverage verification) -- it is the simplest Vecozo endpoint and validates your certificate setup

**Detection:** If you cannot make a single successful sandbox request within the first week, escalate immediately. Certificate issues compound.

**Phase:** Vecozo integration phase. This is the highest-risk phase and should start early (certificate procurement is the bottleneck, not code).

## Moderate Pitfalls

### Pitfall 6: Patient AI Chatbot Giving Medical Advice

**What goes wrong:** The patient-facing AI assistant answers questions like "Is mijn vulling losgeraakt?" with clinical assessments instead of directing to the practice. Liability nightmare.

**Prevention:**
- Hard-code system prompt boundaries: the chatbot can explain existing treatment plans, help with appointment booking, answer billing questions. It must NEVER diagnose, suggest treatments, or interpret symptoms
- Add output filtering that blocks responses containing diagnostic language
- Every response should end with "Neem contact op met de praktijk voor medisch advies" when the question touches clinical topics
- Log all patient AI conversations for audit

**Phase:** Patient AI chatbot phase.

---

### Pitfall 7: Digital Signatures Without Qualified Electronic Signature (QES) Compliance

**What goes wrong:** Implementing "click to sign" for consent forms and assuming it is legally binding. Under Dutch law (and eIDAS regulation), medical consent requires at minimum an Advanced Electronic Signature (AES). A simple checkbox or drawn signature may not hold up.

**Prevention:**
- For treatment consent: AES is sufficient (verifiable identity + tamper-evident). Use a timestamped hash of the consent document + patient identity verification
- Do NOT build your own signature crypto -- use an eIDAS-compliant service
- Store the signed document hash, timestamp, IP address, and authentication method used
- For high-risk procedures: consider qualified signatures via DigiD or iDIN

**Phase:** Digital signatures phase.

---

### Pitfall 8: AI Chat Exposing Cross-Practice Patient Data

**What goes wrong:** The current `ai/chat/route.ts` correctly scopes patient search by `practiceId`. But if multi-tenancy boundaries are not consistently enforced across ALL AI endpoints, a dentist at Practice A could query data from Practice B.

**Prevention:**
- Every database query in every AI endpoint must include `practiceId` filter
- Add integration tests that verify cross-practice data isolation
- The AI system prompt should never receive data from other practices

**Detection:** Audit query: any AI-adjacent DB query missing `practiceId` in its WHERE clause.

**Phase:** All AI phases.

---

### Pitfall 9: DICOM Files Blowing Up Vercel Blob Storage Costs

**What goes wrong:** Dental CBCT scans can be 50-500MB per study. Panoramic X-rays are 5-20MB. A practice doing 20 X-rays/day generates 100-400MB/day. Vercel Blob charges per GB stored and per GB transferred.

**Prevention:**
- Calculate storage cost projections before choosing Vercel Blob for DICOM
- Consider dedicated object storage (S3, Backblaze B2) for DICOM files, keep Vercel Blob for small files (documents, profile photos)
- Implement retention policies -- practices do not need instant access to 10-year-old X-rays
- Use DICOM compression (lossless JPEG-LS) to reduce file sizes 40-60%

**Phase:** DICOM viewer phase -- storage architecture decision needed upfront.

## Minor Pitfalls

### Pitfall 10: Gemini API Rate Limits During Peak Hours

**What goes wrong:** Multiple dentists simultaneously generating declaraties during end-of-day billing rush. Gemini free tier has strict rate limits; even paid tier can throttle.

**Prevention:**
- Add request queuing with retry logic for 429 responses
- Cache identical note patterns (same treatment abbreviations should produce same codes)
- Have a manual fallback (NZa code browser already exists) when AI is unavailable
- Display clear "AI tijdelijk niet beschikbaar" message, not a generic error

**Phase:** AI declaratie phase.

---

### Pitfall 11: Dutch Language NLP Edge Cases

**What goes wrong:** Dentists write in mixed Dutch/English/Latin abbreviations. "WKB 36 3k" means root canal treatment on tooth 36 with 3 canals. "Comp MO 46 + ext 48" means composite filling AND extraction in one note. The current keyword trigger system handles common cases but misses:
- Negations: "geen vulling nodig" (no filling needed) still triggers vulling category
- Compound notes: multiple treatments in one sentence
- Regional dialect variations

**Prevention:**
- Add negation detection ("geen", "niet", "hoeft niet") to category triggers
- Split compound notes on delimiters (+, ;, newline) before AI processing
- Build a test suite of 50+ real clinical note examples with expected NZa codes

**Phase:** AI declaratie refinement.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| AI Declaratie | Hallucinated codes in uncovered categories | Extend validator to all NZa categories |
| AI Declaratie | NZa codebook staleness | Build admin update tool alongside |
| DICOM Viewer | Treating DICOM as image gallery | Use Cornerstone.js, preserve metadata |
| DICOM Viewer | Storage cost explosion | Evaluate dedicated object storage |
| Vecozo Integration | Certificate procurement delay | Apply for access immediately |
| Vecozo Integration | SOAP/XML architecture mismatch | Isolate as separate service module |
| Patient AI Chatbot | Medical advice liability | Hard system prompt boundaries + output filtering |
| Patient AI Chatbot | GDPR violation on patient data | Anonymize before external API calls |
| Digital Signatures | Legal insufficiency | Use eIDAS-compliant AES minimum |
| All AI Features | Cross-practice data leakage | Enforce practiceId on every query |

## Sources

- Codebase analysis: `apps/web/src/app/api/ai/analyze-notes/route.ts`, `apps/web/src/lib/ai/treatment-validator.ts`, `apps/web/src/app/api/ai/chat/route.ts`
- NZa tarievenboekje structure: inferred from `NzaCode` schema fields (validFrom, validUntil, maxTariff)
- Vecozo technical requirements: MEDIUM confidence (based on domain knowledge, not verified against current Vecozo developer portal -- needs validation)
- DICOM standards: HIGH confidence (well-established standard)
- GDPR/AVG medical data requirements: HIGH confidence (established regulation)
- eIDAS signature requirements: MEDIUM confidence (regulation is clear, application to dental consent specifically needs legal verification)
