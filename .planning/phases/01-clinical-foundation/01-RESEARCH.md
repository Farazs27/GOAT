# Phase 1: Clinical Foundation - Research

**Researched:** 2026-02-16
**Domain:** Odontogram clinical status recording + restoration tracking
**Confidence:** HIGH

## Summary

Phase 1 is about making the existing odontogram **fully functional** for clinical recording. The good news: approximately 80-90% of the infrastructure already exists. The Prisma schema has `Tooth`, `ToothSurface`, and `Treatment` models with appropriate enums (`ToothStatus`, `SurfaceCondition`, `Material`, `RestorationType`). The API routes exist for fetching odontogram data, updating tooth status, recording surfaces, and fetching treatment history per tooth. The frontend has a complete `RestorationPanel` with surface selection, material picking, restoration type selection, and status changes (extraction/implant/endo).

The main gaps are: (1) the flow from `RestorationPanel` save through to the API is partially wired but lacks proper Treatment record creation (surfaces are recorded but no `Treatment` model entry is created, so there is no real treatment history), (2) there is no audit trail / history of status changes on the Tooth model itself, and (3) the visual refresh after saving works via `fetchOdontogramData()` but the UX could be tighter (optimistic updates, success feedback).

**Primary recommendation:** Wire the existing UI components to create proper `Treatment` records alongside `ToothSurface` records, add a tooth status history mechanism, and ensure the odontogram visually refreshes after every recording action. No new libraries or schema redesign needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLIN-01 | Odontogram is reactive -- clicking teeth records status, visually updates (do NOT change existing design) | UI already exists: `RestorationPanel` handles tooth selection, status changes (MISSING/IMPLANT/ENDO), and surfaces. API routes exist (`PATCH /teeth/[toothNumber]`, `POST /odontogram`). Gap: need to ensure `fetchOdontogramData()` reliably refreshes after every mutation, and the 3D arch + SVG occlusal views update colors correctly. The `handleRestorationSave` in `odontogram.tsx` already calls `onTreatmentApply` which triggers refresh. Main fix: ensure Treatment records are created (not just surfaces). |
| CLIN-02 | Restoration tracking linked to teeth and surfaces | Schema supports this: `ToothSurface` has `restorationType`, `material`, `treatmentId` (FK to `Treatment`). Gap: the current `POST /odontogram` route creates `ToothSurface` records but does NOT create a `Treatment` record or link via `treatmentId`. The `GET /teeth/[toothNumber]/treatments` route fakes treatment history by grouping surfaces by `recordedAt`. Fix: create actual `Treatment` records and link them to surfaces. |
</phase_requirements>

## Standard Stack

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | (existing) | ORM for Tooth, ToothSurface, Treatment models | Already used throughout |
| Next.js 15 API routes | (existing) | REST endpoints for odontogram CRUD | Existing pattern |
| @react-three/fiber | (existing) | 3D tooth rendering in dental arch | Already integrated |
| React 19 | (existing) | UI state management | Already used |

### Supporting (Already in Codebase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| authFetch | (custom) | Authenticated API calls with JWT refresh | All staff API calls |
| lucide-react | (existing) | Icons in restoration panel | UI elements |
| shadcn/ui | (existing) | Dialog, buttons, etc. | Any new UI controls |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| REST endpoints | tRPC or Server Actions | REST already established, no reason to switch mid-project |
| Manual state refresh | SWR / React Query | Would add caching + optimistic updates, but overkill for Phase 1 scope |

**Installation:**
```bash
# No new packages needed. Everything is already installed.
```

## Architecture Patterns

