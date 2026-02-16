# Technology Stack

**Project:** Nexiom (DentFlow) - Remaining Features
**Researched:** 2026-02-16
**Note:** Web search unavailable during research. Recommendations from training data (May 2025 cutoff). Confidence adjusted.

## Existing Stack (Do Not Change)

Next.js 15, React 19, Prisma + Neon Postgres, Tailwind CSS, Three.js, Mollie, Zustand, SWR, jsPDF, Zod, Resend, Twilio.

---

## New Stack Additions

### 1. AI / LLM Integration (Declaratie Assistant + Clinical Notes + Patient Chatbot)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Vercel AI SDK** (`ai`) | ^4.x | Streaming, tool calling, structured output | Next.js-native. Handles SSE, structured JSON. | MEDIUM |
| **@ai-sdk/google** | ^1.x | Gemini provider | Official adapter. Cleaner than raw googleapis. | MEDIUM |

Use Gemini (already have API key). Do NOT add OpenAI or LangChain.

### 2. DICOM X-ray Viewer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **@cornerstonejs/core** | ^2.x | DICOM rendering | Industry standard. Only serious web DICOM option. | MEDIUM |
| **@cornerstonejs/dicom-image-loader** | ^2.x | DICOM file loading | P10 parsing, transfer syntax decoding. | MEDIUM |
| **@cornerstonejs/tools** | ^2.x | Measurement, windowing | Pan/zoom/window-level/rulers. | MEDIUM |
| **dicom-parser** | ^1.8.x | Low-level DICOM parsing | Cornerstone dependency. | MEDIUM |

Do NOT use OHIF (full app, not embeddable) or dwv (less mature). Store in Vercel Blob.

### 3. Vecozo Insurance Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Node.js native https/tls** | Built-in | mTLS to Vecozo | Vecozo requires mutual TLS. No library needed. | LOW |
| **fast-xml-parser** | ^4.x | SOAP/XML parsing | Vecozo uses SOAP. Faster than xml2js. | LOW |

**BIGGEST RISK:** No npm SDK. Must build custom SOAP client. Needs Vecozo agreement + test env. Requires UZI-pas or server certificates per practice.

### 4. Digital Signatures

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **pdf-lib** | ^1.17.x | Embed signatures in PDFs | Pure JS, modify existing PDFs. | MEDIUM |
| **react-signature-canvas** | ^1.0.x | Capture drawn signatures | Simple. Patient signs on tablet. | MEDIUM |

Do NOT use DocuSign (expensive, overkill for clinical consent).

### 5. Subscription / Billing Tiers

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Mollie Subscriptions API** | Already installed | Recurring billing | Already using Mollie. iDEAL dominant in NL. | HIGH |

Do NOT add Stripe. Use Mollie customers/mandates/subscriptions endpoints.

### 6. Supporting

| Library | Version | Purpose |
|---------|---------|---------|
| **sharp** | ^0.33.x | DICOM thumbnails, image processing (server-side) |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| LLM | Gemini + AI SDK | OpenAI / LangChain | Have Gemini key; AI SDK is lighter |
| DICOM | Cornerstone.js v2 | dwv, OHIF | Industry standard; OHIF not embeddable |
| Signatures | signature-canvas + pdf-lib | DocuSign | Cost; clinical consent doesn't need it |
| XML | fast-xml-parser | xml2js | Faster, no callbacks |
| Subscriptions | Mollie | Stripe | Already integrated; NL standard |

---

## Installation

```bash
# AI
pnpm --filter @dentflow/web add ai @ai-sdk/google

# DICOM
pnpm --filter @dentflow/web add @cornerstonejs/core @cornerstonejs/dicom-image-loader @cornerstonejs/tools dicom-parser

# Signatures
pnpm --filter @dentflow/web add pdf-lib react-signature-canvas

# Vecozo
pnpm --filter @dentflow/web add fast-xml-parser

# Image processing
pnpm --filter @dentflow/web add sharp

# Types
pnpm --filter @dentflow/web add -D @types/react-signature-canvas
```

**Verify versions before installing:** `npm info <package> version` for each.

---

## Roadmap Implications

1. **AI Declaratie first** — lowest risk, highest value, builds on existing Gemini key
2. **Digital signatures second** — simple libraries, enables consent workflows
3. **DICOM viewer third** — complex but well-documented (cornerstone)
4. **Subscription tiers fourth** — Mollie already integrated, mostly business logic
5. **Vecozo integration last** — highest risk, needs external agreements and certificates before any code
