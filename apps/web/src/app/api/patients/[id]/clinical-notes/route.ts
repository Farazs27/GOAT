import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id: patientId } = await params;
    const { searchParams } = new URL(request.url);
    const noteType = searchParams.get('type');

    // Build where clause
    const where: Record<string, unknown> = {
      patientId,
      practiceId: user.practiceId,
    };

    if (noteType) {
      const validTypes = ['HYGIENE', 'SOAP', 'PROGRESS', 'REFERRAL', 'CONSENT'];
      const types = noteType.split(',').filter(t => validTypes.includes(t.toUpperCase()));
      if (types.length === 1) {
        where.noteType = types[0].toUpperCase();
      } else if (types.length > 1) {
        where.noteType = { in: types.map(t => t.toUpperCase()) };
      }
    }

    const notes = await prisma.clinicalNote.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, role: true } },
        flags: {
          include: {
            createdBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mark perio summary cards
    const enrichedNotes = notes.map(note => {
      let isPerioSummary = false;
      let perioChartId: string | null = null;
      if (note.noteType === 'HYGIENE') {
        try {
          const parsed = JSON.parse(note.content);
          if (parsed.perioChartId) {
            isPerioSummary = true;
            perioChartId = parsed.perioChartId;
          }
        } catch {
          // Content is plain text, not JSON
        }
      }
      return { ...note, isPerioSummary, perioChartId };
    });

    return Response.json(enrichedNotes);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id: patientId } = await params;
    const body = await request.json();

    // Verify patient belongs to practice
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, practiceId: user.practiceId },
    });
    if (!patient) throw new ApiError('Patient niet gevonden', 404);

    const { noteType, content, appointmentId, isConfidential } = body;

    // Role-based creation rules
    if (noteType === 'HYGIENE' && user.role !== 'HYGIENIST') {
      throw new ApiError('Alleen mondhygienisten kunnen HYGIENE notities aanmaken', 403);
    }
    if ((noteType === 'SOAP' || noteType === 'PROGRESS') && user.role !== 'DENTIST') {
      throw new ApiError('Alleen tandartsen kunnen SOAP/PROGRESS notities aanmaken', 403);
    }

    // Validate HYGIENE content structure
    if (noteType === 'HYGIENE') {
      let parsed: Record<string, unknown>;
      try {
        parsed = typeof content === 'string' ? JSON.parse(content) : content;
      } catch {
        throw new ApiError('HYGIENE notitie content moet geldige JSON zijn', 400);
      }

      const { oralHygieneScore, bopPercentage } = parsed;
      if (typeof oralHygieneScore !== 'number' || oralHygieneScore < 1 || oralHygieneScore > 5) {
        throw new ApiError('oralHygieneScore moet een nummer zijn tussen 1 en 5', 400);
      }
      if (typeof bopPercentage !== 'number' || bopPercentage < 0 || bopPercentage > 100) {
        throw new ApiError('bopPercentage moet een nummer zijn tussen 0 en 100', 400);
      }
    }

    const contentStr = noteType === 'HYGIENE' && typeof content !== 'string'
      ? JSON.stringify(content)
      : content;

    const note = await prisma.clinicalNote.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        authorId: user.id,
        noteType: noteType || 'PROGRESS',
        content: contentStr,
        appointmentId: appointmentId || null,
        isConfidential: isConfidential || false,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
        flags: true,
      },
    });

    return Response.json(note, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
