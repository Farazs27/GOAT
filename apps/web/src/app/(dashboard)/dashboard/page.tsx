'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { DashboardGrid, DEFAULT_LAYOUT } from '@/components/dashboard/DashboardGrid';
import type { DashboardLayout } from '@/components/dashboard/DashboardGrid';
import { WidgetAppointmentsToday } from '@/components/dashboard/WidgetAppointmentsToday';
import { WidgetNogTeVoltooien } from '@/components/dashboard/WidgetNogTeVoltooien';
import { WidgetCompletedToday } from '@/components/dashboard/WidgetCompletedToday';
import { WidgetBehandelplannen } from '@/components/dashboard/WidgetBehandelplannen';
import { WidgetInProgress } from '@/components/dashboard/WidgetInProgress';
import { WidgetAgendaToday } from '@/components/dashboard/WidgetAgendaToday';
import { WidgetRecentPatients } from '@/components/dashboard/WidgetRecentPatients';
import { WidgetWithoutFollowup } from '@/components/dashboard/WidgetWithoutFollowup';
import { AppointmentSlideout } from '@/components/dashboard/AppointmentSlideout';
import { PatientSlideout } from '@/components/dashboard/PatientSlideout';
import { WidgetDetailSlideout } from '@/components/dashboard/WidgetDetailSlideout';

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

interface FollowupPatient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  firstVisitDate: string;
  firstVisitType: string;
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [followupPatients, setFollowupPatients] = useState<FollowupPatient[]>([]);
  const [pendingPlansCount, setPendingPlansCount] = useState(0);
  const [activePlansCount, setActivePlansCount] = useState(0);
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeWidget, setActiveWidget] = useState<'appointments-today' | 'nog-te-voltooien' | 'completed-today' | 'behandelplannen' | 'without-followup' | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load all dashboard data
  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    Promise.all([
      authFetch(`/api/appointments?date=${today}`).then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch('/api/patients?limit=6&page=1').then(r => r.ok ? r.json() : { data: [], meta: { total: 0 } }).catch(() => ({ data: [], meta: { total: 0 } })),
      authFetch('/api/dashboard/tasks?type=nog-te-voltooien&countOnly=true').then(r => r.ok ? r.json() : { count: 0 }).catch(() => ({ count: 0 })),
      authFetch('/api/dashboard/tasks?type=behandelplannen&countOnly=true').then(r => r.ok ? r.json() : { count: 0 }).catch(() => ({ count: 0 })),
      authFetch('/api/patients/without-followup').then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch('/api/user/dashboard-layout').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([appts, patientsData, pendingPlans, activePlans, followups, savedLayout]) => {
      setAppointments(Array.isArray(appts) ? appts : []);
      setPatients(patientsData.data || []);
      setPendingPlansCount(pendingPlans?.count || 0);
      setActivePlansCount(activePlans?.count || 0);
      setFollowupPatients(Array.isArray(followups) ? followups : []);
      if (savedLayout?.widgets) {
        // Merge saved layout with defaults to handle new widgets
        const savedIds = new Set(savedLayout.widgets.map((w: { id: string }) => w.id));
        const missingWidgets = DEFAULT_LAYOUT.widgets.filter(w => !savedIds.has(w.id));
        setLayout({ widgets: [...savedLayout.widgets, ...missingWidgets] });
      }
    }).finally(() => setLoading(false));
  }, []);

  // Save layout with debounce
  const handleLayoutChange = useCallback((newLayout: DashboardLayout) => {
    setLayout(newLayout);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      authFetch('/api/user/dashboard-layout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLayout),
      }).catch(console.error);
    }, 1000);
  }, []);

  const completedToday = appointments.filter(a => a.status === 'COMPLETED').length;
  const remaining = appointments.filter(a => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)).length;
  const inProgress = appointments.find(a => a.status === 'IN_PROGRESS') || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  const widgetRenderers: Record<string, React.ReactNode> = {
    'appointments-today': (
      <WidgetAppointmentsToday total={appointments.length} remaining={remaining} onClick={() => setActiveWidget('appointments-today')} />
    ),
    'nog-te-voltooien': (
      <WidgetNogTeVoltooien count={pendingPlansCount} onClick={() => setActiveWidget('nog-te-voltooien')} />
    ),
    'completed-today': (
      <WidgetCompletedToday completed={completedToday} total={appointments.length} onClick={() => setActiveWidget('completed-today')} />
    ),
    'behandelplannen': (
      <WidgetBehandelplannen count={activePlansCount} onClick={() => setActiveWidget('behandelplannen')} />
    ),
    'in-progress-banner': (
      <WidgetInProgress appointment={inProgress} />
    ),
    'agenda-today': (
      <WidgetAgendaToday appointments={appointments} onAppointmentClick={setSelectedAppointment} />
    ),
    'recent-patients': (
      <WidgetRecentPatients patients={patients} onPatientClick={setSelectedPatient} />
    ),
    'without-followup': (
      <WidgetWithoutFollowup patients={followupPatients} onClick={() => setActiveWidget('without-followup')} />
    ),
  };

  return (
    <div className="space-y-6">
      <DashboardGrid
        layout={layout}
        onLayoutChange={handleLayoutChange}
        widgetRenderers={widgetRenderers}
      />

      {selectedAppointment && (
        <AppointmentSlideout
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {selectedPatient && (
        <PatientSlideout
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {activeWidget && (
        <WidgetDetailSlideout
          type={activeWidget}
          appointments={appointments}
          followupPatients={followupPatients}
          onClose={() => setActiveWidget(null)}
        />
      )}
    </div>
  );
}
