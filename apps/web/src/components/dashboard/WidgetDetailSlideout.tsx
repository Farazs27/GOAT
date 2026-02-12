'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, Calendar, Clock, ClipboardList, Activity, Stethoscope, ExternalLink, User } from 'lucide-react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';

type WidgetType = 'appointments-today' | 'nog-te-voltooien' | 'completed-today' | 'behandelplannen';

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
  patientId: string;
  title?: string;
  description?: string;
  status: string;
  createdAt: string;
  patient?: { firstName: string; lastName: string };
  creator?: { firstName: string; lastName: string };
  treatments?: Array<{ id: string }>;
}

interface Props {
  type: WidgetType;
  appointments: Appointment[];
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle', TREATMENT: 'Behandeling', EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult', HYGIENE: 'Mondhygiëne',
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  SCHEDULED: { label: 'Gepland', bg: 'rgba(255,255,255,0.03)', text: 'rgba(234,216,192,0.5)' },
  CONFIRMED: { label: 'Bevestigd', bg: 'rgba(245,230,211,0.06)', text: '#EAD8C0' },
  CHECKED_IN: { label: 'Ingecheckt', bg: 'rgba(220,195,165,0.06)', text: '#DCC3A5' },
  IN_PROGRESS: { label: 'Bezig', bg: 'rgba(245,230,211,0.08)', text: '#F5E6D3' },
  COMPLETED: { label: 'Afgerond', bg: 'rgba(180,200,180,0.06)', text: 'rgba(180,200,180,0.7)' },
  NO_SHOW: { label: 'Niet verschenen', bg: 'rgba(200,160,160,0.06)', text: 'rgba(200,160,160,0.7)' },
  CANCELLED: { label: 'Geannuleerd', bg: 'rgba(255,255,255,0.02)', text: 'rgba(234,216,192,0.3)' },
};

const planStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Concept', bg: 'rgba(255,255,255,0.03)', text: 'rgba(234,216,192,0.5)' },
  PROPOSED: { label: 'Voorgesteld', bg: 'rgba(245,230,211,0.06)', text: '#EAD8C0' },
  ACCEPTED: { label: 'Geaccepteerd', bg: 'rgba(180,200,180,0.06)', text: 'rgba(180,200,180,0.7)' },
  IN_PROGRESS: { label: 'In behandeling', bg: 'rgba(245,230,211,0.08)', text: '#F5E6D3' },
  COMPLETED: { label: 'Afgerond', bg: 'rgba(180,200,180,0.08)', text: 'rgba(180,200,180,0.8)' },
  CANCELLED: { label: 'Geannuleerd', bg: 'rgba(255,255,255,0.02)', text: 'rgba(234,216,192,0.3)' },
};

const widgetConfig: Record<WidgetType, { title: string; icon: React.ReactNode }> = {
  'appointments-today': { title: 'Afspraken vandaag', icon: <Calendar className="h-5 w-5" style={{ color: '#EAD8C0' }} /> },
  'nog-te-voltooien': { title: 'Nog te voltooien', icon: <ClipboardList className="h-5 w-5" style={{ color: '#DCC3A5' }} /> },
  'completed-today': { title: 'Afgerond vandaag', icon: <Activity className="h-5 w-5" style={{ color: '#EAD8C0' }} /> },
  'behandelplannen': { title: 'Behandelplannen', icon: <Stethoscope className="h-5 w-5" style={{ color: '#DCC3A5' }} /> },
};

