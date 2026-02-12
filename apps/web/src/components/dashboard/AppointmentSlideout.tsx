'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, FileText, Stethoscope, Pill, ChevronLeft, ExternalLink } from 'lucide-react';
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

interface TreatmentPlan {
  id: string;
  title?: string;
  treatmentType?: string;
  status: string;
  description?: string;
}

interface ClinicalNote {
  id: string;
  content: string;
  noteText?: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle', TREATMENT: 'Behandeling', EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult', HYGIENE: 'Mondhygiëne',
};

const statusConfig: Record<string, { label: string; style: string }> = {
  SCHEDULED: { label: 'Gepland', style: 'bg-white/[0.03] text-[rgba(234,216,192,0.5)] border-white/[0.06]' },
  CONFIRMED: { label: 'Bevestigd', style: 'bg-[rgba(245,230,211,0.06)] text-[#EAD8C0] border-[rgba(245,230,211,0.12)]' },
  CHECKED_IN: { label: 'Ingecheckt', style: 'bg-[rgba(220,195,165,0.06)] text-[#DCC3A5] border-[rgba(220,195,165,0.15)]' },
  IN_PROGRESS: { label: 'Bezig', style: 'bg-[rgba(245,230,211,0.08)] text-[#F5E6D3] border-[rgba(245,230,211,0.15)]' },
  COMPLETED: { label: 'Afgerond', style: 'bg-[rgba(180,200,180,0.06)] text-[rgba(180,200,180,0.7)] border-[rgba(180,200,180,0.12)]' },
  NO_SHOW: { label: 'Niet verschenen', style: 'bg-[rgba(200,160,160,0.06)] text-[rgba(200,160,160,0.7)] border-[rgba(200,160,160,0.12)]' },
  CANCELLED: { label: 'Geannuleerd', style: 'bg-white/[0.02] text-[rgba(234,216,192,0.3)] border-white/[0.04]' },
};

type PanelTab = 'details' | 'behandelingen' | 'notities' | 'recepten';

interface Props {
  appointment: Appointment;
  onClose: () => void;
}

