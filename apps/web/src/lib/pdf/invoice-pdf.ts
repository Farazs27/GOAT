import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillingConfig {
  iban?: string;
  btwNumber?: string;
  bankName?: string;
  paymentTermDays?: number;
  defaultFooterText?: string;
}

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
  billingConfig?: BillingConfig | Record<string, unknown> | null;
}

interface PdfPatient {
  firstName: string;
  lastName: string;
  patientNumber: string;
  bsn?: string | null;
  email?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressPostal?: string | null;
}

interface PdfInvoiceLine {
  nzaCode?: string | null;
  description: string;
  toothNumber?: number | null;
  surface?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder?: number;
}

interface PdfPayment {
  amount: number;
  method: string;
  status?: string | null;
  paidAt?: string | Date | null;
  createdAt: string | Date;
}

interface PdfPractitioner {
  name: string;
  bigNumber?: string | null;
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
  practitioner?: PdfPractitioner | null;
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

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'In afwachting',
  COMPLETED: 'Voltooid',
  FAILED: 'Mislukt',
  REFUNDED: 'Terugbetaald',
};

// Accent color: #e8945a → RGB(232, 148, 90)
const ACCENT: [number, number, number] = [232, 148, 90];
const GRAY_TEXT: [number, number, number] = [120, 120, 120];
const DARK_TEXT: [number, number, number] = [30, 30, 30];
const LIGHT_BG: [number, number, number] = [245, 245, 245];
const WHITE: [number, number, number] = [255, 255, 255];

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function maskBsn(bsn: string): string {
  if (bsn.length <= 4) return bsn;
  return '*'.repeat(bsn.length - 4) + bsn.slice(-4);
}

