import { Appointment, Patient, Practice, User } from "@nexiom/database";

interface AppointmentReminderData {
  patient: Patient;
  appointment: Appointment & { practitioner: User };
  practice: Practice;
}

export function getAppointmentReminderEmail(data: AppointmentReminderData): {
  subject: string;
  html: string;
  text: string;
} {
  const { patient, appointment, practice } = data;

  const appointmentDate = new Date(appointment.startTime).toLocaleDateString(
    "nl-NL",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const appointmentTime = new Date(appointment.startTime).toLocaleTimeString(
    "nl-NL",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const appointmentTypeLabels: Record<string, string> = {
    CHECKUP: "Controle",
    TREATMENT: "Behandeling",
    EMERGENCY: "Spoed",
    CONSULTATION: "Consult",
    HYGIENE: "Mondhygiene",
  };

  const subject = `Herinnering: Afspraak morgen om ${appointmentTime}`;

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Afspraak Herinnering</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #e8945a 0%, #d4803f 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 24px; }
    .reminder-banner { background: linear-gradient(135deg, #fff8f0 0%, #ffe4cc 100%); border: 2px solid #e8945a; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; }
    .reminder-banner h2 { color: #e8945a; margin: 0 0 8px; font-size: 20px; }
    .reminder-banner .date { color: #333; font-size: 24px; font-weight: 600; margin: 8px 0; }
    .reminder-banner .time { color: #666; font-size: 18px; }
    .appointment-card { background-color: #fafafa; border-left: 4px solid #e8945a; padding: 24px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .appointment-card h2 { color: #e8945a; margin: 0 0 16px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-row { display: flex; margin: 12px 0; }
    .detail-label { width: 120px; color: #666; font-size: 14px; }
    .detail-value { flex: 1; color: #333; font-size: 14px; font-weight: 500; }
    .practice-info { background-color: #f8f9fa; padding: 20px; margin: 24px 0; border-radius: 8px; }
    .practice-info h3 { color: #333; margin: 0 0 12px; font-size: 16px; }
    .practice-info p { color: #666; margin: 4px 0; font-size: 14px; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee; }
    .footer p { color: #999; font-size: 12px; margin: 4px 0; }
    .important-note { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .important-note p { color: #856404; margin: 0; font-size: 14px; }
    .cancel-info { background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 24px 0; }
    .cancel-info p { color: #666; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Afspraak Herinnering</h1>
      <p>${practice.name}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Beste ${patient.firstName},</p>
      
      <p>Dit is een vriendelijke herinnering aan uw afspraak van morgen.</p>
      
      <div class="reminder-banner">
        <h2>🗓️ Afspraak morgen</h2>
        <div class="date">${appointmentDate}</div>
        <div class="time">om ${appointmentTime}</div>
      </div>
      
      <div class="appointment-card">
        <h2>Afspraakdetails</h2>
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${appointmentTypeLabels[appointment.appointmentType] || appointment.appointmentType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Behandelaar:</span>
          <span class="detail-value">${appointment.practitioner.firstName} ${appointment.practitioner.lastName}</span>
        </div>
        ${
          appointment.room
            ? `
        <div class="detail-row">
          <span class="detail-label">Kamer:</span>
          <span class="detail-value">${appointment.room}</span>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="important-note">
        <p><strong>Belangrijk:</strong> Komt u iets later? Geen probleem, maar geef dit dan even door. Kunt u niet komen? Annuleer dan minimaal 24 uur van tevoren.</p>
      </div>
      
      <div class="practice-info">
        <h3>Praktijkgegevens</h3>
        <p><strong>${practice.name}</strong></p>
        ${practice.addressStreet ? `<p>${practice.addressStreet}</p>` : ""}
        ${practice.addressPostal || practice.addressCity ? `<p>${practice.addressPostal || ""} ${practice.addressCity || ""}</p>` : ""}
        ${practice.phone ? `<p>Tel: ${practice.phone}</p>` : ""}
      </div>
      
      <div class="cancel-info">
        <p><strong>Wijzigen of annuleren?</strong><br>
        Neem contact op via ${practice.phone || "de praktijk"} of log in op het patiëntenportaal.</p>
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
Afspraak Herinnering - ${practice.name}

Beste ${patient.firstName},

Dit is een vriendelijke herinnering aan uw afspraak van morgen.

📅 Afspraak morgen: ${appointmentDate} om ${appointmentTime}

Afspraakdetails:
- Type: ${appointmentTypeLabels[appointment.appointmentType] || appointment.appointmentType}
- Behandelaar: ${appointment.practitioner.firstName} ${appointment.practitioner.lastName}
${appointment.room ? `- Kamer: ${appointment.room}` : ""}

Belangrijk: Komt u iets later? Geen probleem, maar geef dit dan even door. 
Kunt u niet komen? Annuleer dan minimaal 24 uur van tevoren.

Praktijkgegevens:
${practice.name}
${practice.addressStreet || ""}
${practice.addressPostal || ""} ${practice.addressCity || ""}
${practice.phone ? `Tel: ${practice.phone}` : ""}

Wijzigen of annuleren?
Neem contact op via ${practice.phone || "de praktijk"} of log in op het patiëntenportaal.

Met vriendelijke groet,
${practice.name}
  `.trim();

  return { subject, html, text };
}
