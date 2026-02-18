'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { User, Settings, Save, Eye, EyeOff } from 'lucide-react';

const glassCard = {
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
};

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PerioPreferences {
  defaultChartView: 'buccal' | 'lingual';
  autoAdvanceSpeed: 'normal' | 'fast';
  defaultSessionType: 'FULL' | 'PARTIAL';
  emailOnNewMessage: boolean;
  emailOnRecallDue: boolean;
}

const PREFS_KEY = 'hygienist_perio_preferences';

function getDefaultPrefs(): PerioPreferences {
  return {
    defaultChartView: 'buccal',
    autoAdvanceSpeed: 'normal',
    defaultSessionType: 'FULL',
    emailOnNewMessage: true,
    emailOnRecallDue: true,
  };
}

function loadPrefs(): PerioPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...getDefaultPrefs(), ...JSON.parse(stored) };
  } catch {}
  return getDefaultPrefs();
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'profiel' | 'voorkeuren'>('profiel');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [prefs, setPrefs] = useState<PerioPreferences>(getDefaultPrefs());
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    loadProfile();
    setPrefs(loadPrefs());
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.id) {
          const res = await authFetch(`/api/users/${u.id}`);
          if (res.ok) {
            const data = await res.json();
            setProfile({
              id: data.id,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phone: data.phone || '',
            });
          }
        }
      }
    } catch {}
    setLoading(false);
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, string> = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      };
      if (passwords.newPw && passwords.newPw === passwords.confirm) {
        body.password = passwords.newPw;
        body.currentPassword = passwords.current;
      }
      const res = await authFetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setPasswords({ current: '', newPw: '', confirm: '' });
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  }

  function savePrefs() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 3000);
  }

  const tabs = [
    { id: 'profiel' as const, label: 'Profiel', icon: User },
    { id: 'voorkeuren' as const, label: 'Voorkeuren', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 md:pt-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white/90 tracking-tight">Instellingen</h1>
        <p className="text-white/40 mt-1 text-sm">Profiel en voorkeuren beheren</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === t.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profiel' && profile && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <h2 className="font-semibold text-white/90 mb-6">Profiel bewerken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Voornaam</label>
              <input
                value={profile.firstName}
                onChange={(e) => setProfile((p) => p ? { ...p, firstName: e.target.value } : p)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 focus:border-emerald-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Achternaam</label>
              <input
                value={profile.lastName}
                onChange={(e) => setProfile((p) => p ? { ...p, lastName: e.target.value } : p)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 focus:border-emerald-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">E-mail (niet bewerkbaar)</label>
              <input
                value={profile.email}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/40 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Telefoon</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile((p) => p ? { ...p, phone: e.target.value } : p)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 focus:border-emerald-500/50 outline-none"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-white/[0.08]">
              <h3 className="text-sm font-medium text-white/70 mb-3">Wachtwoord wijzigen</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    placeholder="Huidig wachtwoord"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.newPw}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
                  placeholder="Nieuw wachtwoord"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Bevestig wachtwoord"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none"
                />
              </div>
              {passwords.newPw && passwords.confirm && passwords.newPw !== passwords.confirm && (
                <p className="text-xs text-red-400 mt-2">Wachtwoorden komen niet overeen</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
            {saved && <span className="text-sm text-emerald-400">Opgeslagen!</span>}
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {tab === 'voorkeuren' && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <h2 className="font-semibold text-white/90 mb-6">Paro voorkeuren</h2>
          <div className="space-y-6 max-w-xl">
            {/* Default chart view */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Standaard chartweergave</label>
              <div className="flex gap-3">
                {(['buccal', 'lingual'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setPrefs((p) => ({ ...p, defaultChartView: v }))}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      prefs.defaultChartView === v
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {v === 'buccal' ? 'Buccaal eerst' : 'Linguaal eerst'}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-advance speed */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Auto-advance snelheid</label>
              <div className="flex gap-3">
                {(['normal', 'fast'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setPrefs((p) => ({ ...p, autoAdvanceSpeed: v }))}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      prefs.autoAdvanceSpeed === v
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {v === 'normal' ? 'Normaal' : 'Snel'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/30 mt-1.5">Snel: slaat BOP bevestiging over bij normale tanden</p>
            </div>

            {/* Default session type */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Standaard sessietype</label>
              <div className="flex gap-3">
                {(['FULL', 'PARTIAL'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setPrefs((p) => ({ ...p, defaultSessionType: v }))}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      prefs.defaultSessionType === v
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {v === 'FULL' ? 'Volledig' : 'Gedeeltelijk'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification toggles */}
            <div className="pt-4 border-t border-white/[0.08]">
              <h3 className="text-sm font-medium text-white/70 mb-3">Meldingen</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    E-mail bij nieuw patientbericht
                  </span>
                  <button
                    onClick={() => setPrefs((p) => ({ ...p, emailOnNewMessage: !p.emailOnNewMessage }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      prefs.emailOnNewMessage ? 'bg-emerald-500' : 'bg-white/[0.12]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        prefs.emailOnNewMessage ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    E-mail bij recall deadline
                  </span>
                  <button
                    onClick={() => setPrefs((p) => ({ ...p, emailOnRecallDue: !p.emailOnRecallDue }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      prefs.emailOnRecallDue ? 'bg-emerald-500' : 'bg-white/[0.12]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        prefs.emailOnRecallDue ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={savePrefs}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" /> Opslaan
              </button>
              {prefsSaved && <span className="text-sm text-emerald-400">Voorkeuren opgeslagen!</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
