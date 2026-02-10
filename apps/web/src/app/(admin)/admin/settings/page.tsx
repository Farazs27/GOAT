'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Building2, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-react';

interface Practice {
  id: string;
  name: string;
  slug: string;
  agbCode: string | null;
  kvkNumber: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostal: string | null;
  phone: string | null;
  email: string | null;
  billingConfig: any;
  settings: any;
}

type Tab = 'general' | 'billing' | 'system';

export default function AdminSettingsPage() {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [form, setForm] = useState({
    name: '',
    agbCode: '',
    kvkNumber: '',
    addressStreet: '',
    addressCity: '',
    addressPostal: '',
    phone: '',
    email: '',
  });

  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('/api/users/me', { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((user) => {
        if (!user?.practice) return;
        const p = user.practice;
        setPractice(p);
        setForm({
          name: p.name || '',
          agbCode: p.agbCode || '',
          kvkNumber: p.kvkNumber || '',
          addressStreet: p.addressStreet || '',
          addressCity: p.addressCity || '',
          addressPostal: p.addressPostal || '',
          phone: p.phone || '',
          email: p.email || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!practice) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/practices/${practice.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general' as Tab, label: 'Algemeen', icon: Building2 },
    { id: 'billing' as Tab, label: 'Facturatie', icon: CreditCard },
    { id: 'system' as Tab, label: 'Systeem', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Instellingen</h2>
          <p className="text-white/50">Beheer praktijkinstellingen en configuratie.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all ${
            saved
              ? 'bg-emerald-500/80 shadow-emerald-500/20 text-white'
              : 'bg-violet-500/80 hover:bg-violet-500 shadow-violet-500/20 text-white'
          } disabled:opacity-50`}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Opslaan...' : saved ? 'Opgeslagen!' : 'Opslaan'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-300 shadow-lg shadow-violet-500/5'
                : 'glass text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Praktijkgegevens</h3>

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Praktijknaam</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">AGB-code</label>
              <input
                type="text"
                value={form.agbCode}
                onChange={(e) => setForm({ ...form, agbCode: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">KvK-nummer</label>
              <input
                type="text"
                value={form.kvkNumber}
                onChange={(e) => setForm({ ...form, kvkNumber: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider pt-2">Contactgegevens</h3>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Telefoon</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider pt-2">Adres</h3>

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Straat + huisnummer</label>
              <input
                type="text"
                value={form.addressStreet}
                onChange={(e) => setForm({ ...form, addressStreet: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Postcode</label>
              <input
                type="text"
                value={form.addressPostal}
                onChange={(e) => setForm({ ...form, addressPostal: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="col-span-3">
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Plaats</label>
              <input
                type="text"
                value={form.addressCity}
                onChange={(e) => setForm({ ...form, addressCity: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Facturatie-instellingen</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">BTW-plichtig</p>
                <p className="text-xs text-white/40">Tandheelkundige zorg is vrijgesteld van BTW (artikel 11 Wet OB)</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Vrijgesteld</span>
            </div>

            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">Betalingstermijn</p>
                <p className="text-xs text-white/40">Standaard betalingstermijn voor facturen</p>
              </div>
              <span className="text-sm text-white/60">30 dagen</span>
            </div>

            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">Mollie-integratie</p>
                <p className="text-xs text-white/40">Online betalingen via Mollie</p>
              </div>
              <a href="/admin/credentials" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Configureren &rarr;
              </a>
            </div>

            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">VECOZO declaratie</p>
                <p className="text-xs text-white/40">Automatische verzekeringsdeclaraties</p>
              </div>
              <a href="/admin/credentials" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Configureren &rarr;
              </a>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Systeemvoorkeuren</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">Tijdzone</p>
                <p className="text-xs text-white/40">Tijdzone voor alle afspraken en logs</p>
              </div>
              <span className="text-sm text-white/60">Europe/Amsterdam</span>
            </div>

            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">Taal</p>
                <p className="text-xs text-white/40">Standaard systeemtaal</p>
              </div>
              <span className="text-sm text-white/60">Nederlands</span>
            </div>

            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">BSN-logging</p>
                <p className="text-xs text-white/40">Alle BSN-toegang wordt gelogd conform AVG/WGBO</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Actief</span>
            </div>

            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">Audit trail retentie</p>
                <p className="text-xs text-white/40">Bewaartermijn audit logs</p>
              </div>
              <span className="text-sm text-white/60">7 jaar</span>
            </div>

            <div className="flex items-center justify-between p-4 glass-light rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/90">Data encryptie</p>
                <p className="text-xs text-white/40">AES-256 encryptie voor gevoelige data</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Actief</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
