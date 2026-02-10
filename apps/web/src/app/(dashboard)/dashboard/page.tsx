'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Euro, AlertCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  status: string;
  room?: string;
  notes?: string;
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  practitioner: { id: string; firstName: string; lastName: string };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle', TREATMENT: 'Behandeling', EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult', HYGIENE: 'Mondhygiëne',
};

const statusConfig: Record<string, { label: string; style: string }> = {
  SCHEDULED: { label: 'Gepland', style: 'bg-[var(--bg-card)] text-[var(--text-tertiary)] border-[var(--border-color)]' },
  CONFIRMED: { label: 'Bevestigd', style: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  CHECKED_IN: { label: 'Ingecheckt', style: 'bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent-medium)]' },
  IN_PROGRESS: { label: 'Bezig', style: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  COMPLETED: { label: 'Afgerond', style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  NO_SHOW: { label: 'Niet verschenen', style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  CANCELLED: { label: 'Geannuleerd', style: 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]' },
};

const avatarColors = [
  'from-pink-400 to-rose-500',
  'from-blue-400 to-cyan-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-indigo-400 to-blue-500',
  'from-red-400 to-pink-500',
  'from-cyan-400 to-blue-500',
];

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    Promise.all([
      authFetch(`/api/appointments?date=${today}`).then(r => r.ok ? r.json() : []),
      authFetch('/api/patients?limit=6&page=1').then(r => r.ok ? r.json() : { data: [], meta: { total: 0 } }),
    ]).then(([appts, patientsData]) => {
      setAppointments(appts);
      setPatients(patientsData.data || []);
      setTotalPatients(patientsData.meta?.total || 0);
    }).finally(() => setLoading(false));
  }, []);

  const completedToday = appointments.filter(a => a.status === 'COMPLETED').length;
  const remaining = appointments.filter(a => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)).length;
  const inProgress = appointments.find(a => a.status === 'IN_PROGRESS');

  const stats = [
    {
      title: 'Afspraken vandaag',
      value: String(appointments.length),
      icon: Calendar,
      description: `${remaining} nog te behandelen`,
      iconColor: 'text-[var(--accent)]',
      iconBg: 'bg-[var(--accent-light)]',
    },
    {
      title: 'Actieve patiënten',
      value: totalPatients.toLocaleString('nl-NL'),
      icon: Users,
      description: `${patients.length} recent toegevoegd`,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
    {
      title: 'Afgerond vandaag',
      value: String(completedToday),
      icon: Activity,
      description: `van ${appointments.length} afspraken`,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
    },
    {
      title: 'Bezettingsgraad',
      value: `${appointments.length > 0 ? Math.round((appointments.length / 16) * 100) : 0}%`,
      icon: TrendingUp,
      description: `${appointments.length} van 16 slots`,
      iconColor: 'text-[var(--accent)]',
      iconBg: 'bg-[var(--accent-light)]',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welkom terug, Faraz!</h2>
        <p className="text-[var(--text-tertiary)]">
          Hier is een overzicht van uw praktijk vandaag.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium">{stat.title}</p>
              <div className={`w-8 h-8 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Current treatment banner */}
      {inProgress && (
        <div className="glass-card rounded-2xl p-5 border border-cyan-500/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center animate-pulse">
              <Activity className="h-5 w-5 text-cyan-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-cyan-500">Nu in behandeling</p>
              <p className="text-[var(--text-primary)] font-medium">
                {inProgress.patient.firstName} {inProgress.patient.lastName}
                <span className="text-[var(--text-tertiary)] ml-2">— {typeLabels[inProgress.appointmentType]}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--text-tertiary)]">
                {new Date(inProgress.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {new Date(inProgress.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {inProgress.room && <p className="text-xs text-[var(--text-muted)]">{inProgress.room}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Today's agenda */}
        <div className="glass-card rounded-2xl p-5 col-span-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Agenda vandaag</h3>
            <Link href="/agenda" className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
              Bekijk alles →
            </Link>
          </div>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-tertiary)] text-sm">Geen afspraken vandaag</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 glass-light rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-mono text-[var(--text-tertiary)] w-12">
                      {new Date(a.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--text-primary)] text-sm">
                        {a.patient.firstName} {a.patient.lastName}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {typeLabels[a.appointmentType] || a.appointmentType}
                        {a.room && <span className="ml-2">· {a.room}</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-lg border ${statusConfig[a.status]?.style || ''}`}>
                    {statusConfig[a.status]?.label || a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent patients */}
        <div className="glass-card rounded-2xl p-5 col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Recente patiënten</h3>
            <Link href="/patients" className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
              Bekijk alles →
            </Link>
          </div>
          {patients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-tertiary)] text-sm">Geen patiënten</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient, idx) => {
                const initials = `${patient.firstName[0]}${patient.lastName[0]}`;
                const daysAgo = Math.floor((Date.now() - new Date(patient.createdAt).getTime()) / 86400000);
                const dateStr = daysAgo === 0 ? 'Vandaag' : daysAgo === 1 ? 'Gisteren' : `${daysAgo} dagen geleden`;
                return (
                  <Link key={patient.id} href={`/patients/${patient.id}`}>
                    <div className="flex items-center justify-between p-3 glass-light rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center`}>
                          <span className="text-xs font-bold text-white">{initials}</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm text-[var(--text-primary)]">{patient.firstName} {patient.lastName}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">{dateStr}</div>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{patient.patientNumber}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
