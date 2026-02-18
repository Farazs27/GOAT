# Phase 11: Hygienist Portal Rebuild - Research

**Researched:** 2026-02-18
**Domain:** Hygienist portal, periodontogram, relational perio data, portal pages
**Confidence:** HIGH

## Summary

Phase 11 rebuilds the hygienist portal from its current Phase 10 skeleton (5 nav items, 3 re-exported pages, 1 dashboard, 1 patient list) into a full standalone portal with 12+ pages, a professional-grade 2D periodontogram with sequential data entry, relational perio schema (replacing JSON `chartData`), patient messaging, recall management, billing, reports, and settings.

The existing codebase provides strong foundations: the `(hygienist)/` route group with glass-style layout already exists, the dentist dashboard pages for agenda/billing/berichten are mature and can be studied (NOT re-exported — new hygienist-specific pages must be built), the Conversation model supports threaded patient-staff messaging with attachments, StaffChat supports team messaging, and the shared-types package has a `PerioToothData` interface covering 6 sites per tooth with all clinical fields.

**Primary recommendation:** Structure work as: (1) schema migration first (new relational perio tables + RecallSchedule + PerioProtocol), (2) periodontogram component as the centerpiece feature, (3) portal pages built from scratch (not re-exporting dashboard pages), (4) messaging with conversation handoff, (5) reports/recall/settings.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full standalone portal: dashboard, agenda, patients, perio, clinical notes, messaging, billing/declaratie, reports, consent management, referrals, documents, settings
- Same staff login (`/login`) with role-based routing to `/hygienist/dashboard` for HYGIENIST role
- Completely separate sidebar nav — no overlap with dentist sidebar items
- Same visual design as dentist dashboard (identical Tailwind styling, different pages/nav)
- Patient list shows all practice patients (not filtered to hygienist's patients)
- Agenda shows own schedule + toggle to see dentist's schedule for coordination
- Patient detail page is hygienist-focused: perio tab prominent, clinical notes, simplified treatment view — no odontogram restoration editing
- Full CRUD on appointments, anamnesis, patient images, AI tools, consent forms, referrals, treatment plans, documents, recall management
- Settings page: profile + preferences (perio defaults, preferred chart view, notifications) — no practice settings
- Own declaratie: same billing/invoice system as dentist — full declaratie workflow for hygiene P-codes
- **Periodontogram:** 2D traditional (not 3D), sequential auto-advance entry (18→28 buccal then lingual), BOP per site during probing, auto-skip missing teeth, on-screen numeric keypad + physical keyboard, undo/redo, auto-save, color coding by severity, implant marking, furcation Grade I/II/III, recession direct + CAL-based, keratinized tissue width, plaque index (O'Leary), suppuration per tooth only, missing teeth collapsed, tooth-level notes, historical overlay + side-by-side, EFP/AAP auto-classification, risk score, summary stats, multi-visit protocol tracking, no PDF export
- **Messaging:** Reuse Phase 10 staff chat as-is, hygienist can message patients directly, separate conversation threads, hardcoded message templates, attachments, hygienist identity shown to patients, unread badges, patient messages tab + staff chat tab, conversation handoff to dentist
- **Schema:** Structured relational PerioSession/PerioSite tables (not JSON), linked to appointments, migrate from Phase 10 PerioToothData, formal PerioProtocol model, dedicated RecallSchedule model, message templates hardcoded in code, reports calculated on-the-fly, tooth-level notes on perio data, keratinized tissue + furcation tracked per-session

### Claude's Discretion
- Exact dashboard widget design and metrics
- Sidebar nav icon choices and ordering
- Perio visualization styling details (exact colors, spacing, typography)
- Error states and loading states throughout portal
- On-screen keypad layout
- Exact protocol step definitions
- Report chart types and layouts
- Default perio preferences for settings

### Deferred Ideas (OUT OF SCOPE)
- None explicitly deferred
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HYG-01 | Dental hygienist has a dedicated portal view (separate from dentist dashboard) | Existing `(hygienist)/` route group with layout.tsx, needs full page rebuild (currently 3/5 pages re-export dentist pages) |
| HYG-02 | Hygienist can view and record periodontal data on the periodontogram | New 2D periodontogram component with relational PerioSession/PerioSite schema replacing JSON chartData |
| HYG-03 | Hygienist and dentist can see each other's clinical notes on the same patient | ClinicalNote model already shared, both portals query same table filtered by patientId |
| HYG-04 | Hygienist portal does NOT include smile design section | Sidebar nav excludes smile-design; no DSD pages in hygienist route group |
| HYG-05 | Hygienist and dentist can communicate within the system | StaffChat model exists; add Conversation-based patient messaging with handoff |
| CLIN-06 | Complete periodontogram with probing depths, bleeding, recession, mobility | PerioToothData type covers all fields; new relational schema persists per-site data |
| CLIN-07 | Periodontogram improvements for hygienist workflow (fast data entry, visual charting) | Sequential auto-advance, numeric keypad, auto-skip missing teeth, auto-save, undo/redo |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15 | App router, route groups | Already used for `(hygienist)/` |
| React | 19 | UI components | Project standard |
| Prisma | Latest | ORM for relational perio schema | Project standard |
| Tailwind CSS | Latest | Styling (glass UI pattern) | Project standard |
| lucide-react | Latest | Icons | Project standard |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | Latest | Charts for reports/trends | Perio trends, BOP charts, compliance reports |
| @dentflow/shared-types | - | PerioToothData interface | Type definitions for perio data |
| authFetch | - | Staff API calls | All hygienist API routes use staff auth |

### No New Dependencies Needed
The existing stack covers all requirements. The 2D periodontogram uses SVG (already demonstrated in perio-mode.tsx tooth silhouettes). Charts use recharts (already in project). No new libraries needed.

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/app/(hygienist)/
├── layout.tsx                    # EXISTS — expand nav items from 5 to 12+
├── hygienist/
│   ├── dashboard/page.tsx        # EXISTS — rebuild with new widgets
│   ├── agenda/page.tsx           # REPLACE re-export with own implementation
│   ├── patients/
│   │   ├── page.tsx              # EXISTS — keep/enhance
│   │   └── [id]/
│   │       ├── page.tsx          # REPLACE re-export with hygienist-focused detail
│   │       ├── perio/page.tsx    # NEW — periodontogram page
│   │       └── notes/page.tsx    # EXISTS
│   ├── berichten/page.tsx        # REPLACE re-export — dual tab (patients + staff)
│   ├── billing/page.tsx          # REPLACE re-export with hygienist declaratie
│   ├── reports/page.tsx          # NEW
│   ├── recalls/page.tsx          # NEW
│   ├── consent/page.tsx          # NEW
│   ├── referrals/page.tsx        # NEW
│   ├── documents/page.tsx        # NEW
│   └── settings/page.tsx         # NEW

apps/web/src/components/hygienist/
├── periodontogram/
│   ├── perio-chart.tsx           # Main 2D SVG periodontogram
│   ├── perio-entry-panel.tsx     # Sequential data entry with auto-advance
│   ├── perio-keypad.tsx          # On-screen numeric keypad
│   ├── perio-summary.tsx         # BOP%, Plaque%, mean PD, sites ≥6mm
│   ├── perio-classification.tsx  # EFP/AAP auto-classification
│   ├── perio-history.tsx         # Overlay + side-by-side comparison
│   └── tooth-svg.tsx             # Individual tooth SVG silhouettes (from perio-mode.tsx)
├── messaging/
│   ├── patient-messages.tsx      # Patient conversation threads
│   ├── staff-chat.tsx            # Re-uses existing staff chat
│   └── message-templates.tsx     # Hardcoded template selector
└── recall/
    └── recall-manager.tsx        # Recall tracking UI

apps/web/src/app/api/hygienist/   # NEW API route namespace
├── perio-sessions/route.ts       # CRUD for perio sessions
├── perio-sessions/[id]/route.ts  # Individual session
├── recalls/route.ts              # Recall management
├── protocols/route.ts            # Perio protocols
├── reports/route.ts              # Computed reports
└── conversations/route.ts        # Patient messaging for hygienist
```

### Pattern 1: Relational Perio Schema (replacing JSON chartData)
**What:** New Prisma models for structured perio data
**When to use:** All perio data persistence

```prisma
model PerioSession {
  id             String   @id @default(uuid())
  practiceId     String   @map("practice_id")
  patientId      String   @map("patient_id")
  appointmentId  String?  @map("appointment_id")
  authorId       String   @map("author_id")
  sessionType    String   @default("FULL") // FULL, PARTIAL, RE_EVALUATION
  sessionNote    String?  @map("session_note")
  protocolId     String?  @map("protocol_id")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  practice    Practice       @relation(fields: [practiceId], references: [id])
  patient     Patient        @relation(fields: [patientId], references: [id])
  appointment Appointment?   @relation(fields: [appointmentId], references: [id])
  author      User           @relation(fields: [authorId], references: [id])
  protocol    PerioProtocol? @relation(fields: [protocolId], references: [id])
  sites       PerioSite[]

  @@map("perio_sessions")
}

model PerioSite {
  id              String  @id @default(uuid())
  sessionId       String  @map("session_id")
  toothNumber     Int     @map("tooth_number")  // FDI number
  surface         String  // "buccal" or "lingual"/"palatal"
  sitePosition    String  @map("site_position") // "mesial", "mid", "distal"

  probingDepth    Int     @map("probing_depth")
  gingivalMargin  Int     @map("gingival_margin")  // negative = recession
  bleeding        Boolean @default(false)
  plaque          Boolean @default(false)
  suppuration     Boolean @default(false)  // per-tooth only in UI, stored per site

  // Per-tooth fields (same value for all 6 sites of a tooth)
  mobility        Int?
  furcationGrade  Int?    @map("furcation_grade")  // 0, 1, 2, 3
  isImplant       Boolean @default(false) @map("is_implant")
  toothNote       String? @map("tooth_note")

  // Per-site extended
  keratinizedWidth Int?   @map("keratinized_width")

  session PerioSite @relation(fields: [sessionId], references: [id])

  @@index([sessionId, toothNumber])
  @@map("perio_sites")
}

model PerioProtocol {
  id          String   @id @default(uuid())
  practiceId  String   @map("practice_id")
  patientId   String   @map("patient_id")
  status      String   @default("ACTIVE") // ACTIVE, COMPLETED, CANCELLED
  steps       Json     // Array of { name, status, sessionId?, dueDate? }
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  practice Practice       @relation(fields: [practiceId], references: [id])
  patient  Patient        @relation(fields: [patientId], references: [id])
  sessions PerioSession[]

  @@map("perio_protocols")
}

model RecallSchedule {
  id             String    @id @default(uuid())
  practiceId     String    @map("practice_id")
  patientId      String    @map("patient_id")
  intervalMonths Int       @map("interval_months")
  nextDueDate    DateTime  @map("next_due_date")
  status         String    @default("DUE") // DUE, OVERDUE, COMPLETED, CANCELLED
  lastCompletedAt DateTime? @map("last_completed_at")
  reminderSentAt DateTime? @map("reminder_sent_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  practice Practice @relation(fields: [practiceId], references: [id])
  patient  Patient  @relation(fields: [patientId], references: [id])

  @@unique([practiceId, patientId])
  @@map("recall_schedules")
}
```

### Pattern 2: Sequential Perio Entry State Machine
**What:** Client-side state for auto-advancing through teeth during charting
**When to use:** Periodontogram data entry

```typescript
interface PerioEntryState {
  phase: 'buccal' | 'lingual';
  currentToothIndex: number;
  currentSiteIndex: number; // 0=mesial, 1=mid, 2=distal
  awaitingBOP: boolean; // after depth, mark BOP before advancing
  presentTeeth: number[]; // FDI numbers of non-missing teeth
  undoStack: PerioAction[];
  redoStack: PerioAction[];
}

// Buccal order: 18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28
// Then lingual same order
// Auto-skip missing teeth based on Tooth model status
```

### Pattern 3: 2D SVG Periodontogram Visualization
**What:** Traditional perio chart as SVG with depth bars and color coding
**When to use:** Chart visualization alongside entry panel

Key elements per tooth:
- Tooth silhouette SVG (already exists in perio-mode.tsx)
- Probing depth bars (height = depth in mm scaled)
- Gingival margin line (recession shown below reference)
- BOP dots (red dots at bleeding sites)
- Color coding: green <4mm, yellow 4-5mm, orange 6mm, red 7+mm
- Buccal row on top, lingual row on bottom
- Missing teeth collapsed (not shown)

### Anti-Patterns to Avoid
- **Re-exporting dentist pages:** Phase 10 did `export { default } from '@/app/(dashboard)/...'` for agenda, berichten, billing. Phase 11 must build dedicated pages — the CONTEXT.md says the portal is "completely separate"
- **Modifying dashboard pages:** CLAUDE.md rule: never modify `(dashboard)/` files
- **3D for periodontogram:** Decision is 2D. Do not use Three.js/WebGL for perio chart
- **Storing perio data as JSON:** Migrate away from `PeriodontalChart.chartData` JSON to relational PerioSession/PerioSite

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Perio classification (EFP/AAP) | Custom staging logic | Well-defined clinical algorithm from guidelines | Classification rules are standardized — implement once correctly based on published criteria |
| O'Leary plaque index | Ad-hoc percentage | Standard formula: (plaque sites / total sites) * 100 | Clinical standard, must match expected calculation |
| Undo/redo | Custom stack | useReducer with action history | React pattern, well-understood |
| Auto-save | Custom debounce | Debounced save with optimistic UI | Standard pattern with lodash.debounce or custom hook |
| SVG tooth rendering | New from scratch | Adapt existing ToothSilhouette from perio-mode.tsx | Already 100+ lines of tooth SVGs by type |

## Common Pitfalls

### Pitfall 1: Schema Migration Breaking Existing Data
**What goes wrong:** Adding new PerioSession/PerioSite tables requires migrating data from PeriodontalChart.chartData JSON
**Why it happens:** Existing perio data lives in JSON blobs
**How to avoid:** Write a migration script that reads PeriodontalChart records, parses chartData JSON, creates PerioSession + PerioSite rows, then mark old records as migrated (don't delete immediately)
**Warning signs:** Empty perio history for patients who had prior charting

### Pitfall 2: Missing Prisma Relations
**What goes wrong:** New models (PerioSession, PerioSite, RecallSchedule, PerioProtocol) must have inverse relations on Patient, Practice, User, Appointment
**Why it happens:** Prisma requires both sides of relations
**How to avoid:** Add relation arrays to Patient, Practice, User, Appointment models when adding new models
**Warning signs:** `pnpm db:generate` fails

### Pitfall 3: Navigation Hardcoded in Layout
**What goes wrong:** Current layout.tsx has 5 nav items hardcoded. Adding 7+ more items needs scroll/grouping
**Why it happens:** Sidebar gets too long for smaller screens
**How to avoid:** Group nav items (e.g., Clinical section, Admin section) or make sidebar scrollable (already has `overflow-y-auto`)
**Warning signs:** Nav items cut off on smaller desktop screens

### Pitfall 4: Perio Entry Performance
**What goes wrong:** Rendering 32 tooth SVGs + depth bars + indicators with real-time updates lags
**Why it happens:** Re-rendering entire chart on every keystroke
**How to avoid:** Use React.memo on individual tooth components, update only the active tooth on input, debounce chart re-render
**Warning signs:** Input lag during fast sequential entry

### Pitfall 5: API Route Namespacing
**What goes wrong:** Hygienist API routes conflict with or duplicate existing routes
**Why it happens:** Unclear boundary between staff routes and hygienist-specific routes
**How to avoid:** Use `/api/hygienist/` namespace for hygienist-specific endpoints (perio sessions, recalls, protocols). Reuse existing `/api/patients/`, `/api/appointments/` etc. for shared CRUD
**Warning signs:** Duplicate endpoints doing the same thing

### Pitfall 6: Conversation Handoff Complexity
**What goes wrong:** Transferring a patient conversation from hygienist to dentist creates orphaned threads
**Why it happens:** Conversation model has single `practitionerId`
**How to avoid:** Handoff changes `practitionerId` on the Conversation, adds a system message noting the transfer, preserves full message history
**Warning signs:** Dentist can't see conversation history after handoff

## Code Examples

### Sequential Entry Auto-Advance Hook
```typescript
// Buccal order per clinical practice
const BUCCAL_ORDER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LINGUAL_ORDER = [...BUCCAL_ORDER]; // same tooth order, lingual surface

function usePerioEntry(presentTeeth: number[]) {
  const [state, dispatch] = useReducer(perioReducer, initialState(presentTeeth));

  const recordDepth = (depth: number) => {
    dispatch({ type: 'RECORD_DEPTH', depth });
    // After depth, await BOP input
  };

  const recordBOP = (bleeding: boolean) => {
    dispatch({ type: 'RECORD_BOP', bleeding });
    // Auto-advance to next site/tooth
  };

  const undo = () => dispatch({ type: 'UNDO' });
  const redo = () => dispatch({ type: 'REDO' });

  return { state, recordDepth, recordBOP, undo, redo };
}
```

### Perio Summary Calculation
```typescript
function calculatePerioSummary(sites: PerioSite[]) {
  const totalSites = sites.length;
  const bleedingSites = sites.filter(s => s.bleeding).length;
  const plaqueSites = sites.filter(s => s.plaque).length;
  const deepSites = sites.filter(s => s.probingDepth >= 6).length;
  const avgDepth = sites.reduce((sum, s) => sum + s.probingDepth, 0) / totalSites;

  return {
    bopPercent: Math.round((bleedingSites / totalSites) * 100),
    plaquePercent: Math.round((plaqueSites / totalSites) * 100), // O'Leary index
    meanPD: avgDepth.toFixed(1),
    sitesOver6mm: deepSites,
  };
}
```

### Color Coding by Severity
```typescript
const DEPTH_COLORS = {
  healthy: '#22c55e',   // green — 1-3mm
  moderate: '#eab308',  // yellow — 4-5mm
  severe: '#f97316',    // orange — 6mm
  critical: '#ef4444',  // red — 7+mm
} as const;

function getDepthColor(depth: number): string {
  if (depth <= 3) return DEPTH_COLORS.healthy;
  if (depth <= 5) return DEPTH_COLORS.moderate;
  if (depth === 6) return DEPTH_COLORS.severe;
  return DEPTH_COLORS.critical;
}
```

## State of the Art

| Old Approach (Phase 10) | New Approach (Phase 11) | Impact |
|--------------------------|-------------------------|--------|
| JSON `chartData` in PeriodontalChart | Relational PerioSession + PerioSite tables | Queryable data, proper indexing, per-site queries |
| 3D tooth models in WebGL for perio | 2D SVG traditional periodontogram | Faster, no WebGL context limits, clinical standard |
| Re-exported dentist pages | Dedicated hygienist pages | Full customization, hygienist-focused workflows |
| No sequential entry | Auto-advance sequential entry | 10x faster data entry for clinical use |
| No recall management | RecallSchedule model + recall page | Proactive patient follow-up |
| No protocol tracking | PerioProtocol model | Multi-visit workflow management |

## Existing Code Inventory

### What Exists (Phase 10)
| File | Status | Phase 11 Action |
|------|--------|-----------------|
| `(hygienist)/layout.tsx` (267 lines) | Glass sidebar, 5 nav items, emerald accent | Expand nav to 12+ items |
| `hygienist/dashboard/page.tsx` (270 lines) | Basic dashboard with widgets | Rebuild with richer metrics |
| `hygienist/patients/page.tsx` (167 lines) | Patient list | Keep/enhance |
| `hygienist/patients/[id]/page.tsx` (1 line) | Re-exports dentist patient detail | Replace with hygienist-focused detail |
| `hygienist/patients/[id]/notes/page.tsx` | Clinical notes page | Keep |
| `hygienist/agenda/page.tsx` (1 line) | Re-exports dentist agenda | Replace with own agenda |
| `hygienist/berichten/page.tsx` (1 line) | Re-exports dentist berichten | Replace with dual-tab messaging |
| `hygienist/billing/page.tsx` (1 line) | Re-exports dentist billing | Replace with hygienist declaratie |

### Reusable Components
| Component | Lines | Reusable? |
|-----------|-------|-----------|
| `perio-mode.tsx` ToothSilhouette | ~100 | YES — extract SVG tooth shapes |
| `perio/probing-panel.tsx` | 603 | PARTIAL — reference for data entry UI |
| `perio/line-graph.tsx` | 247 | YES — adapt for history comparison |
| `perio/indicator-rows.tsx` | 94 | PARTIAL — reference for BOP/plaque dots |
| `perio/perio-classification.tsx` | exists | YES — EFP/AAP classification logic |

## Open Questions

1. **Data migration volume**
   - What we know: PeriodontalChart table has JSON chartData from Phase 10
   - What's unclear: How many records exist in production?
   - Recommendation: Build migration script, test with seed data, handle empty/malformed JSON gracefully

2. **Conversation model for hygienist patient messaging**
   - What we know: Conversation model has `practitionerId` field — works for single practitioner conversations
   - What's unclear: Should hygienist-patient conversations use the same Conversation model or new one?
   - Recommendation: Reuse Conversation model — `practitionerId` points to hygienist User. Handoff changes this field.

3. **Billing P-codes subset**
   - What we know: NzaCode table has all codes, hygienist uses P-codes (parodontologie/preventie)
   - What's unclear: Exact filtering logic for hygienist-relevant codes
   - Recommendation: Filter NzaCode by category for P-codes in hygienist billing UI

## Sources

### Primary (HIGH confidence)
- Prisma schema: `packages/database/prisma/schema.prisma` — full schema examined (1610 lines)
- Existing hygienist pages: all 8 files in `(hygienist)/` route group examined
- Shared types: `packages/shared-types/src/odontogram.ts` — PerioToothData interface
- Perio components: 5 files in `components/odontogram/perio/` (1812 total lines)
- CONTEXT.md: All decisions reviewed and constrained research

### Secondary (MEDIUM confidence)
- EFP/AAP classification: Standard clinical guidelines (well-established, implemented in existing `perio-classification.tsx`)
- O'Leary plaque index: Standard clinical formula

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all existing
- Architecture: HIGH — clear route structure, existing patterns to follow
- Schema design: HIGH — relational model is straightforward, existing schema well understood
- Periodontogram UI: MEDIUM — 2D SVG approach clear but complex component, entry UX needs careful implementation
- Pitfalls: HIGH — identified from direct codebase examination

**Research date:** 2026-02-18
**Valid until:** 2026-03-18