### Existing Project Structure (Relevant Files)
```
apps/web/src/
├── app/api/patients/[id]/
│   ├── odontogram/route.ts          # GET teeth+surfaces, POST new recording
│   ├── odontogram/batch/route.ts    # POST batch tooth updates
│   ├── odontogram/[toothNumber]/surfaces/route.ts  # POST single surface
│   ├── teeth/[toothNumber]/route.ts              # PATCH tooth status
│   └── teeth/[toothNumber]/treatments/route.ts   # GET treatment history
├── app/(dashboard)/patients/[id]/page.tsx  # Patient detail page (hosts Odontogram)
├── components/odontogram/
│   ├── odontogram.tsx                # Main orchestrator
│   ├── modes/overview-mode.tsx       # 3D arch + SVG occlusal view
│   ├── restoration/restoration-panel.tsx  # Side panel for recording
│   ├── restoration/surface-selector.tsx   # Surface picker (M,D,O,B,L)
│   ├── restoration/material-picker.tsx    # Material picker
│   ├── three/dental-arch-3d.tsx      # LOCKED 3D arch (DO NOT MODIFY orientation)
│   └── svg/tooth-renderer.tsx        # SVG tooth with colored surfaces
└── lib/
    ├── auth.ts                       # withAuth helper
    └── auth-fetch.ts                 # authFetch wrapper
```

### Pattern 1: Odontogram Data Flow (Current)
**What:** Patient page fetches teeth + surfaces, passes to Odontogram, which delegates to modes. RestorationPanel saves via callbacks.
**When to use:** All clinical recording actions.
**Flow:**
```
PatientPage
  ├── fetchOdontogramData() → GET /api/patients/{id}/odontogram
  ├── passes teeth[], surfaces[] to <Odontogram>
  ├── handleTreatmentApply → POST /api/patients/{id}/odontogram
  └── on success → fetchOdontogramData() again (full refresh)

Odontogram
  ├── overview mode: DentalArch3D + SVG OcclusalRow
  ├── click tooth → selectedTooth state → opens RestorationPanel (portal)
  ├── RestorationPanel.onSave → handleRestorationSave
  │   ├── if statusChange → PATCH /api/patients/{id}/teeth/{toothNumber}
  │   └── if surfaces+material → calls onTreatmentApply (parent callback)
  └── parent refreshes after API success
```

### Pattern 2: Treatment Record Creation (NEEDED - Gap)
**What:** When a restoration is saved, a `Treatment` record should be created and linked to `ToothSurface` records via `treatmentId`.
**Why:** Currently surfaces are orphaned -- no Treatment parent. The treatment history endpoint groups surfaces by timestamp (fragile).
**Implementation:**
```typescript
// In POST /api/patients/{id}/odontogram
const treatment = await prisma.treatment.create({
  data: {
    practiceId: user.practiceId,
    patientId: id,
    performedBy: user.id,
    toothId: tooth.id,
    description: `${restorationType} - ${surfaces.join(',')}`,
    status: 'COMPLETED',
    performedAt: new Date(),
  },
});

// Then create surfaces with treatmentId
for (const surf of surfaces) {
  await prisma.toothSurface.create({
    data: {
      ...surfaceData,
      treatmentId: treatment.id,
    },
  });
}
```

### Anti-Patterns to Avoid
- **Modifying dental-arch-3d.tsx orientation values:** LOCKED. No rotation, no scale changes, no camera changes.
- **Dynamic Tailwind classes:** Never use `bg-${color}-500`. Use static class maps (already done correctly in restoration panel).
- **Bypassing authFetch:** All staff API calls must go through `authFetch` for token refresh.
- **Mutating 3D scene objects directly:** Clone scenes before modifying materials (already done correctly).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooth status history | Custom changelog table | Add `ToothStatusHistory` model to Prisma or use `Treatment` records as implicit history | Audit trail needs proper schema support |
| Optimistic UI updates | Custom cache layer | Simple state update before API call, revert on error | React state is sufficient for Phase 1 |
| Surface validation | Custom validator | Prisma enums (`SurfaceCondition`, `Material`, `RestorationType`) | Already defined in schema |
| FDI tooth numbering | Custom logic | Existing constants in `dental-arch-3d.tsx` (MAXILLA, MANDIBLE arrays) | Already correct |

