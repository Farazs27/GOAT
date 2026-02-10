'use client';

import { useState, useEffect } from 'react';
import {
  Key, Plus, Trash2, Edit2, Check, X, RefreshCw, Shield
} from 'lucide-react';

interface Credential {
  id: string;
  name: string;
  type: string;
  environment: string;
  isActive: boolean;
  isTestMode: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const credentialTypes = [
  { value: 'MOLLIE', label: 'Mollie (iDEAL/Betalingen)' },
  { value: 'TWILIO', label: 'Twilio (SMS)' },
  { value: 'AWS', label: 'AWS (S3/SES/KMS)' },
  { value: 'VECOZO', label: 'VECOZO (Verzekeringen)' },
  { value: 'RESEND', label: 'Resend (E-mail)' },
  { value: 'CUSTOM', label: 'Aangepast' },
];

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean } | null>(null);
  const [formData, setFormData] = useState({ name: '', type: '', environment: 'production', apiKey: '', apiSecret: '', isTestMode: false });

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/credentials', { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });
      if (res.ok) setCredentials(await res.json());
    } catch { setError('Fout bij het laden'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCredentials(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/credentials/${editingId}` : '/api/credentials';
    try {
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify(formData),
      });
      if (res.ok) { fetchCredentials(); setShowForm(false); resetForm(); }
    } catch { setError('Fout bij opslaan'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet u zeker dat u deze sleutel wilt verwijderen?')) return;
    await fetch(`/api/credentials/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });
    fetchCredentials();
  };

  const handleTest = async (id: string) => {
    try {
      const res = await fetch(`/api/credentials/${id}/test`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });
      const result = await res.json();
      setTestResult({ id, success: result.success });
      setTimeout(() => setTestResult(null), 3000);
    } catch { setTestResult({ id, success: false }); }
  };

  const resetForm = () => { setFormData({ name: '', type: '', environment: 'production', apiKey: '', apiSecret: '', isTestMode: false }); setEditingId(null); };

  const openEdit = (c: Credential) => {
    setEditingId(c.id);
    setFormData({ name: c.name, type: c.type, environment: c.environment, apiKey: '', apiSecret: '', isTestMode: c.isTestMode });
    setShowForm(true);
  };

  const getLabel = (type: string) => credentialTypes.find(t => t.value === type)?.label || type;

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">API Sleutels & Credentials</h2>
          <p className="text-white/50">Beheer alle API sleutels en integraties voor uw praktijk</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20">
          <Plus className="h-4 w-4" /> Nieuwe Sleutel
        </button>
      </div>

      {error && <div className="glass-card rounded-xl p-4 text-red-400 text-sm">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
            {editingId ? 'Sleutel bewerken' : 'Nieuwe sleutel'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Naam</p>
                <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="bv. Mollie Productie"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Type</p>
                <select className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                  <option value="">Selecteer...</option>
                  {credentialTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Omgeving</p>
                <select className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formData.environment} onChange={(e) => setFormData({ ...formData, environment: e.target.value })}>
                  <option value="production">Productie</option>
                  <option value="test">Test</option>
                  <option value="sandbox">Sandbox</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">API Key</p>
                <input type="password" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                  placeholder={editingId ? 'Ongewijzigd laten' : 'API key'}
                  value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">API Secret</p>
                <input type="password" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="Optioneel"
                  value={formData.apiSecret} onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" checked={formData.isTestMode}
                  onChange={(e) => setFormData({ ...formData, isTestMode: e.target.checked })} />
                <span className="text-sm text-white/60">Test modus</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors">
                {editingId ? 'Opslaan' : 'Toevoegen'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Credentials list */}
      {credentials.length === 0 && !showForm ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Key className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40">Geen API sleutels geconfigureerd</p>
          <p className="text-sm text-white/30 mt-1">Klik op &quot;Nieuwe Sleutel&quot; om te beginnen</p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white/90">{c.name}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs border ${c.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                        {c.isActive ? 'Actief' : 'Inactief'}
                      </span>
                      {c.isTestMode && (
                        <span className="px-2 py-0.5 rounded-lg text-xs border bg-amber-500/20 text-amber-300 border-amber-500/20">Test</span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {getLabel(c.type)} &middot; {c.environment} &middot; Laatst gebruikt: {c.lastUsedAt ? new Date(c.lastUsedAt).toLocaleDateString('nl-NL') : 'Nooit'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testResult?.id === c.id && (
                    <span className={`px-2 py-0.5 rounded-lg text-xs ${testResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {testResult.success ? <Check className="h-3 w-3 inline mr-1" /> : <X className="h-3 w-3 inline mr-1" />}
                      {testResult.success ? 'OK' : 'Fout'}
                    </span>
                  )}
                  <button onClick={() => handleTest(c.id)} className="p-2 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button onClick={() => openEdit(c)} className="p-2 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 glass rounded-xl text-red-400/60 hover:text-red-400 hover:bg-white/10 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security note */}
      <div className="glass-light rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-white/40" />
          <span className="text-sm font-medium text-white/60">Beveiliging</span>
        </div>
        <p className="text-xs text-white/40">
          API sleutels worden veilig opgeslagen en zijn alleen zichtbaar voor Practice Admins.
          Alle toegang wordt gelogd in de audit log.
        </p>
      </div>
    </div>
  );
}
