import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const plan = await prisma.treatmentPlan.findFirst({
      where: { id, patientId: user.patientId },
      include: {
        patient: { select: { firstName: true, lastName: true, practiceId: true } },
        treatments: { select: { description: true } },
      },
    });

    if (!plan) throw new ApiError('Behandelplan niet gevonden', 404);
    if (plan.status !== 'PROPOSED') {
      throw new ApiError('Behandelplan kan alleen ondertekend worden als het status PROPOSED heeft', 400);
    }

    const body = await request.json();
    const { signatureData, signedByName, signerRelation } = body;

    if (!signatureData || !signedByName) {
      throw new ApiError('Handtekening en naam zijn verplicht', 400);
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const signedAt = new Date();

    // Upload signature to Vercel Blob
    let signatureUrl: string | null = null;
    try {
      if (signatureData.startsWith('data:image/')) {
        const base64Data = signatureData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = await put(
          `signatures/treatment-plans/${id}/${Date.now()}.png`,
          buffer,
          { access: 'public', contentType: 'image/png' }
        );
        signatureUrl = blob.url;
      }
    } catch (err) {
      console.error('Failed to upload signature to Blob:', err);
    }

    // Build content from plan description + treatments
    const treatmentDescriptions = plan.treatments.map(t => t.description).join(', ');
    const content = plan.description
      ? `${plan.description}\n\nBehandelingen: ${treatmentDescriptions}`
      : `Behandelplan: ${plan.title}\n\nBehandelingen: ${treatmentDescriptions}`;

    // Create consent form + update plan in transaction
    const [consentForm] = await prisma.$transaction([
      prisma.consentForm.create({
        data: {
          practiceId: plan.practiceId,
          patientId: plan.patientId,
          consentType: 'TREATMENT_APPROVAL',
          treatmentType: 'TREATMENT_PLAN',
          title: `Akkoord behandelplan: ${plan.title}`,
          content,
          treatmentPlanId: id,
          description: `Goedkeuring behandelplan: ${plan.title}`,
          signatureData,
          signedByName,
          signedAt,
          signedIp: clientIp,
          signedUserAgent: userAgent,
          signerRelation: signerRelation || 'SELF',
          signatureUrl,
          emailAddress: plan.patient.firstName, // placeholder
          status: 'SIGNED',
        },
      }),
      prisma.treatmentPlan.update({
        where: { id },
        data: { status: 'APPROVED', acceptedAt: signedAt },
      }),
    ]);

    // Notification for staff
    try {
      await prisma.notification.create({
        data: {
          practiceId: plan.practiceId,
          channel: 'IN_APP',
          template: 'TREATMENT_PLAN_SIGNED',
          subject: 'Behandelplan goedgekeurd',
          content: `Patient ${plan.patient.firstName} ${plan.patient.lastName} heeft behandelplan goedgekeurd: ${plan.title}`,
          status: 'PENDING',
        },
      });
    } catch {
      // non-critical
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          practiceId: plan.practiceId,
          action: 'TREATMENT_PLAN_SIGNED',
          resourceType: 'TreatmentPlan',
          resourceId: id,
          ipAddress: clientIp,
          userAgent,
          newValues: {
            signedByName,
            signedAt: signedAt.toISOString(),
            consentFormId: consentForm.id,
          },
        },
      });
    } catch {
      // non-critical
    }

    return Response.json({
      success: true,
      consentFormId: consentForm.id,
      treatmentPlanStatus: 'APPROVED',
    });
  } catch (error) {
    return handleError(error);
  }
}
