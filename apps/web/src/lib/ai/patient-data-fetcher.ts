import { prisma } from "@nexiom/database";

export interface PatientContext {
  gender: string | null;
  insuranceType: string | null;
  medicalAlerts: string[];
  appointments: Array<{
    date: string;
    time: string;
    type: string;
    status: string;
    practitionerName: string;
  }>;
  treatmentPlans: Array<{
    title: string;
    status: string;
    treatments: Array<{
      description: string;
      toothNumber: number | null;
      nzaCode: string | null;
      nzaDescription: string | null;
      unitPrice: number | null;
      totalPrice: number | null;
      status: string;
    }>;
  }>;
  invoices: Array<{
    invoiceNumber: string;
    date: string;
    total: number;
    status: string;
    lines: Array<{
      description: string;
      nzaCode: string | null;
      quantity: number;
      lineTotal: number;
    }>;
  }>;
  clinicalNotes: Array<{
    noteType: string;
    content: string;
    date: string;
  }>;
  pendingConsents: Array<{
    title: string;
    consentType: string;
    createdAt: string;
  }>;
  recentImages: Array<{
    imageType: string;
    notes: string | null;
    date: string;
  }>;
  currentPage?: string;
}

export async function fetchPatientContext(
  patientId: string,
  currentPage?: string
): Promise<PatientContext | null> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      gender: true,
      insuranceType: true,
      medicalAlerts: true,
      appointments: {
        orderBy: { startTime: "desc" },
        take: currentPage === "appointments" ? 20 : 10,
        select: {
          startTime: true,
          appointmentType: true,
          status: true,
          practitioner: {
            select: { firstName: true, lastName: true },
          },
        },
      },
      treatmentPlans: {
        orderBy: { createdAt: "desc" },
        take: currentPage === "treatment-plans" ? 10 : 5,
        select: {
          title: true,
          status: true,
          treatments: {
            select: {
              description: true,
              status: true,
              tooth: { select: { toothNumber: true } },
              nzaCode: {
                select: { code: true, descriptionNl: true },
              },
              unitPrice: true,
              totalPrice: true,
            },
          },
        },
      },
      invoices: {
        orderBy: { invoiceDate: "desc" },
        take: currentPage === "invoices" ? 20 : 10,
        select: {
          invoiceNumber: true,
          invoiceDate: true,
          total: true,
          status: true,
          lines: {
            select: {
              description: true,
              nzaCode: true,
              quantity: true,
              lineTotal: true,
            },
          },
        },
      },
      clinicalNotes: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          noteType: true,
          content: true,
          createdAt: true,
        },
      },
      consentForms: {
        where: { status: "PENDING" },
        select: {
          title: true,
          consentType: true,
          createdAt: true,
        },
      },
      patientImages: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          imageType: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });

  if (!patient) return null;

  return {
    gender: patient.gender,
    insuranceType: patient.insuranceType,
    medicalAlerts: patient.medicalAlerts,
    appointments: patient.appointments.map((a) => ({
      date: a.startTime.toISOString().split("T")[0],
      time: a.startTime.toISOString().split("T")[1].slice(0, 5),
      type: a.appointmentType,
      status: a.status,
      practitionerName: [a.practitioner.firstName, a.practitioner.lastName]
        .filter(Boolean)
        .join(" "),
    })),
    treatmentPlans: patient.treatmentPlans.map((tp) => ({
      title: tp.title,
      status: tp.status,
      treatments: tp.treatments.map((t) => ({
        description: t.description,
        toothNumber: t.tooth?.toothNumber ?? null,
        nzaCode: t.nzaCode?.code ?? null,
        nzaDescription: t.nzaCode?.descriptionNl ?? null,
        unitPrice: t.unitPrice ? Number(t.unitPrice) : null,
        totalPrice: t.totalPrice ? Number(t.totalPrice) : null,
        status: t.status,
      })),
    })),
    invoices: patient.invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      date: inv.invoiceDate.toISOString().split("T")[0],
      total: Number(inv.total),
      status: inv.status,
      lines: inv.lines.map((l) => ({
        description: l.description,
        nzaCode: l.nzaCode,
        quantity: l.quantity,
        lineTotal: Number(l.lineTotal),
      })),
    })),
    clinicalNotes: patient.clinicalNotes.map((n) => ({
      noteType: n.noteType,
      content: n.content,
      date: n.createdAt.toISOString().split("T")[0],
    })),
    pendingConsents: patient.consentForms.map((c) => ({
      title: c.title,
      consentType: c.consentType,
      createdAt: c.createdAt.toISOString().split("T")[0],
    })),
    recentImages: patient.patientImages.map((img) => ({
      imageType: img.imageType,
      notes: img.notes,
      date: img.createdAt.toISOString().split("T")[0],
    })),
    currentPage,
  };
}
