import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const anamnesis = await prisma.anamnesis.findFirst({
      where: { patientId: user.patientId },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(anamnesis);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const { data: anamnesisData, completed } = body;

    const patient = await prisma.patient.findUnique({ where: { id: user.patientId } });
    if (!patient) throw new ApiError('Pati\u00ebnt niet gevonden', 404);

    const anamnesis = await prisma.anamnesis.create({
      data: {
        practiceId: patient.practiceId,
        patientId: user.patientId!,
        data: anamnesisData || {},
        version: 1,
        completedAt: completed ? new Date() : null,
      },
    });

    // Sync to patient record if completed
    if (completed && anamnesisData) {
      await syncAnamnesisToPatient(user.patientId!, anamnesisData);
    }

    return Response.json(anamnesis, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

async function syncAnamnesisToPatient(patientId: string, anamnesisData: any) {
  const updateData: any = {};

  if (anamnesisData.medicalAlerts && Array.isArray(anamnesisData.medicalAlerts)) {
    updateData.medicalAlerts = anamnesisData.medicalAlerts;
  }
  if (anamnesisData.medications && Array.isArray(anamnesisData.medications)) {
    updateData.medications = anamnesisData.medications;
  }
  if (anamnesisData.allergies && Array.isArray(anamnesisData.allergies)) {
    updateData.medicalAlerts = [
      ...(updateData.medicalAlerts || []),
      ...anamnesisData.allergies.map((a: string) => `Allergie: ${a}`),
    ];
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.patient.update({ where: { id: patientId }, data: updateData });
  }
}
