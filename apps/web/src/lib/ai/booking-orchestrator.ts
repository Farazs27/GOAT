import { prisma } from '@/lib/prisma';

// --- Types ---

export type BookingState =
  | { step: 'idle' }
  | { step: 'ask_type' }
  | { step: 'ask_practitioner'; appointmentType: string }
  | { step: 'ask_date'; appointmentType: string; practitionerId: string; practitionerName: string }
  | {
      step: 'show_slots';
      appointmentType: string;
      practitionerId: string;
      practitionerName: string;
      datePreference: string;
      slots: Array<{ date: string; startTime: string; endTime: string }>;
    }
  | {
      step: 'confirm';
      appointmentType: string;
      practitionerId: string;
      practitionerName: string;
      date: string;
      startTime: string;
      endTime: string;
    }
  | { step: 'done'; appointmentId: string }
  | { step: 'failed'; reason: string };

const VALID_TYPES = ['CHECKUP', 'TREATMENT', 'HYGIENE', 'EMERGENCY', 'CONSULTATION'] as const;

const TYPE_LABELS: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  HYGIENE: 'Mondhygiëne',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
};

const BOOKING_KEYWORDS = [
  'afspraak', 'boeken', 'inplannen', 'appointment', 'plannen',
  'reserveren', 'maken', 'book', 'schedule',
];

const CANCEL_KEYWORDS = ['stop', 'annuleren', 'cancel', 'nee', 'laat maar'];

// --- Intent detection ---

export function detectBookingIntent(message: string): boolean {
  const lower = message.toLowerCase();
  return BOOKING_KEYWORDS.some((kw) => lower.includes(kw));
}

// --- Orchestrator ---

export class BookingOrchestrator {
  private patientId: string;
  private practiceId: string;
  private patientToken: string;

  constructor(patientId: string, practiceId: string, patientToken: string) {
    this.patientId = patientId;
    this.practiceId = practiceId;
    this.patientToken = patientToken;
  }

  async getState(sessionId: string): Promise<BookingState> {
    const session = await prisma.aiChatSession.findUnique({ where: { id: sessionId } });
    const meta = (session?.metadata as Record<string, unknown>) ?? {};
    return (meta.bookingState as BookingState) ?? { step: 'idle' };
  }

  async setState(state: BookingState, sessionId: string): Promise<void> {
    const session = await prisma.aiChatSession.findUnique({ where: { id: sessionId } });
    const meta = (session?.metadata as Record<string, unknown>) ?? {};
    await prisma.aiChatSession.update({
      where: { id: sessionId },
      data: { metadata: { ...meta, bookingState: state } },
    });
  }

  async processStep(
    userMessage: string,
    currentState: BookingState,
    sessionId: string
  ): Promise<{ response: string; newState: BookingState; richCards?: unknown[] }> {
    const lower = userMessage.toLowerCase().trim();

    // Cancel at any point
    if (CANCEL_KEYWORDS.some((kw) => lower.includes(kw)) && currentState.step !== 'idle') {
      const newState: BookingState = { step: 'idle' };
      await this.setState(newState, sessionId);
      return {
        response: 'De boeking is geannuleerd. Kan ik u ergens anders mee helpen?',
        newState,
      };
    }

    switch (currentState.step) {
      case 'idle':
        return this.handleIdle(sessionId);
      case 'ask_type':
        return this.handleAskType(lower, sessionId);
      case 'ask_practitioner':
        return this.handleAskPractitioner(lower, currentState, sessionId);
      case 'ask_date':
        return this.handleAskDate(lower, currentState, sessionId);
      case 'show_slots':
        return this.handleShowSlots(lower, currentState, sessionId);
      case 'confirm':
        return this.handleConfirm(lower, currentState, sessionId);
      default:
        return this.fallback(currentState, sessionId);
    }
  }

  // --- Step handlers ---

  private async handleIdle(sessionId: string) {
    const newState: BookingState = { step: 'ask_type' };
    await this.setState(newState, sessionId);
    const typeList = Object.entries(TYPE_LABELS)
      .map(([key, label]) => `- **${label}** (${key})`)
      .join('\n');
    return {
      response: `Ik help u graag met het maken van een afspraak! Welk type afspraak wilt u maken?\n\n${typeList}`,
      newState,
    };
  }

