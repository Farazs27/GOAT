import { Patient, Practice } from "@dentflow/database";

interface FollowupReminderData {
  patient: Patient;
  practice: Practice;
  availableDays: string[]; // formatted date strings like "maandag 17 februari"
  bookingUrl: string;
}

export function getFollowupReminderEmail(data: FollowupReminderData): {
  subject: string;
  html: string;
  text: string;
} {
  const { patient, practice, availableDays, bookingUrl } = data;

  const subject = `Tijd voor uw vervolgafspraak bij ${practice.name}`;

  const daysListHtml = availableDays
    .map(
      (day) =>
        `<li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333; font-size: 15px;">📅 ${day}</li>`,
    )
    .join("");

  const daysListText = availableDays.map((day) => `  - ${day}`).join("\n");

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vervolgafspraak</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #e8945a 0%, #d4803f 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 24px; }
    .intro { color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .days-card { background-color: #fafafa; border-left: 4px solid #e8945a; padding: 24px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .days-card h2 { color: #e8945a; margin: 0 0 16px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .days-list { list-style: none; padding: 0; margin: 0; }
    .cta-container { text-align: center; margin: 32px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #e8945a 0%, #d4803f 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; }
    .practice-info { background-color: #f8f9fa; padding: 20px; margin: 24px 0; border-radius: 8px; }
    .practice-info h3 { color: #333; margin: 0 0 12px; font-size: 16px; }
    .practice-info p { color: #666; margin: 4px 0; font-size: 14px; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee; }
    .footer p { color: #999; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Vervolgafspraak</h1>
      <p>${practice.name}</p>
    </div>

    <div class="content">
      <p class="greeting">Beste ${patient.firstName},</p>

      <p class="intro">
        Het is tijd voor uw vervolgbezoek. Regelmatige controles zijn belangrijk voor een gezond gebit.
        Wij hebben gekeken naar onze beschikbaarheid en de volgende dagen zijn beschikbaar:
      </p>

      <div class="days-card">
        <h2>Beschikbare dagen</h2>
        <ul class="days-list">
          ${daysListHtml}
        </ul>
      </div>

      <p class="intro">
        U kunt eenvoudig online een afspraak inplannen via ons patiëntenportaal.
        Klik op de onderstaande knop om een dag en tijd te kiezen die u het beste uitkomt.
      </p>

      <div class="cta-container">
        <a href="${bookingUrl}" class="cta-button">Afspraak inplannen</a>
      </div>

      <div class="practice-info">
        <h3>Praktijkgegevens</h3>
        <p><strong>${practice.name}</strong></p>
        ${practice.addressStreet ? `<p>${practice.addressStreet}</p>` : ""}
        ${practice.addressPostal || practice.addressCity ? `<p>${practice.addressPostal || ""} ${practice.addressCity || ""}</p>` : ""}
        ${practice.phone ? `<p>Tel: ${practice.phone}</p>` : ""}
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
Vervolgafspraak - ${practice.name}

Beste ${patient.firstName},

Het is tijd voor uw vervolgbezoek. Regelmatige controles zijn belangrijk voor een gezond gebit.

Beschikbare dagen:
${daysListText}

U kunt eenvoudig online een afspraak inplannen via ons patiëntenportaal:
${bookingUrl}

Praktijkgegevens:
${practice.name}
${practice.addressStreet || ""}
${practice.addressPostal || ""} ${practice.addressCity || ""}
${practice.phone ? `Tel: ${practice.phone}` : ""}

Met vriendelijke groet,
${practice.name}
  `.trim();

  return { subject, html, text };
}
