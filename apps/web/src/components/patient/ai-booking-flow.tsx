'use client';

import { useState } from 'react';
import { Calendar, Check, X, Download } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  HYGIENE: 'Mondhygiëne',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
};

function formatDateDutch(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function generateIcsUrl(params: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}): string {
  const qs = new URLSearchParams({
    title: params.title,
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
  });
  return `/api/patient-portal/appointments/ics?${qs.toString()}`;
}

interface BookingConfirmationCardProps {
  appointmentType: string;
  practitionerName: string;
  date: string;
  startTime: string;
  endTime: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BookingConfirmationCard({
  appointmentType,
  practitionerName,
  date,
  startTime,
  endTime,
  onConfirm,
  onCancel,
}: BookingConfirmationCardProps) {
  const [status, setStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'error'>('pending');

  const handleConfirm = async () => {
    setStatus('confirming');
    try {
      onConfirm();
      setStatus('confirmed');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'confirmed') {
    const icsUrl = generateIcsUrl({
      title: `${TYPE_LABELS[appointmentType] ?? appointmentType} - ${practitionerName}`,
      date,
      startTime,
      endTime,
    });

    return (
      <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-green-500/20 rounded-2xl p-5 mt-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-400">Afspraak aangevraagd!</p>
            <p className="text-xs text-white/50">Wacht op bevestiging van de praktijk</p>
          </div>
        </div>
        <div className="space-y-1 text-sm text-white/70 mb-4">
          <p>{TYPE_LABELS[appointmentType] ?? appointmentType} bij {practitionerName}</p>
          <p>{formatDateDutch(date)}, {startTime} - {endTime}</p>
        </div>
        <a
          href={icsUrl}
          className="inline-flex items-center gap-2 text-sm text-[#e8945a] hover:text-[#d4864a] transition-colors"
        >
          <Download className="w-4 h-4" />
          Download kalenderbestand (.ics)
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-5 mt-2">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[#e8945a]" />
        <span className="text-sm font-semibold text-white/90">Afspraak bevestigen</span>
      </div>

      <div className="space-y-2 text-sm text-white/70 mb-5">
        <div className="flex justify-between">
          <span className="text-white/50">Type</span>
          <span>{TYPE_LABELS[appointmentType] ?? appointmentType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Behandelaar</span>
          <span>{practitionerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Datum</span>
          <span>{formatDateDutch(date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Tijd</span>
          <span>{startTime} - {endTime}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleConfirm}
          disabled={status === 'confirming'}
          className="bg-[#e8945a] hover:bg-[#d4864a] shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 rounded-2xl px-6 py-3 font-semibold text-white text-sm transition-all duration-300 disabled:opacity-50"
        >
          {status === 'confirming' ? 'Bezig...' : 'Bevestigen'}
        </button>
        <button
          onClick={onCancel}
          disabled={status === 'confirming'}
          className="text-white/50 hover:text-white/70 text-sm py-2 transition-colors"
        >
          <X className="w-3 h-3 inline mr-1" />
          Annuleren
        </button>
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-xs mt-2">Er ging iets mis. Probeer het opnieuw.</p>
      )}

      <p className="text-xs text-white/30 mt-3">
        Of maak een afspraak via het{' '}
        <a href="/portal/appointments/book" className="text-[#e8945a]/70 hover:text-[#e8945a] underline">
          boekingsformulier
        </a>
      </p>
    </div>
  );
}
