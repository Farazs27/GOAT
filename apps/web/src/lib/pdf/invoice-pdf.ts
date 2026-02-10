import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfPractice {
  name: string;
  agbCode?: string | null;
  kvkNumber?: string | null;
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
  email?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressPostal?: string | null;
}

interface PdfInvoiceLine {
  nzaCode?: string | null;
  description: string;
  toothNumber?: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder?: number;
}

interface PdfPayment {
  amount: number;
  method: string;
  paidAt?: string | Date | null;
  createdAt: string | Date;
}

interface PdfInvoice {
  invoiceNumber: string;
  invoiceDate: string | Date;
  dueDate: string | Date;
  subtotal: number;
  taxAmount: number;
  total: number;
  insuranceAmount: number;
  patientAmount: number;
  paidAmount: number;
  status: string;
  notes?: string | null;
  patient: PdfPatient;
  lines: PdfInvoiceLine[];
  payments: PdfPayment[];
}

const methodLabels: Record<string, string> = {
  IDEAL: 'iDEAL',
  SEPA_DIRECT_DEBIT: 'Incasso',
  BANK_TRANSFER: 'Overboeking',
  CASH: 'Contant',
  PIN: 'PIN',
  CREDIT_CARD: 'Creditcard',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Concept',
  SENT: 'Verzonden',
  PARTIALLY_PAID: 'Deels betaald',
  PAID: 'Betaald',
  OVERDUE: 'Achterstallig',
  CANCELLED: 'Geannuleerd',
  CREDITED: 'Gecrediteerd',
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function generateInvoicePdf(invoice: PdfInvoice, practice: PdfPractice): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ─── Header ───
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(practice.name, margin, y);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // blue
  doc.text('FACTUUR', pageWidth - margin, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const practiceLines: string[] = [];
  if (practice.addressStreet) practiceLines.push(practice.addressStreet);
  if (practice.addressPostal || practice.addressCity) {
    practiceLines.push([practice.addressPostal, practice.addressCity].filter(Boolean).join(' '));
  }
  if (practice.phone) practiceLines.push(`Tel: ${practice.phone}`);
  if (practice.email) practiceLines.push(practice.email);
  if (practice.agbCode) practiceLines.push(`AGB: ${practice.agbCode}`);
  if (practice.kvkNumber) practiceLines.push(`KvK: ${practice.kvkNumber}`);

  practiceLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 3.5;
  });

  // ─── Divider ───
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ─── Invoice metadata + Patient block ───
  doc.setTextColor(0, 0, 0);
  const metaX = margin;
  const patientX = pageWidth / 2 + 5;

  // Invoice meta (left side)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Factuurnummer:', metaX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, metaX + 35, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Factuurdatum:', metaX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.invoiceDate), metaX + 35, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Vervaldatum:', metaX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.dueDate), metaX + 35, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', metaX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(statusLabels[invoice.status] || invoice.status, metaX + 35, y);

  // Patient block (right side, same Y as start of meta)
  let patientY = y - 15;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('AAN', patientX, patientY);
  patientY += 5;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.patient.firstName} ${invoice.patient.lastName}`, patientX, patientY);
  doc.setFont('helvetica', 'normal');
  patientY += 5;

  doc.setFontSize(9);
  if (invoice.patient.addressStreet) {
    doc.text(invoice.patient.addressStreet, patientX, patientY);
    patientY += 4.5;
  }
  if (invoice.patient.addressPostal || invoice.patient.addressCity) {
    doc.text(
      [invoice.patient.addressPostal, invoice.patient.addressCity].filter(Boolean).join(' '),
      patientX,
      patientY,
    );
    patientY += 4.5;
  }
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Patiëntnr: ${invoice.patient.patientNumber}`, patientX, patientY);

  // ─── Line items table ───
  y += 12;
  doc.setTextColor(0, 0, 0);

  const sortedLines = [...invoice.lines].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['NZa Code', 'Omschrijving', 'Element', 'Aantal', 'Prijs', 'Bedrag']],
    body: sortedLines.map((line) => [
      line.nzaCode || '',
      line.description,
      line.toothNumber ? String(line.toothNumber) : '',
      String(line.quantity),
      formatCurrency(line.unitPrice),
      formatCurrency(line.lineTotal),
    ]),
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
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
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
  });

  // Get Y after table
  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── Totals block (right aligned) ───
  const totalsX = pageWidth - margin - 70;
  const valuesX = pageWidth - margin;

  const drawTotalLine = (label: string, value: string, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, totalsX, y);
    doc.text(value, valuesX, y, { align: 'right' });
    y += 5;
  };

  drawTotalLine('Subtotaal', formatCurrency(invoice.subtotal));
  if (invoice.taxAmount > 0) {
    drawTotalLine('BTW', formatCurrency(invoice.taxAmount));
  }

  // Divider before total
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y - 1, valuesX, y - 1);
  y += 3;
  drawTotalLine('Totaal', formatCurrency(invoice.total), true);
  y += 2;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(totalsX, y - 1, valuesX, y - 1);
  y += 3;

  drawTotalLine('Verzekeringsdeel', formatCurrency(invoice.insuranceAmount));
  drawTotalLine('Eigen bijdrage', formatCurrency(invoice.patientAmount));
  drawTotalLine('Betaald', formatCurrency(invoice.paidAmount));

  const outstanding = invoice.patientAmount - invoice.paidAmount;
  if (outstanding > 0) {
    doc.setTextColor(220, 38, 38); // red
    drawTotalLine('Openstaand', formatCurrency(outstanding), true);
    doc.setTextColor(0, 0, 0);
  }

  // ─── Payments section ───
  if (invoice.payments.length > 0) {
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Betalingen', margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Datum', 'Methode', 'Bedrag']],
      body: invoice.payments.map((p) => [
        formatDate(p.paidAt || p.createdAt),
        methodLabels[p.method] || p.method,
        formatCurrency(p.amount),
      ]),
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' },
      },
      theme: 'grid',
      styles: { lineColor: [220, 220, 220], lineWidth: 0.2 },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ─── Notes ───
  if (invoice.notes) {
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notities', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const splitNotes = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 4 + 4;
  }

  // ─── Footer ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 12;

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(
      'Tandheelkundige behandelingen zijn vrijgesteld van BTW (Art. 11-1-g Wet OB 1968)',
      margin,
      footerY,
    );
    doc.text(
      `Pagina ${i} van ${pageCount}`,
      pageWidth - margin,
      footerY,
      { align: 'right' },
    );

    if (outstanding > 0) {
      doc.text(
        `Gelieve het openstaande bedrag van ${formatCurrency(outstanding)} te voldoen voor ${formatDate(invoice.dueDate)}`,
        margin,
        footerY + 4,
      );
    }
  }

  return doc.output('arraybuffer');
}
