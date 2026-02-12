import { Invoice, Patient, Practice } from "@dentflow/database";

interface InvoiceNotificationData {
  patient: Patient;
  invoice: Invoice;
  practice: Practice;
  paymentUrl?: string;
}

export function getInvoiceNotificationEmail(data: InvoiceNotificationData): {
  subject: string;
  html: string;
  text: string;
} {
  const { patient, invoice, practice, paymentUrl } = data;

  const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString(
    "nl-NL",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const dueDate = new Date(invoice.dueDate).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const amount = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(invoice.total));

  const patientAmount = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(invoice.patientAmount));

  const subject = `Nieuwe factuur ${invoice.invoiceNumber} - ${amount}`;

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuwe Factuur</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #e8945a 0%, #d4803f 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 24px; }
    .invoice-card { background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border: 2px solid #e8945a; padding: 30px; border-radius: 12px; margin: 24px 0; text-align: center; }
    .invoice-card .amount { color: #e8945a; font-size: 48px; font-weight: 700; margin: 16px 0; }
    .invoice-card .invoice-number { color: #666; font-size: 14px; margin-bottom: 8px; }
    .invoice-card .due-date { color: #333; font-size: 16px; font-weight: 500; }
    .details-table { width: 100%; margin: 24px 0; border-collapse: collapse; }
    .details-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .details-table td:first-child { color: #666; width: 40%; }
    .details-table td:last-child { color: #333; font-weight: 500; text-align: right; }
    .payment-section { background-color: #f0f9ff; border: 2px solid #0ea5e9; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; }
    .payment-section h3 { color: #0ea5e9; margin: 0 0 16px; font-size: 18px; }
    .payment-button { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 0; }
    .payment-info { color: #666; font-size: 14px; margin-top: 12px; }
    .bank-details { background-color: #f8f9fa; padding: 20px; margin: 24px 0; border-radius: 8px; }
    .bank-details h3 { color: #333; margin: 0 0 12px; font-size: 16px; }
    .bank-details p { color: #666; margin: 4px 0; font-size: 14px; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee; }
    .footer p { color: #999; font-size: 12px; margin: 4px 0; }
    .urgent { background-color: #fef3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .urgent p { color: #856404; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nieuwe Factuur</h1>
      <p>${practice.name}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Beste ${patient.firstName},</p>
      
      <p>Hierbij ontvangt u een nieuwe factuur voor de verrichte behandelingen.</p>
      
      <div class="invoice-card">
        <div class="invoice-number">Factuurnummer: ${invoice.invoiceNumber}</div>
        <div class="amount">${amount}</div>
        <div class="due-date">Te betalen voor: <strong>${dueDate}</strong></div>
      </div>
      
      <table class="details-table">
        <tr>
          <td>Factuurdatum:</td>
          <td>${invoiceDate}</td>
        </tr>
        <tr>
          <td>Factuurnummer:</td>
          <td>${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td>Totaalbedrag:</td>
          <td>${amount}</td>
        </tr>
        ${
          Number(invoice.insuranceAmount) > 0
            ? `
        <tr>
          <td>Verzekerd bedrag:</td>
          <td>${new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(invoice.insuranceAmount))}</td>
        </tr>
        <tr>
          <td>Door u te betalen:</td>
          <td><strong>${patientAmount}</strong></td>
        </tr>
        `
            : ""
        }
      </table>
      
      ${
        paymentUrl
          ? `
      <div class="payment-section">
        <h3>💳 Direct online betalen</h3>
        <p style="color: #666; margin-bottom: 16px;">Betaal eenvoudig en veilig met iDEAL of creditcard</p>
        <a href="${paymentUrl}" class="payment-button">Nu betalen</a>
        <p class="payment-info">U wordt doorgestuurd naar een beveiligde betaalomgeving</p>
      </div>
      `
          : ""
      }
      
      <div class="bank-details">
        <h3>🏦 Bankoverschrijving</h3>
        <p>U kunt het bedrag ook overmaken naar:</p>
        <p style="margin-top: 12px;"><strong>${practice.name}</strong></p>
        <p>Factuurnummer: <strong>${invoice.invoiceNumber}</strong></p>
        <p style="color: #e8945a; margin-top: 8px;">Vermeld altijd het factuurnummer bij uw betaling</p>
      </div>
      
      <div class="urgent">
        <p><strong>Belangrijk:</strong> Betaal deze factuur voor ${dueDate} om aanmaningskosten te voorkomen. Heeft u vragen over deze factuur? Neem dan contact met ons op.</p>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 32px;">
        Met vriendelijke groet,<br>
        <strong>${practice.name}</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>Deze e-mail is automatisch verzonden door NEXIOM</p>
      <p>&copy; ${new Date().getFullYear()} ${practice.name}</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Nieuwe Factuur - ${practice.name}

Beste ${patient.firstName},

Hierbij ontvangt u een nieuwe factuur voor de verrichte behandelingen.

FACTUUR OVERZICHT
=================
Factuurnummer: ${invoice.invoiceNumber}
Factuurdatum: ${invoiceDate}
Totaalbedrag: ${amount}
Te betalen voor: ${dueDate}
${
  Number(invoice.insuranceAmount) > 0
    ? `
Verzekerd bedrag: ${new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(invoice.insuranceAmount))}
Door u te betalen: ${patientAmount}
`
    : ""
}

${
  paymentUrl
    ? `ONLINE BETALEN
==============
Betaal eenvoudig via: ${paymentUrl}
`
    : ""
}

BANKOVERSCHRIJVING
==================
U kunt het bedrag ook overmaken naar:
${practice.name}
Factuurnummer: ${invoice.invoiceNumber}

Vermeld altijd het factuurnummer bij uw betaling.

Belangrijk: Betaal deze factuur voor ${dueDate} om aanmaningskosten te voorkomen.

Met vriendelijke groet,
${practice.name}
  `.trim();

  return { subject, html, text };
}
