'use client';

import { useEffect, useState } from 'react';


export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', phone: '', addressStreet: '', addressCity: '', addressPostal: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('patient_token');
    fetch(`/api/patient-portal/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({
          email: data.email || '',
          phone: data.phone || '',
          addressStreet: data.addressStreet || '',
          addressCity: data.addressCity || '',
          addressPostal: data.addressPostal || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const token = localStorage.getItem('patient_token');
    try {
      const res = await fetch(`/api/patient-portal/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile({ ...profile, ...updated });
        setEditing(false);
        setMessage('Gegevens succesvol bijgewerkt');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const err = await res.json();
        setMessage(err.message || 'Opslaan mislukt');
      }
    } catch {
      setMessage('Er is iets misgegaan');
    } finally {
      setSaving(false);
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/40 sm:w-48 mb-1 sm:mb-0">{label}</span>
      <span className="text-base text-white/80 font-medium">{value || '-'}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-white/40 py-16 justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-teal-400 rounded-full animate-spin" />
        Profiel laden...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white/95 mb-2">Mijn Gegevens</h1>
        <p className="text-lg text-white/50">Uw persoonlijke en medische informatie</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-base font-medium ${
          message.includes('succes')
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border border-red-500/20 text-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Personal info */}
      <div className="patient-glass-card rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white/90">Persoonlijke Gegevens</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-sm font-medium shadow-lg shadow-teal-500/20 transition-all"
            >
              Wijzigen
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 rounded-2xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5 transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-sm font-medium shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          )}
        </div>

        <div className="divide-y divide-white/5">
          <InfoRow label="Patientnummer" value={profile?.patientNumber} />
          <InfoRow label="Naam" value={`${profile?.firstName || ''} ${profile?.lastName || ''}`} />
          <InfoRow
            label="Geboortedatum"
            value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('nl-NL') : null}
          />
          <InfoRow label="Geslacht" value={profile?.gender === 'M' ? 'Man' : profile?.gender === 'F' ? 'Vrouw' : profile?.gender} />
          <InfoRow label="BSN" value={profile?.bsn} />

          {/* Editable fields */}
          {editing ? (
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm text-white/40 mb-2">E-mailadres</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-base outline-none focus:border-teal-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-white/40 mb-2">Telefoonnummer</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-base outline-none focus:border-teal-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-white/40 mb-2">Straat</label>
                <input
                  type="text"
                  value={form.addressStreet}
                  onChange={(e) => setForm({ ...form, addressStreet: e.target.value })}
                  className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-base outline-none focus:border-teal-400/50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/40 mb-2">Postcode</label>
                  <input
                    type="text"
                    value={form.addressPostal}
                    onChange={(e) => setForm({ ...form, addressPostal: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-base outline-none focus:border-teal-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/40 mb-2">Plaats</label>
                  <input
                    type="text"
                    value={form.addressCity}
                    onChange={(e) => setForm({ ...form, addressCity: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-base outline-none focus:border-teal-400/50 transition-all"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <InfoRow label="E-mailadres" value={profile?.email} />
              <InfoRow label="Telefoonnummer" value={profile?.phone} />
              <InfoRow
                label="Adres"
                value={
                  [profile?.addressStreet, profile?.addressPostal, profile?.addressCity]
                    .filter(Boolean)
                    .join(', ') || null
                }
              />
            </>
          )}
        </div>
      </div>

      {/* Insurance */}
      <div className="patient-glass-card rounded-3xl p-8">
        <h2 className="text-xl font-semibold text-white/90 mb-6">Verzekering</h2>
        <div className="divide-y divide-white/5">
          <InfoRow label="Verzekeraar" value={profile?.insuranceCompany} />
          <InfoRow label="Polisnummer" value={profile?.insuranceNumber} />
          <InfoRow label="Type" value={profile?.insuranceType} />
        </div>
      </div>

      {/* Medical info (read-only) */}
      <div className="patient-glass-card rounded-3xl p-8">
        <h2 className="text-xl font-semibold text-white/90 mb-6">Medische Informatie</h2>
        <div className="divide-y divide-white/5">
          <InfoRow label="Bloedgroep" value={profile?.bloodType} />
          <div className="py-4 border-b border-white/5">
            <span className="text-sm text-white/40 block mb-2">Medische waarschuwingen</span>
            {profile?.medicalAlerts?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.medicalAlerts.map((alert: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300"
                  >
                    {alert}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-base text-white/80 font-medium">Geen</span>
            )}
          </div>
          <div className="py-4">
            <span className="text-sm text-white/40 block mb-2">Medicatie</span>
            {profile?.medications?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.medications.map((med: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300"
                  >
                    {med}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-base text-white/80 font-medium">Geen</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
