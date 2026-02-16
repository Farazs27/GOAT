# Architecture Patterns

**Domain:** Dental practice management with AI, DICOM, and insurance integration
**Researched:** 2026-02-16

## Current Architecture (Baseline)

The existing system is a Next.js 15 monorepo with 119 API routes, Prisma on Neon Postgres, JWT dual-auth, and external integrations (Mollie, Resend, Twilio, Gemini). All new components must integrate into this structure without disrupting the stable dashboard or patient portal.

## Recommended Architecture for New Components

```
                        Next.js App (Vercel)

  Dashboard (staff)    Patient Portal    Admin Panel
       |                    |
  ─────┴────────────────────┴──────────────────────────
                   API Layer (route handlers)

  /api/ai/declaratie/*        AI Declaratie Engine
  /api/dicom/*                DICOM Upload/Metadata
  /api/vecozo/*               Insurance Integration
  /api/subscriptions/*        Tier Management
  /api/signatures/*           Digital Signatures
  /api/patient-portal/chat/*  Patient AI Chatbot
  ─────────────────────────────────────────────────────
              Service Layer (new: src/lib/services/)

  declaratie-engine.ts    NZa code resolution + rules
  dicom-service.ts        DICOM parse/metadata
  vecozo-client.ts        Vecozo SOAP/REST adapter
  subscription-guard.ts   Feature gate checks
  signature-service.ts    PDF signing + verification
  chatbot-service.ts      Patient AI conversation mgmt
  ─────────────────────────────────────────────────────
  Prisma (Neon PG)  |  Gemini AI  |  Vecozo API  |  Vercel Blob

External Libraries:
  Cornerstone.js (DICOM parsing/rendering)
```

## Component Boundaries

| Component | Responsibility | Communicates With | New Files |
|-----------|---------------|-------------------|-----------|
| **AI Declaratie Engine** | NZa code suggestion from natural language, combinatie rules, opmerkingen validation | Gemini API, NZa codebook, Prisma (treatments, teeth) | `src/lib/services/declaratie-engine.ts`, `src/app/api/ai/declaratie/route.ts` |
| **DICOM Viewer** | Upload, parse, display dental X-rays (periapical, panoramic) | Vercel Blob (storage), Cornerstone.js (rendering), Prisma (metadata) | `src/components/dicom/`, `src/app/api/dicom/`, `src/lib/services/dicom-service.ts` |
| **Vecozo Integration** | COV check (insurance verification), BSN validation, declaratie submission | Vecozo SOAP API, Prisma (patients, invoices), UZI certificate | `src/lib/services/vecozo-client.ts`, `src/app/api/vecozo/` |
| **Patient AI Chatbot** | Conversational AI for patients: explain treatments, answer questions, book appointments | Gemini API, Prisma (patient data, appointments), existing patient auth | `src/app/api/patient-portal/chat/route.ts`, `src/lib/services/chatbot-service.ts` |
| **Digital Signatures** | Consent form signing, treatment plan approval with audit trail | PDF generation, Prisma (consent records), canvas/typed signatures | `src/lib/services/signature-service.ts`, `src/app/api/signatures/` |
| **Subscription Tiers** | Feature gating based on practice subscription level | Prisma (practice subscription), Mollie (recurring billing), all API routes (guard) | `src/lib/services/subscription-guard.ts`, `src/app/api/subscriptions/` |

## Detailed Component Architecture

### 1. AI Declaratie Engine

This is the core differentiator. Architecture must support the full flow: natural language input -> structured NZa codes -> human review -> submission.

```
Dentist types: "Composiet vulling 36 MOD, met rubberdam en anesthesie"
       |
       v
  Declaratie Engine
    1. Parse intent          (Gemini with NZa codebook context)
    2. Resolve codes         (nza-codebook.ts, already exists)
    3. Apply combinatie rules (Rule engine for code combinations)
    4. Check opmerkingen     (Validation against NZa remarks)
    5. Generate lines        (Structured declaratie output)
       |
       v
  Review UI (dentist confirms, edits, approves/rejects per line)
       |
       v
  Submit to Vecozo (or save as draft invoice)
```

**Key design decisions:**
- The NZa codebook (`src/lib/ai/nza-codebook.ts`) is already in the system. Feed it as structured context to Gemini, not as free-text.
- Combinatie rules (e.g., V-codes always need anesthesie code, X-ray accompanies certain procedures) should be a **rule engine separate from AI**. AI suggests, rules validate.
- Store AI suggestions in a `DeclaratieDraft` table with status (suggested/approved/rejected/submitted).
- Gemini prompt must include: tooth number, surfaces, procedure type, patient age, insurance type.

