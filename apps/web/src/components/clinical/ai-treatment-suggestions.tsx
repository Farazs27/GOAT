'use client';

import { useState } from 'react';
import { Sparkles, Check, CheckCheck, X, Loader2, AlertCircle } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface SuggestedTreatment {
  toothNumber: number;
  description: string;
  nzaCode: string;
  nzaDescription: string;
  tariff: string;
  reasoning: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AiSuggestionResult {
  suggestion: {
    title: string;
    treatments: SuggestedTreatment[];
  };
  aiGenerated: boolean;
}

const PRIORITY_CLASSES: Record<string, string> = {
  HIGH: 'bg-red-500/20 text-red-300 border-red-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  LOW: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'Hoog',
  MEDIUM: 'Midden',
  LOW: 'Laag',
};

interface Props {
  patientId: string;
  onAcceptTreatment?: (treatment: SuggestedTreatment) => void;
}

export default function AiTreatmentSuggestions({ patientId, onAcceptTreatment }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiSuggestionResult | null>(null);
  const [acceptedIndices, setAcceptedIndices] = useState<Set<number>>(new Set());
  const [acceptingIndex, setAcceptingIndex] = useState<number | null>(null);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setAcceptedIndices(new Set());
    setPlanId(null);
    try {
      const res = await authFetch('/api/ai/suggest-treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fout bij ophalen suggesties');
      }
      const data: AiSuggestionResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  const ensurePlan = async (title: string): Promise<string> => {
    if (planId) return planId;
    const res = await authFetch('/api/treatment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        title,
        description: 'AI-gegenereerd behandelvoorstel',
      }),
    });
    if (!res.ok) throw new Error('Fout bij aanmaken behandelplan');
    const plan = await res.json();
    setPlanId(plan.id);
    return plan.id;
  };

  const acceptTreatment = async (treatment: SuggestedTreatment, index: number) => {
    if (acceptedIndices.has(index)) return;
    setAcceptingIndex(index);
    try {
      const id = await ensurePlan(result?.suggestion.title || 'AI Behandelvoorstel');

      // Look up NZa code ID by code
      const codeRes = await authFetch(`/api/nza-codes?search=${treatment.nzaCode}&limit=1`);
      let nzaCodeId: string | undefined;
      if (codeRes.ok) {
        const codes = await codeRes.json();
        const codeList = codes.data || codes;
        if (Array.isArray(codeList) && codeList.length > 0) {
          nzaCodeId = codeList[0].id;
        }
      }

      await authFetch(`/api/treatment-plans/${id}/treatments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: treatment.description,
          nzaCodeId,
          notes: `AI-suggestie: ${treatment.reasoning}`,
        }),
      });

      setAcceptedIndices((prev) => new Set([...prev, index]));
      onAcceptTreatment?.(treatment);
    } catch (err: any) {
      setError(err.message || 'Fout bij overnemen behandeling');
    } finally {
      setAcceptingIndex(null);
    }
  };

  const acceptAll = async () => {
    if (!result) return;
    setAcceptingAll(true);
    for (let i = 0; i < result.suggestion.treatments.length; i++) {
      if (!acceptedIndices.has(i)) {
        await acceptTreatment(result.suggestion.treatments[i], i);
      }
    }
    setAcceptingAll(false);
  };

  const dismiss = () => {
    setResult(null);
    setError('');
    setAcceptedIndices(new Set());
    setPlanId(null);
  };

  // Not showing panel yet - just the button
  if (!result && !loading) {
    return (
      <button
        onClick={fetchSuggestions}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-medium transition-all"
      >
        <Sparkles className="h-4 w-4" />
        AI Behandeladvies
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Button row */}
      <button
        onClick={fetchSuggestions}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-medium transition-all disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        {loading ? 'Analyseren...' : 'AI Behandeladvies'}
      </button>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
          <span className="text-sm text-purple-300">AI analyseert gebitstatus...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/15">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-white/90">{result.suggestion.title}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                AI-suggestie
              </span>
            </div>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Empty state */}
          {result.suggestion.treatments.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-white/40">
                Geen diagnosegegevens gevonden. Vul eerst het odontogram in.
              </p>
            </div>
          )}

          {/* Treatment list */}
          {result.suggestion.treatments.length > 0 && (
            <div className="divide-y divide-white/5">
              {result.suggestion.treatments.map((t, i) => {
                const accepted = acceptedIndices.has(i);
                return (
                  <div
                    key={i}
                    className={`p-4 transition-colors ${accepted ? 'opacity-60 bg-emerald-500/5' : 'hover:bg-white/[0.03]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            Element {t.toothNumber}
                          </span>
                          <span className="text-xs font-mono text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                            {t.nzaCode}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${PRIORITY_CLASSES[t.priority] || PRIORITY_CLASSES.LOW}`}>
                            {PRIORITY_LABELS[t.priority] || t.priority}
                          </span>
                          {accepted && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                              Overgenomen
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/80 mt-1.5">{t.description}</p>
                        {t.nzaDescription && (
                          <p className="text-xs text-white/40 mt-0.5">{t.nzaDescription}</p>
                        )}
                        <p className="text-xs text-white/30 mt-1 italic">{t.reasoning}</p>
                        {t.tariff && (
                          <p className="text-xs text-white/50 mt-1 font-medium">
                            Tarief: &euro;{Number(t.tariff).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => acceptTreatment(t, i)}
                        disabled={accepted || acceptingIndex === i || acceptingAll}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                          accepted
                            ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
                        } disabled:opacity-50`}
                      >
                        {accepted ? (
                          <><Check className="h-3.5 w-3.5" /> Overgenomen</>
                        ) : acceptingIndex === i ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Bezig...</>
                        ) : (
                          'Overnemen'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer actions */}
          {result.suggestion.treatments.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-purple-500/15 bg-white/[0.02]">
              <p className="text-[10px] text-white/25">
                {acceptedIndices.size}/{result.suggestion.treatments.length} overgenomen
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={dismiss}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  Sluiten
                </button>
                {acceptedIndices.size < result.suggestion.treatments.length && (
                  <button
                    onClick={acceptAll}
                    disabled={acceptingAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {acceptingAll ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Bezig...</>
                    ) : (
                      <><CheckCheck className="h-3.5 w-3.5" /> Alles overnemen</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
