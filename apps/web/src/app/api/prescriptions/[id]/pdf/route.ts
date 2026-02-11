import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';
import { generatePrescriptionPdf } from '@/lib/pdf/prescription-pdf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const prescription = await prisma.prescription.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            bsn: true,
            patientNumber: true,
          },
        },
        prescriber: {
          select: {
            firstName: true,
            lastName: true,
            bigNumber: true,
            agbCode: true,
          },
        },
        practice: {
          select: {
            name: true,
            addressStreet: true,
            addressCity: true,
            addressPostal: true,
            phone: true,
            email: true,
            kvkNumber: true,
            agbCode: true,
            avgCode: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new ApiError('Recept niet gevonden', 404);
    }

    const doc = generatePrescriptionPdf({
      prescription: {
        medicationName: prescription.medicationName,
        genericName: prescription.genericName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        quantity: prescription.quantity,
        route: prescription.route,
        instructions: prescription.instructions,
        prescribedAt: prescription.prescribedAt,
        status: prescription.status,
      },
      patient: prescription.patient,
      prescriber: prescription.prescriber,
      practice: prescription.practice,
    });

    const pdfBuffer = doc.output('arraybuffer');
    const fileName = `recept-${prescription.medicationName.replace(/\s+/g, '-').toLowerCase()}-${prescription.patient.lastName.toLowerCase()}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