**Schema additions:**
```prisma
model DeclaratieDraft {
  id            String   @id @default(cuid())
  patientId     String
  practiceId    String
  treatmentId   String?
  status        DraftStatus  // SUGGESTED, APPROVED, REJECTED, SUBMITTED
  aiInput       String       // Original natural language
  aiOutput      Json         // Full AI response
  lines         DeclaratieLine[]
  createdAt     DateTime @default(now())
  submittedAt   DateTime?
}

model DeclaratieLine {
  id            String   @id @default(cuid())
  draftId       String
  nzaCode       String
  description   String
  toothNumber   Int?
  surfaces      String?
  amount        Decimal
  approved      Boolean  @default(false)
}
```

### 2. DICOM Viewer

Use **Cornerstone.js 3** (via `@cornerstonejs/core` + `@cornerstonejs/dicom-image-loader`) for DICOM rendering. This is the standard web DICOM library -- OHIF Viewer is built on it but is overkill for embedded use.

```
Upload Flow:
  File input (.dcm) -> Parse metadata (dicomParser) -> Store file in Vercel Blob
  -> Store metadata in Prisma (DicomStudy table) -> Link to patient + tooth

Viewing Flow:
  Load metadata from Prisma -> Fetch blob URL -> Cornerstone.js renders in canvas
  -> Tools: zoom, pan, window/level, measure, annotate
```

**Key design decisions:**
- Store DICOM files in Vercel Blob (same as existing patient images). Extract metadata server-side before storage.
- Viewer is a client-only component (`next/dynamic` with `ssr: false`), same pattern as odontogram 3D.
- For dental: periapical (small) and panoramic (OPG) are the main types. CBCT (3D) is out of scope for v1.
- Annotations stored in Prisma, not baked into DICOM files.

**Schema additions:**
```prisma
model DicomStudy {
  id            String   @id @default(cuid())
  patientId     String
  practiceId    String
  studyDate     DateTime
  modality      String   // IO (intraoral), PX (panoramic)
  description   String?
  blobUrl       String
  thumbnailUrl  String?
  metadata      Json     // Parsed DICOM tags
  toothNumbers  Int[]    // Associated teeth (FDI)
  annotations   DicomAnnotation[]
  createdAt     DateTime @default(now())
}
```

**Component structure:**
```
src/components/dicom/
  dicom-viewer.tsx        Main viewer (Cornerstone canvas)
  dicom-toolbar.tsx       Zoom, pan, W/L, measure tools
  dicom-upload.tsx        Upload + metadata extraction
  dicom-thumbnail.tsx     Grid thumbnail for study list
```

### 3. Vecozo Integration

Vecozo is the Dutch healthcare clearinghouse. Integration requires a **UZI server certificate** (hardware or software) for mutual TLS authentication. This is the hardest integration technically.

```
COV Check (insurance verification):
  Patient BSN -> Vecozo COV service -> Insurance status + policy details
  -> Store in Prisma for billing decisions

Declaratie Submission:
  Approved declaratie lines -> Format as Vektis EI standard
  -> Submit via Vecozo -> Track response (accepted/rejected/info needed)
```

**Key design decisions:**
- Vecozo uses **SOAP/XML** APIs with WS-Security and mutual TLS (UZI certificate). Create an adapter that abstracts this behind a clean TypeScript interface.
- UZI certificate management: store certificate path + passphrase in `Credential` table (type='VECOZO'). The actual .p12/.pfx file lives on the server or in a secure vault.
- **Start with COV check only** (simpler, immediate value). Declaratie submission is complex and requires Vektis message formatting.
- On Vercel: mutual TLS with client certificates is problematic. Needs a **small proxy service** (e.g., Node.js container on Railway/Fly.io) that holds the UZI cert and forwards requests.

**Architecture for Vecozo proxy:**
```
Next.js (Vercel) -> HTTPS -> Vecozo Proxy (Railway/Fly)
                                |
                                +-- UZI Certificate (mounted)
                                +-- SOAP client (soap npm package)
                                +-- mTLS to Vecozo servers
```

### 4. Patient AI Chatbot

Conversational AI scoped to the authenticated patient's data. Uses Gemini with patient context.

