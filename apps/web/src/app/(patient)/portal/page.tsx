'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';


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

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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

function getDaysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
  const daysUntil = nextAppt ? getDaysUntil(nextAppt.startTime) : null;

  const openInvoiceCount = data?.recentInvoices?.filter((i: any) => i.status !== 'PAID').length || 0;
  const pendingConsents = data?.pendingConsents || 0;
  const lastVisitDate = data?.lastVisit ? formatShortDate(data.lastVisit) : '-';

  const loadingSpinner = (
    <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#e8945a' }} />
      Laden...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero / Welcome card — spans full width */}
      <div className="patient-glass-card rounded-3xl p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #e8945a, #d4864a, rgba(232,148,90,0.2))' }} />
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(232,148,90,0.06), transparent 70%)' }} />
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Welkom terug, {firstName}
          </h1>
          <p className="text-base lg:text-lg mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Hier vindt u een overzicht van uw tandheelkundige zorg
          </p>

          {loading ? loadingSpinner : nextAppt ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,148,90,0.12)', border: '1px solid rgba(232,148,90,0.2)' }}>
                  <svg className="w-5 h-5" style={{ color: '#e8945a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e8945a' }}>Volgende afspraak</p>
                  <p className="text-lg font-semibold capitalize" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {formatDate(nextAppt.startTime)} om {formatTime(nextAppt.startTime)}
                  </p>
                </div>
              </div>
              {countdown && (
                <div className="px-4 py-2 rounded-2xl" style={{ background: 'rgba(232,148,90,0.1)', border: '1px solid rgba(232,148,90,0.15)' }}>
                  <p className="text-sm font-medium" style={{ color: '#e8945a' }}>Over {countdown}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
              U heeft geen aankomende afspraken.
            </p>
          )}
        </div>
      </div>

      {/* Stats row — bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Volgende afspraak */}
        <div className="patient-stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Volgende afspraak</p>
          <p className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {loading ? '...' : daysUntil !== null && daysUntil > 0 ? `${daysUntil}d` : '-'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {loading ? '' : nextAppt ? formatShortDate(nextAppt.startTime) : 'Geen gepland'}
          </p>
        </div>

        {/* Openstaande facturen */}
        <div className="patient-stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Openstaande facturen</p>
          <p className="text-2xl font-bold" style={{ color: openInvoiceCount > 0 ? '#e8945a' : 'rgba(255,255,255,0.9)' }}>
            {loading ? '...' : openInvoiceCount}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {openInvoiceCount === 0 ? 'Alles betaald' : 'Actie vereist'}
          </p>
        </div>

        {/* Toestemmingen */}
        <div className="patient-stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Toestemmingen</p>
          <p className="text-2xl font-bold" style={{ color: pendingConsents > 0 ? '#e8945a' : 'rgba(255,255,255,0.9)' }}>
            {loading ? '...' : pendingConsents}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {pendingConsents === 0 ? 'Alles ondertekend' : 'In afwachting'}
          </p>
        </div>

        {/* Laatste bezoek */}
        <div className="patient-stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Laatste bezoek</p>
          <p className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {loading ? '...' : lastVisitDate}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Vorige afspraak</p>
        </div>
      </div>

      {/* Bento grid: appointment detail + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next appointment detail card — 2 cols */}
        <div className="lg:col-span-2 patient-glass-card rounded-3xl p-7 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-3xl" style={{ background: 'linear-gradient(180deg, #e8945a, rgba(232,148,90,0.2))' }} />
          <div className="pl-4">
            <h2 className="text-lg font-semibold mb-5" style={{ color: 'rgba(255,255,255,0.9)' }}>Afspraakdetails</h2>

            {loading ? loadingSpinner : nextAppt ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div>
                    <p className="text-2xl font-bold capitalize" style={{ color: 'rgba(255,255,255,0.95)' }}>
                      {formatDate(nextAppt.startTime)}
                    </p>
                    <p className="text-lg font-medium mt-1" style={{ color: '#e8945a' }}>
                      {formatTime(nextAppt.startTime)} - {formatTime(nextAppt.endTime)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  <div className="px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Type</p>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {appointmentTypeLabels[nextAppt.appointmentType] || nextAppt.appointmentType}
                    </p>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Behandelaar</p>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {nextAppt.practitioner?.firstName} {nextAppt.practitioner?.lastName}
                    </p>
                  </div>
                  {nextAppt.room && (
                    <div className="px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Kamer</p>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{nextAppt.room}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Geen aankomende afspraken. Neem contact op met de praktijk om een afspraak te plannen.
              </p>
            )}
          </div>
        </div>

        {/* Quick actions card — 1 col */}
        <div className="patient-glass-card rounded-3xl p-7">
          <h2 className="text-lg font-semibold mb-5" style={{ color: 'rgba(255,255,255,0.9)' }}>Snelle acties</h2>
          <div className="space-y-3">
            <Link
              href="/portal/anamnesis"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,148,90,0.12)' }}>
                <svg className="w-4.5 h-4.5" style={{ color: '#e8945a', width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Anamnese invullen</span>
            </Link>

            <Link
              href="/portal/profile"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,148,90,0.12)' }}>
                <svg className="w-4.5 h-4.5" style={{ color: '#e8945a', width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Profiel bewerken</span>
            </Link>

            <Link
              href="/portal/documents"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,148,90,0.12)' }}>
                <svg className="w-4.5 h-4.5" style={{ color: '#e8945a', width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Documenten bekijken</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent invoices card — full width */}
      <div className="patient-glass-card rounded-3xl p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Recente Facturen</h2>
          <Link
            href="/portal/documents"
            className="text-sm font-medium transition-colors"
            style={{ color: '#e8945a' }}
          >
            Alle bekijken
          </Link>
        </div>

        {loading ? loadingSpinner : data?.recentInvoices?.length > 0 ? (
          <div className="space-y-2.5">
            {data.recentInvoices.map((inv: any) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{inv.invoiceNumber}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(inv.invoiceDate).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(inv.total))}
                  </p>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : inv.status === 'OVERDUE'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {inv.status === 'PAID' ? 'Betaald' : inv.status === 'OVERDUE' ? 'Verlopen' : 'Open'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Geen recente facturen gevonden.</p>
        )}
      </div>
    </div>
  );
}
