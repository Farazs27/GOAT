'use client';

import { useEffect, useState } from 'react';


function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCountdown(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} dag${days > 1 ? 'en' : ''} en ${hours} uur`;
  if (hours > 0) return `${hours} uur`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${mins} minuten`;
}

const appointmentTypeLabels: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
  HYGIENE: 'Mondhygiene',
};

export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pd = localStorage.getItem('patient_data');
    if (pd) setPatientData(JSON.parse(pd));

    const token = localStorage.getItem('patient_token');
    fetch(`/api/patient-portal/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = patientData?.firstName || 'Patient';
  const nextAppt = data?.nextAppointment;
  const countdown = nextAppt ? getCountdown(nextAppt.startTime) : null;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white/95 mb-2">
          Welkom, {firstName}
        </h1>
        <p className="text-lg text-white/50">
          Hier vindt u een overzicht van uw tandheelkundige zorg
        </p>
      </div>

      {/* Next appointment — prominent card */}
      <div className="patient-glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20 flex items-center justify-center border border-teal-400/20">
              <svg className="w-5 h-5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white/90">Volgende Afspraak</h2>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-white/40">
              <div className="w-5 h-5 border-2 border-white/20 border-t-teal-400 rounded-full animate-spin" />
              Laden...
            </div>
          ) : nextAppt ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div>
                  <p className="text-2xl font-bold text-white/95 capitalize">
                    {formatDate(nextAppt.startTime)}
                  </p>
                  <p className="text-lg text-teal-300 font-medium mt-1">
                    {formatTime(nextAppt.startTime)} - {formatTime(nextAppt.endTime)}
                  </p>
                </div>
                {countdown && (
                  <div className="px-5 py-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 inline-block">
                    <p className="text-sm text-teal-300 font-medium">
                      Over {countdown}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/8">
                  <p className="text-xs text-white/40 mb-0.5">Type</p>
                  <p className="text-base text-white/80 font-medium">
                    {appointmentTypeLabels[nextAppt.appointmentType] || nextAppt.appointmentType}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/8">
                  <p className="text-xs text-white/40 mb-0.5">Behandelaar</p>
                  <p className="text-base text-white/80 font-medium">
                    {nextAppt.practitioner?.firstName} {nextAppt.practitioner?.lastName}
                  </p>
                </div>
                {nextAppt.room && (
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/8">
                    <p className="text-xs text-white/40 mb-0.5">Kamer</p>
                    <p className="text-base text-white/80 font-medium">{nextAppt.room}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-base text-white/50">
              U heeft geen aankomende afspraken. Neem contact op met de praktijk om een afspraak te plannen.
            </p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/portal/appointments"
          className="patient-glass-card rounded-3xl p-7 group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20 flex items-center justify-center border border-teal-400/20 mb-4 group-hover:shadow-lg group-hover:shadow-teal-500/10 transition-all">
            <svg className="w-6 h-6 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white/90 mb-1">Mijn Afspraken</h3>
          <p className="text-base text-white/40">Bekijk en beheer uw afspraken</p>
        </a>

        <a
          href="/portal/profile"
          className="patient-glass-card rounded-3xl p-7 group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center border border-purple-400/20 mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/10 transition-all">
            <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white/90 mb-1">Mijn Gegevens</h3>
          <p className="text-base text-white/40">Bekijk en wijzig uw persoonlijke gegevens</p>
        </a>
      </div>

      {/* Recent invoices */}
      <div className="patient-glass-card rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white/90">Recente Facturen</h2>
          <a
            href="/portal/documents"
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium"
          >
            Alle bekijken
          </a>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-white/40 py-4">
            <div className="w-5 h-5 border-2 border-white/20 border-t-teal-400 rounded-full animate-spin" />
            Laden...
          </div>
        ) : data?.recentInvoices?.length > 0 ? (
          <div className="space-y-3">
            {data.recentInvoices.map((inv: any) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all"
              >
                <div>
                  <p className="text-base font-medium text-white/80">{inv.invoiceNumber}</p>
                  <p className="text-sm text-white/40">
                    {new Date(inv.invoiceDate).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-white/90">
                    {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(inv.total))}
                  </p>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : inv.status === 'OVERDUE'
                        ? 'bg-red-500/15 text-red-300'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {inv.status === 'PAID' ? 'Betaald' : inv.status === 'OVERDUE' ? 'Verlopen' : 'Open'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base text-white/40 py-4">Geen recente facturen gevonden.</p>
        )}
      </div>
    </div>
  );
}
