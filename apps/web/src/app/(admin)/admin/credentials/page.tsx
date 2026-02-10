'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, X, Trash2, RefreshCw, CheckCircle, XCircle, Zap } from 'lucide-react';

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

const typeLabels: Record<string, string> = {
  MOLLIE: 'Mollie',
  VECOZO: 'VECOZO',
  TWILIO: 'Twilio',
  AWS: 'AWS',
  SMTP: 'SMTP',
  OTHER: 'Overig',
};

const typeColors: Record<string, string> = {
  MOLLIE: 'from-pink-400 to-rose-500',
  VECOZO: 'from-blue-400 to-cyan-500',
  TWILIO: 'from-red-400 to-red-500',
  AWS: 'from-amber-400 to-orange-500',
  SMTP: 'from-emerald-400 to-teal-500',
  OTHER: 'from-gray-400 to-gray-500',
};

export default function AdminCredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'MOLLIE',
    environment: 'production',
    apiKey: '',
    apiSecret: '',
    isTestMode: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' };

  const fetchCredentials = () => {
    setLoading(true);
    fetch('/api/credentials', { headers })
      .then((r) => r.ok ? r.json() : [])
      .then(setCredentials)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCredentials(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Fout bij aanmaken');
      }
      setShowCreateModal(false);
      setFormData({ name: '', type: 'MOLLIE', environment: 'production', apiKey: '', apiSecret: '', isTestMode: false });
      fetchCredentials();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Weet u zeker dat u "${name}" wilt verwijderen?`)) return;
    await fetch(`/api/credentials/${id}`, { method: 'DELETE', headers });
    fetchCredentials();
  };

  const handleTest = async (id: string) => {
    setTestResult(null);
    try {
      const res = await fetch(`/api/credentials/${id}/test`, { method: 'POST', headers });
      const data = await res.json();
      setTestResult({ id, ...data });
    } catch {
      setTestResult({ id, success: false, message: 'Test mislukt' });
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">API Sleutels</h2>
          <p className="text-white/50">Beheer externe API-koppelingen en credentials.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/80 hover:bg-violet-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nieuwe sleutel
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400 border-t-transparent"></div>
        </div>
      ) : credentials.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Key className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40">Geen API sleutels geconfigureerd</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            Voeg uw eerste sleutel toe
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {credentials.map((cred) => (
            <div key={cred.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[cred.type] || typeColors.OTHER} flex items-center justify-center shadow-lg`}>
                    <Key className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white/90">{cred.name}</h4>
                    <p className="text-xs text-white/40">{typeLabels[cred.type] || cred.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {cred.isActive ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Actief</span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/20">Inactief</span>
                  )}
                  {cred.isTestMode && (
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/20">Test</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Omgeving</span>
                  <span className="text-white/60">{cred.environment}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Laatst gebruikt</span>
                  <span className="text-white/60">
                    {cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Nooit'}
                  </span>
                </div>
                {cred.expiresAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Vervalt</span>
                    <span className={`${new Date(cred.expiresAt) < new Date() ? 'text-red-300' : 'text-white/60'}`}>
                      {new Date(cred.expiresAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                )}
              </div>

              {testResult?.id === cred.id && (
                <div className={`mb-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20'
                }`}>
                  {testResult.success ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {testResult.message}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => handleTest(cred.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Testen
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => handleDelete(cred.id, cred.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-red-300/60 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Nieuwe API Sleutel</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/20 text-red-300 text-sm">{error}</div>
            )}

            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Naam</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="bijv. Mollie Productie"
                className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option value="MOLLIE">Mollie</option>
                  <option value="VECOZO">VECOZO</option>
                  <option value="TWILIO">Twilio</option>
                  <option value="AWS">AWS</option>
                  <option value="SMTP">SMTP</option>
                  <option value="OTHER">Overig</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Omgeving</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option value="production">Productie</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">API Key</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">API Secret</label>
              <input
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTestMode}
                onChange={(e) => setFormData({ ...formData, isTestMode: e.target.checked })}
                className="rounded"
              />
              Test modus
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="glass rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                Annuleren
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !formData.name}
                className="px-4 py-2 bg-violet-500/80 hover:bg-violet-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
