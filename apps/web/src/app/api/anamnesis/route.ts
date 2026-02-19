import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nexiom/database";
import { withAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();

    const { patientId, data, completed } = body;

    if (!patientId) {
      return NextResponse.json(
        { message: "Patient ID is verplicht" },
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

    // Check if anamnesis already exists for this patient
    const existingAnamnesis = await prisma.anamnesis.findFirst({
      where: {
        patientId,
        practiceId: user.practiceId,
      },
    });

    let anamnesis;

    if (existingAnamnesis) {
      // Update existing
      anamnesis = await prisma.anamnesis.update({
        where: { id: existingAnamnesis.id },
        data: {
          data: data || {},
          completedAt: completed ? new Date() : existingAnamnesis.completedAt,
        },
      });
    } else {
      // Create new
      anamnesis = await prisma.anamnesis.create({
        data: {
          practiceId: user.practiceId,
          patientId,
          data: data || {},
          completedAt: completed ? new Date() : null,
        },
      });
    }

    return NextResponse.json(anamnesis);
  } catch (error: any) {
    console.error("Error saving anamnesis:", error);
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

    const anamnesis = await prisma.anamnesis.findFirst({
      where: {
        patientId,
        practiceId: user.practiceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(anamnesis);
  } catch (error: any) {
    console.error("Error fetching anamnesis:", error);
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
