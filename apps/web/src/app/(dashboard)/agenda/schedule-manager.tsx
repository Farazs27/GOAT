'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Clock, Calendar, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface Schedule {
  id: string;
  practitionerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  practitioner: Practitioner;
}

interface ScheduleManagerProps {
  open: boolean;
  onClose: () => void;
}

const DAY_NAMES = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
const SLOT_DURATIONS = [15, 20, 30, 45, 60];

export function ScheduleManager({ open, onClose }: ScheduleManagerProps) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string>('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    startTime: '08:00',
    endTime: '17:00',
    slotDuration: 15,
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchPractitioners = useCallback(async () => {
    try {
      const res = await authFetch('/api/schedules?listPractitioners=true');
      if (res.ok) {
        const data = await res.json();
        setPractitioners(data);
        if (data.length > 0 && !selectedPractitionerId) {
          setSelectedPractitionerId(data[0].id);
        }
      }
    } catch { /* ignore */ }
  }, [selectedPractitionerId]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedPractitionerId) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/schedules?practitionerId=${selectedPractitionerId}&includeInactive=true`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [selectedPractitionerId]);

  useEffect(() => {
    if (open) fetchPractitioners();
  }, [open, fetchPractitioners]);

  useEffect(() => {
    if (open && selectedPractitionerId) fetchSchedules();
  }, [open, selectedPractitionerId, fetchSchedules]);

  const resetForm = () => {
    setFormData({ dayOfWeek: 0, startTime: '08:00', endTime: '17:00', slotDuration: 15 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await authFetch(`/api/schedules/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await authFetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, practitionerId: selectedPractitionerId }),
        });
      }
      resetForm();
      fetchSchedules();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDuration: schedule.slotDuration,
    });
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await authFetch(`/api/schedules/${id}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      fetchSchedules();
    } catch { /* ignore */ }
  };

  const handleToggleActive = async (schedule: Schedule) => {
    try {
      await authFetch(`/api/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      });
      fetchSchedules();
    } catch { /* ignore */ }
  };

  // Group schedules by day
  const schedulesByDay = schedules.reduce<Record<number, Schedule[]>>((acc, s) => {
    if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = [];
    acc[s.dayOfWeek].push(s);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-[#0f1117] border-l border-white/10 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f1117]/95 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-white">Roosters beheren</h2>
            <p className="text-xs text-white/40">Wekelijkse beschikbaarheid per behandelaar</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Practitioner selector */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Behandelaar</label>
            <select
              value={selectedPractitionerId}
              onChange={(e) => setSelectedPractitionerId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none"
            >
              {practitioners.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1a1b23]">
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Add button */}
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 rounded-xl text-sm text-blue-300 transition-colors w-full justify-center"
          >
            <Plus className="h-4 w-4" /> Nieuw rooster toevoegen
          </button>

          {/* Add/Edit form */}
          {showForm && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-white">
                {editingId ? 'Rooster bewerken' : 'Nieuw rooster'}
              </h3>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Dag</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                >
                  {DAY_NAMES.map((name, i) => (
                    <option key={i} value={i} className="bg-[#1a1b23]">{name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Begintijd</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Eindtijd</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Slotduur (minuten)</label>
                <select
                  value={formData.slotDuration}
                  onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                >
                  {SLOT_DURATIONS.map((d) => (
                    <option key={d} value={d} className="bg-[#1a1b23]">{d} min</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingId ? 'Opslaan' : 'Toevoegen'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}

          {/* Schedule list grouped by day */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-white/30" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Geen roosters voor deze behandelaar
            </div>
          ) : (
            <div className="space-y-3">
              {DAY_NAMES.map((dayName, dayIndex) => {
                const daySchedules = schedulesByDay[dayIndex];
                if (!daySchedules || daySchedules.length === 0) return null;
                return (
                  <div key={dayIndex}>
                    <h4 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-1.5">{dayName}</h4>
                    <div className="space-y-1.5">
                      {daySchedules.map((s) => (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between bg-white/5 border rounded-lg px-3 py-2.5 transition-colors ${
                            s.isActive ? 'border-white/10' : 'border-white/5 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-3.5 w-3.5 text-white/30" />
                            <div>
                              <span className="text-sm text-white">
                                {s.startTime} - {s.endTime}
                              </span>
                              <span className="text-xs text-white/40 ml-2">{s.slotDuration} min slots</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Toggle active */}
                            <button
                              onClick={() => handleToggleActive(s)}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              title={s.isActive ? 'Deactiveren' : 'Activeren'}
                            >
                              {s.isActive ? (
                                <ToggleRight className="h-4 w-4 text-green-400" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-white/30" />
                              )}
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => handleEdit(s)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                              title="Bewerken"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {/* Delete */}
                            {deleteConfirmId === s.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30"
                                >
                                  Ja
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-white/5 text-white/40 rounded text-xs hover:bg-white/10"
                                >
                                  Nee
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(s.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                                title="Verwijderen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
