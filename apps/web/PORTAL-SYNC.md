# Portal Sync Documentation

# ⚠️ CRITICAL: DO NOT MODIFY DENTIST PORTAL

The following directories and files MUST NOT be modified during patient portal development:
- `apps/web/src/app/(dashboard)/` — ALL dentist portal pages
- `apps/web/src/app/api/` (existing routes) — DO NOT alter existing API routes
- `apps/web/src/components/` (existing components) — DO NOT modify shared components

Patient portal work should ONLY touch:
- `apps/web/src/app/(patient)/` — patient portal pages
- `apps/web/src/app/api/portal/` — patient-specific API routes (NEW only)
- `apps/web/src/app/api/auth/patient-login/` — patient auth (existing, can modify)
- New components in `apps/web/src/components/patient/` (create new dir)

---

## Section 1: Dentist Portal — Completed Features

The dentist portal (`app/(dashboard)/`) includes the following completed features:

### Dashboard
- Practice overview with key statistics
- Today's appointments summary
- Recent patients list

### Agenda
- Appointment calendar and scheduling
- Appointment detail panel with tabs:
  - **Gebitstatus/Odontogram** — interactive dental chart
  - **Behandelingen** — treatments performed during appointment
  - **Notities** — clinical notes
  - **Declaratie** — billing/claims for the appointment
  - **Recepten** — prescriptions
  - **Dossier** — patient file/documents

### Patienten
- Patient list with search and filters
- Patient detail view with tabs:
  - **Overzicht** — patient overview (demographics, insurance, contact)
  - **Gebitstatus** — dental chart / odontogram
  - **Behandelingen** — treatment history and plans
  - **Notities** — clinical notes history
  - **Facturen** — invoices linked to patient
  - **Rontgen** — X-ray images
  - **Recepten** — prescriptions
  - **Dossier** — documents and files

### Facturen (Billing)
- Invoice list and management
- PDF invoice generation
- Payment registration

### Betalingen (Payments)
- Payments overview
- Outstanding payment tracking

### Settings
- Practice settings, user management

### Reports
- Practice reporting and analytics

---

## Section 2: Critical Rules for Patient Portal Development

These rules MUST be followed when building patient portal features:

1. **DO NOT modify any existing dentist portal pages** — no changes to files in `app/(dashboard)/`. The dentist portal is stable and must not be affected by patient portal work.

2. **DO NOT modify existing API routes** — patient portal must use separate endpoints (under `app/api/portal/`) or use query params to differentiate. Never change the behavior of an API route that the dentist portal depends on.

3. **DO NOT alter Prisma schema** without verifying all existing relations still work. Run `pnpm --filter @dentflow/web build` after any schema change to confirm nothing breaks.

4. **Shared components** in `src/components/` can be USED but not MODIFIED. If the patient portal needs a variant of an existing component, create a patient-portal-specific wrapper in `src/components/patient-portal/` or co-locate it within the `(patient)/` route group.

5. **Auth separation**: Dentist portal uses `access_token` via `authFetch` (`src/lib/auth-fetch.ts`). Patient portal uses `patient_token` stored in localStorage — never mix these. Patient portal API routes must validate `patient_token`, not `access_token`.

---

## Section 3: Patient Portal Features to Sync

The patient portal reads from and writes to the same database tables as the dentist portal. Features and their data sources:

| Patient Portal Feature | Table(s) | Access |
|---|---|---|
| View own appointments | `Appointment` | Read |
| View own treatment history | `Treatment`, `TreatmentPlan` | Read |
| View own invoices and payment status | `Invoice`, `Payment` | Read |
| View own prescriptions | `Prescription` | Read |
| View own dental chart / odontogram | `Tooth`, `ToothSurface` | Read |
| Submit anamnesis forms | `Anamnesis` | Write |
| View own documents and X-rays | `Document`, `PatientImage` | Read |
| Messaging with practice | `Message` | Read/Write |

All queries MUST be scoped to the authenticated patient's `patientId`. The patient portal must never expose data belonging to other patients.

---

## Section 4: API Pattern for Patient Portal

### Route prefix
All patient portal API routes live under:
```
apps/web/src/app/api/portal/
```

### Authentication
Patient portal endpoints authenticate via the `patient_token` JWT, which contains:
- `patientId` — the logged-in patient's ID
- `practiceId` — the practice the patient belongs to

### Data scoping
Every query MUST filter by the authenticated patient's ID. Never return data for other patients.

### Example pattern

```typescript
// apps/web/src/app/api/portal/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@dentflow/database";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verify(token, process.env.JWT_SECRET!) as {
      patientId: string;
      practiceId: string;
    };

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: payload.patientId,
        practiceId: payload.practiceId,
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

### Patient-side fetch helper

On the client side, patient portal pages retrieve the token from localStorage:

```typescript
async function patientFetch(url: string, options?: RequestInit) {
  const token = localStorage.getItem("patient_token");
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
```
