import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const existing = await prisma.anamnesis.findFirst({
      where: { id, patientId: user.patientId },
    });
    if (!existing) throw new ApiError('Anamnese niet gevonden', 404);

    const body = await request.json();
    const { data: anamnesisData, completed } = body;

    const updateData: any = {};
    if (anamnesisData) updateData.data = anamnesisData;
    if (completed) {
      updateData.completedAt = new Date();
      updateData.version = (existing.version || 1) + 1;
    }

    const updated = await prisma.anamnesis.update({ where: { id }, data: updateData });

    // Sync to patient record if completed
    if (completed) {
      const finalData = anamnesisData || (existing.data as any);
      if (finalData) {
        const syncData: any = {};

        if (finalData.medicalAlerts && Array.isArray(finalData.medicalAlerts)) {
          syncData.medicalAlerts = finalData.medicalAlerts;
        }
        if (finalData.medications && Array.isArray(finalData.medications)) {
          syncData.medications = finalData.medications;
        }
        if (finalData.allergies && Array.isArray(finalData.allergies)) {
          syncData.medicalAlerts = [
            ...(syncData.medicalAlerts || []),
            ...finalData.allergies.map((a: string) => `Allergie: ${a}`),
          ];
        }

        if (Object.keys(syncData).length > 0) {
          await prisma.patient.update({ where: { id: user.patientId }, data: syncData });
        }
      }
    }

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
