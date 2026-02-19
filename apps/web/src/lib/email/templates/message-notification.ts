import { Patient, Practice, User } from "@nexiom/database";

interface MessageNotificationData {
  patient: Patient;
  sender: User;
  messagePreview: string;
  practice: Practice;
  messageId: string;
  portalUrl?: string;
}

export function getMessageNotificationEmail(data: MessageNotificationData): {
  subject: string;
  html: string;
  text: string;
} {
  const { patient, sender, messagePreview, practice, portalUrl } = data;

  // Truncate message preview
  const preview =
    messagePreview.length > 150
      ? messagePreview.substring(0, 150) + "..."
      : messagePreview;

  const senderName =
    `${sender.firstName || ""} ${sender.lastName || ""}`.trim();
  const subject = `Nieuw bericht van ${senderName}`;

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuw Bericht</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #e8945a 0%, #d4803f 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 24px; }
    .message-card { background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-left: 4px solid #e8945a; padding: 24px; margin: 24px 0; border-radius: 0 12px 12px 0; }
    .message-header { display: flex; align-items: center; margin-bottom: 16px; }
    .avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #e8945a 0%, #d4803f 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 18px; margin-right: 16px; }
    .sender-info { flex: 1; }
    .sender-name { color: #333; font-size: 16px; font-weight: 600; margin: 0; }
    .sender-role { color: #666; font-size: 14px; margin: 4px 0 0; }
    .message-preview { background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eee; color: #444; font-size: 15px; line-height: 1.6; }
    .action-section { background-color: #fff8f0; border: 2px solid #e8945a; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; }
    .action-section h3 { color: #e8945a; margin: 0 0 12px; font-size: 18px; }
    .action-section p { color: #666; margin: 0 0 16px; font-size: 14px; }
    .action-button { display: inline-block; background: linear-gradient(135deg, #e8945a 0%, #d4803f 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 0; }
    .practice-info { background-color: #f8f9fa; padding: 20px; margin: 24px 0; border-radius: 8px; }
    .practice-info h3 { color: #333; margin: 0 0 12px; font-size: 16px; }
    .practice-info p { color: #666; margin: 4px 0; font-size: 14px; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee; }
    .footer p { color: #999; font-size: 12px; margin: 4px 0; }
    .privacy-note { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .privacy-note p { color: #0369a1; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nieuw Bericht</h1>
      <p>${practice.name}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Beste ${patient.firstName},</p>
      
      <p>U heeft een nieuw bericht ontvangen van uw tandarts:</p>
      
      <div class="message-card">
        <div class="message-header">
          <div class="avatar">${sender.firstName?.[0] || ""}${sender.lastName?.[0] || ""}</div>
          <div class="sender-info">
            <p class="sender-name">${senderName}</p>
            <p class="sender-role">${practice.name}</p>
          </div>
        </div>
        
        <div class="message-preview">
          "${preview}"
        </div>
      </div>
      
      ${
        portalUrl
          ? `
      <div class="action-section">
        <h3>💬 Lees het volledige bericht</h3>
        <p>Log in op het patiëntenportaal om het complete bericht te lezen en te reageren.</p>
        <a href="${portalUrl}" class="action-button">Naar het patiëntenportaal</a>
      </div>
      `
          : ""
      }
      
      <div class="privacy-note">
        <p><strong>Privacy:</strong> Dit bericht bevat mogelijk medische informatie. Wilt u niet per e-mail op de hoogte worden gehouden van nieuwe berichten? Pas dan uw e-mailvoorkeuren aan in het patiëntenportaal.</p>
      </div>
      
      <div class="practice-info">
        <h3>Contactgegevens</h3>
        <p><strong>${practice.name}</strong></p>
        ${practice.phone ? `<p>Tel: ${practice.phone}</p>` : ""}
        ${practice.email ? `<p>E-mail: ${practice.email}</p>` : ""}
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 32px;">
        Met vriendelijke groet,<br>
        <strong>${senderName}</strong><br>
        ${practice.name}
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
Nieuw Bericht - ${practice.name}

Beste ${patient.firstName},

U heeft een nieuw bericht ontvangen van uw tandarts:

Van: ${senderName} (${practice.name})
Bericht:
"${preview}"

${
  portalUrl
    ? `Lees het volledige bericht in het patiëntenportaal:
${portalUrl}

`
    : ""
}Privacy: Dit bericht bevat mogelijk medische informatie. Wilt u niet per e-mail op de hoogte worden gehouden van nieuwe berichten? Pas dan uw e-mailvoorkeuren aan in het patiëntenportaal.

Contactgegevens:
${practice.name}
${practice.phone ? `Tel: ${practice.phone}` : ""}
${practice.email ? `E-mail: ${practice.email}` : ""}

Met vriendelijke groet,
${senderName}
${practice.name}
  `.trim();

  return { subject, html, text };
}
