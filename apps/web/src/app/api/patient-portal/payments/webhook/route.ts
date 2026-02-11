import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMollieClient } from "@/lib/mollie";

export async function POST(req: NextRequest) {
  try {
    // Parse body - Mollie sends the payment ID
    const body = await req.json();
    const molliePaymentId = body.id;

    if (!molliePaymentId) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    // Find payment record by molliePaymentId
    const payment = await prisma.payment.findFirst({
      where: { molliePaymentId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      console.error("Payment not found for Mollie payment ID:", molliePaymentId);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Get Mollie client for the practice
    const mollieClient = await getMollieClient(payment.practiceId);

    // Fetch payment status from Mollie
    const molliePayment = await mollieClient.payments.get(molliePaymentId);

    // Map Mollie status to our enum
    let paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" = "PENDING";
    let paidAt: Date | undefined;

    switch (molliePayment.status as string) {
      case "paid":
        paymentStatus = "COMPLETED";
        paidAt = new Date(molliePayment.paidAt || Date.now());
        break;
      case "failed":
      case "expired":
      case "canceled":
        paymentStatus = "FAILED";
        break;
      case "refunded":
        paymentStatus = "REFUNDED";
        break;
      default:
        paymentStatus = "PENDING";
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        mollieStatus: molliePayment.status,
        status: paymentStatus,
        paidAt,
      },
    });

    // If payment is completed, update invoice
    if (paymentStatus === "COMPLETED") {
      const invoice = payment.invoice;
      const newPaidAmount = Number(invoice.paidAmount) + Number(payment.amount);
      const patientAmount = Number(invoice.patientAmount);

      let invoiceStatus = invoice.status;
      if (newPaidAmount >= patientAmount) {
        invoiceStatus = "PAID";
      } else if (newPaidAmount > 0) {
        invoiceStatus = "PARTIALLY_PAID";
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: invoiceStatus,
        },
      });
    }

    // Mollie requires 200 OK response
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    // Still return 200 to prevent Mollie from retrying
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 }
    );
  }
}
