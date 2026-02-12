'use client';
import { Activity } from 'lucide-react';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  room?: string;
  patient: { firstName: string; lastName: string };
}

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle', TREATMENT: 'Behandeling', EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult', HYGIENE: 'Mondhygiëne',
};

interface Props { appointment: Appointment | null; }

export function WidgetInProgress({ appointment }: Props) {
  if (!appointment) return null;
  return (
    <div className="glass-card rounded-2xl p-4 border border-[rgba(245,230,211,0.12)] h-full">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(245,230,211,0.08)] flex items-center justify-center animate-pulse">
          <Activity className="h-4 w-4 text-[#F5E6D3]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#F5E6D3]">Nu in behandeling</p>
          <p className="text-[rgba(245,230,211,0.95)] font-medium">
            {appointment.patient.firstName} {appointment.patient.lastName}
            <span className="text-[rgba(234,216,192,0.4)] ml-2">— {typeLabels[appointment.appointmentType] || appointment.appointmentType}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[rgba(234,216,192,0.4)]">
            {new Date(appointment.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(appointment.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {appointment.room && <p className="text-xs text-[rgba(234,216,192,0.2)]">{appointment.room}</p>}
        </div>
      </div>
    </div>
  );
}
