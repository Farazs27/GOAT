'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  X,
  Search,
  Eye,
  EyeOff,
  Loader2,
  Activity,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
}

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  appointmentType: string;
  status: string;
  room?: string;
  notes?: string;
  patient: Patient;
  practitioner: Practitioner;
}

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
  HYGIENE: 'Mondhygiëne',
};

const typeBadgeColors: Record<string, string> = {
  CHECKUP: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  TREATMENT: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
  EMERGENCY: 'bg-red-500/20 text-red-300 border-red-500/20',
  CONSULTATION: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  HYGIENE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
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

const hours = Array.from({ length: 12 }, (_, i) => i + 8);

export default function HygienistAgendaPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dentistAppointments, setDentistAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDentistSchedule, setShowDentistSchedule] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  // New appointment form state
  const [newPatientSearch, setNewPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newType, setNewType] = useState('HYGIENE');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newDuration, setNewDuration] = useState('30');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      let endDateStr = dateStr;
      if (viewMode === 'week') {
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + 6);
        endDateStr = end.toISOString().split('T')[0];
      }

      const res = await authFetch(
        `/api/appointments?startDate=${dateStr}&endDate=${endDateStr}&practitionerId=${currentUserId}`
      );
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : data.data || []);

      // Fetch practitioners for dentist toggle
      const practRes = await authFetch('/api/schedules?listPractitioners=true');
      const practData = await practRes.json();
      const allPractitioners = practData.practitioners || [];
      setPractitioners(allPractitioners);

      // Fetch dentist appointments if toggle is on
      if (showDentistSchedule) {
        const dentists = allPractitioners.filter(
          (p: any) => p.id !== currentUserId
        );
        const dentistPromises = dentists.map((d: any) =>
          authFetch(`/api/appointments?startDate=${dateStr}&endDate=${endDateStr}&practitionerId=${d.id}`)
            .then((r) => r.json())
            .then((data) => (Array.isArray(data) ? data : data.data || []))
        );
        const allDentist = (await Promise.all(dentistPromises)).flat();
        setDentistAppointments(allDentist);
      } else {
        setDentistAppointments([]);
      }
    } catch (e) {
      console.error('Failed to fetch appointments', e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, selectedDate, viewMode, showDentistSchedule]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const navigateDate = (dir: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (viewMode === 'week' ? 7 * dir : dir));
    setSelectedDate(d);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  const getTopOffset = (iso: string) => {
    const d = new Date(iso);
    const minutes = (d.getHours() - 8) * 60 + d.getMinutes();
    return (minutes / 60) * 80;
  };

  const getHeight = (mins: number) => (mins / 60) * 80;

  const searchPatients = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await authFetch(`/api/patients?search=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch { setSearchResults([]); }
  };

  const createAppointment = async () => {
    if (!selectedPatient || !newDate || !newTime) return;
    setCreating(true);
    try {
      const startTime = new Date(`${newDate}T${newTime}:00`);
      const endTime = new Date(startTime.getTime() + parseInt(newDuration) * 60000);
      await authFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient.id,
          practitionerId: currentUserId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes: parseInt(newDuration),
          appointmentType: newType,
          notes: newNotes || undefined,
        }),
      });
      setShowNewAppointment(false);
      setSelectedPatient(null);
      setNewPatientSearch('');
      setNewNotes('');
      fetchAppointments();
    } catch (e) {
      console.error('Failed to create appointment', e);
    } finally {
      setCreating(false);
    }
  };

  const weekDays = viewMode === 'week'
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + i);
        return d;
      })
    : [selectedDate];

  const getAppointmentsForDay = (date: Date, list: Appointment[]) => {
    const dateStr = date.toISOString().split('T')[0];
    return list.filter((a) => a.startTime.startsWith(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Agenda</h1>
          <p className="text-sm text-white/40 mt-1">Mijn afspraken en planning</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dentist schedule toggle */}
          <button
            onClick={() => setShowDentistSchedule(!showDentistSchedule)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
              showDentistSchedule
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-white/[0.06] text-white/50 border-white/[0.12] hover:bg-white/[0.09]'
            }`}
          >
            {showDentistSchedule ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Tandarts agenda
          </button>

          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/[0.12]">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2.5 text-sm font-medium transition-all ${
                viewMode === 'day' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-white/40 hover:text-white/60'
              }`}
            >
              Dag
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2.5 text-sm font-medium transition-all ${
                viewMode === 'week' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-white/40 hover:text-white/60'
              }`}
            >
              Week
            </button>
          </div>

          <button
            onClick={() => { setShowNewAppointment(true); setNewDate(selectedDate.toISOString().split('T')[0]); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nieuwe afspraak
          </button>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white/50 hover:text-white/80 hover:bg-white/[0.09] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-lg font-semibold text-white/80 capitalize">{formatDate(selectedDate)}</div>
        <button
          onClick={() => navigateDate(1)}
          className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white/50 hover:text-white/80 hover:bg-white/[0.09] transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => setSelectedDate(new Date(new Date().setHours(0, 0, 0, 0)))}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] text-white/40 hover:text-white/60 border border-white/[0.12] transition-all"
        >
          Vandaag
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      )}

      {/* Time grid */}
      {!loading && (
        <div className="bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-xl shadow-black/10 overflow-hidden">
          <div className={`grid ${viewMode === 'week' ? 'grid-cols-8' : 'grid-cols-1'}`}>
            {/* Week day headers */}
            {viewMode === 'week' && (
              <>
                <div className="p-3 border-b border-white/[0.08] bg-white/[0.03]" /> {/* time column header */}
                {weekDays.map((d, i) => (
                  <div key={i} className="p-3 border-b border-l border-white/[0.08] bg-white/[0.03] text-center">
                    <div className="text-xs text-white/40 uppercase">
                      {d.toLocaleDateString('nl-NL', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${
                      d.toDateString() === new Date().toDateString() ? 'text-emerald-400' : 'text-white/70'
                    }`}>
                      {d.getDate()}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className={`relative ${viewMode === 'week' ? 'grid grid-cols-8' : ''}`}>
            {/* Time labels */}
            <div className={viewMode === 'week' ? '' : 'absolute left-0 top-0 w-16 z-10'}>
              {hours.map((h) => (
                <div key={h} className="h-20 flex items-start px-2 pt-1">
                  <span className="text-xs text-white/30 font-medium">{`${h.toString().padStart(2, '0')}:00`}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIdx) => {
              const dayAppts = getAppointmentsForDay(day, appointments);
              const dentistAppts = showDentistSchedule ? getAppointmentsForDay(day, dentistAppointments) : [];
              return (
                <div
                  key={dayIdx}
                  className={`relative ${viewMode === 'day' ? 'ml-16' : 'border-l border-white/[0.08]'}`}
                  style={{ height: hours.length * 80 }}
                >
                  {/* Hour lines */}
                  {hours.map((h) => (
                    <div key={h} className="absolute w-full border-t border-white/[0.06]" style={{ top: (h - 8) * 80 }} />
                  ))}

                  {/* Dentist appointments (background overlay) */}
                  {dentistAppts.map((apt) => (
                    <div
                      key={`d-${apt.id}`}
                      className="absolute left-1 right-1 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1 overflow-hidden z-10"
                      style={{ top: getTopOffset(apt.startTime), height: Math.max(getHeight(apt.durationMinutes), 24) }}
                    >
                      <div className="text-[10px] text-blue-300/70 truncate">
                        {formatTime(apt.startTime)} - {apt.practitioner.firstName} {apt.practitioner.lastName}
                      </div>
                      <div className="text-[10px] text-blue-200/50 truncate">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </div>
                    </div>
                  ))}

                  {/* Own appointments */}
                  {dayAppts.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
                      className="absolute left-1 right-1 rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 cursor-pointer hover:bg-emerald-500/20 transition-all z-20 overflow-hidden"
                      style={{ top: getTopOffset(apt.startTime), height: expandedId === apt.id ? 'auto' : Math.max(getHeight(apt.durationMinutes), 32) }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-emerald-300">{formatTime(apt.startTime)}</span>
                        <span className="text-xs text-white/60">-</span>
                        <span className="text-xs text-white/40">{formatTime(apt.endTime)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeBadgeColors[apt.appointmentType] || 'bg-white/5 text-white/40 border-white/10'}`}>
                          {typeLabels[apt.appointmentType] || apt.appointmentType}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-white/80 mt-0.5 truncate">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </div>

                      {expandedId === apt.id && (
                        <div className="mt-2 pt-2 border-t border-emerald-500/20 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusColors[apt.status] || ''}`}>
                              {statusLabels[apt.status] || apt.status}
                            </span>
                            {apt.room && <span className="text-[10px] text-white/30">Kamer {apt.room}</span>}
                          </div>
                          {apt.notes && <p className="text-xs text-white/40">{apt.notes}</p>}
                          <div className="flex gap-2 pt-1">
                            <Link
                              href={`/hygienist/patients/${apt.patient.id}`}
                              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              Patient bekijken
                            </Link>
                            {apt.appointmentType === 'HYGIENE' && (
                              <Link
                                href={`/hygienist/patients/${apt.patient.id}/perio`}
                                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                              >
                                <Activity className="w-3 h-3" />
                                Periodontogram
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No appointments */}
      {!loading && appointments.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Geen afspraken op deze dag</p>
        </div>
      )}

      {/* New appointment modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white/90">Nieuwe afspraak</h2>
              <button onClick={() => setShowNewAppointment(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Patient search */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Patiënt</label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between bg-white/[0.06] rounded-xl px-3 py-2.5 border border-white/[0.12]">
                    <span className="text-sm text-white/80">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                    <button onClick={() => { setSelectedPatient(null); setNewPatientSearch(''); }} className="text-white/30 hover:text-white/50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={newPatientSearch}
                      onChange={(e) => { setNewPatientSearch(e.target.value); searchPatients(e.target.value); }}
                      placeholder="Zoek patiënt..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/[0.12] rounded-xl overflow-hidden z-10 shadow-xl">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPatient(p); setSearchResults([]); }}
                            className="w-full px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/[0.06] transition-colors"
                          >
                            {p.firstName} {p.lastName} <span className="text-white/30">#{p.patientNumber}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 outline-none focus:border-emerald-500/50 transition-all"
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k} className="bg-[#1a1a2e]">{v}</option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Datum</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Tijd</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Duur (minuten)</label>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 outline-none focus:border-emerald-500/50 transition-all"
                >
                  <option value="15" className="bg-[#1a1a2e]">15 min</option>
                  <option value="30" className="bg-[#1a1a2e]">30 min</option>
                  <option value="45" className="bg-[#1a1a2e]">45 min</option>
                  <option value="60" className="bg-[#1a1a2e]">60 min</option>
                  <option value="90" className="bg-[#1a1a2e]">90 min</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Notities</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/50 transition-all resize-none"
                  placeholder="Optioneel..."
                />
              </div>

              <button
                onClick={createAppointment}
                disabled={!selectedPatient || !newDate || creating}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Afspraak aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