export function generateInvoicePdf(invoice: PdfInvoice, practice: PdfPractice): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // Parse billingConfig
  const bc: BillingConfig = (practice.billingConfig && typeof practice.billingConfig === 'object')
    ? practice.billingConfig as BillingConfig
    : {};
  const ibanDisplay = bc.iban || 'IBAN niet geconfigureerd';
  const paymentTermDays = bc.paymentTermDays || 30;

  // ─── 1. Top accent border ───
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageWidth, 3, 'F');
  y = 18;

  // ─── 2. Header: Practice name + FACTUUR ───
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text(practice.name, margin, y);

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('FACTUUR', pageWidth - margin, y, { align: 'right' });
  doc.setTextColor(...DARK_TEXT);

  y += 10;

  // ─── 3. Practice info (left) + Patient info (right) ───
  const colLeft = margin;
  const colRight = pageWidth / 2 + 10;

  // Practice details
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY_TEXT);

  let practiceY = y;
  if (practice.addressStreet) {
    doc.text(practice.addressStreet, colLeft, practiceY);
    practiceY += 4;
  }
  if (practice.addressPostal || practice.addressCity) {
    doc.text([practice.addressPostal, practice.addressCity].filter(Boolean).join(' '), colLeft, practiceY);
    practiceY += 4;
  }
  if (practice.phone) {
    doc.text(`Tel: ${practice.phone}`, colLeft, practiceY);
    practiceY += 4;
  }
  if (practice.email) {
    doc.text(practice.email, colLeft, practiceY);
    practiceY += 4;
  }

  // Registration info gray box
  practiceY += 2;
  const regParts: string[] = [];
  if (practice.kvkNumber) regParts.push(`KvK: ${practice.kvkNumber}`);
  if (practice.agbCode) regParts.push(`AGB: ${practice.agbCode}`);
  if (practice.avgCode) regParts.push(`AVG: ${practice.avgCode}`);
  if (bc.btwNumber) regParts.push(`BTW: ${bc.btwNumber}`);

  if (regParts.length > 0) {
    const regText = regParts.join('  |  ');
    const regBoxWidth = doc.getTextWidth(regText) + 6;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(colLeft, practiceY - 3.5, regBoxWidth, 6, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(regText, colLeft + 3, practiceY);
    practiceY += 8;
  }

  // Patient block (right)
  let patientY = y;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('PATI\u00cbNT', colRight, patientY);
  patientY += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text(`${invoice.patient.firstName} ${invoice.patient.lastName}`, colRight, patientY);
  patientY += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY_TEXT);
  if (invoice.patient.addressStreet) {
    doc.text(invoice.patient.addressStreet, colRight, patientY);
    patientY += 4;
  }
  if (invoice.patient.addressPostal || invoice.patient.addressCity) {
    doc.text(
      [invoice.patient.addressPostal, invoice.patient.addressCity].filter(Boolean).join(' '),
      colRight,
      patientY,
    );
    patientY += 4;
  }
  doc.setFontSize(8);
  doc.text(`Pati\u00ebntnr: ${invoice.patient.patientNumber}`, colRight, patientY);
  patientY += 4;
  if (invoice.patient.bsn) {
    doc.text(`BSN: ${maskBsn(invoice.patient.bsn)}`, colRight, patientY);
    patientY += 4;
  }

  y = Math.max(practiceY, patientY) + 4;

  // ─── 4. Invoice meta row ───
  doc.setDrawColor(...LIGHT_BG);
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 1.5, 1.5, 'F');

  const metaItems: { label: string; value: string }[] = [
    { label: 'Factuurnummer', value: invoice.invoiceNumber },
    { label: 'Factuurdatum', value: formatDate(invoice.invoiceDate) },
    { label: 'Vervaldatum', value: formatDate(invoice.dueDate) },
  ];
  if (invoice.practitioner) {
    let practVal = invoice.practitioner.name;
    if (invoice.practitioner.bigNumber) practVal += ` (BIG: ${invoice.practitioner.bigNumber})`;
    metaItems.push({ label: 'Behandelaar', value: practVal });
  }

  const metaColWidth = (pageWidth - margin * 2) / metaItems.length;
  const metaTextY = y + 4.5;
  const metaValueY = y + 8.5;

  metaItems.forEach((item, i) => {
    const x = margin + i * metaColWidth + 4;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_TEXT);
    doc.text(item.label.toUpperCase(), x, metaTextY);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text(item.value, x, metaValueY);

    // Subtle separator between columns
    if (i > 0) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(margin + i * metaColWidth, y + 2, margin + i * metaColWidth, y + 10);
    }
  });

  y += 18;

  // ─── 5. Line items table ───
  const sortedLines = [...invoice.lines].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Code', 'Omschrijving', 'Element', 'Vlak', 'Aantal', 'Prijs', 'Totaal']],
    body: sortedLines.map((line) => [
      line.nzaCode || '',
      line.description,
      line.toothNumber ? String(line.toothNumber) : '',
      line.surface || '',
      String(line.quantity),
      formatCurrency(line.unitPrice),
      formatCurrency(line.lineTotal),
    ]),
    headStyles: {
      fillColor: DARK_TEXT,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50] as [number, number, number],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 20, font: 'courier', fontStyle: 'bold', fontSize: 7.5 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 22, halign: 'right', font: 'courier', fontSize: 7.5 },
      6: { cellWidth: 24, halign: 'right', font: 'courier', fontStyle: 'bold', fontSize: 7.5 },
    },
    theme: 'plain',
    styles: {
      lineColor: [230, 230, 230] as [number, number, number],
      lineWidth: 0,
      overflow: 'linebreak',
    },
    didDrawCell: (data) => {
      // Bottom border on each row
      if (data.section === 'body') {
        doc.setDrawColor(235, 235, 235);
        doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ─── 6. Totals section (right-aligned) ───
  const totalsWidth = 75;
  const totalsX = pageWidth - margin - totalsWidth;
  const valuesX = pageWidth - margin;

  const drawTotalLine = (label: string, value: string, opts?: { bold?: boolean; accent?: boolean; red?: boolean }) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    if (opts?.red) {
      doc.setTextColor(200, 40, 40);
    } else if (opts?.accent) {
      doc.setTextColor(...ACCENT);
    } else {
      doc.setTextColor(...DARK_TEXT);
    }
    doc.text(label, totalsX, y);
    doc.text(value, valuesX, y, { align: 'right' });
    y += 5.5;
  };

  drawTotalLine('Subtotaal', formatCurrency(invoice.subtotal));
  if (invoice.taxAmount > 0) {
    drawTotalLine('BTW', formatCurrency(invoice.taxAmount));
  }

  // Accent underline before insurance breakdown
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(totalsX, y - 2, valuesX, y - 2);
  y += 2;

  drawTotalLine('Verzekerd bedrag', formatCurrency(invoice.insuranceAmount));
  drawTotalLine('Eigen bijdrage', formatCurrency(invoice.patientAmount));

  // Bold total line with accent
  y += 1;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(totalsX, y - 2, valuesX, y - 2);
  y += 2;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text('Totaal', totalsX, y);
  doc.text(formatCurrency(invoice.total), valuesX, y, { align: 'right' });
  y += 3;

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(totalsX, y - 1, valuesX, y - 1);
  y += 8;

  // ─── 7. Payments section ───
  const outstanding = invoice.patientAmount - invoice.paidAmount;

  if (invoice.payments.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text('Betalingen', margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Datum', 'Methode', 'Bedrag', 'Status']],
      body: invoice.payments.map((p) => [
        formatDate(p.paidAt || p.createdAt),
        methodLabels[p.method] || p.method,
        formatCurrency(p.amount),
        p.status ? (paymentStatusLabels[p.status] || p.status) : 'Voltooid',
      ]),
      headStyles: {
        fillColor: LIGHT_BG,
        textColor: GRAY_TEXT,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50] as [number, number, number],
        cellPadding: 2.5,
      },
      columnStyles: {
        2: { halign: 'right', font: 'courier', fontSize: 7.5 },
        3: { halign: 'center' },
      },
      theme: 'plain',
      styles: {
        lineColor: [235, 235, 235] as [number, number, number],
        lineWidth: 0,
      },
    });

    y = (doc as any).lastAutoTable.finalY + 4;

    if (outstanding > 0) {
      // Highlighted remaining balance
      doc.setFillColor(255, 245, 238);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 9, 1.5, 1.5, 'F');
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 9, 1.5, 1.5, 'S');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 60, 30);
      doc.text('Openstaand bedrag:', margin + 4, y + 6);
      doc.text(formatCurrency(outstanding), pageWidth - margin - 4, y + 6, { align: 'right' });
      y += 14;
    }
  } else if (outstanding > 0) {
    // No payments yet, show outstanding
    doc.setFillColor(255, 245, 238);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 9, 1.5, 1.5, 'F');
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 9, 1.5, 1.5, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 60, 30);
    doc.text('Openstaand bedrag:', margin + 4, y + 6);
    doc.text(formatCurrency(outstanding), pageWidth - margin - 4, y + 6, { align: 'right' });
    y += 14;
  }

  // ─── Notes ───
  if (invoice.notes) {
    y += 2;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text('Opmerkingen', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_TEXT);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 3.5 + 4;
  }

  // ─── 8. Footer (on every page) ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerTop = pageHeight - 24;

    // Separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, footerTop, pageWidth - margin, footerTop);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_TEXT);

    const footerLine1Y = footerTop + 4;
    doc.text(`Betalingstermijn: ${paymentTermDays} dagen`, margin, footerLine1Y);
    doc.text(`Pagina ${i} van ${pageCount}`, pageWidth - margin, footerLine1Y, { align: 'right' });

    const footerLine2Y = footerTop + 8;
    const ibanLine = bc.bankName
      ? `${bc.bankName} - ${ibanDisplay}  |  t.n.v. ${practice.name}`
      : `IBAN: ${ibanDisplay}  |  t.n.v. ${practice.name}`;
    doc.text(ibanLine, margin, footerLine2Y);

    const footerLine3Y = footerTop + 12;
    const footerText = bc.defaultFooterText || 'Bij vragen kunt u contact opnemen met de praktijk.';
    doc.text(footerText, margin, footerLine3Y);

    if (outstanding > 0) {
      const footerLine4Y = footerTop + 16;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...ACCENT);
      doc.text(
        `Gelieve het openstaande bedrag van ${formatCurrency(outstanding)} te voldoen voor ${formatDate(invoice.dueDate)}.`,
        margin,
        footerLine4Y,
      );
    }
  }

  return doc.output('arraybuffer');
}
