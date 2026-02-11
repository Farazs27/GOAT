import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { id } = await params;

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        practice: true,
        patient: true,
        lines: {
          include: {
            treatment: {
              include: {
                performer: true,
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return Response.json(
        { message: "Factuur niet gevonden" },
        { status: 404 },
      );
    }

    // Security check: patient can only download their own invoices
    if (invoice.patientId !== user.patientId) {
      return Response.json(
        { message: "Geen toegang tot deze factuur" },
        { status: 403 },
      );
    }

    // Get practitioner info from the first line's treatment (if available)
    const practitioner = invoice.lines.find((l) => l.treatment?.performer)
      ?.treatment?.performer;

    // Transform data for PDF generator
    const pdfInvoice = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      insuranceAmount: Number(invoice.insuranceAmount),
      patientAmount: Number(invoice.patientAmount),
      paidAmount: Number(invoice.paidAmount),
      status: invoice.status,
      notes: invoice.notes,
      patient: {
        firstName: invoice.patient.firstName,
        lastName: invoice.patient.lastName,
        patientNumber: invoice.patient.patientNumber,
        bsn: invoice.patient.bsn,
        email: invoice.patient.email,
        addressStreet: invoice.patient.addressStreet,
        addressCity: invoice.patient.addressCity,
        addressPostal: invoice.patient.addressPostal,
      },
      practitioner: practitioner
        ? {
            name: `${practitioner.firstName || ""} ${practitioner.lastName || ""}`.trim(),
            bigNumber: practitioner.bigNumber,
          }
        : null,
      lines: invoice.lines.map((line) => ({
        nzaCode: line.nzaCode,
        description: line.description,
        toothNumber: line.toothNumber,
        surface: line.surface,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
        sortOrder: line.sortOrder,
      })),
      payments: invoice.payments.map((payment) => ({
        amount: Number(payment.amount),
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      })),
    };

    const pdfPractice = {
      name: invoice.practice.name,
      agbCode: invoice.practice.agbCode,
      kvkNumber: invoice.practice.kvkNumber,
      avgCode: invoice.practice.avgCode,
      addressStreet: invoice.practice.addressStreet,
      addressCity: invoice.practice.addressCity,
      addressPostal: invoice.practice.addressPostal,
      phone: invoice.practice.phone,
      email: invoice.practice.email,
    };

    // Generate PDF
    const pdfBuffer = generateInvoicePdf(pdfInvoice, pdfPractice);

    // Return PDF as downloadable file
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factuur-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