**Key insight:** The entire UI and most of the API layer already exists. Phase 1 is primarily about fixing data integrity (creating Treatment records) and ensuring the existing refresh cycle works reliably. This is a wiring/completion phase, not a greenfield build.

## Common Pitfalls

### Pitfall 1: Not Creating Treatment Records
**What goes wrong:** Surfaces are recorded but no `Treatment` row is created. History endpoint groups by `recordedAt` timestamp which is fragile and loses treatment metadata.
**Why it happens:** The original `POST /odontogram` route was built quickly and skipped Treatment creation.
**How to avoid:** Always create a `Treatment` record first, then create `ToothSurface` records with `treatmentId` pointing to it. Wrap in `prisma.$transaction()`.
**Warning signs:** Treatment history shows entries without NZA codes or performer info.

### Pitfall 2: Stale UI After Recording
**What goes wrong:** User saves a restoration but the odontogram doesn't visually update.
**Why it happens:** The `fetchOdontogramData()` refresh might fail silently, or the component doesn't re-render with new data.
**How to avoid:** Ensure `handleTreatmentApply` awaits the API call and always calls refresh. Consider optimistic updates for status changes.
**Warning signs:** User has to manually navigate away and back to see changes.

### Pitfall 3: Tooth Upsert Race Conditions
**What goes wrong:** Two rapid clicks create duplicate tooth records.
**Why it happens:** The `@@unique([patientId, toothNumber])` constraint on `Tooth` model prevents duplicates at DB level, but concurrent requests might fail.
**How to avoid:** The existing upsert pattern handles this correctly. Just ensure error handling shows a user-friendly message.

### Pitfall 4: Missing Surface Validation
**What goes wrong:** Invalid surface codes (e.g., 'X' instead of 'M','D','O','B','L','V','P') get saved.
**Why it happens:** No validation on the API route for surface values.
**How to avoid:** Validate surface strings against allowed values: `['M', 'D', 'O', 'B', 'V', 'L', 'P']` (B=Buccal/V=Vestibulair, L=Lingual/P=Palatinaal).

### Pitfall 5: Modifying Locked 3D Values
**What goes wrong:** Breaking the dental arch visualization.
**Why it happens:** Attempting to "fix" tooth positioning or orientation.
**How to avoid:** NEVER change values in `dental-arch-3d.tsx`: SLOT=1.2, Y_GAP=2.5, camera position=[0,0,18], fov=30. No rotation, no scale, no negative values.

## Code Examples

### Current Save Flow (restoration-panel.tsx -> odontogram.tsx -> patient page)
```typescript
// restoration-panel.tsx calls onSave:
onSave({
  restorationType: 'FILLING',
  surfaces: ['M', 'O'],
  material: 'COMPOSITE',
  action: 'save',
  statusChange: undefined, // or 'MISSING', 'IMPLANT', 'ENDO'
});

// odontogram.tsx handleRestorationSave:
// 1. If statusChange → PATCH /api/patients/{id}/teeth/{toothNumber}
// 2. If surfaces+material → calls onTreatmentApply (parent callback)

// patient page handleTreatmentApply:
// POST /api/patients/{id}/odontogram with { toothNumber, treatmentType, surfaces, material, restorationType }
// On success → fetchOdontogramData()
```

