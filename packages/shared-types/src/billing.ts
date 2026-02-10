export interface NzaCodeDto {
  id: string;
  code: string;
  category: string;
  descriptionNl: string;
  descriptionEn: string | null;
  maxTariff: number;
  unit: string;
  requiresTooth: boolean;
  requiresSurface: boolean;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  patientId: string;
  patientName: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  insuranceAmount: number;
  patientAmount: number;
  status: InvoiceStatus;
  paidAmount: number;
  lines: InvoiceLineDto[];
}

export interface InvoiceLineDto {
  id: string;
  description: string;
  nzaCode: string | null;
  toothNumber: number | null;
  surface: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  CREDITED = 'CREDITED',
}

export interface CreateInvoiceDto {
  patientId: string;
  treatmentIds: string[];
  dueDate: Date;
  notes?: string;
}
