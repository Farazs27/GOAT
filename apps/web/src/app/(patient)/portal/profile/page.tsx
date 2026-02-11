'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Heart,
  Pencil,
  X,
  Save,
  Calendar,
  Hash,
  Droplets,
  AlertTriangle,
  Pill,
  CreditCard,
  FileText,
  BadgeCheck,
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: '',
    phone: '',
    addressStreet: '',
    addressCity: '',
    addressPostal: '',
  });
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

  const maskBsn = (bsn: string | null | undefined) => {
    if (!bsn) return '-';
    if (bsn.length <= 3) return bsn;
    return '***' + bsn.slice(-3);
  };

  const genderLabel = (g: string | null | undefined) => {
    if (g === 'M') return 'Man';
    if (g === 'F') return 'Vrouw';
    return g || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-white/40 py-16 justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-orange-400 rounded-full animate-spin" />
        Profiel laden...
      </div>
    );
  }

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || '-';
  const fullAddress = [profile?.addressStreet, profile?.addressPostal, profile?.addressCity]
    .filter(Boolean)
    .join(', ');

  const inputClasses =
    'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/90 text-sm outline-none focus:border-[#e8945a]/60 focus:shadow-[0_0_0_3px_rgba(232,148,90,0.1)] transition-all placeholder:text-white/20';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white/95 mb-1">Mijn Profiel</h1>
          <p className="text-base text-white/50">
            Uw persoonlijke en medische informatie
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e8945a]/10 border border-[#e8945a]/20 text-[#e8945a] text-sm font-medium hover:bg-[#e8945a]/20 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Wijzigen
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditing(false);
                setForm({
                  email: profile?.email || '',
                  phone: profile?.phone || '',
                  addressStreet: profile?.addressStreet || '',
                  addressCity: profile?.addressCity || '',
                  addressPostal: profile?.addressPostal || '',
                });
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/[0.1] text-white/50 text-sm font-medium hover:bg-white/[0.04] transition-all"
            >
              <X className="w-4 h-4" />
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4803f] text-white text-sm font-medium shadow-lg shadow-[#e8945a]/20 hover:shadow-[#e8945a]/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        )}
      </div>

      {/* Success / Error message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium ${
            message.includes('succes')
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/20 text-red-300'
          }`}
        >
          {message}
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Personal Info (spans 2 cols) ── */}
        <div className="md:col-span-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden">
          {/* Accent header bar */}
          <div className="h-1 bg-gradient-to-r from-[#e8945a] to-[#d4803f]" />
          <div className="p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#e8945a]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#e8945a]" />
              </div>
              <h2 className="text-lg font-semibold text-white/90">
                Persoonlijke Gegevens
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
              <InfoField
                icon={<Hash className="w-4 h-4" />}
                label="Patientnummer"
                value={profile?.patientNumber}
              />
              <InfoField
                icon={<User className="w-4 h-4" />}
                label="Volledige naam"
                value={fullName}
              />
              <InfoField
                icon={<Calendar className="w-4 h-4" />}
                label="Geboortedatum"
                value={
                  profile?.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString('nl-NL')
                    : null
                }
              />
              <InfoField
                icon={<BadgeCheck className="w-4 h-4" />}
                label="Geslacht"
                value={genderLabel(profile?.gender)}
              />
              <InfoField
                icon={<Shield className="w-4 h-4" />}
                label="BSN"
                value={maskBsn(profile?.bsn)}
              />
            </div>
          </div>
        </div>

        {/* ── Contact Info ── */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#e8945a]/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#e8945a]" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">
              Contactgegevens
            </h2>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClasses}
                  placeholder="uw@email.nl"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                  Telefoonnummer
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClasses}
                  placeholder="+31 6 12345678"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                  Straat
                </label>
                <input
                  type="text"
                  value={form.addressStreet}
                  onChange={(e) =>
                    setForm({ ...form, addressStreet: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={form.addressPostal}
                    onChange={(e) =>
                      setForm({ ...form, addressPostal: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                    Plaats
                  </label>
                  <input
                    type="text"
                    value={form.addressCity}
                    onChange={(e) =>
                      setForm({ ...form, addressCity: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <InfoField
                icon={<Mail className="w-4 h-4" />}
                label="E-mailadres"
                value={profile?.email}
              />
              <InfoField
                icon={<Phone className="w-4 h-4" />}
                label="Telefoonnummer"
                value={profile?.phone}
              />
              <InfoField
                icon={<MapPin className="w-4 h-4" />}
                label="Adres"
                value={fullAddress || null}
              />
            </div>
          )}
        </div>

        {/* ── Insurance ── */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#e8945a]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#e8945a]" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">Verzekering</h2>
          </div>

          <div className="space-y-4">
            <InfoField
              icon={<Shield className="w-4 h-4" />}
              label="Verzekeraar"
              value={profile?.insuranceCompany}
            />
            <InfoField
              icon={<FileText className="w-4 h-4" />}
              label="Polisnummer"
              value={profile?.insuranceNumber}
            />
            <InfoField
              icon={<BadgeCheck className="w-4 h-4" />}
              label="Type"
              value={profile?.insuranceType}
            />
          </div>
        </div>

        {/* ── Medical Info (spans 2 cols) ── */}
        <div className="md:col-span-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#e8945a]/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#e8945a]" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">
              Medische Informatie
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood type */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-white/30" />
                <span className="text-xs text-white/40 uppercase tracking-wider">
                  Bloedgroep
                </span>
              </div>
              <span className="text-lg font-semibold text-white/90">
                {profile?.bloodType || '-'}
              </span>
            </div>

            {/* Medical alerts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-white/30" />
                <span className="text-xs text-white/40 uppercase tracking-wider">
                  Medische waarschuwingen
                </span>
              </div>
              {profile?.medicalAlerts?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.medicalAlerts.map((alert: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {alert}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-white/50">Geen</span>
              )}
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-4 h-4 text-white/30" />
                <span className="text-xs text-white/40 uppercase tracking-wider">
                  Medicatie
                </span>
              </div>
              {profile?.medications?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.medications.map((med: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8945a]/10 border border-[#e8945a]/20 text-sm text-[#e8945a]"
                    >
                      <Pill className="w-3 h-3" />
                      {med}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-white/50">Geen</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable info field component ── */
function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-white/30">{icon}</span>
        <span className="text-xs text-white/40 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm font-medium text-white/90 pl-6">
        {value || '-'}
      </p>
    </div>
  );
}
