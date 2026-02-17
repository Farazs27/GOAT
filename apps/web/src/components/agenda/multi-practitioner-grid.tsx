'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { AppointmentBlock, type AppointmentBlockData } from './appointment-block';
import { TimeGrid } from './time-grid';

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
}

const roleLabels: Record<string, string> = {
  DENTIST: 'Tandarts',
  HYGIENIST: 'Mondhygienist',
  ASSISTANT: 'Assistent',
  PRACTICE_ADMIN: 'Admin',
  ORTHODONTIST: 'Orthodontist',
};

interface MultiPractitionerGridProps {
  date: Date;
  onAppointmentClick: (appointment: AppointmentBlockData) => void;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function MultiPractitionerGrid({ date, onAppointmentClick }: MultiPractitionerGridProps) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [allAppointments, setAllAppointments] = useState<AppointmentBlockData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [practRes, apptRes] = await Promise.all([
        authFetch('/api/schedules?listPractitioners=true'),
        authFetch(`/api/appointments?date=${formatDate(date)}`),
      ]);
      if (practRes.ok) setPractitioners(await practRes.json());
      if (apptRes.ok) setAllAppointments(await apptRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group appointments by practitioner
  const appointmentsByPractitioner = useMemo(() => {
    const map: Record<string, AppointmentBlockData[]> = {};
    for (const p of practitioners) {
      map[p.id] = [];
    }
    for (const a of allAppointments) {
      const pid = a.practitioner.id;
      if (!map[pid]) map[pid] = [];
      map[pid].push(a);
    }
    return map;
  }, [practitioners, allAppointments]);

  // Group appointments by practitioner and hour for TimeGrid
  const getTimeSlots = useCallback((practitionerId: string) => {
    const appts = appointmentsByPractitioner[practitionerId] || [];
    const slots: Record<string, AppointmentBlockData[]> = {};
    appts.forEach(a => {
      const t = new Date(a.startTime);
      const key = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
      if (!slots[key]) slots[key] = [];
      slots[key].push(a);
    });
    return slots;
  }, [appointmentsByPractitioner]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
      </div>
    );
  }

  if (practitioners.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-white/20" />
        <p className="text-white/40">Geen behandelaars gevonden</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header row: time label spacer + practitioner headers */}
      <div className="flex border-b border-white/10 bg-white/[0.03]">
        <div className="w-16 flex-shrink-0 border-r border-white/5" />
        {practitioners.map((practitioner, idx) => {
          const apptCount = (appointmentsByPractitioner[practitioner.id] || []).length;
          return (
            <div
              key={practitioner.id}
              className={`flex-shrink-0 px-3 py-3 ${idx > 0 ? 'border-l border-white/10' : ''}`}
              style={{ minWidth: '200px', flex: '1 1 0%' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-white">
                    {practitioner.firstName[0]}{practitioner.lastName[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/90 truncate">
                    {practitioner.firstName} {practitioner.lastName}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {practitioner.role && (
                      <span className="text-[9px] text-white/40">
                        {roleLabels[practitioner.role] || practitioner.role}
                      </span>
                    )}
                    <span className="text-[9px] text-white/30">{apptCount} afspr.</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid rows: time label + practitioner columns */}
      <div className="overflow-x-auto">
        {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => {
          const hourStr = String(hour).padStart(2, '0');
          return (
            <div key={hour} className="flex border-b border-white/5 last:border-b-0">
              {/* Time label */}
              <div className="w-16 flex-shrink-0 p-2 text-right border-r border-white/5">
                <span className="text-xs font-mono text-white/30">{hourStr}:00</span>
              </div>
              {/* Practitioner columns */}
              {practitioners.map((practitioner, idx) => {
                const timeSlots = getTimeSlots(practitioner.id);
                const slotsThisHour = Object.entries(timeSlots).filter(([key]) => key.startsWith(hourStr));
                return (
                  <div
                    key={practitioner.id}
                    className={`flex-shrink-0 min-h-[60px] p-1.5 ${idx > 0 ? 'border-l border-white/10' : ''}`}
                    style={{ minWidth: '200px', flex: '1 1 0%' }}
                  >
                    {slotsThisHour.length > 0 ? (
                      <div className="space-y-1">
                        {slotsThisHour.flatMap(([, apps]) => apps).map(a => (
                          <AppointmentBlock
                            key={a.id}
                            appointment={a}
                            onClick={onAppointmentClick}
                            compact
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
