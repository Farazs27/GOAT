'use client';

import { useState } from 'react';
import { Plus, Info, X, Sparkles } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { expandHygieneShorthand, getShorthandHints } from '@/lib/ai/hygiene-shorthand';

interface HygienistNoteFormProps {
  patientId: string;
  onNoteCreated: () => void;
}

export default function HygienistNoteForm({ patientId, onNoteCreated }: HygienistNoteFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [oralHygieneScore, setOralHygieneScore] = useState(3);
  const [bopPercentage, setBopPercentage] = useState<number>(0);
  const [homeCareInstructions, setHomeCareInstructions] = useState('');
  const [complianceNotes, setComplianceNotes] = useState('');
  const [nextVisitRecommendation, setNextVisitRecommendation] = useState('');

  const hints = getShorthandHints();

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      // Expand shorthands in text fields
      const content = {
        oralHygieneScore,
        bopPercentage,
        homeCareInstructions: expandHygieneShorthand(homeCareInstructions),
        complianceNotes: expandHygieneShorthand(complianceNotes),
        nextVisitRecommendation: expandHygieneShorthand(nextVisitRecommendation),
      };

      const res = await authFetch(`/api/patients/${patientId}/clinical-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteType: 'HYGIENE', content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Fout bij opslaan');
        return;
      }

      // Reset form
      setOralHygieneScore(3);
      setBopPercentage(0);
      setHomeCareInstructions('');
      setComplianceNotes('');
      setNextVisitRecommendation('');
      setShowForm(false);
      onNoteCreated();
    } catch (err) {
      setError('Fout bij opslaan');
    } finally {
      setSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all duration-300 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Nieuwe notitie
      </button>
    );
  }

  return (
    <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Nieuwe mondhygienist notitie
        </h3>
        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* Oral Hygiene Score */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Mondhygiene Score (1-5)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setOralHygieneScore(n)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                n <= oralHygieneScore
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white/[0.06] text-gray-500 border border-white/[0.12]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* BOP Percentage */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">BOP Percentage (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          value={bopPercentage}
          onChange={e => setBopPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
          className="w-32 bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* AI Shorthand hint */}
      <div className="relative">
        <button
          onClick={() => setShowHints(!showHints)}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          AI afkortingen beschikbaar
        </button>
        {showHints && (
          <div className="absolute left-0 top-full mt-1 z-40 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/[0.15] rounded-xl p-3 shadow-2xl">
            <p className="text-xs text-gray-400 mb-2">Typ afkortingen - worden automatisch uitgebreid bij opslaan:</p>
            <div className="grid grid-cols-2 gap-1">
              {hints.map(h => (
                <div key={h.short} className="flex items-center gap-2 text-xs">
                  <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{h.short}</code>
                  <span className="text-gray-300">{h.full}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Home Care Instructions */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Thuiszorg instructies</label>
        <textarea
          value={homeCareInstructions}
          onChange={e => setHomeCareInstructions(e.target.value)}
          placeholder="Bijv: sc uitgevoerd, mhi gegeven voor interdentale reiniging..."
          rows={3}
          className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
        />
      </div>

      {/* Compliance Notes */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Compliantie notities</label>
        <textarea
          value={complianceNotes}
          onChange={e => setComplianceNotes(e.target.value)}
          placeholder="Patient compliantie opmerkingen..."
          rows={2}
          className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
        />
      </div>

      {/* Next Visit Recommendation */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Volgende afspraak aanbeveling</label>
        <textarea
          value={nextVisitRecommendation}
          onChange={e => setNextVisitRecommendation(e.target.value)}
          placeholder="Aanbeveling voor volgende bezoek..."
          rows={2}
          className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-500/25"
      >
        {submitting ? 'Opslaan...' : 'Notitie opslaan'}
      </button>
    </div>
  );
}
