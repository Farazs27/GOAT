import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: Record<string, unknown> = {
      practiceId: user.practiceId,
    };

    if (statusFilter === "DUE" || statusFilter === "OVERDUE" || statusFilter === "COMPLETED") {
      where.status = statusFilter;
    }

    const recalls = await prisma.recallSchedule.findMany({
      where,
      orderBy: { nextDueDate: "asc" },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const formattedRecalls = recalls.map((r) => ({
      id: r.id,
      patient: {
        id: r.patient.id,
        name: `${r.patient.firstName} ${r.patient.lastName}`,
        email: r.patient.email,
      },
      intervalMonths: r.intervalMonths,
      nextDueDate: r.nextDueDate,
      status: r.status,
      lastCompletedAt: r.lastCompletedAt,
      reminderSentAt: r.reminderSentAt,
    }));

    return NextResponse.json({ recalls: formattedRecalls });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { patientId, intervalMonths, markCompleted, recallId } = body;

    // Mark as completed
    if (markCompleted && recallId) {
      const recall = await prisma.recallSchedule.findFirst({
        where: { id: recallId, practiceId: user.practiceId },
      });
      if (!recall) {
        return NextResponse.json({ error: "Recall not found" }, { status: 404 });
      }

      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + recall.intervalMonths);

      const updated = await prisma.recallSchedule.update({
        where: { id: recallId },
        data: {
          status: "DUE",
          lastCompletedAt: new Date(),
          nextDueDate: nextDue,
        },
      });

      return NextResponse.json(updated);
    }

    // Create or update recall schedule
    if (!patientId || !intervalMonths) {
      return NextResponse.json(
        { error: "patientId and intervalMonths are required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);

    const recall = await prisma.recallSchedule.upsert({
      where: {
        practiceId_patientId: {
          practiceId: user.practiceId,
          patientId,
        },
      },
      create: {
        practiceId: user.practiceId,
        patientId,
        intervalMonths,
        nextDueDate,
        status: "DUE",
      },
      update: {
        intervalMonths,
        nextDueDate,
      },
    });

    return NextResponse.json(recall, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