```
Patient message -> Chatbot Service:
  1. Load patient context (appointments, treatments, notes)
  2. Build system prompt ("You are a dental assistant for...")
  3. Call Gemini with conversation history
  4. Parse response for structured actions (book, cancel)
  5. Execute actions via service layer
  6. Return response + store in ChatMessage table
```

**Key design decisions:**
- Conversation history stored in `ChatMessage` table (patient-scoped).
- System prompt includes: patient's upcoming appointments, active treatment plans, practice info, available slots.
- **Action detection**: If Gemini response contains structured actions (book appointment, request callback), parse and execute via existing API logic. Do NOT let AI directly write to database -- always go through service layer.
- Rate limit: max 20 messages per hour per patient to control Gemini costs.
- Language: Dutch by default (system prompt specifies).

### 5. Digital Signatures

For consent forms and treatment plan approvals. Use canvas-based signature capture + PDF embedding.

```
Consent Flow:
  Staff creates form -> Patient signs on tablet/phone -> Signature embedded in PDF
  -> PDF stored in Vercel Blob -> Record in Prisma with audit trail
```

**Key design decisions:**
- Use `react-signature-canvas` for capture on client.
- Use `pdf-lib` to embed signature image into consent PDF server-side.
- Store signature as base64 PNG in Prisma (small, < 50KB). Store signed PDF in Vercel Blob.
- Audit: log signer IP, timestamp, document hash (SHA-256) for non-repudiation.
- This is NOT a qualified electronic signature (QES). A simple electronic signature with audit trail is sufficient for dental consent in NL.

### 6. Subscription Tier System

Feature gating at both API and UI level.

```
Tiers:
  Starter:  Agenda + Patients + Basic Billing
  Pro:      + AI Declaratie + DICOM Viewer + Digital Signatures
  Premium:  + Vecozo Integration + Patient Portal AI + Analytics
```

**Key design decisions:**
- Add `Subscription` model linked to `Practice`. Has `tier`, `status`, `currentPeriodEnd`.
- Feature flags stored as enum array on the tier definition (not per-practice customization for v1).
- Guard function: `requireFeature(practiceId, 'AI_DECLARATIE')` -- call in API route handlers alongside existing `withAuth()`.
- UI guard: `<FeatureGate feature="DICOM_VIEWER">` component that hides content if not in tier.
- Billing via Mollie recurring payments (already partially integrated).

**Schema additions:**
```prisma
model Subscription {
  id                String             @id @default(cuid())
  practiceId        String             @unique
  practice          Practice           @relation(fields: [practiceId], references: [id])
  tier              SubscriptionTier
  status            SubscriptionStatus // ACTIVE, PAST_DUE, CANCELLED, TRIAL
  mollieSubId       String?
  currentPeriodEnd  DateTime
  createdAt         DateTime           @default(now())
}

enum SubscriptionTier {
  STARTER
  PRO
  PREMIUM
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELLED
}
```

## Data Flow Summary

1. **Declaratie Flow**: Natural language -> Gemini AI -> NZa code resolution -> Rule validation -> Draft lines -> Dentist review -> Approved lines -> (future) Vecozo submission
2. **DICOM Flow**: File upload -> Server-side metadata extraction -> Blob storage -> Client-side Cornerstone rendering -> Annotation save
3. **Vecozo Flow**: Patient BSN -> Vecozo proxy -> COV response -> Cache in Prisma -> Display insurance status
4. **Chatbot Flow**: Patient message -> Load context -> Gemini call -> Parse actions -> Execute/respond -> Store history
5. **Signature Flow**: Form display -> Canvas capture -> PDF embed -> Blob storage -> Audit record
6. **Subscription Flow**: Practice signup -> Mollie recurring -> Webhook updates status -> Guard checks on every request

## Suggested Build Order (Dependencies)

```
Phase 1: AI Declaratie Engine
  - No external dependencies beyond existing Gemini
  - Core value proposition -- build first
  - Requires: NZa codebook (exists), Gemini API (exists)

Phase 2: Digital Signatures + Subscription Tiers
  - Signatures: self-contained, no external APIs
  - Subscriptions: extends existing Mollie integration
  - Both are enablers for later features

Phase 3: DICOM Viewer
  - New dependency: Cornerstone.js
  - Extends existing patient image infrastructure
  - Independent of other new features

Phase 4: Patient AI Chatbot
  - Depends on: stable Gemini integration (proven in Phase 1)
  - Depends on: patient portal (exists)
  - Leverages patterns from declaratie AI

Phase 5: Vecozo Integration
  - Hardest: requires UZI cert, SOAP, proxy service
  - Depends on: declaratie engine (Phase 1) for submission
  - Depends on: subscription tier (Phase 2) for gating
  - Build last -- longest external dependency chain
```