export function AppointmentSlideout({ appointment, onClose }: Props) {
  const [tab, setTab] = useState<PanelTab>('details');
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [prevAppointments, setPrevAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTab('details');
    Promise.all([
      authFetch(`/api/treatment-plans?patientId=${appointment.patient.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/clinical-notes?appointmentId=${appointment.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/prescriptions?patientId=${appointment.patient.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/appointments?patientId=${appointment.patient.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([plans, noteData, prescriptions, allAppts]) => {
      setTreatmentPlans(Array.isArray(plans) ? plans : plans?.data || []);
      setNotes(Array.isArray(noteData) ? noteData : noteData?.data || []);
      setPrescriptionCount(Array.isArray(prescriptions) ? prescriptions.length : prescriptions?.data?.length || 0);
      const prev = (Array.isArray(allAppts) ? allAppts : [])
        .filter((a: Appointment) => a.id !== appointment.id)
        .sort((a: Appointment, b: Appointment) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5);
      setPrevAppointments(prev);
    }).finally(() => setLoading(false));
  }, [appointment]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const tabs: { key: PanelTab; label: string; icon: React.ReactNode }[] = [
    { key: 'details', label: 'Details', icon: <Calendar className="h-4 w-4" /> },
    { key: 'behandelingen', label: 'Behandelingen', icon: <Stethoscope className="h-4 w-4" /> },
    { key: 'notities', label: 'Notities', icon: <FileText className="h-4 w-4" /> },
    { key: 'recepten', label: 'Recepten', icon: <Pill className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 backdrop-blur-sm" style={{ background: 'rgba(14, 12, 10, 0.5)' }} onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-1/2 lg:w-[45%] flex flex-col animate-in slide-in-from-right duration-300"
        style={{
          background: 'rgba(14, 12, 10, 0.85)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300" style={{ color: 'rgba(234,216,192,0.4)' }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'rgba(245,230,211,0.95)' }}>Afspraak details</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300" style={{ color: 'rgba(234,216,192,0.4)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Patient info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #DCC3A5, #C4A882)' }}>
              <span className="text-xs font-bold" style={{ color: '#2B2118' }}>
                {appointment.patient.firstName[0]}{appointment.patient.lastName[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: 'rgba(245,230,211,0.95)' }}>
                {appointment.patient.firstName} {appointment.patient.lastName}
              </p>
              <p className="text-xs" style={{ color: 'rgba(234,216,192,0.35)' }}>{appointment.patient.patientNumber}</p>
            </div>
            <Link href={`/patients/${appointment.patient.id}`}
              className="p-2 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300"
              style={{ color: 'rgba(234,216,192,0.4)' }}
              title="Patiënt openen">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Appointment info chips */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 glass-light rounded-2xl px-3 py-2">
              <Clock className="h-3.5 w-3.5" style={{ color: 'rgba(234,216,192,0.35)' }} />
              <span className="text-xs" style={{ color: 'rgba(245,230,211,0.8)' }}>
                {new Date(appointment.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {new Date(appointment.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <span className="px-3 py-1.5 rounded-2xl text-xs border bg-[rgba(245,230,211,0.06)] text-[#EAD8C0] border-[rgba(245,230,211,0.12)]">
              {typeLabels[appointment.appointmentType] || appointment.appointmentType}
            </span>
            <span className={`px-3 py-1.5 rounded-2xl text-xs border ${statusConfig[appointment.status]?.style || ''}`}>
              {statusConfig[appointment.status]?.label || appointment.status}
            </span>
            {appointment.room && (
              <span className="px-3 py-1.5 rounded-2xl text-xs glass-light border border-white/[0.06]" style={{ color: 'rgba(234,216,192,0.4)' }}>
                {appointment.room}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.04] flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                tab === t.key
                  ? 'border-b-2'
                  : 'hover:bg-white/[0.02]'
              }`}
              style={{
                color: tab === t.key ? '#EAD8C0' : 'rgba(234,216,192,0.35)',
                borderBottomColor: tab === t.key ? '#EAD8C0' : 'transparent',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: 'rgba(245,230,211,0.2)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <>
              {tab === 'details' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-light rounded-2xl p-4">
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Type</p>
                      <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.9)' }}>
                        {typeLabels[appointment.appointmentType] || appointment.appointmentType}
                      </p>
                    </div>
                    <div className="glass-light rounded-2xl p-4">
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Kamer</p>
                      <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.9)' }}>{appointment.room || '—'}</p>
                    </div>
                    <div className="glass-light rounded-2xl p-4">
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Behandelaar</p>
                      <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.9)' }}>
                        {appointment.practitioner.firstName} {appointment.practitioner.lastName}
                      </p>
                    </div>
                    <div className="glass-light rounded-2xl p-4">
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Status</p>
                      <span className={`text-xs px-2.5 py-1 rounded-xl border ${statusConfig[appointment.status]?.style || ''}`}>
                        {statusConfig[appointment.status]?.label || appointment.status}
                      </span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="glass-light rounded-2xl p-4">
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Notities</p>
                      <p className="text-sm" style={{ color: 'rgba(245,230,211,0.8)' }}>{appointment.notes}</p>
                    </div>
                  )}

                  {prevAppointments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(234,216,192,0.4)' }}>
                        Eerdere afspraken
                      </p>
                      <div className="space-y-2">
                        {prevAppointments.map((pa) => (
                          <div key={pa.id} className="glass-light rounded-2xl p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono" style={{ color: 'rgba(234,216,192,0.35)' }}>
                                {new Date(pa.startTime).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              </span>
                              <span className="text-sm" style={{ color: 'rgba(245,230,211,0.8)' }}>
                                {typeLabels[pa.appointmentType] || pa.appointmentType}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-xl border ${statusConfig[pa.status]?.style || ''}`}>
                              {statusConfig[pa.status]?.label || pa.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-3">
                    <Link href="/agenda" onClick={onClose}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold btn-liquid-primary">
                      <Calendar className="h-4 w-4" />
                      Bekijk in agenda
                    </Link>
                    <Link href={`/patients/${appointment.patient.id}`} onClick={onClose}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium btn-liquid-secondary">
                      <ExternalLink className="h-4 w-4" />
                      Patiënt bekijken
                    </Link>
                  </div>
                </div>
              )}

              {tab === 'behandelingen' && (
                <div className="space-y-3">
                  {treatmentPlans.length === 0 ? (
                    <div className="text-center py-12">
                      <Stethoscope className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(234,216,192,0.15)' }} />
                      <p className="text-sm" style={{ color: 'rgba(234,216,192,0.35)' }}>Geen behandelplannen</p>
                    </div>
                  ) : (
                    treatmentPlans.map((tp) => (
                      <div key={tp.id} className="glass-light rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.9)' }}>
                            {tp.title || tp.treatmentType || tp.description || 'Behandeling'}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(234,216,192,0.35)' }}>{tp.status}</span>
                        </div>
                        {tp.description && (
                          <p className="text-xs" style={{ color: 'rgba(234,216,192,0.4)' }}>{tp.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'notities' && (
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(234,216,192,0.15)' }} />
                      <p className="text-sm" style={{ color: 'rgba(234,216,192,0.35)' }}>Geen notities</p>
                    </div>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="glass-light rounded-2xl p-4">
                        <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.3)' }}>
                          {new Date(n.createdAt).toLocaleDateString('nl-NL')}
                        </p>
                        <p className="text-sm" style={{ color: 'rgba(245,230,211,0.8)' }}>{n.content || n.noteText}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'recepten' && (
                <div className="text-center py-12">
                  <Pill className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(234,216,192,0.15)' }} />
                  <p className="text-sm" style={{ color: 'rgba(234,216,192,0.35)' }}>
                    {prescriptionCount > 0
                      ? `${prescriptionCount} recept${prescriptionCount !== 1 ? 'en' : ''} gevonden`
                      : 'Geen recepten'}
                  </p>
                  {prescriptionCount > 0 && (
                    <Link href={`/patients/${appointment.patient.id}`} onClick={onClose}
                      className="inline-flex items-center gap-1 mt-3 text-xs transition-colors" style={{ color: '#EAD8C0' }}>
                      Bekijk in patiëntdossier
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
