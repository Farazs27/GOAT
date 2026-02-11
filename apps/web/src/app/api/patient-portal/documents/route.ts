import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const [invoices, consentForms, treatmentPlans, documentsList] =
      await Promise.all([
        prisma.invoice.findMany({
          where: { patientId: user.patientId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            total: true,
            patientAmount: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.consentForm.findMany({
          where: { patientId: user.patientId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            signedAt: true,
            createdAt: true,
          },
        }),
        prisma.treatmentPlan.findMany({
          where: { patientId: user.patientId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            proposedAt: true,
            acceptedAt: true,
            createdAt: true,
          },
        }),
        prisma.document.findMany({
          where: {
            patientId: user.patientId,
            isArchived: false,
          },
          orderBy: { createdAt: "desc" },
          include: {
            uploader: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

    // Map consent forms to documents
    const consentDocuments = consentForms.map((cf) => ({
      id: cf.id,
      title: cf.title,
      documentType: "Toestemmingsformulier",
      subType: cf.status === "SIGNED" ? "Getekend" : "In afwachting",
      status: cf.status,
      createdAt: cf.createdAt,
      signedAt: cf.signedAt,
      type: "consent",
    }));

    // Map treatment plans to documents
    const planDocuments = treatmentPlans.map((tp) => ({
      id: tp.id,
      title: tp.title,
      documentType: "Behandelplan",
      subType: tp.status,
      createdAt: tp.createdAt,
      proposedAt: tp.proposedAt,
      acceptedAt: tp.acceptedAt,
      type: "treatment_plan",
    }));

    // Map uploaded documents
    const uploadedDocuments = documentsList.map((doc) => ({
      id: doc.id,
      title: doc.title,
      documentType: getDocumentTypeLabel(doc.documentType),
      description: doc.description,
      createdAt: doc.createdAt,
      uploadedBy: doc.uploader
        ? `${doc.uploader.firstName} ${doc.uploader.lastName}`
        : "Praktijk",
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      s3Key: doc.s3Key,
      type: "document",
    }));

    // Combine all documents
    const documents = [
      ...consentDocuments,
      ...planDocuments,
      ...uploadedDocuments,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return Response.json({ invoices, documents });
  } catch (error) {
    return handleError(error);
  }
}

function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    REFERRAL: "Verwijzing",
    LAB_RESULT: "Labresultaat",
    XRAY: "Röntgenfoto",
    PHOTO: "Foto",
    REPORT: "Verslag",
    CONSENT: "Toestemmingsformulier",
    TREATMENT_PLAN: "Behandelplan",
    INSURANCE: "Verzekeringsdocument",
    OTHER: "Overig",
  };
  return labels[type] || type;
}
