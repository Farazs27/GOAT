import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const body = await request.json();
    const { messageId, feedback } = body as { messageId: string; feedback: string };

    if (!messageId || !['up', 'down'].includes(feedback)) {
      throw new ApiError('messageId en feedback (up/down) zijn vereist', 400);
    }

    // Verify message belongs to patient's session
    const message = await prisma.aiChatMessage.findFirst({
      where: { id: messageId },
      include: { session: { select: { patientId: true } } },
    });

    if (!message || message.session.patientId !== user.patientId) {
      throw new ApiError('Bericht niet gevonden', 404);
    }

    await prisma.aiChatMessage.update({
      where: { id: messageId },
      data: { feedback },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
