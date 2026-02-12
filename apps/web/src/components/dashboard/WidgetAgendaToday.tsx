'use client';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  status: string;
  room?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  practitioner: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const statusConfig: Record<string, { label: string; style: string }> = {
  SCHEDULED: { label: 'Gepland', style: 'bg-white/[0.03] text-[rgba(234,216,192,0.5)] border-white/[0.06]' },
  CONFIRMED: { label: 'Bevestigd', style: 'bg-[rgba(245,230,211,0.06)] text-[#EAD8C0] border-[rgba(245,230,211,0.12)]' },
  CHECKED_IN: { label: 'Ingecheckt', style: 'bg-[rgba(220,195,165,0.06)] text-[#DCC3A5] border-[rgba(220,195,165,0.15)]' },
  IN_PROGRESS: { label: 'Bezig', style: 'bg-[rgba(245,230,211,0.08)] text-[#F5E6D3] border-[rgba(245,230,211,0.15)]' },
  COMPLETED: { label: 'Afgerond', style: 'bg-[rgba(180,200,180,0.06)] text-[rgba(180,200,180,0.7)] border-[rgba(180,200,180,0.12)]' },
  NO_SHOW: { label: 'Niet verschenen', style: 'bg-[rgba(200,160,160,0.06)] text-[rgba(200,160,160,0.7)] border-[rgba(200,160,160,0.12)]' },
  CANCELLED: { label: 'Geannuleerd', style: 'bg-white/[0.02] text-[rgba(234,216,192,0.3)] border-white/[0.04]' },
};

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
  HYGIENE: 'Mondhygiëne',
};

interface Props {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

export function WidgetAgendaToday({ appointments, onAppointmentClick }: Props) {
  return (
    <div className="glass-card rounded-2xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[rgba(245,230,211,0.95)]">Agenda vandaag</h2>
        <Link
          href="/agenda"
          className="text-sm text-[#EAD8C0] hover:text-[#F5E6D3] transition-colors"
        >
          Bekijk alles →
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center mb-3">
            <Calendar className="h-6 w-6 text-[rgba(234,216,192,0.2)]" />
          </div>
          <p className="text-[rgba(234,216,192,0.4)] text-sm">Geen afspraken vandaag</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1 overflow-y-auto">
          {appointments.map((appointment) => {
            const status = statusConfig[appointment.status] || statusConfig.SCHEDULED;
            return (
              <button
                key={appointment.id}
                onClick={() => onAppointmentClick(appointment)}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-xs font-medium text-[rgba(245,230,211,0.95)] min-w-[42px]">
                    {new Date(appointment.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[rgba(245,230,211,0.95)] truncate">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                    <p className="text-xs text-[rgba(234,216,192,0.4)]">
                      {typeLabels[appointment.appointmentType] || appointment.appointmentType}
                      {appointment.room && ` • ${appointment.room}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg border ${status.style}`}>
                    {status.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
