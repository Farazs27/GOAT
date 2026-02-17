import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';
import { put } from '@vercel/blob';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const form = await prisma.consentForm.findFirst({
      where: { id, patientId: user.patientId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!form) throw new ApiError('Toestemmingsformulier niet gevonden', 404);
    if (form.status === 'REVOKED') throw new ApiError('Dit formulier is ingetrokken', 400);

    const body = await request.json();
    const { signatureData, signedByName, signerRelation } = body;

    if (!signatureData || !signedByName) {
      throw new ApiError('Handtekening en naam zijn verplicht', 400);
    }

    // Extract IP and user agent
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const signedAt = new Date();

    // Upload signature PNG to Vercel Blob
    let signatureUrl: string | null = null;
    try {
      if (signatureData.startsWith('data:image/')) {
        const base64Data = signatureData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = await put(
          `signatures/${id}/${Date.now()}.png`,
          buffer,
          { access: 'public', contentType: 'image/png' }
        );
        signatureUrl = blob.url;
      }
    } catch (err) {
      console.error('Failed to upload signature to Blob:', err);
      // Continue without blob URL — signatureData is still stored
    }

    // If already SIGNED, create a new version instead of updating
    if (form.status === 'SIGNED') {
      const newForm = await prisma.consentForm.create({
        data: {
          practiceId: form.practiceId,
          patientId: form.patientId,
          consentType: form.consentType,
          treatmentType: form.treatmentType,
          title: form.title,
          content: form.content,
          treatmentPlanId: form.treatmentPlanId,
          templateId: form.templateId,
          appointmentId: form.appointmentId,
          description: form.description,
          signatureData,
          signedByName,
          signedAt,
          signedIp: clientIp,
          signedUserAgent: userAgent,
          signerRelation: signerRelation || 'SELF',
          signatureUrl,
          emailAddress: form.patient.email,
          version: form.version + 1,
          language: form.language,
          status: 'SIGNED',
        },
      });

      // Notification for staff
      try {
        await prisma.notification.create({
          data: {
            practiceId: form.practiceId,
            channel: 'IN_APP',
            template: 'CONSENT_SIGNED',
            subject: 'Toestemming ondertekend',
            content: `Patient ${form.patient.firstName} ${form.patient.lastName} heeft toestemming ondertekend: ${form.title} (versie ${form.version + 1})`,
            status: 'PENDING',
          },
        });
      } catch {
        // non-critical
      }

      return Response.json(newForm);
    }

    // Normal signing flow
    const updated = await prisma.consentForm.update({
      where: { id },
      data: {
        signatureData,
        signedByName,
        signedAt,
        signedIp: clientIp,
        signedUserAgent: userAgent,
        signerRelation: signerRelation || 'SELF',
        signatureUrl,
        status: 'SIGNED',
        emailAddress: form.patient.email,
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          practiceId: form.practiceId,
          action: 'CONSENT_SIGNED',
          resourceType: 'ConsentForm',
          resourceId: id,
          ipAddress: clientIp,
          userAgent,
          newValues: {
            signedByName,
            signedAt: signedAt.toISOString(),
            treatmentType: form.treatmentType,
            signerRelation: signerRelation || 'SELF',
          },
        },
      });
    } catch {
      // non-critical
    }

    // Notification for staff
    try {
      await prisma.notification.create({
        data: {
          practiceId: form.practiceId,
          channel: 'IN_APP',
          template: 'CONSENT_SIGNED',
          subject: 'Toestemming ondertekend',
          content: `Patient ${form.patient.firstName} ${form.patient.lastName} heeft toestemming ondertekend: ${form.title}`,
          status: 'PENDING',
        },
      });
    } catch {
      // non-critical
    }

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
