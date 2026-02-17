# Phase 9: Patient AI Assistant - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Patient-facing AI chatbot within the portal that explains treatments, answers billing/invoice questions, books appointments conversationally, and sends follow-up nudges for overdue checkups. AI uses Gemini API with the existing GEMINI_API_KEY. The assistant has full knowledge of NZa codes (from static import), patient clinical history, appointments, treatment plans, invoices, and X-ray images. It never provides medical diagnoses — only explains what the dentist has already planned/done.

</domain>

<decisions>
## Implementation Decisions

### Chat Interface
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

### AI Personality & Tone
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

### Handoff & Escalation
- When AI can't help: tell patient someone will follow up, create conversation summary, send to practice team via WhatsApp/internal notification
- Async follow-up: patient doesn't wait in chat — "Een medewerker neemt contact met u op"
- Booking rejections notified through existing notification system, not AI chat

### Practice Configuration
- Enable/disable toggle for AI assistant per practice
- Practice-configurable custom info: opening hours, address, policies — fed into AI system prompt
- Custom FAQ entries: practice can add Q&A pairs the AI prioritizes
- Preview/test mode: staff can chat with AI as if they were a patient to verify behavior
- Admin can see all AI conversation logs with patient feedback ratings (thumbs) alongside messages
- NZa knowledge base: static import, manual update when tariffs change

### Booking Flow
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

### Follow-up Nudges
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

</decisions>

<specifics>
## Specific Ideas

- AI must have a "brain" with all NZa codes, opmerkingen, descriptions — preprocessed into AI-digestible format from NZa codes / KNMT boekje
- Input validation: AI validates patient questions against actual data before responding — no hallucinated answers, no random info
- When patient asks about a treatment ("do I need a new crown?"), AI confirms based on what the dentist actually planned — without revealing internal dentist reasoning
- AI must access full patient context: history, appointments, treatment plans, invoices, X-rays, clinical notes
- Correctness over speed: output must be grounded in actual data
- Gemini integration using existing GEMINI_API_KEY (consistent with Phase 4/5 patterns)
- Reuse shared Gemini client (callGemini/parseGeminiJson) from Phase 5

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-patient-ai-assistant*
*Context gathered: 2026-02-17*
