'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Users, Euro, AlertCircle, Clock, TrendingUp, Activity, X, ExternalLink, FileText, Pill, ChevronDown, ChevronUp, Stethoscope, User } from 'lucide-react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';

interface TreatmentPlan {
  id: string;
  treatmentType: string;
  status: string;
  description?: string;
}

interface ClinicalNote {
  id: string;
  content: string;
  noteText?: string;
  createdAt: string;
}

interface AppointmentDetail {
  treatmentPlans: TreatmentPlan[];
  notes: ClinicalNote[];
  prescriptionCount: number;
  loading: boolean;
}

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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detail, setDetail] = useState<AppointmentDetail>({ treatmentPlans: [], notes: [], prescriptionCount: 0, loading: false });
  const [prevAppointments, setPrevAppointments] = useState<Appointment[]>([]);
  const [prevApptLoading, setPrevApptLoading] = useState(false);
  const [expandedPrevAppt, setExpandedPrevAppt] = useState<string | null>(null);
  const [prevApptDetailCache, setPrevApptDetailCache] = useState<Record<string, { notes: any[]; treatments: any[]; prescriptions: any[]; loading: boolean }>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  const openAppointmentDetail = useCallback((appt: Appointment) => {
    setSelectedAppointment(appt);
    setDetail({ treatmentPlans: [], notes: [], prescriptionCount: 0, loading: true });
    setPrevAppointments([]);
    setPrevApptLoading(true);
    setExpandedPrevAppt(null);
    setPrevApptDetailCache({});

    Promise.all([
      authFetch(`/api/treatment-plans?patientId=${appt.patient.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/clinical-notes?appointmentId=${appt.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/prescriptions?patientId=${appt.patient.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([plans, notes, prescriptions]) => {
      setDetail({
        treatmentPlans: Array.isArray(plans) ? plans : plans?.data || [],
        notes: Array.isArray(notes) ? notes : notes?.data || [],
        prescriptionCount: Array.isArray(prescriptions) ? prescriptions.length : prescriptions?.data?.length || 0,
        loading: false,
      });
    }).catch(() => {
      setDetail(prev => ({ ...prev, loading: false }));
    });

    // Fetch previous appointments for this patient
    authFetch(`/api/appointments?patientId=${appt.patient.id}`)
      .then(r => r.ok ? r.json() : [])
      .then((allAppts: Appointment[]) => {
        const prev = (Array.isArray(allAppts) ? allAppts : [])
          .filter((a: Appointment) => a.id !== appt.id)
          .sort((a: Appointment, b: Appointment) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          .slice(0, 5);
        setPrevAppointments(prev);
      })
      .catch(() => setPrevAppointments([]))
      .finally(() => setPrevApptLoading(false));
  }, []);

  const togglePrevApptExpand = useCallback((apptId: string, patientId: string) => {
    if (expandedPrevAppt === apptId) {
      setExpandedPrevAppt(null);
      return;
    }
    setExpandedPrevAppt(apptId);
    if (prevApptDetailCache[apptId]) return;
    setPrevApptDetailCache(prev => ({ ...prev, [apptId]: { notes: [], treatments: [], prescriptions: [], loading: true } }));
    Promise.all([
      authFetch(`/api/clinical-notes?appointmentId=${apptId}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/treatment-plans?patientId=${patientId}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/prescriptions?patientId=${patientId}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([notes, treatments, prescriptions]) => {
      setPrevApptDetailCache(prev => ({
        ...prev,
        [apptId]: {
          notes: Array.isArray(notes) ? notes : notes?.data || [],
          treatments: Array.isArray(treatments) ? treatments : treatments?.data || [],
          prescriptions: Array.isArray(prescriptions) ? prescriptions : prescriptions?.data || [],
          loading: false,
        },
      }));
    }).catch(() => {
      setPrevApptDetailCache(prev => ({ ...prev, [apptId]: { ...prev[apptId], loading: false } }));
    });
  }, [expandedPrevAppt, prevApptDetailCache]);

  const closeModal = useCallback(() => setSelectedAppointment(null), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (selectedAppointment) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedAppointment, closeModal]);

  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    Promise.all([
      authFetch(`/api/appointments?date=${today}`).then(r => r.ok ? r.json() : []),
      authFetch('/api/patients?limit=6&page=1').then(r => r.ok ? r.json() : { data: [], meta: { total: 0 } }),
    ]).then(([appts, patientsData]) => {
      setAppointments(Array.isArray(appts) ? appts : []);
      setPatients(patientsData.data || []);
      setTotalPatients(patientsData.meta?.total || 0);
    }).catch((err) => {
      console.error('Dashboard fetch error:', err);
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
                <div key={a.id} onClick={() => openAppointmentDetail(a)} className="flex items-center justify-between p-3 glass-light rounded-xl cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors">
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

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div ref={modalRef} className="glass-card rounded-2xl p-6 w-full max-w-lg relative z-10 max-h-[80vh] overflow-y-auto border border-[var(--border-color)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                </h3>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Patiëntnr: {selectedAppointment.patient.patientNumber}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--text-tertiary)]" />
              </button>
            </div>

            {/* Appointment Info */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="glass-light rounded-xl p-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Tijd</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {new Date(selectedAppointment.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(selectedAppointment.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="glass-light rounded-xl p-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Type</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {typeLabels[selectedAppointment.appointmentType] || selectedAppointment.appointmentType}
                </p>
              </div>
              <div className="glass-light rounded-xl p-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Status</p>
                <span className={`text-xs px-2.5 py-1 rounded-lg border ${statusConfig[selectedAppointment.status]?.style || ''}`}>
                  {statusConfig[selectedAppointment.status]?.label || selectedAppointment.status}
                </span>
              </div>
              <div className="glass-light rounded-xl p-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Kamer</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {selectedAppointment.room || '—'}
                </p>
              </div>
            </div>

            {/* Extra details */}
            {detail.loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--accent)] border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                {/* Treatment Plans */}
                {detail.treatmentPlans.length > 0 && (
                  <div className="glass-light rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Behandelplannen</p>
                    </div>
                    <div className="space-y-1.5">
                      {detail.treatmentPlans.slice(0, 3).map(tp => (
                        <div key={tp.id} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text-primary)]">{tp.treatmentType || tp.description || 'Behandeling'}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">{tp.status}</span>
                        </div>
                      ))}
                      {detail.treatmentPlans.length > 3 && (
                        <p className="text-xs text-[var(--text-muted)]">+{detail.treatmentPlans.length - 3} meer</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {detail.notes.length > 0 && (
                  <div className="glass-light rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3.5 w-3.5 text-violet-500" />
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Notities</p>
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)] line-clamp-3">
                      {detail.notes[0].content}
                    </p>
                    {detail.notes.length > 1 && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">+{detail.notes.length - 1} meer notities</p>
                    )}
                  </div>
                )}

                {/* Prescriptions count */}
                {detail.prescriptionCount > 0 && (
                  <div className="glass-light rounded-xl p-3 flex items-center gap-2">
                    <Pill className="h-3.5 w-3.5 text-emerald-500" />
                    <p className="text-sm text-[var(--text-primary)]">{detail.prescriptionCount} recept{detail.prescriptionCount !== 1 ? 'en' : ''}</p>
                  </div>
                )}

                {detail.treatmentPlans.length === 0 && detail.notes.length === 0 && detail.prescriptionCount === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-2">Geen aanvullende gegevens beschikbaar</p>
                )}
              </div>
            )}

            {/* Eerdere afspraken */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Eerdere afspraken</p>
              </div>
              {prevApptLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--accent)] border-t-transparent"></div>
                </div>
              ) : prevAppointments.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-2">Geen eerdere afspraken</p>
              ) : (
                <div className="space-y-1.5">
                  {prevAppointments.map(pa => {
                    const isExp = expandedPrevAppt === pa.id;
                    const cached = prevApptDetailCache[pa.id];
                    const paDate = new Date(pa.startTime);
                    return (
                      <div key={pa.id} className="glass-light rounded-xl overflow-hidden">
                        <div
                          className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors"
                          onClick={() => togglePrevApptExpand(pa.id, pa.patient.id)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-mono text-[var(--text-tertiary)] w-10 flex-shrink-0">
                              {paDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })}
                            </span>
                            <span className="text-xs text-[var(--text-primary)] truncate">
                              {typeLabels[pa.appointmentType] || pa.appointmentType}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg border flex-shrink-0 ${statusConfig[pa.status]?.style || ''}`}>
                              {statusConfig[pa.status]?.label || pa.status}
                            </span>
                          </div>
                          {isExp ? (
                            <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
                          )}
                        </div>
                        <div
                          className="overflow-hidden transition-all duration-300"
                          style={{ maxHeight: isExp ? '400px' : '0px', opacity: isExp ? 1 : 0 }}
                        >
                          <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-[var(--border-color)] pt-2">
                            {cached?.loading ? (
                              <div className="flex items-center justify-center py-3">
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[var(--accent)] border-t-transparent"></div>
                              </div>
                            ) : cached ? (
                              <>
                                {pa.practitioner && (
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3 w-3 text-[var(--accent)]" />
                                    <span className="text-[11px] text-[var(--text-tertiary)]">{pa.practitioner.firstName} {pa.practitioner.lastName}</span>
                                  </div>
                                )}
                                {pa.notes && (
                                  <p className="text-[11px] text-[var(--text-tertiary)]">{pa.notes}</p>
                                )}
                                {cached.notes.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <FileText className="h-3 w-3 text-violet-500" />
                                      <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase">Notities</span>
                                    </div>
                                    {cached.notes.slice(0, 2).map((n: any) => (
                                      <p key={n.id} className="text-[11px] text-[var(--text-tertiary)] line-clamp-2">{n.content || n.noteText || ''}</p>
                                    ))}
                                  </div>
                                )}
                                {cached.treatments.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <Stethoscope className="h-3 w-3 text-emerald-500" />
                                      <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase">Behandelingen</span>
                                    </div>
                                    {cached.treatments.slice(0, 2).map((t: any) => (
                                      <div key={t.id} className="flex justify-between">
                                        <span className="text-[11px] text-[var(--text-tertiary)]">{t.title || t.treatmentType || t.description || 'Behandeling'}</span>
                                        <span className="text-[10px] text-[var(--text-muted)]">{t.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {cached.prescriptions.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Pill className="h-3 w-3 text-emerald-500" />
                                    <span className="text-[11px] text-[var(--text-tertiary)]">{cached.prescriptions.length} recept{cached.prescriptions.length !== 1 ? 'en' : ''}</span>
                                  </div>
                                )}
                                {cached.notes.length === 0 && cached.treatments.length === 0 && cached.prescriptions.length === 0 && !pa.notes && (
                                  <p className="text-[11px] text-[var(--text-muted)] text-center">Geen details</p>
                                )}
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link
                href="/agenda"
                onClick={closeModal}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Bekijk in agenda
              </Link>
              <Link
                href={`/patients/${selectedAppointment.patient.id}`}
                onClick={closeModal}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Patiënt bekijken
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