### Needed: Treatment Creation in API Route
```typescript
// POST /api/patients/{id}/odontogram — enhanced
const result = await prisma.$transaction(async (tx) => {
  // 1. Upsert tooth
  const tooth = await tx.tooth.upsert({
    where: { patientId_toothNumber: { patientId: id, toothNumber } },
    create: { practiceId: user.practiceId, patientId: id, toothNumber, status: status || 'PRESENT' },
    update: { ...(status ? { status } : {}) },
  });

  // 2. Create Treatment record
  const treatment = await tx.treatment.create({
    data: {
      practiceId: user.practiceId,
      patientId: id,
      performedBy: user.id,
      toothId: tooth.id,
      description: `${restorationType || treatmentType} - ${(surfaces || []).join(',')}`,
      status: 'COMPLETED',
      performedAt: new Date(),
    },
  });

  // 3. Create ToothSurface records linked to treatment
  if (surfaces?.length) {
    for (const surf of surfaces) {
      await tx.toothSurface.create({
        data: {
          practiceId: user.practiceId,
          toothId: tooth.id,
          surface: surf,
          condition: mapTreatmentToCondition(treatmentType),
          material: material || null,
          restorationType: restorationType || null,
          treatmentId: treatment.id,
          recordedBy: user.id,
        },
      });
    }
  }

  return { tooth, treatment };
});
```

### Tooth Status Visual Mapping (existing, for reference)
```typescript
// dental-arch-3d.tsx — STATUS_TINTS (color tints on 3D teeth)
const STATUS_TINTS = { CROWN: '#f59e0b', IMPLANT: '#8b5cf6', ENDO: '#f97316' };

// MISSING teeth render as wireframe capsule (ghost)
// IMPLANT teeth render with implant GLB model
// ENDO teeth render with red canal lines (EndoCanals3D component)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Surfaces without Treatment link | Surfaces should link to Treatment via treatmentId | This phase | Enables proper history & billing linkage |
| Grouping surfaces by recordedAt for history | Query Treatment records with included surfaces | This phase | Reliable history with metadata |

**Deprecated/outdated:**
- The `GET /teeth/[toothNumber]/treatments` endpoint currently fakes treatment entries by grouping surfaces by timestamp. This should be replaced with actual Treatment queries.

## Open Questions

1. **Should tooth status changes also create Treatment records?**
   - What we know: Status changes (MISSING/IMPLANT/ENDO) currently only PATCH the tooth. No Treatment is created.
   - What's unclear: Should an extraction (MISSING) create a Treatment? It would be useful for billing (NZA code E13).
   - Recommendation: Yes, create Treatment records for status changes too. This links them to billing later.

2. **Should there be a separate ToothStatusHistory model?**
   - What we know: Currently no audit trail when tooth status changes from PRESENT to CROWN to MISSING.
   - What's unclear: Is the Treatment table sufficient as implicit history, or do we need explicit status change logging?
   - Recommendation: Use Treatment records as the history mechanism for Phase 1. If needed later, add a lightweight `ToothStatusHistory` model.

3. **How to handle surface overwrites?**
   - What we know: Current approach creates new ToothSurface records each time (append-only). Multiple surface records can exist for the same tooth+surface combination.
   - What's unclear: Should old surface records be soft-deleted or marked superseded when a new restoration is placed on the same surface?
   - Recommendation: Keep append-only for Phase 1 (it preserves history). The GET endpoint already returns the latest by `recordedAt: 'desc'`. For display, group by surface and take the most recent.

## Sources

### Primary (HIGH confidence)
- **Prisma schema**: `/Users/farazsharifi/GOAT/packages/database/prisma/schema.prisma` — Tooth, ToothSurface, Treatment models with enums
- **Odontogram components**: `/Users/farazsharifi/GOAT/apps/web/src/components/odontogram/` — 19 files, full UI
- **API routes**: `/Users/farazsharifi/GOAT/apps/web/src/app/api/patients/[id]/odontogram/` and `/teeth/`
- **Patient detail page**: `/Users/farazsharifi/GOAT/apps/web/src/app/(dashboard)/patients/[id]/page.tsx`

### Secondary (MEDIUM confidence)
- CLAUDE.md and MEMORY.md project instructions — locked values and architectural decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — everything already exists in the codebase, no new libraries needed
- Architecture: HIGH — data flow is clear from reading the actual code, gaps are well-defined
- Pitfalls: HIGH — identified from reading the actual implementation and seeing where data is missing

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (stable — schema and UI are already built)
