import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callGemini } from '@/lib/ai/gemini-client';
import { sendWhatsAppMessage, isWhatsAppConfigured } from '@/lib/whatsapp/twilio';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Auth: CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ message: 'Niet geautoriseerd' }, { status: 401 });
    }

    let processed = 0;
    let nudgesSent = 0;
    let errors = 0;

    // Get all practices (settings is Json, filter in-app)
    const practices = await prisma.practice.findMany({
      where: { isActive: true },
      select: { id: true, name: true, settings: true },
    });

    for (const practice of practices) {
      const settings = (practice.settings as Record<string, unknown>) || {};
      const aiSettings = (settings.aiAssistant as Record<string, unknown>) || {};

      if (!aiSettings.nudgesEnabled) continue;

      const overdueThresholdMonths = (aiSettings.overdueThresholdMonths as number) || 6;
      const maxNudges = (aiSettings.maxNudges as number) || 2;
      const thresholdDate = new Date();
      thresholdDate.setMonth(thresholdDate.getMonth() - overdueThresholdMonths);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Find active patients for this practice
      const patients = await prisma.patient.findMany({
        where: {
          practiceId: practice.id,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          phone: true,
          appointments: {
            where: {
              appointmentType: { in: ['CHECKUP'] },
              status: { in: ['COMPLETED', 'CONFIRMED'] },
              startTime: { gte: thresholdDate },
            },
            select: { id: true },
            take: 1,
          },
          patientNudges: {
            where: { nudgeType: 'overdue_checkup' },
            select: { id: true, sentAt: true },
            orderBy: { sentAt: 'desc' },
          },
        },
      });

      for (const patient of patients) {
        // Skip if has recent checkup
        if (patient.appointments.length > 0) continue;

        // Skip if already at max nudges
        if (patient.patientNudges.length >= maxNudges) continue;

        // Skip if nudged in last 90 days
        const lastNudge = patient.patientNudges[0];
        if (lastNudge && lastNudge.sentAt > ninetyDaysAgo) continue;

        processed++;

        try {
          // Calculate months overdue (find last completed checkup)
          const lastCheckup = await prisma.appointment.findFirst({
            where: {
              patientId: patient.id,
              appointmentType: 'CHECKUP',
              status: 'COMPLETED',
            },
            orderBy: { startTime: 'desc' },
            select: { startTime: true },
          });

          const monthsOverdue = lastCheckup
            ? Math.floor((Date.now() - lastCheckup.startTime.getTime()) / (30 * 24 * 60 * 60 * 1000))
            : overdueThresholdMonths;

          // Generate personalized WhatsApp message via Gemini (no PII sent)
          const prompt = `Schrijf een kort, vriendelijk WhatsApp-bericht (max 160 tekens) in het Nederlands om een patiënt te herinneren aan een controle-afspraak. De patiënt is al ${monthsOverdue} maanden niet bij de tandarts geweest. Eindig met een link naar het boekingsportaal. Toon: professioneel maar warm. Geef alleen het bericht terug als platte tekst, geen JSON.`;

          let generatedMessage: string;
          try {
            generatedMessage = await callGemini(prompt, { temperature: 0.7, maxTokens: 256 });
            // Strip any JSON wrapper if Gemini returns it
            generatedMessage = generatedMessage.replace(/^["']|["']$/g, '').trim();
          } catch {
            generatedMessage = `Het is alweer ${monthsOverdue} maanden geleden sinds uw laatste controle. Maak snel een afspraak via ons portaal!`;
          }

          // Prepend patient name (not sent to Gemini)
          const fullMessage = `Beste ${patient.firstName}, ${generatedMessage}`;

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dentflow.nl';

          // Create WhatsApp nudge record
          const whatsappNudge = await prisma.patientNudge.create({
            data: {
              practiceId: practice.id,
              patientId: patient.id,
              nudgeType: 'overdue_checkup',
              channel: 'whatsapp',
              message: fullMessage,
              metadata: {
                monthsOverdue,
                bookingLink: `${baseUrl}/portal/appointments/book?ref=nudge`,
              },
            },
          });

          // Update metadata with nudgeId-based booking link
          const bookingLink = `${baseUrl}/portal/appointments/book?ref=nudge&nudgeId=${whatsappNudge.id}`;
          await prisma.patientNudge.update({
            where: { id: whatsappNudge.id },
            data: { metadata: { monthsOverdue, bookingLink } },
          });

          // Send via Twilio if configured
          const whatsappConfigured = await isWhatsAppConfigured(practice.id);
          if (whatsappConfigured && patient.phone) {
            try {
              await sendWhatsAppMessage(
                practice.id,
                patient.phone,
                `${fullMessage}\n\n${bookingLink}`,
              );
            } catch (err) {
              console.warn(`WhatsApp send failed for patient ${patient.id}:`, err);
            }
          }

          // Create IN_APP notification
          await prisma.notification.create({
            data: {
              practiceId: practice.id,
              patientId: patient.id,
              channel: 'IN_APP',
              template: 'NUDGE',
              content: 'Het is tijd voor uw controle-afspraak',
              status: 'SENT',
              sentAt: new Date(),
              metadata: { nudgeId: whatsappNudge.id, bookingLink },
            },
          });

          // Create in_app nudge record
          await prisma.patientNudge.create({
            data: {
              practiceId: practice.id,
              patientId: patient.id,
              nudgeType: 'overdue_checkup',
              channel: 'in_app',
              message: 'Het is tijd voor uw controle-afspraak',
              metadata: { nudgeId: whatsappNudge.id, bookingLink },
            },
          });

          nudgesSent += 2; // whatsapp + in_app
        } catch (err) {
          console.error(`Error processing nudge for patient ${patient.id}:`, err);
          errors++;
        }
      }
    }

    return Response.json({ processed, nudgesSent, errors });
  } catch (error) {
    console.error('Cron nudge error:', error);
    return Response.json({ message: 'Interne serverfout' }, { status: 500 });
  }
}
