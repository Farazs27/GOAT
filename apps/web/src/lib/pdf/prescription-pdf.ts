import { jsPDF } from 'jspdf';

interface PdfPractice {
  name: string;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressPostal?: string | null;
  phone?: string | null;
  email?: string | null;
  kvkNumber?: string | null;
  agbCode?: string | null;
  avgCode?: string | null;
}

interface PdfPatient {
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  bsn?: string | null;
  patientNumber: string;
}

interface PdfPrescriber {
  firstName?: string | null;
  lastName?: string | null;
  bigNumber?: string | null;
  agbCode?: string | null;
}

interface PdfPrescription {
  medicationName: string;
  genericName?: string | null;
  dosage: string;
  frequency: string;
  duration?: string | null;
  quantity?: number | null;
  route: string;
  instructions?: string | null;
  prescribedAt: string | Date;
  status: string;
}

export interface PrescriptionPdfData {
  prescription: PdfPrescription;
  patient: PdfPatient;
  prescriber: PdfPrescriber;
  practice: PdfPractice;
}

const ACCENT_R = 232;
const ACCENT_G = 148;
const ACCENT_B = 90;

function formatDateShort(d: string | Date): string {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatDateLong(d: string | Date): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function maskBsn(bsn: string): string {
  if (bsn.length <= 4) return bsn;
  return '****' + bsn.slice(-4);
}

function expiryDate(d: string | Date): string {
  const date = new Date(d);
  date.setMonth(date.getMonth() + 3);
  return formatDateShort(date);
}

const routeLabels: Record<string, string> = {
  oraal: 'Oraal',
  topicaal: 'Topicaal',
  spoeling: 'Spoeling',
};

export function generatePrescriptionPdf(data: PrescriptionPdfData): jsPDF {
  const { prescription, patient, prescriber, practice } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ─── Top accent border ───
  doc.setFillColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.rect(0, 0, pageWidth, 3, 'F');
  y = 14;

  // ─── Header: Practice name left, RECEPT right ───
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(practice.name, margin, y);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.text('RECEPT', pageWidth - margin, y, { align: 'right' });
  y += 4;

  // Practice address line
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  const addrParts: string[] = [];
  if (practice.addressStreet) addrParts.push(practice.addressStreet);
  if (practice.addressPostal || practice.addressCity) {
    addrParts.push([practice.addressPostal, practice.addressCity].filter(Boolean).join(' '));
  }
  if (practice.phone) addrParts.push(`Tel: ${practice.phone}`);
  if (practice.email) addrParts.push(practice.email);
  if (addrParts.length > 0) {
    doc.text(addrParts.join('  |  '), margin, y + 3);
    y += 6;
  }

  // ─── Credentials bar ───
  y += 3;
  doc.setFillColor(247, 247, 247);
  doc.rect(margin, y, contentWidth, 7, 'F');

  const credentials: string[] = [];
  if (practice.agbCode) credentials.push(`AGB: ${practice.agbCode}`);
  if (prescriber.bigNumber) credentials.push(`BIG: ${prescriber.bigNumber}`);
  if (practice.kvkNumber) credentials.push(`KvK: ${practice.kvkNumber}`);
  if (practice.avgCode) credentials.push(`AVG: ${practice.avgCode}`);

  if (credentials.length > 0) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(credentials.join('   |   '), margin + 3, y + 4.5);
  }
  y += 12;

  // ─── Two-column info section ───
  const colWidth = contentWidth / 2 - 3;
  const leftX = margin;
  const rightX = margin + colWidth + 6;

  // Patient column
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.text('PATIËNT', leftX, y);

  doc.setDrawColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.setLineWidth(0.4);
  doc.line(leftX, y + 1.5, leftX + 30, y + 1.5);

  let py = y + 7;
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  const patientRows: [string, string][] = [
    ['Naam', `${patient.firstName} ${patient.lastName}`],
    ['Geboortedatum', formatDateLong(patient.dateOfBirth)],
  ];
  if (patient.bsn) patientRows.push(['BSN', maskBsn(patient.bsn)]);
  patientRows.push(['Patiëntnummer', patient.patientNumber]);

  patientRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text(label, leftX, py);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(value, leftX + 30, py);
    py += 5;
  });

  // Prescriber column
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.text('VOORSCHRIJVER', rightX, y);

  doc.setDrawColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.setLineWidth(0.4);
  doc.line(rightX, y + 1.5, rightX + 38, y + 1.5);

  let ry = y + 7;
  const prescriberName = [prescriber.firstName, prescriber.lastName].filter(Boolean).join(' ') || 'Onbekend';
  doc.setFontSize(8.5);

  const prescriberRows: [string, string][] = [
    ['Naam', `Dr. ${prescriberName}`],
  ];
  if (prescriber.bigNumber) prescriberRows.push(['BIG-registratie', prescriber.bigNumber]);
  if (prescriber.agbCode) prescriberRows.push(['AGB-code', prescriber.agbCode]);

  prescriberRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text(label, rightX, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(value, rightX + 30, ry);
    ry += 5;
  });

  y = Math.max(py, ry) + 8;

  // ─── Prescription card ───
  const cardTop = y;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);

  // Rx symbol
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.text('Rx', margin + 4, y + 12);

  // Medication name
  const medX = margin + 24;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(prescription.medicationName, medX, y + 7);

  if (prescription.genericName) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(130, 130, 130);
    doc.text(prescription.genericName, medX, y + 12);
    y += 18;
  } else {
    y += 14;
  }

  // Detail grid
  y += 4;
  const gridItems: [string, string][] = [
    ['Dosering', prescription.dosage],
    ['Frequentie', prescription.frequency],
    ['Toedieningsweg', routeLabels[prescription.route] || prescription.route],
  ];
  if (prescription.duration) gridItems.push(['Duur', prescription.duration]);
  if (prescription.quantity) gridItems.push(['Hoeveelheid', String(prescription.quantity)]);

  const cellWidth = contentWidth / 3;
  const cellHeight = 14;

  gridItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = margin + col * cellWidth;
    const cy = y + row * cellHeight;

    // Cell background
    doc.setFillColor(250, 248, 246);
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.2);
    doc.rect(cx, cy, cellWidth, cellHeight, 'FD');

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(item[0], cx + 3, cy + 5);

    // Value
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(item[1], cx + 3, cy + 10.5);
  });

  const gridRows = Math.ceil(gridItems.length / 3);
  y += gridRows * cellHeight + 2;

  // Card border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cardTop - 4, contentWidth, y - cardTop + 6, 3, 3, 'S');

  y += 8;

  // ─── Instructions box ───
  if (prescription.instructions) {
    doc.setDrawColor(ACCENT_R, ACCENT_G, ACCENT_B);
    doc.setLineWidth(0.4);
    doc.setFillColor(255, 253, 250);

    const instructionLines = doc.splitTextToSize(prescription.instructions, contentWidth - 14);
    const instrBoxHeight = instructionLines.length * 4.5 + 14;

    doc.roundedRect(margin, y, contentWidth, instrBoxHeight, 2, 2, 'FD');

    // Left accent bar
    doc.setFillColor(ACCENT_R, ACCENT_G, ACCENT_B);
    doc.rect(margin, y, 2.5, instrBoxHeight, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ACCENT_R, ACCENT_G, ACCENT_B);
    doc.text('Bijzondere instructies', margin + 7, y + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(instructionLines, margin + 7, y + 12);

    y += instrBoxHeight + 8;
  }

  // ─── Signature area ───
  y += 6;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Datum:', margin, y);
  doc.setTextColor(40, 40, 40);
  doc.text(formatDateShort(prescription.prescribedAt), margin + 18, y);
  y += 14;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Handtekening:', margin, y);
  y += 4;

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 65, y);
  y += 5;

  const prescriberNameFull = [prescriber.firstName, prescriber.lastName].filter(Boolean).join(' ') || 'Onbekend';
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Dr. ${prescriberNameFull}`, margin, y);

  // ─── Footer ───
  const footerY = pageHeight - 12;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Dit recept is digitaal gegenereerd. Geldig tot ${expiryDate(prescription.prescribedAt)}. Neem contact op met de praktijk bij vragen.`,
    margin,
    footerY
  );

  return doc;
}
