import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: paymentId } = await params;

    // Get payment with invoice to verify patient ownership
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          select: {
            patientId: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Verify payment belongs to patient
    if (payment.invoice.patientId !== patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      mollieStatus: payment.mollieStatus,
      paidAt: payment.paidAt,
    });
  } catch (error: any) {
    console.error("Failed to get payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get payment" },
      { status: 500 }
    );
  }
}
