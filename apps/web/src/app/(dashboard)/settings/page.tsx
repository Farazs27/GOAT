'use client';

import { useState, useEffect } from 'react';

type Tab = 'profile' | 'practice' | 'schedule';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  bigNumber: string;
  agbCode: string;
  specialization: string;
  role: string;
  practice: {
    id: string;
    name: string;
    phone: string;
    email: string;
    addressStreet: string;
    addressCity: string;
    addressPostal: string;
    kvkNumber: string;
    agbCode: string;
  };
}

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  practitionerId: string;
  practitioner?: {
    firstName: string;
    lastName: string;
  };
}

interface ScheduleException {
  id: string;
  date: string;
  reason: string;
  practitionerId: string;
  practitioner?: {
    firstName: string;
    lastName: string;
  };
}

const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bigNumber: '',
    agbCode: '',
  });

  // Schedule state
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/me', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setProfileForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          bigNumber: data.bigNumber || '',
          agbCode: data.agbCode || '',
        });
      } else {
        showToast('Fout bij laden van profiel', 'error');
      }
    } catch {
      showToast('Fout bij laden van profiel', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => (prev ? { ...prev, ...data } : prev));
        showToast('Profiel succesvol opgeslagen', 'success');
      } else {
        showToast('Fout bij opslaan van profiel', 'error');
      }
    } catch {
      showToast('Fout bij opslaan van profiel', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedules', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        showToast('Fout bij laden van schema', 'error');
      }
    } catch {
      showToast('Fout bij laden van schema', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schedule exceptions
  const fetchExceptions = async () => {
    try {
      const response = await fetch('/api/schedules/exceptions', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setExceptions(data);
      } else {
        showToast('Fout bij laden van uitzonderingen', 'error');
      }
    } catch {
      showToast('Fout bij laden van uitzonderingen', 'error');
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'profile' || activeTab === 'practice') {
      if (!profile) fetchProfile();
    } else if (activeTab === 'schedule') {
      fetchSchedules();
      fetchExceptions();
    }
  }, [activeTab]);

  // Group schedules by day
  const schedulesByDay: { [key: number]: Schedule[] } = {};
  schedules.forEach((schedule) => {
    if (!schedulesByDay[schedule.dayOfWeek]) {
      schedulesByDay[schedule.dayOfWeek] = [];
    }
    schedulesByDay[schedule.dayOfWeek].push(schedule);
  });

  const inputClassName =
    'bg-white/5 rounded-xl px-4 py-3 text-white/90 outline-none border border-white/10 focus:border-blue-500/30 w-full transition-colors';
  const readOnlyInputClassName =
    'bg-white/5 rounded-xl px-4 py-3 text-white/50 outline-none border border-white/10 w-full cursor-not-allowed';

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white/90 mb-2">Instellingen</h1>
          <p className="text-white/50">Beheer uw profiel, praktijk en schema</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'profile' as Tab, label: 'Profiel' },
            { key: 'practice' as Tab, label: 'Praktijk' },
            { key: 'schedule' as Tab, label: 'Schema' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                  : 'glass text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="glass-light rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Persoonlijk profiel</h2>
            {loading ? (
              <p className="text-white/50">Laden...</p>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                      Voornaam
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, firstName: e.target.value })
                      }
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                      Achternaam
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, lastName: e.target.value })
                      }
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      readOnly
                      className={readOnlyInputClassName}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                      Telefoon
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                      BIG Nummer
                    </label>
                    <input
                      type="text"
                      value={profileForm.bigNumber}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bigNumber: e.target.value })
                      }
                      className={inputClassName}
                      placeholder="11-123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                      AGB Code
                    </label>
                    <input
                      type="text"
                      value={profileForm.agbCode}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, agbCode: e.target.value })
                      }
                      className={inputClassName}
                      placeholder="12-345678"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white px-6 py-3 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Practice Tab (read-only) */}
        {activeTab === 'practice' && (
          <div className="glass-light rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white/90">Praktijkgegevens</h2>
              <span className="text-xs text-white/40 uppercase tracking-wider px-3 py-1 rounded-lg border border-white/10">
                Alleen lezen
              </span>
            </div>
            {loading ? (
              <p className="text-white/50">Laden...</p>
            ) : profile?.practice ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    Praktijknaam
                  </label>
                  <input
                    type="text"
                    value={profile.practice.name || ''}
                    readOnly
                    className={readOnlyInputClassName}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    Telefoon
                  </label>
                  <input
                    type="text"
                    value={profile.practice.phone || ''}
                    readOnly
                    className={readOnlyInputClassName}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    E-mail
                  </label>
                  <input
                    type="text"
                    value={profile.practice.email || ''}
                    readOnly
                    className={readOnlyInputClassName}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    Adres
                  </label>
                  <input
                    type="text"
                    value={
                      [
                        profile.practice.addressStreet,
                        profile.practice.addressPostal,
                        profile.practice.addressCity,
                      ]
                        .filter(Boolean)
                        .join(', ') || ''
                    }
                    readOnly
                    className={readOnlyInputClassName}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    KvK Nummer
                  </label>
                  <input
                    type="text"
                    value={profile.practice.kvkNumber || ''}
                    readOnly
                    className={readOnlyInputClassName}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    AGB Code
                  </label>
                  <input
                    type="text"
                    value={profile.practice.agbCode || ''}
                    readOnly
                    className={readOnlyInputClassName}
                  />
                </div>
              </div>
            ) : (
              <p className="text-white/50">Geen praktijkgegevens beschikbaar</p>
            )}
          </div>
        )}

        {/* Schedule Tab (kept as-is) */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Weekly Schedule */}
            <div className="glass-light rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Weekschema</h2>
              {loading ? (
                <p className="text-white/50">Laden...</p>
              ) : (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <div key={day} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white/90 font-medium mb-2">{dayNames[day - 1]}</h3>
                          {schedulesByDay[day] && schedulesByDay[day].length > 0 ? (
                            <div className="space-y-2">
                              {schedulesByDay[day].map((schedule) => (
                                <div key={schedule.id} className="text-sm text-white/60">
                                  {schedule.startTime} - {schedule.endTime}
                                  {schedule.practitioner && (
                                    <span className="ml-2 text-white/40">
                                      ({schedule.practitioner.firstName}{' '}
                                      {schedule.practitioner.lastName})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-white/40">Geen schema</p>
                          )}
                        </div>
                        <button className="glass rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                          Bewerken
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exceptions */}
            <div className="glass-light rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white/90">Uitzonderingen</h2>
                <button className="bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white px-4 py-2 shadow-lg shadow-blue-500/20 transition-all">
                  Toevoegen
                </button>
              </div>
              {exceptions.length > 0 ? (
                <div className="space-y-3">
                  {exceptions.map((exception) => (
                    <div
                      key={exception.id}
                      className="glass rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white/90 font-medium">{exception.reason}</p>
                        <p className="text-sm text-white/50 mt-1">
                          {new Date(exception.date).toLocaleDateString('nl-NL')}
                          {exception.practitioner && (
                            <span className="ml-2">
                              - {exception.practitioner.firstName}{' '}
                              {exception.practitioner.lastName}
                            </span>
                          )}
                        </p>
                      </div>
                      <button className="glass rounded-xl px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        Verwijderen
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50">Geen uitzonderingen gevonden</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4">
          <div
            className={`glass-light rounded-xl px-6 py-4 shadow-xl ${
              toast.type === 'success'
                ? 'border-l-4 border-green-500'
                : 'border-l-4 border-red-500'
            }`}
          >
            <p className="text-white/90 font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
