import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = { patientId: user.patientId };
    if (
      status &&
      ["SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"].includes(status)
    ) {
      where.status = status;
    }

    // Fetch invoices with payment status
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        practice: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            amount: true,
            status: true,
            paidAt: true,
          },
        },
        _count: {
          select: {
            lines: true,
          },
        },
      },
    });

    // Calculate total amount paid for each invoice
    const invoicesWithPaidAmount = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      total: Number(invoice.total),
      insuranceAmount: Number(invoice.insuranceAmount),
      patientAmount: Number(invoice.patientAmount),
      status: invoice.status,
      lineCount: invoice._count.lines,
      practiceName: invoice.practice.name,
      totalPaid: invoice.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + Number(p.amount), 0),
      hasPayments: invoice.payments.length > 0,
      lastPaymentDate:
        invoice.payments.length > 0
          ? invoice.payments[invoice.payments.length - 1].paidAt
          : null,
    }));

    // Get summary statistics
    const [
      totalInvoices,
      unpaidCount,
      overdueCount,
      totalAmount,
      unpaidAmount,
    ] = await Promise.all([
      prisma.invoice.count({ where: { patientId: user.patientId } }),
      prisma.invoice.count({
        where: {
          patientId: user.patientId,
          status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        },
      }),
      prisma.invoice.count({
        where: {
          patientId: user.patientId,
          status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.invoice.aggregate({
        where: { patientId: user.patientId },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          patientId: user.patientId,
          status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        },
        _sum: { patientAmount: true },
      }),
    ]);

    return Response.json({
      invoices: invoicesWithPaidAmount,
      summary: {
        totalInvoices,
        unpaidCount,
        overdueCount,
        totalAmount: Number(totalAmount._sum.total || 0),
        unpaidAmount: Number(unpaidAmount._sum.patientAmount || 0),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
