# Phase 9: Patient AI Assistant - Research

**Researched:** 2026-02-18
**Domain:** Conversational AI chatbot (Gemini), streaming responses, cron-based nudges, WhatsApp integration
**Confidence:** HIGH

## Summary

Phase 9 builds a patient-facing AI assistant ("Nexiom Assistant") within the existing patient portal. The system has three pillars: (1) a chat interface with streaming Gemini responses that can explain treatments, invoices, and NZa codes using the patient's actual data, (2) conversational appointment booking that reuses the existing Phase 8 booking API, and (3) automated follow-up nudges via WhatsApp and in-app banners for overdue checkups.

The existing codebase already has all foundational pieces: `gemini-client.ts` for Gemini calls, `pii-guard.ts` for anonymization, the full patient data model in Prisma, booking APIs with availability/slot checking, WhatsApp models, and a notification system. The main new work is: a streaming chat API, new DB models for AI conversations/sessions, a floating bubble + dedicated page UI, practice configuration for AI settings, and a cron endpoint for nudge scheduling.

**Primary recommendation:** Build the streaming chat API using Gemini's `streamGenerateContent?alt=sse` endpoint with ReadableStream/TransformStream on the server and EventSource or fetch+reader on the client. Reuse existing booking APIs as tool-call targets from the AI orchestration layer.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Chat Interface
- Both floating bubble (bottom-right) AND dedicated page (/portal/assistant) in sidebar
- Same conversation shared between bubble and dedicated page — seamless switch
- Session-based history: each visit starts fresh, past sessions viewable in history sidebar (ChatGPT-style left sidebar on dedicated page)
- Clean bubble — no proactive popups, no unread indicators, silent until clicked
- Rich cards inline: appointment details, treatment plan progress, X-ray thumbnails with click-to-enlarge
- Quick-action chips at top of dedicated page: common topics like "Mijn afspraken", "Behandelplan uitleg", "Factuur vraag"
- Glass theme matching the portal (glassmorphism, not white/light)
- Streaming text responses (tokens appear as generated)
- Text + voice input (Web Speech API for speech-to-text)
- Text-to-speech on AI responses (Web Speech API)
- Context-aware: AI knows which portal page patient is on, asks before loading that page's data ("Wilt u dat ik naar uw factuur kijk?")
- Thumbs up/down feedback on each AI message
- Cross-session memory: AI references past conversations for continuity even though sessions display fresh

#### AI Personality & Tone
- Name: "Nexiom Assistant"
- Tone: Professional & clear Dutch ("Goedendag, hoe kan ik u helpen?"), matches patient's language if they write in English or other
- Clear AI label: "Ik ben Nexiom Assistant, uw digitale assistent"
- Avatar: Nexiom logo
- Explain-only scope: never gives medical opinions, only explains existing treatments, plans, invoices
- NZa code explanations: patient-friendly plain language ("V11 = een controle-afspraak bij de tandarts")
- Treatment plan progress shown as inline rich cards
- Short responses: aim for 2-3 sentences, patient can ask for more detail
- Empathy detection: AI recognizes anxiety/frustration and adjusts tone to be more reassuring
- No disclaimers on cost/code answers — data comes from actual records
- PII guard: anonymize patient data (strip names, BSN, DOB) before sending to Gemini — consistent with Phase 4 pattern
- X-ray references: AI can reference X-ray images from clinical notes and show thumbnails inline

#### Handoff & Escalation
- When AI can't help: tell patient someone will follow up, create conversation summary, send to practice team via WhatsApp/internal notification
- Async follow-up: patient doesn't wait in chat — "Een medewerker neemt contact met u op"
- Booking rejections notified through existing notification system, not AI chat

#### Practice Configuration
- Enable/disable toggle for AI assistant per practice
- Practice-configurable custom info: opening hours, address, policies — fed into AI system prompt
- Custom FAQ entries: practice can add Q&A pairs the AI prioritizes
- Preview/test mode: staff can chat with AI as if they were a patient to verify behavior
- Admin can see all AI conversation logs with patient feedback ratings (thumbs) alongside messages
- NZa knowledge base: static import, manual update when tariffs change

