import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError, ApiError } from '@/lib/auth';
import { UserRole } from '@dentflow/shared-types';
import { jsPDF } from 'jspdf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);
    const { id } = await params;

    const form = await prisma.consentForm.findFirst({
      where: { id, patientId: user.patientId },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        practice: { select: { name: true } },
      },
    });

    if (!form) throw new ApiError('Toestemmingsformulier niet gevonden', 404);
    if (form.status !== 'SIGNED') throw new ApiError('Dit formulier is nog niet ondertekend', 400);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 30;

    // Practice name header
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(form.practice.name, margin, y);
    y += 15;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(form.title || 'Toestemmingsformulier', margin, y);
    y += 15;

    // Content
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(form.content || form.description, maxWidth);
    for (const line of lines) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    }

    y += 15;

    // Signature section
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Embed signature image if available
    if (form.signatureUrl) {
      try {
        const sigResponse = await fetch(form.signatureUrl);
        const sigBuffer = await sigResponse.arrayBuffer();
        const base64Sig = Buffer.from(sigBuffer).toString('base64');
        const imgData = `data:image/png;base64,${base64Sig}`;
        doc.addImage(imgData, 'PNG', margin, y, 60, 25);
        y += 30;
      } catch {
        // If fetch fails, try signatureData
        if (form.signatureData) {
          try {
            doc.addImage(form.signatureData, 'PNG', margin, y, 60, 25);
            y += 30;
          } catch {
            // skip image
          }
        }
      }
    } else if (form.signatureData) {
      try {
        doc.addImage(form.signatureData, 'PNG', margin, y, 60, 25);
        y += 30;
      } catch {
        // skip image
      }
    }

    // Signer details
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Ondertekend door: ${form.signedByName || 'Onbekend'}`, margin, y);
    y += 6;
    doc.text(`Datum: ${form.signedAt ? new Date(form.signedAt).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Onbekend'}`, margin, y);
    y += 6;
    if (form.signerRelation && form.signerRelation !== 'SELF') {
      doc.text(`Relatie: ${form.signerRelation}`, margin, y);
      y += 6;
    }
    doc.text(`Versie: ${form.version}`, margin, y);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const fileName = `toestemming-${form.title?.replace(/[^a-zA-Z0-9]/g, '-') || id}.pdf`;

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
