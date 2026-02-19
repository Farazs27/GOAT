import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const { sessionId, reason } = body as { sessionId: string; reason?: string };

    if (!sessionId) {
      throw new ApiError('sessionId is vereist', 400);
    }

    // Verify session belongs to patient
    const session = await prisma.aiChatSession.findFirst({
      where: { id: sessionId, patientId: user.patientId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { role: true, content: true },
        },
      },
    });

    if (!session) {
      throw new ApiError('Sessie niet gevonden', 404);
    }

    // Generate conversation summary
    const summary = session.messages
      .reverse()
      .map((m) => `- [${m.role}]: ${m.content.slice(0, 200)}`)
      .join('\n');

    // Find practitioner: most recent appointment's practitioner, or any DENTIST in practice
    let recipientId: string | null = null;

    const recentAppointment = await prisma.appointment.findFirst({
      where: { patientId: user.patientId! },
      orderBy: { startTime: 'desc' },
      select: { practitionerId: true },
    });

    if (recentAppointment) {
      // Get the user ID for this practitioner
      const practitioner = await prisma.user.findFirst({
        where: { id: recentAppointment.practitionerId },
        select: { id: true },
      });
      recipientId = practitioner?.id || null;
    }

    if (!recipientId) {
      // Fallback: find any DENTIST in practice
      const dentist = await prisma.user.findFirst({
        where: { practiceId: user.practiceId, role: 'DENTIST' },
        select: { id: true },
      });
      recipientId = dentist?.id || null;
    }

    if (!recipientId) {
      throw new ApiError('Geen beschikbare medewerker gevonden', 500);
    }

    // Create notification
    await prisma.notification.create({
      data: {
        practiceId: user.practiceId,
        userId: recipientId,
        patientId: user.patientId,
        channel: 'IN_APP',
        template: 'AI_HANDOFF',
        subject: 'AI-assistent doorverwijzing',
        content: `${reason ? `Reden: ${reason}\n\n` : ''}Gesprek samenvatting:\n${summary}`,
        metadata: { sessionId, patientId: user.patientId },
      },
    });

    return Response.json({
      success: true,
      message: 'Een medewerker neemt contact met u op.',
    });
  } catch (error) {
    return handleError(error);
  }
}