export function WidgetDetailSlideout({ type, appointments, onClose }: Props) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const needsPlans = type === 'nog-te-voltooien' || type === 'behandelplannen';

  useEffect(() => {
    if (!needsPlans) return;
    setLoading(true);
    const statuses = type === 'nog-te-voltooien'
      ? 'DRAFT,PROPOSED,ACCEPTED,IN_PROGRESS'
      : 'ACCEPTED,IN_PROGRESS';
    authFetch(`/api/treatment-plans?status=${statuses}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setPlans(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [type, needsPlans]);

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

  const config = widgetConfig[type];

  // Get filtered appointments for appointment-based widgets
  const filteredAppointments = type === 'completed-today'
    ? appointments.filter(a => a.status === 'COMPLETED')
    : type === 'appointments-today'
      ? appointments
      : [];

  const renderAppointmentRow = (appt: Appointment) => {
    const sc = statusConfig[appt.status] || statusConfig.SCHEDULED;
    return (
      <div
        key={appt.id}
        className="p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.02] transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #DCC3A5, #C4A882)' }}
            >
              <span className="text-[10px] font-bold" style={{ color: '#2B2118' }}>
                {appt.patient.firstName[0]}{appt.patient.lastName[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.95)' }}>
                {appt.patient.firstName} {appt.patient.lastName}
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(234,216,192,0.35)' }}>
                {appt.patient.patientNumber}
              </p>
            </div>
          </div>
          <Link
            href={`/patients/${appt.patient.id}`}
            className="p-2 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
            style={{ color: 'rgba(234,216,192,0.4)' }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Clock className="h-3 w-3" style={{ color: 'rgba(234,216,192,0.35)' }} />
            <span className="text-[11px]" style={{ color: 'rgba(245,230,211,0.7)' }}>
              {new Date(appt.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {new Date(appt.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-[11px] border" style={{ background: 'rgba(245,230,211,0.04)', color: '#EAD8C0', borderColor: 'rgba(245,230,211,0.08)' }}>
            {typeLabels[appt.appointmentType] || appt.appointmentType}
          </span>
          <span className="px-2.5 py-1 rounded-xl text-[11px] border" style={{ background: sc.bg, color: sc.text, borderColor: 'rgba(255,255,255,0.06)' }}>
            {sc.label}
          </span>
        </div>
      </div>
    );
  };

  const renderPlanRow = (plan: TreatmentPlan) => {
    const sc = planStatusConfig[plan.status] || planStatusConfig.DRAFT;
    return (
      <Link
        key={plan.id}
        href={`/patients/${plan.patientId}`}
        className="block p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200 group"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'rgba(245,230,211,0.95)' }}>
              {plan.title || 'Behandelplan'}
            </p>
            {plan.patient && (
              <div className="flex items-center gap-1.5 mt-1">
                <User className="h-3 w-3" style={{ color: 'rgba(234,216,192,0.3)' }} />
                <span className="text-[11px]" style={{ color: 'rgba(234,216,192,0.5)' }}>
                  {plan.patient.firstName} {plan.patient.lastName}
                </span>
              </div>
            )}
          </div>
          <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(234,216,192,0.4)' }} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-xl text-[11px] border" style={{ background: sc.bg, color: sc.text, borderColor: 'rgba(255,255,255,0.06)' }}>
            {sc.label}
          </span>
          {plan.treatments && plan.treatments.length > 0 && (
            <span className="px-2.5 py-1 rounded-xl text-[11px]" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(234,216,192,0.4)' }}>
              {plan.treatments.length} behandeling{plan.treatments.length !== 1 ? 'en' : ''}
            </span>
          )}
          {plan.creator && (
            <span className="px-2.5 py-1 rounded-xl text-[11px]" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(234,216,192,0.3)' }}>
              Dr. {plan.creator.lastName}
            </span>
          )}
          <span className="text-[10px] ml-auto" style={{ color: 'rgba(234,216,192,0.25)' }}>
            {new Date(plan.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </Link>
    );
  };

  const isAppointmentBased = type === 'appointments-today' || type === 'completed-today';
  const items = isAppointmentBased ? filteredAppointments : plans;
  const itemCount = items.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: 'rgba(14, 12, 10, 0.5)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[480px] lg:w-[520px] flex flex-col animate-in slide-in-from-right duration-300"
        style={{
          background: 'rgba(14, 12, 10, 0.85)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300"
                style={{ color: 'rgba(234,216,192,0.4)' }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2.5">
                {config.icon}
                <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'rgba(245,230,211,0.95)' }}>
                  {config.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300"
              style={{ color: 'rgba(234,216,192,0.4)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Count badge */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-2xl text-xs font-medium border"
              style={{ background: 'rgba(245,230,211,0.06)', color: '#EAD8C0', borderColor: 'rgba(245,230,211,0.12)' }}
            >
              {loading ? '...' : itemCount} {isAppointmentBased ? 'afspraken' : 'plannen'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#DCC3A5] border-t-transparent" />
            </div>
          ) : itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(245,230,211,0.04)' }}
              >
                {config.icon}
              </div>
              <p className="text-sm" style={{ color: 'rgba(234,216,192,0.4)' }}>
                Geen items gevonden
              </p>
            </div>
          ) : isAppointmentBased ? (
            filteredAppointments.map(renderAppointmentRow)
          ) : (
            plans.map(renderPlanRow)
          )}
        </div>
      </div>
    </>
  );
}