**Rationale**: AI Declaratie first because it is the core product differentiator and validates the Gemini integration pattern. Vecozo last because it requires external certificates, a proxy service, and depends on having declaratie data to submit.

## Patterns to Follow

### Pattern 1: Service Layer Extraction
**What:** Move business logic out of route handlers into `src/lib/services/`.
**When:** Any logic more complex than CRUD.
**Why:** Current codebase has business logic in route handlers. New features are complex enough to warrant separation.
```typescript
// src/lib/services/declaratie-engine.ts
export class DeclaratieEngine {
  async suggestCodes(input: string, context: PatientContext): Promise<DeclaratieSuggestion> {
    // 1. Call Gemini with structured prompt
    // 2. Parse response into NZa codes
    // 3. Validate against combinatie rules
    // 4. Return structured suggestion
  }
}

// src/app/api/ai/declaratie/route.ts
export async function POST(request: Request) {
  const user = await withAuth(request);
  requireFeature(user.practiceId, 'AI_DECLARATIE');
  const engine = new DeclaratieEngine();
  const suggestion = await engine.suggestCodes(body.input, body.context);
  return NextResponse.json(suggestion);
}
```

### Pattern 2: Feature Guard
**What:** Check subscription tier before processing requests.
**When:** Any feature-gated API route.
```typescript
// src/lib/services/subscription-guard.ts
export async function requireFeature(practiceId: string, feature: Feature): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { practiceId } });
  if (!sub || !TIER_FEATURES[sub.tier].includes(feature)) {
    throw new ApiError(403, 'Feature not available in your plan');
  }
}
```

### Pattern 3: Client-Only Heavy Components
**What:** Use `next/dynamic` with `ssr: false` for Cornerstone.js / canvas components.
**When:** DICOM viewer, signature canvas.
**Why:** Same pattern as existing odontogram 3D -- proven in codebase.

## Anti-Patterns to Avoid

### Anti-Pattern 1: AI Direct Database Writes
**What:** Letting Gemini responses directly create/update database records.
**Why bad:** Hallucinated codes, wrong amounts, patient safety.
**Instead:** AI always produces drafts. Human confirms. Service layer writes.

### Anti-Pattern 2: DICOM Files in Database
**What:** Storing DICOM binary data in Postgres.
**Why bad:** DICOM files are 5-50MB each. Database bloat, slow queries.
**Instead:** Blob storage for files, Postgres for metadata only.

### Anti-Pattern 3: Vecozo Direct from Vercel
**What:** Attempting mTLS with client certificates from Vercel serverless functions.
**Why bad:** Vercel functions don't support custom CA/client certificates reliably.
**Instead:** Dedicated proxy service with mounted UZI certificate.

### Anti-Pattern 4: Monolithic AI Prompt
**What:** Cramming entire NZa codebook into every Gemini call.
**Why bad:** Token limits, cost, slow responses.
**Instead:** Pre-filter relevant codes based on procedure category before calling AI. Use structured few-shot examples.

## Scalability Considerations

| Concern | At 1 practice | At 50 practices | At 500 practices |
|---------|---------------|-----------------|-------------------|
| Gemini API costs | Negligible (~5/mo) | Moderate (~200/mo) | Need caching + batching |
| DICOM storage | ~10GB/mo | ~500GB/mo | Need S3/R2 instead of Vercel Blob |
| Vecozo proxy | Single instance | Single instance (stateless) | Multiple instances with load balancer |
| Subscription checks | In-memory cache | Redis cache | Redis cache with pub/sub invalidation |

## Sources

- Existing codebase analysis (HIGH confidence)
- Cornerstone.js: standard web DICOM library, used by OHIF Viewer (MEDIUM confidence -- training data, not verified against current docs)
- Vecozo: Dutch healthcare clearinghouse requiring UZI certificates and SOAP/Vektis protocols (MEDIUM confidence -- domain knowledge, specific API details need verification)
- NZa codebook already in system at `src/lib/ai/nza-codebook.ts` (HIGH confidence -- verified in codebase)

---

*Architecture research: 2026-02-16*
