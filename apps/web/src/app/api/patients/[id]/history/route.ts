import { NextRequest } from 'next/server';
import { prisma } from '@dentflow/database';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id: patientId } = await params;

    // Verify patient belongs to same practice
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        patientNumber: true,
        medicalAlerts: true,
        medications: true,
        dateOfBirth: true,
        insuranceCompany: true,
      },
    });

    if (!patient) {
      throw new ApiError('Patiënt niet gevonden', 404);
    }

    const [treatments, clinicalNotes, images, prescriptions, anamnesis, periodontalChart] =
      await Promise.all([
        // All treatments
        prisma.treatment.findMany({
          where: { patientId, practiceId: user.practiceId },
          orderBy: { performedAt: 'desc' },
          select: {
            id: true,
            description: true,
            status: true,
            performedAt: true,
            createdAt: true,
            totalPrice: true,
            notes: true,
            nzaCode: { select: { code: true, descriptionNl: true } },
            tooth: { select: { toothNumber: true } },
            performer: { select: { firstName: true, lastName: true } },
          },
        }),

        // Last 20 clinical notes
        prisma.clinicalNote.findMany({
          where: { patientId, practiceId: user.practiceId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            noteType: true,
            content: true,
            createdAt: true,
            author: { select: { firstName: true, lastName: true } },
          },
        }),

        // Last 10 x-ray images
        prisma.patientImage.findMany({
          where: { patientId, practiceId: user.practiceId, imageType: 'XRAY' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            fileName: true,
            imageType: true,
            notes: true,
            createdAt: true,
          },
        }),

        // All active + last 20 prescriptions
        prisma.prescription.findMany({
          where: {
            patientId,
            practiceId: user.practiceId,
          },
          orderBy: { prescribedAt: 'desc' },
          take: 30,
          select: {
            id: true,
            medicationName: true,
            dosage: true,
            frequency: true,
            status: true,
            prescribedAt: true,
            prescriber: { select: { firstName: true, lastName: true } },
          },
        }),

        // Latest anamnesis
        prisma.anamnesis.findFirst({
          where: { patientId, practiceId: user.practiceId },
          orderBy: { createdAt: 'desc' },
          select: { data: true, completedAt: true },
        }),

        // Latest periodontal chart
        prisma.periodontalChart.findFirst({
          where: { patientId, practiceId: user.practiceId },
          orderBy: { createdAt: 'desc' },
          select: { chartData: true, createdAt: true },
        }),
      ]);

    return Response.json({
      patient,
      treatments,
      clinicalNotes,
      images,
      prescriptions,
      anamnesis: anamnesis || null,
      periodontalChart: periodontalChart || null,
    });
  } catch (error) {
    return handleError(error);
  }
}