#### Booking Flow
- Conversational booking: AI asks step by step (type? practitioner? date preference?) then confirms
- Confirmation step required: summary card with date, time, practitioner — patient confirms with button
- Book only: cancel/reschedule goes through existing portal pages
- Same approval workflow as Phase 8 (pending approval)
- No cost shown in confirmation card
- Alternative suggestions when preferred slot unavailable
- Real-time slot availability checking
- Natural language time preferences: "volgende week ochtend", "na 14:00"
- Consent form check: AI prompts patient to sign pending consent forms before booking
- Patient always specifies appointment type (no AI auto-suggesting from treatment plan)
- Always ask which practitioner (no remembered preference)
- Booking validation: AI checks patient history to flag premature/unnecessary bookings
- .ics calendar download offered after successful booking
- Fallback link to standard booking form if patient prefers

#### Follow-up Nudges
- Trigger: overdue checkup (6+ months since last controle)
- Delivery: WhatsApp + in-app banner/toast (not in AI chat)
- Frequency: twice — at 6 months, again at 9 months if no booking
- AI-generated personalized WhatsApp messages
- Deep link to booking page in WhatsApp message
- Click tracking: log if patient opened the booking link
- Automatic system (daily cron check), not staff-triggered
- No patient opt-out
- Practice-configurable: nudge on/off, overdue threshold, max nudges per patient
- Full nudge log visible to staff: which patients, when sent, if they booked after
- Nudge outcome tracking in staff dashboard

