'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { FileText, Plus, ChevronDown, ChevronUp, X } from 'lucide-react';

interface Referral {
  id: string;
  reason: string;
  specialistName: string;
  specialty: string;
  status: string;
  notes: string | null;
  createdAt: string;
  patient?: { firstName: string; lastName: string; id: string };
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
  DRAFT: 'bg-white/10 text-white/50',
  SENT: 'bg-blue-500/15 text-blue-400',
  ACCEPTED: 'bg-emerald-500/15 text-emerald-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400',
};

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    specialistName: '',
    specialty: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadReferrals();
  }, []);

  async function loadReferrals() {
    setLoading(true);
    try {
      // Load referrals from patients endpoint - aggregate from all patients
      const patientsRes = await authFetch('/api/patients?limit=200');
      if (patientsRes.ok) {
        const pData = await patientsRes.json();
        const patientList: Patient[] = Array.isArray(pData) ? pData : pData.patients || [];
        setPatients(patientList);

        const allReferrals: Referral[] = [];
        // Load referrals for recent patients (top 50 to avoid too many requests)
        const recentPatients = patientList.slice(0, 50);
        await Promise.all(
          recentPatients.map(async (p) => {
            try {
              const res = await authFetch(`/api/patients/${p.id}/referrals`);
              if (res.ok) {
                const refs = await res.json();
                const list = Array.isArray(refs) ? refs : refs.referrals || [];
                list.forEach((r: Referral) => {
                  allReferrals.push({ ...r, patient: { firstName: p.firstName, lastName: p.lastName, id: p.id } });
                });
              }
            } catch {}
          })
        );
        allReferrals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReferrals(allReferrals);
      }
    } catch {}
    setLoading(false);
  }

  async function createReferral() {
    if (!form.patientId) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/patients/${form.patientId}/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistName: form.specialistName,
          specialty: form.specialty,
          reason: form.reason,
          notes: form.notes || undefined,
          status: 'DRAFT',
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ patientId: '', specialistName: '', specialty: '', reason: '', notes: '' });
        loadReferrals();
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
          <h1 className="text-2xl md:text-3xl font-bold text-white/90 tracking-tight">Verwijzingen</h1>
          <p className="text-white/40 mt-1 text-sm">{referrals.length} verwijzingen</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nieuwe verwijzing
        </button>
      </div>

      {/* Create Referral Form */}
      {showCreate && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/90">Nieuwe verwijzing</h2>
            <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white/70">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.patientId}
              onChange={(e) => setForm((p) => ({ ...p, patientId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 outline-none"
            >
              <option value="" className="bg-gray-900">Selecteer patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <input
              value={form.specialistName}
              onChange={(e) => setForm((p) => ({ ...p, specialistName: e.target.value }))}
              placeholder="Naam specialist"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none"
            />
            <input
              value={form.specialty}
              onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
              placeholder="Specialisme (bijv. Parodontologie)"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none"
            />
            <input
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Reden voor verwijzing"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none"
            />
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Klinische notities (optioneel)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none resize-none md:col-span-2"
            />
          </div>
          <button
            onClick={createReferral}
            disabled={saving || !form.patientId || !form.specialistName || !form.reason}
            className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Aanmaken'}
          </button>
        </div>
      )}

      {/* Referrals Table */}
      <div className="rounded-2xl overflow-hidden" style={glassCard}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Patient</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Verwezen naar</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Specialisme</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Reden</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-4 text-sm text-white/80">
                  {r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-white/80 font-medium">{r.specialistName}</td>
                <td className="px-6 py-4 text-xs text-white/50">{r.specialty}</td>
                <td className="px-6 py-4 text-sm text-white/60 max-w-[200px] truncate">{r.reason}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${STATUS_COLORS[r.status] || 'bg-white/10 text-white/50'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white/50">
                  {new Date(r.createdAt).toLocaleDateString('nl-NL')}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    {expandedId === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/30 text-sm">
                  Geen verwijzingen gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {expandedId && (() => {
          const ref = referrals.find((r) => r.id === expandedId);
          if (!ref) return null;
          return (
            <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white/70 mb-2">Verwijsdetails</h3>
              {ref.notes && <p className="text-sm text-white/50 mb-2">{ref.notes}</p>}
              <p className="text-xs text-white/40">
                Aangemaakt: {new Date(ref.createdAt).toLocaleString('nl-NL')}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
