# Email Notification System

DentFlow's email notification system sends professional HTML emails to patients using Resend.

## Features

- **Appointment Confirmation Emails** - Sent when a new appointment is booked
- **Appointment Reminder Emails** - Sent 24 hours before scheduled appointments
- **Invoice Notifications** - Sent when new invoices are created
- **Message Notifications** - Sent when dentists reply to patient messages
- **Patient Preferences** - Patients can opt-out of non-essential emails

## Email Templates

All email templates are located in `apps/web/src/lib/email/templates/`:

- `appointment-confirmation.ts` - Booking confirmation with appointment details
- `appointment-reminder.ts` - 24-hour reminder with practice info
- `invoice-notification.ts` - New invoice with payment link
- `message-notification.ts` - New message notification with preview

Templates use the DentFlow orange/amber (#e8945a) theme and are in Dutch.

## Configuration

### Environment Variables

Add to `apps/web/.env`:

```bash
# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
FROM_EMAIL="noreply@dentflow.nl"

# Cron Jobs (optional)
CRON_SECRET="your-secure-cron-secret-here"
```

### Resend Setup

1. Sign up at https://resend.com
2. Verify your domain
3. Create an API key
4. Add the API key to your `.env` file

### Cron Job Setup

To send appointment reminders automatically, configure a cron job to call:

```
GET /api/cron/appointment-reminders
Headers: x-cron-secret: your-cron-secret
```

**Vercel Cron Example** (vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9:00 AM to send reminders for appointments scheduled in the next 24 hours.

## Usage

### Sending Emails Programmatically

```typescript
import {
  sendAppointmentConfirmation,
  sendInvoiceNotification,
} from "@/lib/email/triggers";

// Send appointment confirmation
await sendAppointmentConfirmation(appointmentId);

// Send invoice notification
await sendInvoiceNotification(invoiceId, paymentUrl);
```

### Email Preferences

Patients can manage their email preferences in their profile page:

- `/portal/profile` - Email preferences section

Available preferences:

- `appointmentConfirmation` - Confirmation emails for new bookings
- `appointmentReminder` - 24-hour reminder emails
- `invoiceNotification` - New invoice emails
- `messageNotification` - New message emails

## Database Schema

Email preferences are stored in the `Patient` model:

```prisma
model Patient {
  // ... other fields
  emailPreferences Json? @default("{}")
}
```

Preferences are stored as JSON:

```json
{
  "appointmentConfirmation": true,
  "appointmentReminder": true,
  "invoiceNotification": true,
  "messageNotification": true
}
```

## Email Logging

All sent emails are logged to the `Notification` table:

```prisma
model Notification {
  id          String
  practiceId  String
  patientId   String?
  channel     NotificationChannel  // EMAIL
  template    String
  subject     String?
  content     String?
  status      NotificationStatus   // PENDING, SENT, DELIVERED, FAILED
  sentAt      DateTime?
  externalId  String?              // Resend message ID
  errorMessage String?
}
```

## API Endpoints

### Patient Portal

- `GET /api/patient-portal/email-preferences` - Get current preferences
- `PATCH /api/patient-portal/email-preferences` - Update preferences

### Cron Jobs

- `GET /api/cron/appointment-reminders` - Send 24-hour reminders (requires CRON_SECRET header)

## Styling

Email templates use:

- Professional HTML with inline CSS
- DentFlow brand colors (orange/amber #e8945a)
- Responsive design for mobile devices
- Dutch language throughout
- Practice branding dynamically inserted

## Testing

To test emails locally without sending real emails:

1. Don't set `RESEND_API_KEY` - emails will be logged but not sent
2. Check console output for email content
3. Review the `Notification` table for logged attempts

## Troubleshooting

**Emails not sending:**

- Check `RESEND_API_KEY` is set correctly
- Verify patient has an email address
- Check patient's email preferences haven't disabled the email type

**Cron job not working:**

- Verify `CRON_SECRET` matches between your cron scheduler and the app
- Check that the cron endpoint is accessible
- Review server logs for errors

**Template rendering issues:**

- Ensure all required data is passed to templates
- Check that Decimal values are converted to numbers before comparison
- Verify practice and patient data is loaded with relations
