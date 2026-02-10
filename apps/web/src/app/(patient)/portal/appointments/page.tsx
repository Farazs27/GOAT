'use client';

import { useEffect, useState } from 'react';


const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
  HYGIENE: 'Mondhygiene',
};

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Gepland',
  CONFIRMED: 'Bevestigd',
  CHECKED_IN: 'Ingecheckt',
  IN_PROGRESS: 'Bezig',
  COMPLETED: 'Afgerond',
  NO_SHOW: 'Niet verschenen',
  CANCELLED: 'Geannuleerd',
};

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/15 text-blue-300',
  CONFIRMED: 'bg-teal-500/15 text-teal-300',
  CHECKED_IN: 'bg-cyan-500/15 text-cyan-300',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-300',
  COMPLETED: 'bg-emerald-500/15 text-emerald-300',
  NO_SHOW: 'bg-red-500/15 text-red-300',
  CANCELLED: 'bg-white/10 text-white/40',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

export default function AppointmentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchAppointments = () => {
    const token = localStorage.getItem('patient_token');
    fetch(`/api/patient-portal/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchAppointments, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Weet u zeker dat u deze afspraak wilt annuleren?')) return;
    setCancelling(id);
    const token = localStorage.getItem('patient_token');
    try {
      const res = await fetch(`/api/patient-portal/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Annuleren mislukt');
      } else {
        fetchAppointments();
      }
    } catch {
      alert('Er is iets misgegaan');
    } finally {
      setCancelling(null);
    }
  };

  const AppointmentCard = ({ appt, showCancel }: { appt: any; showCancel?: boolean }) => (
    <div className="patient-glass-card rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-lg font-semibold text-white/90 capitalize">
              {formatDate(appt.startTime)}
            </span>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[appt.status] || 'bg-white/10 text-white/50'}`}>
              {statusLabels[appt.status] || appt.status}
            </span>
          </div>
          <p className="text-base text-teal-300 font-medium">
            {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/8">
              <span className="text-sm text-white/60">
                {typeLabels[appt.appointmentType] || appt.appointmentType}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/8">
              <span className="text-sm text-white/60">
                {appt.practitioner?.firstName} {appt.practitioner?.lastName}
              </span>
            </div>
            {appt.room && (
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/8">
                <span className="text-sm text-white/60">Kamer {appt.room}</span>
              </div>
            )}
          </div>
          {appt.notes && (
            <p className="text-sm text-white/40 mt-2">{appt.notes}</p>
          )}
        </div>

        {showCancel && appt.status !== 'CANCELLED' && (
          <button
            onClick={() => handleCancel(appt.id)}
            disabled={cancelling === appt.id}
            className="px-5 py-3 rounded-2xl border border-red-500/20 text-red-300 text-sm font-medium hover:bg-red-500/10 transition-all disabled:opacity-50 shrink-0"
          >
            {cancelling === appt.id ? 'Bezig...' : 'Annuleren'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white/95 mb-2">Mijn Afspraken</h1>
        <p className="text-lg text-white/50">Bekijk uw aankomende en eerdere afspraken</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-white/40 py-8">
          <div className="w-5 h-5 border-2 border-white/20 border-t-teal-400 rounded-full animate-spin" />
          Afspraken laden...
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div>
            <h2 className="text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              Aankomende afspraken
            </h2>
            {data?.upcoming?.length > 0 ? (
              <div className="space-y-4">
                {data.upcoming.map((a: any) => (
                  <AppointmentCard key={a.id} appt={a} showCancel />
                ))}
              </div>
            ) : (
              <div className="patient-glass-card rounded-3xl p-8 text-center">
                <p className="text-base text-white/40">Geen aankomende afspraken</p>
              </div>
            )}
          </div>

          {/* Past */}
          <div>
            <h2 className="text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              Eerdere afspraken
            </h2>
            {data?.past?.length > 0 ? (
              <div className="space-y-4">
                {data.past.map((a: any) => (
                  <AppointmentCard key={a.id} appt={a} />
                ))}
              </div>
            ) : (
              <div className="patient-glass-card rounded-3xl p-8 text-center">
                <p className="text-base text-white/40">Geen eerdere afspraken gevonden</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
