import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";
import { put } from "@vercel/blob";
import { generateReferralPdf } from "@/lib/pdf/referral-pdf";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.DENTIST, UserRole.PRACTICE_ADMIN]);
    const { id: patientId } = await params;

    const body = await request.json();
    const {
      specialistType,
      specialistName,
      specialistPractice,
      specialistPhone,
      specialistEmail,
      reason,
      clinicalInfo,
      urgency,
    } = body;

    if (!specialistType || !reason) {
      throw new ApiError("Specialisttype en reden zijn verplicht", 400);
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
      include: { practice: true },
    });
    if (!patient) throw new ApiError("Patiënt niet gevonden", 404);

    const creator = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true, bigNumber: true },
    });
    if (!creator) throw new ApiError("Gebruiker niet gevonden", 404);

    const referral = await prisma.referral.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        createdBy: user.id,
        specialistType,
        specialistName: specialistName || null,
        specialistPractice: specialistPractice || null,
        specialistPhone: specialistPhone || null,
        specialistEmail: specialistEmail || null,
        reason,
        clinicalInfo: clinicalInfo || null,
        urgency: urgency || "ROUTINE",
        status: "SENT",
      },
    });

    // Generate PDF
    const pdfBuffer = generateReferralPdf({
      referralNumber: `VW-${new Date().getFullYear()}-${referral.id.slice(0, 8).toUpperCase()}`,
      referralDate: referral.referralDate,
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        patientNumber: patient.patientNumber,
        dateOfBirth: patient.dateOfBirth,
        email: patient.email,
        phone: patient.phone,
      },
      practice: {
        name: patient.practice.name,
        addressStreet: patient.practice.addressStreet,
        addressCity: patient.practice.addressCity,
        addressPostal: patient.practice.addressPostal,
        phone: patient.practice.phone,
        email: patient.practice.email,
        agbCode: patient.practice.agbCode,
      },
      referringDentist: {
        name: `${creator.firstName || ""} ${creator.lastName || ""}`.trim(),
        bigNumber: creator.bigNumber,
      },
      specialist: {
        type: specialistType,
        name: specialistName,
        practice: specialistPractice,
        phone: specialistPhone,
        email: specialistEmail,
      },
      reason,
      clinicalInfo,
      urgency: urgency || "ROUTINE",
    });

    // Upload PDF to Vercel Blob
    const blob = await put(`referrals/${referral.id}.pdf`, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
    });

    await prisma.referral.update({
      where: { id: referral.id },
      data: { pdfUrl: blob.url },
    });

    return Response.json({
      success: true,
      referral: { ...referral, pdfUrl: blob.url },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [
      UserRole.DENTIST,
      UserRole.PRACTICE_ADMIN,
      UserRole.RECEPTIONIST,
    ]);
    const { id: patientId } = await params;

    const referrals = await prisma.referral.findMany({
      where: { patientId, practiceId: user.practiceId },
      include: {
        creator: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { referralDate: "desc" },
    });

    return Response.json({ referrals });
  } catch (error) {
    return handleError(error);
  }
}
