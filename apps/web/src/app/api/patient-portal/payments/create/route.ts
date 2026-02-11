import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getMollieClient } from "@/lib/mollie";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    // Auth: Verify patient token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "PATIENT" || !decoded.patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patientId = decoded.patientId;

    // Parse body
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    // Verify invoice belongs to patient and is unpaid
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        practice: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.patientId !== patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if invoice can be paid
    const unpaidStatuses = ["SENT", "PARTIALLY_PAID", "OVERDUE"];
    if (!unpaidStatuses.includes(invoice.status)) {
      return NextResponse.json(
        { error: "Invoice is already fully paid or cannot be paid" },
        { status: 400 }
      );
    }

    // Calculate remaining amount
    const remainingAmount = Number(invoice.patientAmount) - Number(invoice.paidAmount);

    if (remainingAmount <= 0) {
      return NextResponse.json(
        { error: "Invoice is already fully paid" },
        { status: 400 }
      );
    }

    // Create Mollie payment
    const mollieClient = await getMollieClient(invoice.practiceId);
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Payment record first to get the ID
    const payment = await prisma.payment.create({
      data: {
        practiceId: invoice.practiceId,
        invoiceId: invoice.id,
        amount: remainingAmount,
        method: "IDEAL", // Default, Mollie will allow customer to choose
        status: "PENDING",
      },
    });

    // Create Mollie payment
    const molliePayment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: remainingAmount.toFixed(2),
      },
      description: `Factuur ${invoice.invoiceNumber}`,
      redirectUrl: `${origin}/portal/betalen?paymentId=${payment.id}`,
      webhookUrl: `${origin}/api/patient-portal/payments/webhook`,
      method: ["ideal", "creditcard"] as any,
      metadata: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        patientId,
      },
    });

    // Update payment with Mollie details
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        molliePaymentId: molliePayment.id,
        mollieCheckoutUrl: molliePayment.getCheckoutUrl() || undefined,
        mollieStatus: molliePayment.status,
      },
    });

    return NextResponse.json({
      checkoutUrl: molliePayment.getCheckoutUrl(),
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