  private async handleAskType(msg: string, sessionId: string) {
    // Match type from message
    const matched = VALID_TYPES.find(
      (t) => msg.includes(t.toLowerCase()) || msg.includes(TYPE_LABELS[t].toLowerCase())
    );

    if (!matched) {
      return {
        response: `Ik heb het type niet herkend. Kies uit: ${Object.values(TYPE_LABELS).join(', ')}.\n\nOf maak een afspraak via [het boekingsformulier](/portal/appointments/book).`,
        newState: { step: 'ask_type' } as BookingState,
      };
    }

    // Check recent appointment of same type (3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentSameType = await prisma.appointment.findFirst({
      where: {
        patientId: this.patientId,
        appointmentType: matched === 'HYGIENE' ? { in: ['HYGIENE'] } : matched,
        startTime: { gte: threeMonthsAgo },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    let prematureWarning = '';
    if (recentSameType) {
      prematureWarning =
        '\n\n⚠️ Let op: u heeft minder dan 3 maanden geleden al een soortgelijke afspraak gehad. U kunt toch doorgaan.';
    }

    // Fetch practitioners
    const practitioners = await prisma.user.findMany({
      where: {
        practiceId: this.practiceId,
        role: { in: ['DENTIST', 'HYGIENIST'] },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (practitioners.length === 0) {
      const failState: BookingState = { step: 'failed', reason: 'Geen behandelaars beschikbaar' };
      await this.setState(failState, sessionId);
      return { response: 'Er zijn momenteel geen behandelaars beschikbaar.', newState: failState };
    }

    const newState: BookingState = { step: 'ask_practitioner', appointmentType: matched };
    await this.setState(newState, sessionId);

    const practList = practitioners
      .map((p, i) => `${i + 1}. **${p.firstName} ${p.lastName}** (${p.role === 'DENTIST' ? 'Tandarts' : 'Mondhygiënist'})`)
      .join('\n');

    return {
      response: `U wilt een ${TYPE_LABELS[matched]} afspraak. Bij welke behandelaar?\n\n${practList}${prematureWarning}`,
      newState,
    };
  }

  private async handleAskPractitioner(
    msg: string,
    state: Extract<BookingState, { step: 'ask_practitioner' }>,
    sessionId: string
  ) {
    const practitioners = await prisma.user.findMany({
      where: {
        practiceId: this.practiceId,
        role: { in: ['DENTIST', 'HYGIENIST'] },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true },
    });

    // Match by number or name
    let matched = practitioners.find(
      (p) =>
        msg.includes((p.firstName ?? '').toLowerCase()) ||
        msg.includes((p.lastName ?? '').toLowerCase())
    );

    if (!matched) {
      const num = parseInt(msg);
      if (!isNaN(num) && num >= 1 && num <= practitioners.length) {
        matched = practitioners[num - 1];
      }
    }

    if (!matched) {
      return {
        response: `Ik heb de behandelaar niet herkend. Geef de naam of het nummer op.\n\nOf maak een afspraak via [het boekingsformulier](/portal/appointments/book).`,
        newState: state,
      };
    }

    const newState: BookingState = {
      step: 'ask_date',
      appointmentType: state.appointmentType,
      practitionerId: matched.id,
      practitionerName: `${matched.firstName} ${matched.lastName}`,
    };
    await this.setState(newState, sessionId);

    return {
      response: `Bij ${matched.firstName} ${matched.lastName}. Wanneer wilt u de afspraak? U kunt zeggen: "volgende week", "maandag ochtend", "na 14:00", of een specifieke datum.`,
      newState,
    };
  }

  private async handleAskDate(
    msg: string,
    state: Extract<BookingState, { step: 'ask_date' }>,
    sessionId: string
  ) {
    const { startDate, endDate, timeFilter } = parseNaturalDate(msg);

    // Fetch slots for each day in range (max 14 days)
    const allSlots: Array<{ date: string; startTime: string; endTime: string }> = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end && allSlots.length < 5) {
      const dateStr = current.toISOString().split('T')[0];
      try {
        const url = new URL('/api/patient-portal/appointments/availability', getBaseUrl());
        url.searchParams.set('practitionerId', state.practitionerId);
        url.searchParams.set('date', dateStr);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${this.patientToken}` },
        });

        if (res.ok) {
          const data = (await res.json()) as { slots: Array<{ startTime: string; endTime: string }> };
          let filtered = data.slots;

          if (timeFilter === 'morning') {
            filtered = filtered.filter((s) => parseInt(s.startTime.split(':')[0]) < 12);
          } else if (timeFilter === 'afternoon') {
            filtered = filtered.filter((s) => {
              const h = parseInt(s.startTime.split(':')[0]);
              return h >= 12 && h < 17;
            });
          } else if (timeFilter === 'after') {
            const afterHour = parseInt(msg.match(/na (\d{1,2})/)?.[1] ?? '14');
            filtered = filtered.filter((s) => parseInt(s.startTime.split(':')[0]) >= afterHour);
          }

          for (const slot of filtered) {
            if (allSlots.length >= 5) break;
            allSlots.push({ date: dateStr, startTime: slot.startTime, endTime: slot.endTime });
          }
        }
      } catch {
        // Skip failed day
      }

      current.setDate(current.getDate() + 1);
    }

    if (allSlots.length === 0) {
      return {
        response: `Er zijn helaas geen beschikbare tijdsloten gevonden in die periode. Probeer een andere datum of periode.\n\nOf maak een afspraak via [het boekingsformulier](/portal/appointments/book).`,
        newState: state,
      };
    }

    const newState: BookingState = {
      step: 'show_slots',
      appointmentType: state.appointmentType,
      practitionerId: state.practitionerId,
      practitionerName: state.practitionerName,
      datePreference: msg,
      slots: allSlots,
    };
    await this.setState(newState, sessionId);

    const slotList = allSlots
      .map((s, i) => `${i + 1}. **${formatDateDutch(s.date)}** om **${s.startTime}**`)
      .join('\n');

    return {
      response: `Ik heb ${allSlots.length} beschikbare tijdsloten gevonden:\n\n${slotList}\n\nWelk tijdslot wilt u? Geef het nummer op.`,
      newState,
      richCards: [
        {
          type: 'slot_picker',
          slots: allSlots,
        },
      ],
    };
  }

  private async handleShowSlots(
    msg: string,
    state: Extract<BookingState, { step: 'show_slots' }>,
    sessionId: string
  ) {
    const num = parseInt(msg);
    if (isNaN(num) || num < 1 || num > state.slots.length) {
      return {
        response: `Kies een nummer van 1 tot ${state.slots.length}.`,
        newState: state,
      };
    }

    const selected = state.slots[num - 1];
    const newState: BookingState = {
      step: 'confirm',
      appointmentType: state.appointmentType,
      practitionerId: state.practitionerId,
      practitionerName: state.practitionerName,
      date: selected.date,
      startTime: selected.startTime,
      endTime: selected.endTime,
    };
    await this.setState(newState, sessionId);

    return {
      response: `Wilt u de volgende afspraak bevestigen?\n\n- **Type:** ${TYPE_LABELS[state.appointmentType] ?? state.appointmentType}\n- **Behandelaar:** ${state.practitionerName}\n- **Datum:** ${formatDateDutch(selected.date)}\n- **Tijd:** ${selected.startTime} - ${selected.endTime}\n\nZeg "ja" om te bevestigen of "annuleren" om te stoppen.`,
      newState,
      richCards: [
        {
          type: 'booking_confirmation',
          appointmentType: state.appointmentType,
          practitionerName: state.practitionerName,
          date: selected.date,
          startTime: selected.startTime,
          endTime: selected.endTime,
        },
      ],
    };
  }

  private async handleConfirm(
    msg: string,
    state: Extract<BookingState, { step: 'confirm' }>,
    sessionId: string
  ) {
    const affirmative = ['ja', 'yes', 'bevestig', 'ok', 'oké', 'akkoord', 'confirm', 'doe maar'];
    if (!affirmative.some((a) => msg.includes(a))) {
      return {
        response: 'Zeg "ja" om te bevestigen of "annuleren" om te stoppen.',
        newState: state,
      };
    }

    // Check pending consent forms
    const pendingConsent = await prisma.consentForm.findFirst({
      where: {
        patientId: this.patientId,
        status: 'PENDING',
      },
    });

    if (pendingConsent) {
      return {
        response:
          'U heeft nog een toestemmingsformulier dat ondertekend moet worden voordat u een afspraak kunt maken. Ga naar [Toestemming](/portal/consent) om dit te voltooien.',
        newState: state,
      };
    }

    // Check max pending bookings
    const practice = await prisma.practice.findUnique({
      where: { id: this.practiceId },
      select: { settings: true },
    });
    const settings = (practice?.settings as Record<string, unknown>) ?? {};
    const booking = (settings.booking as Record<string, number>) ?? {};
    const maxPending = booking.maxPendingBookings || 2;

    const pendingCount = await prisma.appointment.count({
      where: { patientId: this.patientId, status: 'PENDING_APPROVAL' },
    });

    if (pendingCount >= maxPending) {
      const failState: BookingState = {
        step: 'failed',
        reason: `U heeft al ${maxPending} afspraken in afwachting van goedkeuring.`,
      };
      await this.setState(failState, sessionId);
      return { response: failState.reason, newState: failState };
    }

    // Book via internal API
    try {
      const url = new URL('/api/patient-portal/appointments/book', getBaseUrl());
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.patientToken}`,
        },
        body: JSON.stringify({
          date: state.date,
          startTime: state.startTime,
          appointmentType: state.appointmentType,
          practitionerId: state.practitionerId,
          notes: 'Geboekt via AI-assistent',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Boeking mislukt' }));
        const failState: BookingState = {
          step: 'failed',
          reason: (err as { message?: string }).message ?? 'Boeking mislukt',
        };
        await this.setState(failState, sessionId);
        return { response: `De boeking is niet gelukt: ${failState.reason}`, newState: failState };
      }

      const data = (await res.json()) as { appointment: { id: string } };
      const newState: BookingState = { step: 'done', appointmentId: data.appointment.id };
      await this.setState(newState, sessionId);

      // Generate .ics download link
      const icsParams = new URLSearchParams({
        title: `${TYPE_LABELS[state.appointmentType] ?? state.appointmentType} - ${state.practitionerName}`,
        date: state.date,
        startTime: state.startTime,
        endTime: state.endTime,
      });

      return {
        response: `Uw afspraak is aangevraagd! De praktijk zal deze binnenkort bevestigen.\n\n- **Type:** ${TYPE_LABELS[state.appointmentType]}\n- **Behandelaar:** ${state.practitionerName}\n- **Datum:** ${formatDateDutch(state.date)}\n- **Tijd:** ${state.startTime} - ${state.endTime}\n\n[Download kalenderbestand (.ics)](/api/patient-portal/appointments/ics?${icsParams.toString()})`,
        newState,
        richCards: [
          {
            type: 'appointment',
            appointmentType: state.appointmentType,
            practitionerName: state.practitionerName,
            date: state.date,
            startTime: state.startTime,
            endTime: state.endTime,
            status: 'PENDING_APPROVAL',
          },
        ],
      };
    } catch {
      const failState: BookingState = { step: 'failed', reason: 'Netwerkfout bij boeking' };
      await this.setState(failState, sessionId);
      return { response: 'Er ging iets mis bij het boeken. Probeer het later opnieuw.', newState: failState };
    }
  }

  private async fallback(currentState: BookingState, sessionId: string) {
    const idleState: BookingState = { step: 'idle' };
    await this.setState(idleState, sessionId);
    return {
      response:
        'Er ging iets mis met de boeking. U kunt ook direct een afspraak maken via [het boekingsformulier](/portal/appointments/book).',
      newState: idleState,
    };
  }
}

// --- Helpers ---

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

function parseNaturalDate(msg: string): {
  startDate: string;
  endDate: string;
  timeFilter: 'morning' | 'afternoon' | 'after' | null;
} {
  const lower = msg.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = new Date(today);
  let endDate = new Date(today);
  let timeFilter: 'morning' | 'afternoon' | 'after' | null = null;

  // Time filters
  if (lower.includes('ochtend')) timeFilter = 'morning';
  else if (lower.includes('middag')) timeFilter = 'afternoon';
  else if (/na \d{1,2}/.test(lower)) timeFilter = 'after';

  // Date parsing
  const dayNames: Record<string, number> = {
    maandag: 1, dinsdag: 2, woensdag: 3, donderdag: 4,
    vrijdag: 5, zaterdag: 6, zondag: 0,
  };

  if (lower.includes('volgende week')) {
    // Next Monday to Sunday
    const daysUntilMonday = ((1 - today.getDay() + 7) % 7) || 7;
    startDate.setDate(today.getDate() + daysUntilMonday);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
  } else if (lower.includes('deze week')) {
    endDate.setDate(today.getDate() + (7 - today.getDay()));
  } else {
    // Check for specific day name
    const matchedDay = Object.entries(dayNames).find(([name]) => lower.includes(name));
    if (matchedDay) {
      const targetDay = matchedDay[1];
      const daysUntil = ((targetDay - today.getDay() + 7) % 7) || 7;
      startDate.setDate(today.getDate() + daysUntil);
      endDate = new Date(startDate);
    } else {
      // Check for explicit date (YYYY-MM-DD or DD-MM)
      const dateMatch = lower.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        startDate = new Date(dateMatch[1] + 'T00:00:00');
        endDate = new Date(startDate);
      } else {
        // Default: next 14 days
        startDate.setDate(today.getDate() + 1);
        endDate.setDate(today.getDate() + 14);
      }
    }
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    timeFilter,
  };
}

function formatDateDutch(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
