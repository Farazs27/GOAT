'use client';

import { Clock } from 'lucide-react';

const typeColors: Record<string, string> = {
  CHECKUP: 'from-blue-400 to-blue-600',
  TREATMENT: 'from-purple-400 to-purple-600',
  EMERGENCY: 'from-red-400 to-red-600',
  CONSULTATION: 'from-amber-400 to-amber-600',
  HYGIENE: 'from-emerald-400 to-emerald-600',
};

const typeBadgeColors: Record<string, string> = {
  CHECKUP: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  TREATMENT: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
  EMERGENCY: 'bg-red-500/20 text-red-300 border-red-500/20',
  CONSULTATION: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  HYGIENE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
};

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
  HYGIENE: 'Mondhygiene',
};

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'Wacht op goedkeuring',
  SCHEDULED: 'Gepland',
  CONFIRMED: 'Bevestigd',
  CHECKED_IN: 'Ingecheckt',
  IN_PROGRESS: 'Bezig',
  COMPLETED: 'Afgerond',
  NO_SHOW: 'Niet verschenen',
  CANCELLED: 'Geannuleerd',
};

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: 'bg-orange-500/20 text-orange-300 border-orange-500/20',
  SCHEDULED: 'bg-white/5 text-white/40 border-white/10',
  CONFIRMED: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  CHECKED_IN: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  NO_SHOW: 'bg-red-500/20 text-red-300 border-red-500/20',
  CANCELLED: 'bg-white/5 text-white/30 border-white/10',
};

export interface AppointmentBlockData {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  appointmentType: string;
  status: string;
  room?: string;
  notes?: string;
  patientNotes?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    patientNumber: string;
    medicalAlerts?: string[];
    medications?: string[];
  };
  practitioner: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface AppointmentBlockProps {
  appointment: AppointmentBlockData;
  onClick?: (appointment: AppointmentBlockData) => void;
  style?: React.CSSProperties;
  className?: string;
  compact?: boolean;
}

export function AppointmentBlock({ appointment, onClick, style, className, compact }: AppointmentBlockProps) {
  const a = appointment;

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(a)}
        className={`w-full text-left p-2 rounded-lg hover:bg-white/10 transition-all ${className || ''}`}
        style={{
          backgroundColor: `rgba(${a.appointmentType === 'EMERGENCY' ? '239,68,68' : a.appointmentType === 'TREATMENT' ? '168,85,247' : a.appointmentType === 'HYGIENE' ? '34,197,94' : a.appointmentType === 'CONSULTATION' ? '245,158,11' : '96,165,250'}, 0.15)`,
          ...style,
        }}
      >
        <p className="text-[10px] font-mono text-white/50">
          {new Date(a.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs font-medium text-white/80 truncate">
          {a.patient.firstName} {a.patient.lastName[0]}.
        </p>
        <p className="text-[9px] text-white/35 truncate">{typeLabels[a.appointmentType]}</p>
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(a)}
      className={`w-full text-left p-3 glass-light rounded-xl hover:bg-white/10 transition-all group ${className || ''}`}
      style={style}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[a.appointmentType] || 'from-gray-400 to-gray-600'} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <span className="text-[10px] font-bold text-white">
            {a.patient.firstName[0]}{a.patient.lastName[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-white/90">
              {a.patient.firstName} {a.patient.lastName}
            </span>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${statusColors[a.status]}`}>
              {statusLabels[a.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(a.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {new Date(a.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${typeBadgeColors[a.appointmentType]}`}>
              {typeLabels[a.appointmentType]}
            </span>
            {a.room && <span>Kamer {a.room}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

export { typeColors, typeBadgeColors, typeLabels, statusLabels, statusColors };
