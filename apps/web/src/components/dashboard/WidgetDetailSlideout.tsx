'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, Calendar, Clock, ClipboardList, Activity, Stethoscope, ExternalLink, User, Plus, FileText, Receipt, Pill, Wrench, Tag, UserX, Mail, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';

type WidgetType = 'appointments-today' | 'nog-te-voltooien' | 'completed-today' | 'behandelplannen' | 'without-followup';

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

interface UnifiedTask {
  id: string;
  type: string;
  title: string;
  patientId: string | null;
  patientName: string | null;
  patientNumber: string | null;
  status: 'NOT_DONE' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  navigationPath: string | null;
  taskId: string | null;
  category: string;
  metadata?: Record<string, unknown>;
}

interface FollowupPatient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  firstVisitDate: string;
  firstVisitType: string;
  contactedAt?: string | null;
}

interface Props {
  type: WidgetType;
  appointments: Appointment[];
  followupPatients?: FollowupPatient[];
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

const widgetConfig: Record<WidgetType, { title: string; icon: React.ReactNode }> = {
  'appointments-today': { title: 'Afspraken vandaag', icon: <Calendar className="h-5 w-5" style={{ color: '#EAD8C0' }} /> },
  'nog-te-voltooien': { title: 'Nog te voltooien', icon: <ClipboardList className="h-5 w-5" style={{ color: '#DCC3A5' }} /> },
  'completed-today': { title: 'Afgerond vandaag', icon: <Activity className="h-5 w-5" style={{ color: '#EAD8C0' }} /> },
  'behandelplannen': { title: 'Behandelplannen', icon: <Stethoscope className="h-5 w-5" style={{ color: '#DCC3A5' }} /> },
  'without-followup': { title: 'Zonder vervolgafspraak', icon: <UserX className="h-5 w-5" style={{ color: '#EAD8C0' }} /> },
};

const TASK_STATUS_ACTIVE: Record<string, string> = {
  NOT_DONE: 'bg-red-500/20 text-red-300 border-red-500/30',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  DONE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const TASK_STATUS_INACTIVE = 'bg-white/5 text-white/30 border-white/10 hover:border-white/20';

const TASK_STATUS_LABELS: Record<string, string> = {
  NOT_DONE: 'Te doen',
  IN_PROGRESS: 'Bezig',
  DONE: 'Klaar',
};

const TASK_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  'clinical-note': { label: 'Notitie', icon: <FileText className="h-3 w-3" /> },
  'invoice': { label: 'Factuur', icon: <Receipt className="h-3 w-3" /> },
  'prescription': { label: 'Recept', icon: <Pill className="h-3 w-3" /> },
  'treatment-plan': { label: 'Behandelplan', icon: <Wrench className="h-3 w-3" /> },
  'treatment': { label: 'Behandeling', icon: <Wrench className="h-3 w-3" /> },
  'custom': { label: 'Eigen', icon: <Tag className="h-3 w-3" /> },
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  NORMAL: 'bg-transparent',
  LOW: 'bg-transparent',
};

export function WidgetDetailSlideout({ type, appointments, followupPatients = [], onClose }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<UnifiedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [contacted, setContacted] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of followupPatients) {
      if (p.contactedAt) map[p.id] = p.contactedAt;
    }
    return map;
  });

  const isTaskBased = type === 'nog-te-voltooien' || type === 'behandelplannen';
  const isFollowup = type === 'without-followup';

  useEffect(() => {
    if (!isTaskBased) return;
    setLoading(true);
    authFetch(`/api/dashboard/tasks?type=${type}`)
      .then(r => r.ok ? r.json() : { tasks: [] })
      .then(data => setTasks(data.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [type, isTaskBased]);

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

  const handleStatusChange = async (task: UnifiedTask, newStatus: 'NOT_DONE' | 'IN_PROGRESS' | 'DONE') => {
    const originalStatus = task.status;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const body: Record<string, string> = { status: newStatus };
      const taskId = task.taskId || task.id;

      // For auto-generated tasks, include target info
      if (!task.taskId) {
        body.targetType = task.type;
        body.targetId = task.id;
        body.title = task.title;
      }

      const res = await authFetch(`/api/dashboard/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      // If marked done, fade out after brief delay
      if (newStatus === 'DONE') {
        setTimeout(() => {
          setTasks(prev => prev.filter(t => t.id !== task.id));
        }, 600);
      }
    } catch {
      // Revert
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: originalStatus } : t));
    }
  };

  const handleNavigate = (task: UnifiedTask) => {
    if (task.navigationPath) {
      onClose();
      router.push(task.navigationPath);
    }
  };

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const category = type === 'behandelplannen' ? 'TREATMENT' : 'CUSTOM';
      const res = await authFetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category,
          dueDate: newDueDate || null,
          priority: newPriority,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks(prev => [{
          id: created.id,
          type: 'custom',
          title: created.title,
          patientId: created.patient?.id || null,
          patientName: created.patient ? `${created.patient.firstName} ${created.patient.lastName}` : null,
          patientNumber: created.patient?.patientNumber || null,
          status: 'NOT_DONE',
          priority: created.priority || 'NORMAL',
          dueDate: created.dueDate || null,
          navigationPath: null,
          taskId: created.id,
          category: created.category,
        }, ...prev]);
        setNewTitle('');
        setNewDueDate('');
        setNewPriority('NORMAL');
        setShowAddForm(false);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (patientId: string) => {
    setSendingId(patientId);
    try {
      const res = await authFetch(`/api/patients/${patientId}/followup-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setContacted(prev => ({ ...prev, [patientId]: data.emailedAt }));
      }
    } catch {
      // silently fail
    } finally {
      setSendingId(null);
    }
  };

  const visitTypeLabels: Record<string, string> = {
    CHECKUP: 'Controle', TREATMENT: 'Behandeling', EMERGENCY: 'Spoed',
    CONSULTATION: 'Consult', HYGIENE: 'Mondhygiëne',
  };

  const renderFollowupRow = (patient: FollowupPatient) => {
    const visitDate = new Date(patient.firstVisitDate);
    const formattedDate = visitDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });
    const isContacted = !!contacted[patient.id];
    const isSending = sendingId === patient.id;

    return (
      <div
        key={patient.id}
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
                {patient.firstName[0]}{patient.lastName[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgba(245,230,211,0.95)' }}>
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(234,216,192,0.35)' }}>
                Eerste bezoek: {formattedDate} • {visitTypeLabels[patient.firstVisitType] || patient.firstVisitType}
              </p>
            </div>
          </div>
          <Link
            href={`/patients/${patient.id}`}
            className="p-2 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
            style={{ color: 'rgba(234,216,192,0.4)' }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex items-center justify-end">
          {isContacted ? (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Check className="h-3 w-3" />
              Uitgenodigd
            </span>
          ) : (
            <button
              onClick={() => handleInvite(patient.id)}
              disabled={isSending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all duration-200 hover:bg-white/[0.04] disabled:opacity-50"
              style={{ color: '#DCC3A5', borderColor: 'rgba(220,195,165,0.2)', background: 'rgba(220,195,165,0.06)' }}
            >
              {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
              {isSending ? 'Verzenden...' : 'Uitnodigen'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const config = widgetConfig[type];

  // Appointment-based widgets
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

  const renderTaskRow = (task: UnifiedTask) => {
    const typeConfig = TASK_TYPE_CONFIG[task.type] || TASK_TYPE_CONFIG['custom'];
    const priorityDot = PRIORITY_COLORS[task.priority];
    const isDone = task.status === 'DONE';

    return (
      <div
        key={task.id}
        className={`p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.02] transition-all duration-300 ${isDone ? 'opacity-40' : ''}`}
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        {/* Top row: patient + navigate */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {task.patientName ? (
              <>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #DCC3A5, #C4A882)' }}
                >
                  <span className="text-[9px] font-bold" style={{ color: '#2B2118' }}>
                    {task.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium truncate" style={{ color: 'rgba(245,230,211,0.8)' }}>
                    {task.patientName}
                  </p>
                  {task.patientNumber && (
                    <p className="text-[10px]" style={{ color: 'rgba(234,216,192,0.3)' }}>
                      {task.patientNumber}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <User className="h-3.5 w-3.5" style={{ color: 'rgba(234,216,192,0.3)' }} />
                </div>
                <span className="text-[11px]" style={{ color: 'rgba(234,216,192,0.35)' }}>Geen patiënt</span>
              </div>
            )}
            {task.navigationPath && (
              <button
                onClick={() => handleNavigate(task)}
                className="p-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all ml-auto flex-shrink-0"
                style={{ color: 'rgba(234,216,192,0.4)' }}
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Task title */}
        <p className={`text-sm mb-2.5 ${isDone ? 'line-through' : ''}`} style={{ color: 'rgba(245,230,211,0.9)' }}>
          {task.title}
        </p>

        {/* Bottom row: type badge + priority + status toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority dot */}
          {(task.priority === 'URGENT' || task.priority === 'HIGH') && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot}`} />
          )}

          {/* Type badge */}
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(234,216,192,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            {typeConfig.icon}
            {typeConfig.label}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(234,216,192,0.4)' }}>
              {new Date(task.dueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
            </span>
          )}

          {/* Status toggles */}
          <div className="flex gap-1 ml-auto">
            {(['NOT_DONE', 'IN_PROGRESS', 'DONE'] as const).map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(task, s)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all duration-200 ${task.status === s ? TASK_STATUS_ACTIVE[s] : TASK_STATUS_INACTIVE}`}
              >
                {TASK_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const isAppointmentBased = type === 'appointments-today' || type === 'completed-today';
  const itemCount = isFollowup ? followupPatients.length : isAppointmentBased ? filteredAppointments.length : tasks.length;
  const countLabel = isFollowup ? 'patiënten' : isAppointmentBased ? 'afspraken' : 'taken';

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
              {loading ? '...' : itemCount} {countLabel}
            </span>

            {/* Add task button for task-based widgets */}
            {isTaskBased && (
              <button
                onClick={() => setShowAddForm(f => !f)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all duration-200 hover:bg-white/[0.04]"
                style={{ color: '#DCC3A5', borderColor: 'rgba(220,195,165,0.2)', background: 'rgba(220,195,165,0.06)' }}
              >
                <Plus className="h-3 w-3" />
                Taak toevoegen
              </button>
            )}
          </div>

          {/* Add task form */}
          {showAddForm && (
            <div className="mt-4 p-4 rounded-2xl border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <input
                type="text"
                placeholder="Taakomschrijving..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                className="w-full px-3 py-2 rounded-xl text-sm border border-white/[0.08] bg-white/[0.04] placeholder-white/20 focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 outline-none transition-all"
                style={{ color: 'rgba(245,230,211,0.9)' }}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl text-[11px] border border-white/[0.08] bg-white/[0.04] outline-none focus:border-[#DCC3A5]/40 transition-all"
                  style={{ color: 'rgba(245,230,211,0.7)', colorScheme: 'dark' }}
                />
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-[11px] border border-white/[0.08] bg-white/[0.04] outline-none focus:border-[#DCC3A5]/40 transition-all"
                  style={{ color: 'rgba(245,230,211,0.7)' }}
                >
                  <option value="LOW">Laag</option>
                  <option value="NORMAL">Normaal</option>
                  <option value="HIGH">Hoog</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <button
                  onClick={handleAddTask}
                  disabled={submitting || !newTitle.trim()}
                  className="px-4 py-1.5 rounded-xl text-[11px] font-medium transition-all disabled:opacity-30"
                  style={{ background: '#DCC3A5', color: '#1a1410' }}
                >
                  {submitting ? '...' : 'Toevoegen'}
                </button>
              </div>
            </div>
          )}
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
                {isTaskBased ? 'Geen openstaande taken' : 'Geen items gevonden'}
              </p>
            </div>
          ) : isFollowup ? (
            followupPatients.map(renderFollowupRow)
          ) : isAppointmentBased ? (
            filteredAppointments.map(renderAppointmentRow)
          ) : (
            tasks.map(renderTaskRow)
          )}
        </div>
      </div>
    </>
  );
}
