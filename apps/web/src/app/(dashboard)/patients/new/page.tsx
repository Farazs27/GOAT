'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '',
    bsn: '', insuranceCompany: '', insuranceNumber: '',
    addressStreet: '', addressCity: '', addressPostal: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/patients', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          bsn: formData.bsn || undefined,
          insuranceCompany: formData.insuranceCompany || undefined,
          insuranceNumber: formData.insuranceNumber || undefined,
          addressStreet: formData.addressStreet || undefined,
          addressCity: formData.addressCity || undefined,
          addressPostal: formData.addressPostal || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Fout bij aanmaken');
      }
      const patient = await res.json();
      router.push(`/patients/${patient.id}`);
    } catch (err: any) {
      setError(err.message || 'Fout bij het aanmaken van de patiënt');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setFormData({ ...formData, [field]: value });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <button className="p-2 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Nieuwe patiënt</h2>
          <p className="text-white/50">Voeg een nieuwe patiënt toe aan uw praktijk</p>
        </div>
      </div>

      {error && <div className="glass-card rounded-xl p-4 text-red-400 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal info */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Persoonsgegevens</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40 mb-1">Voornaam *</p>
              <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                value={formData.firstName} onChange={(e) => update('firstName', e.target.value)} required />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Achternaam *</p>
              <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                value={formData.lastName} onChange={(e) => update('lastName', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40 mb-1">Geboortedatum *</p>
              <input type="date" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                value={formData.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} required />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">BSN</p>
              <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="123456789"
                value={formData.bsn} onChange={(e) => update('bsn', e.target.value)} maxLength={9} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Contactgegevens</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40 mb-1">E-mail</p>
              <input type="email" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="email@voorbeeld.nl"
                value={formData.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Telefoon</p>
              <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="+31 6 12345678"
                value={formData.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <p className="text-xs text-white/40 mb-1">Straat + huisnr</p>
              <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                value={formData.addressStreet} onChange={(e) => update('addressStreet', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Postcode</p>
              <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="1234 AB"
                value={formData.addressPostal} onChange={(e) => update('addressPostal', e.target.value)} />
            </div>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Stad</p>
            <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
              value={formData.addressCity} onChange={(e) => update('addressCity', e.target.value)} />
          </div>
        </div>

        {/* Insurance */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Verzekering</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40 mb-1">Verzekeraar</p>
              <select className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                value={formData.insuranceCompany} onChange={(e) => update('insuranceCompany', e.target.value)}>
                <option value="">Selecteer...</option>
                {['VGZ', 'CZ', 'Menzis', 'Zilveren Kruis', 'ONVZ', 'DSW', 'FBTO', 'Interpolis', 'Ditzo', 'Anders'].map(v =>
                  <option key={v} value={v}>{v}</option>
                )}
              </select>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Polisnummer</p>
              <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                value={formData.insuranceNumber} onChange={(e) => update('insuranceNumber', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Patiënt aanmaken
          </button>
          <Link href="/patients">
            <button type="button" className="px-6 py-2.5 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              Annuleren
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
