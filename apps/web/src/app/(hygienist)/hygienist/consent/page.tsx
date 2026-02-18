'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { FileCheck, Plus, ChevronDown, ChevronUp, Send, X } from 'lucide-react';

interface ConsentForm {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  signedAt: string | null;
  patient?: { firstName: string; lastName: string; id: string };
  signatureData?: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const glassCard = {
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  SIGNED: 'bg-emerald-500/15 text-emerald-400',
  EXPIRED: 'bg-red-500/15 text-red-400',
  DRAFT: 'bg-white/10 text-white/50',
};

export default function ConsentPage() {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [newForm, setNewForm] = useState({ title: '', content: '', category: 'TREATMENT' });
  const [sendForm, setSendForm] = useState({ patientId: '', templateId: '' });
  const [saving, setSaving] = useState(false);

  const categories = ['TREATMENT', 'GENERAL', 'PHOTOGRAPHY', 'DATA_PROCESSING'];

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    setLoading(true);
    try {
      const res = await authFetch('/api/consent-forms');
      if (res.ok) {
        const data = await res.json();
        setForms(Array.isArray(data) ? data : data.forms || []);
      }
    } catch {}
    setLoading(false);
  }

  async function loadPatients() {
    try {
      const res = await authFetch('/api/patients?limit=200');
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : data.patients || []);
      }
    } catch {}
  }

  async function createTemplate() {
    setSaving(true);
    try {
      const res = await authFetch('/api/consent-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewForm({ title: '', content: '', category: 'TREATMENT' });
        loadForms();
      }
    } catch {}
    setSaving(false);
  }

  async function sendToPatient() {
    setSaving(true);
    try {
      const res = await authFetch('/api/consent-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: sendForm.patientId,
          templateId: sendForm.templateId,
          status: 'PENDING',
        }),
      });
      if (res.ok) {
        setShowSend(false);
        setSendForm({ patientId: '', templateId: '' });
        loadForms();
      }
    } catch {}
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 md:pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white/90 tracking-tight">Toestemmingsformulieren</h1>
          <p className="text-white/40 mt-1 text-sm">{forms.length} formulieren</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowSend(true); loadPatients(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
          >
            <Send className="w-4 h-4" /> Versturen
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nieuw template
          </button>
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreate && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/90">Nieuw template aanmaken</h2>
            <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white/70">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <input
              value={newForm.title}
              onChange={(e) => setNewForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Titel"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
            <select
              value={newForm.category}
              onChange={(e) => setNewForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-gray-900">{c}</option>
              ))}
            </select>
            <textarea
              value={newForm.content}
              onChange={(e) => setNewForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="Inhoud van het formulier..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
            />
            <button
              onClick={createTemplate}
              disabled={saving || !newForm.title}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}

      {/* Send to Patient Modal */}
      {showSend && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/90">Formulier versturen naar patient</h2>
            <button onClick={() => setShowSend(false)} className="text-white/40 hover:text-white/70">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <select
              value={sendForm.patientId}
              onChange={(e) => setSendForm((p) => ({ ...p, patientId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 outline-none"
            >
              <option value="" className="bg-gray-900">Selecteer patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <select
              value={sendForm.templateId}
              onChange={(e) => setSendForm((p) => ({ ...p, templateId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 outline-none"
            >
              <option value="" className="bg-gray-900">Selecteer template...</option>
              {forms.filter((f) => f.status === 'DRAFT' || !f.patient).map((f) => (
                <option key={f.id} value={f.id} className="bg-gray-900">{f.title}</option>
              ))}
            </select>
            <button
              onClick={sendToPatient}
              disabled={saving || !sendForm.patientId || !sendForm.templateId}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Versturen...' : 'Versturen'}
            </button>
          </div>
        </div>
      )}

      {/* Forms Table */}
      <div className="rounded-2xl overflow-hidden" style={glassCard}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Patient</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Formulier</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Categorie</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Verstuurd</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Getekend</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-4 text-sm text-white/80">
                  {f.patient ? `${f.patient.firstName} ${f.patient.lastName}` : 'Template'}
                </td>
                <td className="px-6 py-4 text-sm text-white/80 font-medium">{f.title}</td>
                <td className="px-6 py-4 text-xs text-white/50">{f.category}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${STATUS_COLORS[f.status] || 'bg-white/10 text-white/50'}`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white/50">
                  {new Date(f.createdAt).toLocaleDateString('nl-NL')}
                </td>
                <td className="px-6 py-4 text-sm text-white/50">
                  {f.signedAt ? new Date(f.signedAt).toLocaleDateString('nl-NL') : '-'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    {expandedId === f.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/30 text-sm">
                  Geen toestemmingsformulieren gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {expandedId && (() => {
          const form = forms.find((f) => f.id === expandedId);
          if (!form) return null;
          return (
            <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white/70 mb-2">Details</h3>
              {form.signatureData && (
                <p className="text-xs text-white/40">Handtekening opgeslagen</p>
              )}
              <p className="text-xs text-white/40 mt-1">
                Aangemaakt: {new Date(form.createdAt).toLocaleString('nl-NL')}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
