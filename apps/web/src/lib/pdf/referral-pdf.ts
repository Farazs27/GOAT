import { jsPDF } from 'jspdf';

interface ReferralPdfData {
  referralNumber: string;
  referralDate: Date | string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
    dateOfBirth: Date | string;
    email?: string | null;
    phone?: string | null;
  };
  practice: {
    name: string;
    addressStreet?: string | null;
    addressCity?: string | null;
    addressPostal?: string | null;
    phone?: string | null;
    email?: string | null;
    agbCode?: string | null;
  };
  referringDentist: {
    name: string;
    bigNumber?: string | null;
  };
  specialist: {
    type: string;
    name?: string | null;
    practice?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  reason: string;
  clinicalInfo?: string | null;
  urgency: string;
}

const ACCENT: [number, number, number] = [232, 148, 90];

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const urgencyLabels: Record<string, string> = {
  ROUTINE: 'Regulier',
  URGENT: 'Spoed',
  EMERGENCY: 'Noodgeval',
};

export function generateReferralPdf(data: ReferralPdfData): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 15;

  // Top accent bar
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Title
  y += 8;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('VERWIJSBRIEF', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Metadata line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Referentie: ${data.referralNumber}`, margin, y);
  doc.text(`Datum: ${formatDate(data.referralDate)}`, pageWidth - margin, y, { align: 'right' });
  y += 4;
  doc.text(`Urgentie: ${urgencyLabels[data.urgency] || data.urgency}`, margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // From: Practice info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Van:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(data.practice.name, margin, y);
  y += 4;
  if (data.practice.addressStreet) {
    doc.text(data.practice.addressStreet, margin, y);
    y += 4;
  }
  if (data.practice.addressPostal || data.practice.addressCity) {
    doc.text(`${data.practice.addressPostal || ''} ${data.practice.addressCity || ''}`.trim(), margin, y);
    y += 4;
  }
  if (data.practice.phone) {
    doc.text(`Tel: ${data.practice.phone}`, margin, y);
    y += 4;
  }
  if (data.practice.email) {
    doc.text(`E-mail: ${data.practice.email}`, margin, y);
    y += 4;
  }
  if (data.practice.agbCode) {
    doc.text(`AGB-code: ${data.practice.agbCode}`, margin, y);
    y += 4;
  }
  y += 2;
  doc.setTextColor(100, 100, 100);
  doc.text(`Verwijzend tandarts: ${data.referringDentist.name}${data.referringDentist.bigNumber ? ` (BIG: ${data.referringDentist.bigNumber})` : ''}`, margin, y);
  y += 10;

  // To: Specialist info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Aan:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Specialisme: ${data.specialist.type}`, margin, y);
  y += 4;
  if (data.specialist.name) {
    doc.text(`Naam: ${data.specialist.name}`, margin, y);
    y += 4;
  }
  if (data.specialist.practice) {
    doc.text(`Praktijk: ${data.specialist.practice}`, margin, y);
    y += 4;
  }
  if (data.specialist.phone) {
    doc.text(`Tel: ${data.specialist.phone}`, margin, y);
    y += 4;
  }
  if (data.specialist.email) {
    doc.text(`E-mail: ${data.specialist.email}`, margin, y);
    y += 4;
  }
  y += 8;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Patient info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Patiënt:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Naam: ${data.patient.firstName} ${data.patient.lastName}`, margin, y);
  y += 4;
  doc.text(`Geboortedatum: ${formatDate(data.patient.dateOfBirth)}`, margin, y);
  y += 4;
  doc.text(`Patiëntnummer: ${data.patient.patientNumber}`, margin, y);
  y += 4;
  if (data.patient.phone) {
    doc.text(`Tel: ${data.patient.phone}`, margin, y);
    y += 4;
  }
  if (data.patient.email) {
    doc.text(`E-mail: ${data.patient.email}`, margin, y);
    y += 4;
  }
  y += 8;

  // Divider
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Reason
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Reden van verwijzing:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const reasonLines = doc.splitTextToSize(data.reason, pageWidth - 2 * margin);
  doc.text(reasonLines, margin, y);
  y += reasonLines.length * 4 + 4;

  // Clinical info
  if (data.clinicalInfo) {
    y += 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Klinische informatie:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const clinicalLines = doc.splitTextToSize(data.clinicalInfo, pageWidth - 2 * margin);
    doc.text(clinicalLines, margin, y);
    y += clinicalLines.length * 4 + 4;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Gegenereerd door NEXIOM op ${formatDate(new Date())}`, pageWidth / 2, footerY, { align: 'center' });

  return doc.output('arraybuffer');
}
