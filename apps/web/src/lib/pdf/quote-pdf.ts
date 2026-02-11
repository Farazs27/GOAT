import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfPractice {
  name: string;
  agbCode?: string | null;
  kvkNumber?: string | null;
  avgCode?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressPostal?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface PdfPatient {
  firstName: string;
  lastName: string;
  patientNumber: string;
  dateOfBirth: string | Date;
}

interface PdfPractitioner {
  firstName?: string | null;
  lastName?: string | null;
  bigNumber?: string | null;
}

interface PdfTreatmentLine {
  code: string;
  description: string;
  toothNumber?: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QuotePdfData {
  quoteNumber: string;
  quoteDate: string | Date;
  validUntil: string | Date;
  patient: PdfPatient;
  practitioner: PdfPractitioner;
  practice: PdfPractice;
  lines: PdfTreatmentLine[];
  subtotal: number;
  insuranceEstimate: number;
  patientEstimate: number;
  planTitle: string;
}

// Accent color #e8945a
const ACCENT_R = 232;
const ACCENT_G = 148;
const ACCENT_B = 90;

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateQuotePdf(data: QuotePdfData): ArrayBuffer {
  const { patient, practitioner, practice, lines } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ─── Accent top border ───
  doc.setFillColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.rect(0, 0, pageWidth, 3, 'F');

  y = 12;

  // ─── Header: Practice name left, OFFERTE right ───
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(practice.name, margin, y);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.text('OFFERTE', pageWidth - margin, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // ─── Practice credentials bar ───
  y += 6;
  const credParts: string[] = [];
  if (practice.agbCode) credParts.push(`AGB: ${practice.agbCode}`);
  if (practice.kvkNumber) credParts.push(`KvK: ${practice.kvkNumber}`);
  if (practice.avgCode) credParts.push(`AVG: ${practice.avgCode}`);

  if (credParts.length > 0) {
    doc.setFillColor(245, 243, 240);
    doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(credParts.join('   |   '), margin + 3, y + 4);
    y += 10;
  } else {
    y += 4;
  }

  // ─── Divider ───
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ─── Patient info (left) + Quote meta (right) ───
  const leftX = margin;
  const rightX = pageWidth / 2 + 10;
  const startY = y;

  // Patient info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.text('PATIENT', leftX, y);
  y += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`${patient.firstName} ${patient.lastName}`, leftX, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Patiëntnr: ${patient.patientNumber}`, leftX, y);
  y += 4.5;
  doc.text(`Geboortedatum: ${formatDate(patient.dateOfBirth)}`, leftX, y);

  // Quote meta (right side)
  let metaY = startY;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.text('DETAILS', rightX, metaY);
  metaY += 5;

  const metaLabelX = rightX;
  const metaValueX = rightX + 32;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  const metaRows: [string, string][] = [
    ['Offertenr:', data.quoteNumber],
    ['Datum:', formatDate(data.quoteDate)],
    ['Geldig tot:', formatDate(data.validUntil)],
  ];

  const practitionerName = [practitioner.firstName, practitioner.lastName].filter(Boolean).join(' ');
  if (practitionerName) metaRows.push(['Behandelaar:', practitionerName]);
  if (practitioner.bigNumber) metaRows.push(['BIG-nummer:', practitioner.bigNumber]);

  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(label, metaLabelX, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(value, metaValueX, metaY);
    metaY += 5;
  });

  y = Math.max(y, metaY) + 8;

  // ─── Plan title ───
  if (data.planTitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`Behandelplan: ${data.planTitle}`, margin, y);
    y += 7;
  }

  // ─── Treatment table ───
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Code', 'Behandeling', 'Element', 'Aantal', 'Tarief', 'Totaal']],
    body: lines.map((line) => [
      line.code || '',
      line.description,
      line.toothNumber ? String(line.toothNumber) : '',
      String(line.quantity),
      formatCurrency(line.unitPrice),
      formatCurrency(line.totalPrice),
    ]),
    headStyles: {
      fillColor: [ACCENT_R, ACCENT_G, ACCENT_B],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [252, 249, 246],
    },
    columnStyles: {
      0: { cellWidth: 22, font: 'courier', fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
    theme: 'grid',
    styles: {
      lineColor: [230, 225, 220],
      lineWidth: 0.2,
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── Totals block ───
  const totalsX = pageWidth - margin - 70;
  const valuesX = pageWidth - margin;

  const drawTotalLine = (label: string, value: string, bold = false, accent = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    if (accent) {
      doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
    } else {
      doc.setTextColor(60, 60, 60);
    }
    doc.text(label, totalsX, y);
    doc.text(value, valuesX, y, { align: 'right' });
    if (accent) doc.setTextColor(0, 0, 0);
    y += 5;
  };

  drawTotalLine('Subtotaal', formatCurrency(data.subtotal));

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(totalsX, y - 1, valuesX, y - 1);
  y += 3;

  drawTotalLine('Geschat verzekerd bedrag', formatCurrency(data.insuranceEstimate));
  drawTotalLine('Geschatte eigen bijdrage', formatCurrency(data.patientEstimate));

  // Accent divider before total
  doc.setDrawColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y - 1, valuesX, y - 1);
  y += 3;

  drawTotalLine('Totaal', formatCurrency(data.subtotal), true, true);

  // ─── Disclaimer ───
  y += 10;
  doc.setDrawColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 251, 247);
  const disclaimerText = 'Dit is een kostenraming. De definitieve kosten kunnen afwijken op basis van de daadwerkelijke behandeling. Deze offerte is 30 dagen geldig.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 10);
  const disclaimerHeight = disclaimerLines.length * 4 + 8;

  doc.roundedRect(margin, y, contentWidth, disclaimerHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 100, 80);
  doc.text(disclaimerLines, margin + 5, y + 5.5);

  // ─── Footer ───
  const footerY = pageHeight - 15;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 140, 140);

  const footerParts: string[] = [practice.name];
  if (practice.addressStreet) footerParts.push(practice.addressStreet);
  if (practice.addressPostal || practice.addressCity) {
    footerParts.push([practice.addressPostal, practice.addressCity].filter(Boolean).join(' '));
  }
  if (practice.phone) footerParts.push(`Tel: ${practice.phone}`);
  if (practice.email) footerParts.push(practice.email);

  doc.text(footerParts.join('  |  '), margin, footerY);
  doc.text(formatDate(new Date()), pageWidth - margin, footerY, { align: 'right' });

  return doc.output('arraybuffer');
}
