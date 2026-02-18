import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

const VALID_FLAG_TYPES = ['Needs follow-up', 'Noted', 'Urgent', 'Discuss at next visit'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id: patientId, noteId } = await params;

    // Verify note belongs to practice
    const note = await prisma.clinicalNote.findFirst({
      where: { id: noteId, patientId, practiceId: user.practiceId },
    });
    if (!note) throw new ApiError('Notitie niet gevonden', 404);

    const flags = await prisma.noteFlag.findMany({
      where: { noteId },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(flags);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id: patientId, noteId } = await params;
    const body = await request.json();

    const { flagType, comment } = body;

    if (!VALID_FLAG_TYPES.includes(flagType)) {
      throw new ApiError(`Ongeldig flagType. Kies uit: ${VALID_FLAG_TYPES.join(', ')}`, 400);
    }

    // Verify note and get author + patient info
    const note = await prisma.clinicalNote.findFirst({
      where: { id: noteId, patientId, practiceId: user.practiceId },
      include: {
        author: { select: { name: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });
    if (!note) throw new ApiError('Notitie niet gevonden', 404);

    const flag = await prisma.noteFlag.create({
      data: {
        noteId,
        flagType,
        comment: comment || null,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Determine target role for notification
    const targetRole = user.role === 'DENTIST' ? 'HYGIENIST' : 'DENTIST';
    const targetUsers = await prisma.user.findMany({
      where: { practiceId: user.practiceId, role: targetRole, isActive: true },
      select: { id: true },
    });

    const patientName = `${note.patient.firstName} ${note.patient.lastName}`;
    const authorName = note.author.name || 'Onbekend';
    const notificationContent = `${flagType} op notitie van ${authorName} voor ${patientName}`;

    // Create notifications for all target role users
    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map(u => ({
          practiceId: user.practiceId,
          userId: u.id,
          patientId,
          channel: 'IN_APP' as const,
          template: 'note_flag',
          subject: flagType,
          content: notificationContent,
          status: 'PENDING' as const,
          metadata: { noteId, flagId: flag.id, flagType },
        })),
      });
    }

    return Response.json(flag, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const user = await withAuth(request);
    const { noteId } = await params;
    const { searchParams } = new URL(request.url);
    const flagId = searchParams.get('flagId');

    if (!flagId) throw new ApiError('flagId is verplicht', 400);

    const flag = await prisma.noteFlag.findFirst({
      where: { id: flagId, noteId },
    });
    if (!flag) throw new ApiError('Flag niet gevonden', 404);

    // Only creator or admin can delete
    if (flag.createdById !== user.id && user.role !== 'PRACTICE_ADMIN') {
      throw new ApiError('Alleen de maker of admin kan deze flag verwijderen', 403);
    }

    await prisma.noteFlag.delete({ where: { id: flagId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
