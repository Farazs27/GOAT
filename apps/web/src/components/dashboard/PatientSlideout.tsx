'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, User, Calendar, Stethoscope, FileText, ChevronLeft, ExternalLink, Phone, Mail, MapPin, Shield } from 'lucide-react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  createdAt: string;
}

interface PatientDetails {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostal?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
  medicalAlerts?: string;
  medications?: string;
  bsn?: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  status: string;
  room?: string;
  practitioner?: { firstName: string; lastName: string };
}

interface TreatmentPlan {
  id: string;
  title?: string;
  treatmentType?: string;
  status: string;
  description?: string;
  createdAt: string;
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

const genderLabels: Record<string, string> = {
  MALE: 'Man', FEMALE: 'Vrouw', OTHER: 'Anders',
};

type PanelTab = 'overzicht' | 'afspraken' | 'behandelingen' | 'notities';

interface Props {
  patient: Patient;
  onClose: () => void;
}

export function PatientSlideout({ patient, onClose }: Props) {
  const [tab, setTab] = useState<PanelTab>('overzicht');
  const [details, setDetails] = useState<PatientDetails | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTab('overzicht');
    Promise.all([
      authFetch(`/api/patients/${patient.id}`).then(r => r.ok ? r.json() : null).catch(() => null),
      authFetch(`/api/appointments?patientId=${patient.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/treatment-plans?patientId=${patient.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch(`/api/clinical-notes?patientId=${patient.id}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([patientData, appts, plans, noteData]) => {
      setDetails(patientData);
      const apptList = Array.isArray(appts) ? appts : [];
      setAppointments(apptList.sort((a: Appointment, b: Appointment) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      setTreatmentPlans(Array.isArray(plans) ? plans : plans?.data || []);
      setNotes(Array.isArray(noteData) ? noteData : noteData?.data || []);
    }).finally(() => setLoading(false));
  }, [patient]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const tabs: { key: PanelTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overzicht', label: 'Overzicht', icon: <User className="h-4 w-4" /> },
    { key: 'afspraken', label: 'Afspraken', icon: <Calendar className="h-4 w-4" /> },
    { key: 'behandelingen', label: 'Behandelingen', icon: <Stethoscope className="h-4 w-4" /> },
    { key: 'notities', label: 'Notities', icon: <FileText className="h-4 w-4" /> },
  ];

  const d = details;

  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm" style={{ background: 'rgba(14, 12, 10, 0.5)' }} onClick={onClose} />

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
              <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'rgba(245,230,211,0.95)' }}>Patiënt details</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300" style={{ color: 'rgba(234,216,192,0.4)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #DCC3A5, #C4A882)' }}>
              <span className="text-xs font-bold" style={{ color: '#2B2118' }}>
                {patient.firstName[0]}{patient.lastName[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: 'rgba(245,230,211,0.95)' }}>
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-xs" style={{ color: 'rgba(234,216,192,0.35)' }}>#{patient.patientNumber}</p>
            </div>
            <Link href={`/patients/${patient.id}`}
              className="p-2 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300"
              style={{ color: 'rgba(234,216,192,0.4)' }}
              title="Patiënt openen">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick info chips */}
          {d && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {d.phone && (
                <div className="flex items-center gap-1.5 glass-light rounded-2xl px-3 py-2">
                  <Phone className="h-3.5 w-3.5" style={{ color: 'rgba(234,216,192,0.35)' }} />
                  <span className="text-xs" style={{ color: 'rgba(245,230,211,0.8)' }}>{d.phone}</span>
                </div>
              )}
              {d.email && (
                <div className="flex items-center gap-1.5 glass-light rounded-2xl px-3 py-2">
                  <Mail className="h-3.5 w-3.5" style={{ color: 'rgba(234,216,192,0.35)' }} />
                  <span className="text-xs" style={{ color: 'rgba(245,230,211,0.8)' }}>{d.email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.04] flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                tab === t.key ? 'border-b-2' : 'hover:bg-white/[0.02]'
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
              {tab === 'overzicht' && d && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {d.dateOfBirth && (
                      <div className="glass-light rounded-2xl p-4">
                        <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Geboortedatum</p>
                        <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.9)' }}>
                          {new Date(d.dateOfBirth).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {d.gender && (
                      <div className="glass-light rounded-2xl p-4">
                        <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Geslacht</p>
                        <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.9)' }}>{genderLabels[d.gender] || d.gender}</p>
                      </div>
                    )}
                    {d.bsn && (
                      <div className="glass-light rounded-2xl p-4">
                        <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>BSN</p>
                        <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.9)' }}>{d.bsn}</p>
                      </div>
                    )}
                    <div className="glass-light rounded-2xl p-4">
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Patiënt sinds</p>
                      <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.9)' }}>
                        {new Date(d.createdAt).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {(d.addressStreet || d.addressCity) && (
                    <div className="glass-light rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPin className="h-3.5 w-3.5" style={{ color: 'rgba(234,216,192,0.35)' }} />
                        <p className="text-xs" style={{ color: 'rgba(234,216,192,0.35)' }}>Adres</p>
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(245,230,211,0.8)' }}>
                        {[d.addressStreet, d.addressPostal, d.addressCity].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}

                  {(d.insuranceCompany || d.insuranceNumber) && (
                    <div className="glass-light rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Shield className="h-3.5 w-3.5" style={{ color: 'rgba(234,216,192,0.35)' }} />
                        <p className="text-xs" style={{ color: 'rgba(234,216,192,0.35)' }}>Verzekering</p>
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(245,230,211,0.8)' }}>
                        {[d.insuranceCompany, d.insuranceNumber].filter(Boolean).join(' — ')}
                      </p>
                    </div>
                  )}

                  {d.medicalAlerts && (
                    <div className="glass-light rounded-2xl p-4 border border-[rgba(200,160,160,0.12)]">
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(200,160,160,0.7)' }}>Medische waarschuwingen</p>
                      <p className="text-sm" style={{ color: 'rgba(245,230,211,0.8)' }}>{d.medicalAlerts}</p>
                    </div>
                  )}

                  {d.medications && (
                    <div className="glass-light rounded-2xl p-4">
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(234,216,192,0.35)' }}>Medicatie</p>
                      <p className="text-sm" style={{ color: 'rgba(245,230,211,0.8)' }}>{d.medications}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-3">
                    <Link href={`/patients/${patient.id}`} onClick={onClose}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold btn-liquid-primary">
                      <ExternalLink className="h-4 w-4" />
                      Volledig dossier
                    </Link>
                  </div>
                </div>
              )}

              {tab === 'afspraken' && (
                <div className="space-y-3">
                  {appointments.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(234,216,192,0.15)' }} />
                      <p className="text-sm" style={{ color: 'rgba(234,216,192,0.35)' }}>Geen afspraken</p>
                    </div>
                  ) : (
                    appointments.map((appt) => (
                      <div key={appt.id} className="glass-light rounded-2xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-xs font-mono block" style={{ color: 'rgba(234,216,192,0.35)' }}>
                              {new Date(appt.startTime).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </span>
                            <span className="text-xs" style={{ color: 'rgba(234,216,192,0.25)' }}>
                              {new Date(appt.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-sm" style={{ color: 'rgba(245,230,211,0.8)' }}>
                            {typeLabels[appt.appointmentType] || appt.appointmentType}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-xl border ${statusConfig[appt.status]?.style || ''}`}>
                          {statusConfig[appt.status]?.label || appt.status}
                        </span>
                      </div>
                    ))
                  )}
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
