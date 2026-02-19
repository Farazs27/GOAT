import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nexiom/database";
import { withAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();

    const {
      patientId,
      consentType,
      title,
      description,
      signatureData,
      signedByName,
      status,
    } = body;

    if (!patientId || !consentType || !title) {
      return NextResponse.json(
        { message: "Patient ID, consent type en titel zijn verplicht" },
        { status: 400 },
      );
    }

    // Verify patient belongs to user's practice
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        practiceId: user.practiceId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { message: "Patiënt niet gevonden" },
        { status: 404 },
      );
    }

    const consentForm = await prisma.consentForm.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        consentType,
        title,
        description: description || "",
        signatureData: signatureData || null,
        signedByName: signedByName || null,
        signedAt: status === "SIGNED" ? new Date() : null,
        status: status || "PENDING",
        signedIp: null,
      },
    });

    return NextResponse.json(consentForm);
  } catch (error: any) {
    console.error("Error creating consent form:", error);
    if (error.status) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Interne serverfout" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { message: "Patient ID is verplicht" },
        { status: 400 },
      );
    }

    const consentForms = await prisma.consentForm.findMany({
      where: {
        patientId,
        practiceId: user.practiceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(consentForms);
  } catch (error: any) {
    console.error("Error fetching consent forms:", error);
    if (error.status) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Interne serverfout" },
      { status: 500 },
    );
  }
}