### Claude's Discretion
- Rate limiting strategy (invisible to patient)
- Handoff notification routing (practice inbox vs. patient's dentist)
- AI response typing speed feel
- Actions beyond booking (e.g., document requests, practice messages)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-06 | Patient can chat with AI assistant in portal (explains treatment, answers questions in Dutch) | Gemini streaming API, patient data retrieval patterns from existing `api/ai/chat/route.ts`, PII guard, NZa codebook, conversation persistence model |
| AI-07 | Patient AI can book appointments on behalf of patient | Existing `api/patient-portal/appointments/book/route.ts` and `availability/route.ts` provide all booking logic; AI orchestration layer calls these APIs internally |
| AI-08 | Patient AI sends follow-up nudges to motivate treatment completion | Cron API route, WhatsApp message model already in schema, Notification model for in-app banners, Gemini for personalized message generation |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Gemini 2.0 Flash (REST) | v1beta | LLM for chat responses, intent parsing, nudge message generation | Already used across 5 AI endpoints in codebase |
| Web Speech API | Browser native | Speech-to-text input + text-to-speech output | No library needed, built into modern browsers |
| ReadableStream / TransformStream | Web Streams API | Server-side streaming response construction | Native to Next.js edge/node runtime, no library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | (existing) | Icons for chat UI (MessageCircle, Mic, ThumbsUp, etc.) | All UI icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw Gemini REST | Vercel AI SDK (`ai` package) | Would add streaming helpers but is an extra dependency; raw REST keeps consistency with existing 5 AI routes |
| Web Speech API | Whisper API / Deepgram | Higher accuracy but adds cost and latency; Web Speech API is free and instant |

**Installation:**
No new packages needed. Everything uses existing dependencies + browser APIs.

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── app/api/patient-portal/
│   ├── ai-chat/
│   │   └── route.ts              # Streaming chat endpoint (POST)
│   ├── ai-chat/sessions/
│   │   └── route.ts              # List/create sessions (GET/POST)
│   ├── ai-chat/sessions/[id]/
│   │   └── route.ts              # Get session messages (GET)
│   ├── ai-chat/feedback/
│   │   └── route.ts              # Thumbs up/down (POST)
│   ├── ai-chat/handoff/
│   │   └── route.ts              # Escalate to human (POST)
│   └── nudges/
│       ├── cron/route.ts         # Daily cron endpoint
│       └── route.ts              # Staff: view nudge log (GET)
├── app/(patient)/portal/
│   └── assistant/
│       └── page.tsx              # Dedicated assistant page
├── components/patient/
│   ├── ai-chat-bubble.tsx        # Floating bubble (renders in layout)
│   ├── ai-chat-panel.tsx         # Shared chat panel (used by bubble + page)
│   ├── ai-message.tsx            # Single message with rich cards
│   ├── ai-rich-cards.tsx         # Appointment card, treatment card, etc.
│   ├── ai-booking-flow.tsx       # Booking confirmation card with button
│   └── ai-voice-controls.tsx     # Mic button + TTS toggle
├── app/(dashboard)/dashboard/
│   └── ai-logs/                  # Staff AI conversation log viewer (new page)
│       └── page.tsx
├── app/api/dashboard/
│   └── ai-logs/
│       └── route.ts              # Staff: fetch AI logs with feedback
├── lib/ai/
│   ├── patient-system-prompt.ts  # System prompt builder for patient AI
│   ├── patient-data-fetcher.ts   # Fetch + anonymize patient context
│   └── booking-orchestrator.ts   # Multi-turn booking state machine
```

### Pattern 1: Streaming Chat API with Gemini
**What:** Use `streamGenerateContent?alt=sse` to stream tokens, pipe through TransformStream to client
**When to use:** All chat responses
**Example:**
```typescript
// apps/web/src/app/api/patient-portal/ai-chat/route.ts
export async function POST(request: NextRequest) {
  const user = await withAuth(request);
  requireRoles(user, [UserRole.PATIENT]);

  const { message, sessionId, currentPage } = await request.json();

  // 1. Fetch patient data (anonymized)
  const context = await fetchPatientContext(user.patientId!, currentPage);

  // 2. Build conversation history from DB
  const history = await getSessionMessages(sessionId);

  // 3. Build system prompt with practice config + patient context
  const systemPrompt = buildPatientSystemPrompt(context, currentPage);

  // 4. Call Gemini streaming
  const geminiUrl = `${GEMINI_URL.replace('generateContent', 'streamGenerateContent')}?alt=sse&key=${GEMINI_API_KEY}`;

  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...history.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  // 5. Transform SSE stream and forward to client
  const stream = new ReadableStream({
    async start(controller) {
      const reader = geminiRes.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines: "data: {...}"
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const json = JSON.parse(line.slice(6));
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            fullText += text;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
      }
      // Save complete message to DB
      await saveMessage(sessionId, 'user', message);
      await saveMessage(sessionId, 'assistant', fullText);
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
```

### Pattern 2: PII Anonymization Before Gemini
**What:** Strip patient names, BSN, DOB, addresses from context before sending to Gemini
**When to use:** Every AI chat call
**Example:**
```typescript
// Extend existing pii-guard.ts pattern
function anonymizePatientContext(data: PatientContext): AnonymizedContext {
  return {
    // Keep clinical data
    treatments: data.treatments,
    appointments: data.appointments.map(a => ({
      ...a,
      practitioner: a.practitioner, // Keep practitioner name (not PII of patient)
    })),
    invoices: data.invoices,
    treatmentPlans: data.treatmentPlans,
    // Strip PII
    patient: {
      gender: data.patient.gender,
      insuranceType: data.patient.insuranceType,
      medicalAlerts: data.patient.medicalAlerts,
      // NO: firstName, lastName, email, phone, BSN, DOB, address
    },
  };
}
```

### Pattern 3: Multi-Turn Booking State Machine
**What:** Track booking conversation state (asking type -> asking practitioner -> asking date -> confirming)
**When to use:** When AI detects booking intent
**Example:**
```typescript
type BookingState =
  | { step: 'idle' }
  | { step: 'ask_type' }
  | { step: 'ask_practitioner'; appointmentType: string }
  | { step: 'ask_date'; appointmentType: string; practitionerId: string }
  | { step: 'confirm'; appointmentType: string; practitionerId: string; date: string; startTime: string }
  | { step: 'done'; appointmentId: string };

// Store booking state in session metadata (JSON column)
// AI system prompt includes current booking state
// When state is 'confirm', render a confirmation rich card instead of text
```

### Pattern 4: Cron-Based Nudge System
**What:** Daily API route checks all patients for overdue checkups, sends WhatsApp + in-app notifications
**When to use:** Automated, called by Vercel Cron or external scheduler
**Example:**
```typescript
// api/patient-portal/nudges/cron/route.ts
// Protected by CRON_SECRET header
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find patients with last CHECKUP appointment > 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const overduePatients = await prisma.patient.findMany({
    where: {
      isActive: true,
      practice: { settings: { path: ['aiAssistant', 'nudgesEnabled'], equals: true } },
      appointments: {
        none: {
          appointmentType: 'CHECKUP',
          startTime: { gte: sixMonthsAgo },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      },
    },
  });
  // ... check nudge count, generate personalized message via Gemini, send WhatsApp
}
```

### Anti-Patterns to Avoid
- **Sending full patient data to Gemini without anonymization:** Always strip PII (names, BSN, DOB, addresses) before any Gemini call
- **Blocking on streaming:** Never await the entire Gemini response before sending to client; stream chunks immediately
- **Storing AI conversation in localStorage:** Must persist to database for cross-session memory, staff log viewing, and feedback tracking
- **Using the staff AI chat route (`/api/ai/chat`):** Patient AI must be a separate route under `/api/patient-portal/ai-chat/` with patient auth
- **Hard-coding NZa descriptions in prompts:** Load from DB (`nzaCode` table) and cache; the codebook (`nza-codebook.ts`) can serve as fallback

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE streaming | Custom WebSocket server | `ReadableStream` + `text/event-stream` | Native to Next.js, simpler than WS, sufficient for unidirectional streaming |
| Speech-to-text | Whisper integration | Web Speech API (`SpeechRecognition`) | Free, instant, no server round-trip, good Dutch support in Chrome |
| Text-to-speech | External TTS API | Web Speech API (`SpeechSynthesis`) | Free, instant, good Dutch voices on modern browsers |
| Booking logic | New booking endpoint | Existing `/api/patient-portal/appointments/book` + `/availability` | Already handles validation, slot conflicts, notifications, approval workflow |
| NZa code knowledge | New code table | Existing `nzaCode` table + `nza-codebook.ts` static data | Already contains all codes with descriptions, tariffs, toelichting |
| Patient data retrieval | New data fetcher from scratch | Pattern from `api/ai/chat/route.ts` `getPatientData()` | Already fetches treatments, appointments, invoices, notes by intent |
| Rate limiting | Custom token bucket | Simple in-memory counter per patient per hour | Good enough for patient portal scale; no Redis needed |

**Key insight:** This phase is largely an integration/orchestration challenge. Nearly all data access, booking logic, notification sending, and AI calling patterns already exist. The new work is the streaming chat wrapper, conversation persistence, UI components, and the cron nudge system.

## Common Pitfalls

### Pitfall 1: Gemini Multi-Turn Conversation Format
**What goes wrong:** Gemini expects alternating user/model roles; consecutive same-role messages cause errors
**Why it happens:** When system prompt + history + new message are composed incorrectly
**How to avoid:** Always structure as: system prompt in first user message, then alternating user/model, then final user message. Merge consecutive same-role messages into one.
**Warning signs:** 400 errors from Gemini API with role ordering complaints

### Pitfall 2: SSE Parsing on Client
**What goes wrong:** Chunks from Gemini may split mid-JSON, causing parse errors
**Why it happens:** Network chunking doesn't respect SSE message boundaries
**How to avoid:** Buffer incomplete lines; only parse when you have a complete `data: {...}\n\n` sequence
**Warning signs:** Intermittent JSON parse errors in client console

### Pitfall 3: PII Leaking to Gemini
**What goes wrong:** Patient asks "what is my address?" and the system sends their address to Gemini in context
**Why it happens:** Naive context building includes all patient fields
**How to avoid:** Whitelist approach: only include clinical fields (treatments, codes, appointments, invoices). Never include name, BSN, DOB, address, email, phone in the Gemini context.
**Warning signs:** PII guard (`assertNoPII`) throwing errors

### Pitfall 4: Booking State Loss
**What goes wrong:** Patient starts booking flow, switches to bubble, state is lost
**Why it happens:** Booking state stored in React component state instead of DB
**How to avoid:** Store booking state in the session's metadata column in the database. Both bubble and dedicated page read from same session.
**Warning signs:** Patient has to restart booking conversation after switching views

### Pitfall 5: Web Speech API Browser Support
**What goes wrong:** Speech features don't work on Firefox/Safari
**Why it happens:** `SpeechRecognition` API has limited browser support (Chrome/Edge best)
**How to avoid:** Feature-detect and gracefully hide mic/TTS buttons when unsupported. Always have text input as primary.
**Warning signs:** `window.SpeechRecognition` is undefined errors

### Pitfall 6: Cron Nudge Duplicate Sends
**What goes wrong:** Same patient gets nudged multiple times on same day
**Why it happens:** Cron runs multiple times, no idempotency check
**How to avoid:** Track nudges in a `PatientNudge` table with `sentAt` date. Check before sending. Use a date-based idempotency key.
**Warning signs:** Patients complaining about repeated WhatsApp messages

## Code Examples

### Gemini Streaming with SSE (Server-Side)
```typescript
// Gemini streamGenerateContent endpoint
const GEMINI_STREAM_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent';

async function streamGeminiResponse(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<Response> {
  const { maxTokens = 1024, temperature = 0.3 } = options;

  const geminiRes = await fetch(
    `${GEMINI_STREAM_URL}?alt=sse&key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    }
  );

  if (!geminiRes.ok) {
    throw new ApiError('AI verwerking mislukt', 502);
  }

  return geminiRes; // Body is an SSE stream
}
```

### Client-Side SSE Consumption
```typescript
// React hook for streaming chat
async function sendMessage(message: string) {
  const res = await fetch('/api/patient-portal/ai-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('patient_token')}`,
    },
    body: JSON.stringify({ message, sessionId, currentPage }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE messages
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || ''; // Keep incomplete chunk

    for (const line of lines) {
      if (line.startsWith('data: [DONE]')) return;
      if (line.startsWith('data: ')) {
        const { text } = JSON.parse(line.slice(6));
        // Append text to current message in state
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + text }];
        });
      }
    }
  }
}
```

### Web Speech API Voice Input
```typescript
function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = () => {
    if (!isSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'nl-NL';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      // Update input field with transcript
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  return { isSupported, isListening, startListening, stopListening: () => recognitionRef.current?.stop() };
}
```

### Database Schema for AI Conversations
```prisma
model AiChatSession {
  id          String   @id @default(uuid())
  practiceId  String   @map("practice_id")
  patientId   String   @map("patient_id")
  title       String?  // Auto-generated from first message
  metadata    Json?    @default("{}") // Booking state, current page, etc.
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  practice Practice          @relation(fields: [practiceId], references: [id])
  patient  Patient           @relation(fields: [patientId], references: [id])
  messages AiChatMessage[]

  @@index([patientId, updatedAt])
  @@map("ai_chat_sessions")
}

model AiChatMessage {
  id        String   @id @default(uuid())
  sessionId String   @map("session_id")
  role      String   // 'user' | 'assistant' | 'system'
  content   String   @db.Text
  richCards Json?    @map("rich_cards") // Serialized card data
  feedback  String?  // 'up' | 'down' | null
  createdAt DateTime @default(now()) @map("created_at")

  session AiChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
  @@map("ai_chat_messages")
}

model PatientNudge {
  id         String    @id @default(uuid())
  practiceId String    @map("practice_id")
  patientId  String    @map("patient_id")
  nudgeType  String    @map("nudge_type") // 'overdue_checkup'
  channel    String    // 'whatsapp' | 'in_app'
  message    String    @db.Text
  sentAt     DateTime  @default(now()) @map("sent_at")
  clickedAt  DateTime? @map("clicked_at")
  bookedAt   DateTime? @map("booked_at") // If patient booked after nudge
  metadata   Json?     @default("{}")

  practice Practice @relation(fields: [practiceId], references: [id])
  patient  Patient  @relation(fields: [patientId], references: [id])

  @@index([patientId, nudgeType, sentAt])
  @@map("patient_nudges")
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Non-streaming Gemini `generateContent` | `streamGenerateContent?alt=sse` | Available since Gemini launch | Tokens appear progressively, much better UX |
| Custom chat libraries | Raw SSE with `ReadableStream` | N/A | No dependencies needed for simple streaming |
| Gemini `v1` API | `v1beta` API (used in codebase) | Ongoing | Must use v1beta for latest model features |

## Discretion Recommendations

### Rate Limiting Strategy
**Recommendation:** Simple per-patient in-memory counter. 30 messages per hour, 200 per day. Store counts in a Map keyed by patientId with TTL reset. No Redis needed at this scale. If exceeded, return a friendly message: "U heeft veel berichten verstuurd. Probeer het over een uurtje opnieuw."

### Handoff Notification Routing
**Recommendation:** Route to the patient's most recent practitioner (from last appointment). If no recent practitioner, route to all DENTIST-role users in the practice. Use the existing `Notification` model with channel `IN_APP` and a new template `AI_HANDOFF`.

### AI Response Typing Speed Feel
**Recommendation:** No artificial delay. The natural Gemini streaming speed (tokens arriving over 1-3 seconds) already provides a natural typing feel. Adding artificial delays would slow down an already-latent API call.

### Actions Beyond Booking
**Recommendation:** Phase 9 scope should include: (1) viewing documents list, (2) linking to practice messages page, (3) showing practice contact info. These are read-only and low-risk. Do NOT implement document upload or message sending via AI in this phase.

## Open Questions

1. **WhatsApp API Integration**
   - What we know: WhatsApp models exist in schema (WhatsAppConversation, WhatsAppMessage), Twilio SID field present
   - What's unclear: Whether Twilio WhatsApp is actually configured and operational
   - Recommendation: Build the nudge system to generate messages and create DB records. Add a `sendWhatsApp()` function that calls Twilio if configured, otherwise logs a warning. Make it work without Twilio for testing.

2. **Vercel Cron Configuration**
   - What we know: Cron endpoint pattern is straightforward (GET with secret header)
   - What's unclear: Whether Vercel Cron is already configured in `vercel.json`
   - Recommendation: Add cron config to `vercel.json`. For local dev, provide a manual trigger endpoint.

3. **Practice Settings Schema for AI Config**
   - What we know: `Practice.settings` is a Json column already used for booking settings
   - What's unclear: Exact structure of existing settings
   - Recommendation: Nest AI config under `settings.aiAssistant` key: `{ enabled, nudgesEnabled, overdueThresholdMonths, maxNudges, customFaq, openingHours, policies }`

## Sources

### Primary (HIGH confidence)
- Codebase: `apps/web/src/lib/ai/gemini-client.ts` — existing Gemini integration pattern
- Codebase: `apps/web/src/app/api/ai/chat/route.ts` — staff AI chat with patient data retrieval
- Codebase: `apps/web/src/app/api/ai/treatment-chat/route.ts` — PII guard usage, NZa codebook pattern
- Codebase: `apps/web/src/app/api/patient-portal/appointments/book/route.ts` — booking with approval workflow
- Codebase: `apps/web/src/app/api/patient-portal/appointments/availability/route.ts` — slot availability checking
- Codebase: `apps/web/src/lib/ai/pii-guard.ts` — PII detection patterns
- Codebase: `packages/database/prisma/schema.prisma` — all relevant models (Notification, WhatsApp, Conversation, NzaCode, ConsentForm)
- Codebase: `apps/web/src/app/(patient)/portal/layout.tsx` — portal layout with sidebar nav, glass theme

### Secondary (MEDIUM confidence)
- [Gemini API Streaming Quickstart](https://github.com/google-gemini/cookbook/blob/main/quickstarts/rest/Streaming_REST.ipynb) — SSE streaming format with `alt=sse` parameter
- [Gemini API Reference](https://ai.google.dev/api) — streamGenerateContent endpoint documentation

### Tertiary (LOW confidence)
- Web Speech API browser support for Dutch — Chrome has good support, Firefox/Safari limited; needs runtime feature detection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, no new dependencies
- Architecture: HIGH — patterns directly derived from existing codebase (5 AI routes, patient portal APIs)
- Pitfalls: HIGH — pitfalls identified from actual code patterns and Gemini API behavior
- Nudge system: MEDIUM — WhatsApp integration depends on Twilio configuration status

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable — Gemini REST API, existing codebase patterns)
