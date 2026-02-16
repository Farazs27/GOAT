'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, Info, Check, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Suggestion {
  nzaCode: string;
  nzaCodeId: string;
  description: string;
  unitPrice: string;
  confidence: 'high' | 'medium' | 'low';
  corrected?: boolean;
  corrections?: string[];
  isCompanion?: boolean;
  warnings?: Array<{ code: string; message: string; severity: 'warning' | 'error' }>;
  reasoning?: string;
  tooth?: string;
}

export interface ConfirmedLine {
  nzaCode: string;
  nzaCodeId: string;
  description: string;
  unitPrice: string;
  tooth?: string;
  quantity: number;
}

interface AIDeclaratiePanelProps {
  patientId: string;
  patientName: string;
  patientAge?: number;
  onConfirm: (lines: ConfirmedLine[]) => void;
  onClose: () => void;
}

const confidenceBadge: Record<string, string> = {
  high: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  low: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const confidenceLabel: Record<string, string> = {
  high: 'Hoog',
  medium: 'Gemiddeld',
  low: 'Laag',
};

export function AIDeclaratiePanel({ patientId, patientName, patientAge, onConfirm, onClose }: AIDeclaratiePanelProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!input.trim() || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/treatment-chat', {
        method: 'POST',
        body: JSON.stringify({ message: input, patientId, context: 'declaratie' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'AI analyse mislukt');
      }
      const data = await res.json();
      const suggs: Suggestion[] = data.suggestions || [];
      setSuggestions(suggs);
      // Auto-select high confidence, deselect medium/low
      const autoSelected = new Set<number>();
      suggs.forEach((s, i) => {
        if (s.confidence === 'high') autoSelected.add(i);
      });
      setSelected(autoSelected);
      setExpandedReasoning(new Set());
    } catch (e: any) {
      setError(e.message || 'Er ging iets mis');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleReasoning = (i: number) => {
    setExpandedReasoning(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleConfirm = () => {
    const confirmed: ConfirmedLine[] = [];
    suggestions.forEach((s, i) => {
      if (selected.has(i)) {
        confirmed.push({
          nzaCode: s.nzaCode,
          nzaCodeId: s.nzaCodeId,
          description: s.description,
          unitPrice: s.unitPrice,
          tooth: s.tooth,
          quantity: 1,
        });
      }
    });
    onConfirm(confirmed);
  };

  const selectedTotal = suggestions.reduce((sum, s, i) => {
    if (selected.has(i)) return sum + (parseFloat(s.unitPrice) || 0);
    return sum;
  }, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white/90">AI Declaratie Assistent</h3>
          <p className="text-xs text-white/40">
            {patientName}{patientAge ? ` (${patientAge} jaar)` : ''}
          </p>
        </div>
      </div>

      {/* Input section */}
      <div className="mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Beschrijf de behandeling, bijv. 'composiet vulling 36 MOD met verdoving'"
          rows={3}
          className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none resize-none placeholder:text-white/25"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze();
          }}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-500/80 hover:bg-purple-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 w-full justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyseren...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyseer
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          <p className="text-xs text-white/40 uppercase tracking-wider">
            Suggesties ({suggestions.length})
          </p>

          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3 transition-all cursor-pointer ${
                selected.has(i)
                  ? 'bg-white/[0.06] border-purple-500/30'
                  : 'bg-white/[0.02] border-white/[0.06] opacity-60'
              }`}
              onClick={() => toggleSelect(i)}
            >
              <div className="flex items-start gap-2">
                {/* Checkbox */}
                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  selected.has(i)
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-white/20 bg-transparent'
                }`}>
                  {selected.has(i) && <Check className="h-3 w-3 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Code + description + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-mono">
                      {s.nzaCode}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${confidenceBadge[s.confidence] || confidenceBadge.medium}`}>
                      {confidenceLabel[s.confidence] || s.confidence}
                    </span>
                    {s.isCompanion && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        Automatisch toegevoegd
                      </span>
                    )}
                    {s.corrected && (
                      <span className="group relative">
                        <Info className="h-3.5 w-3.5 text-amber-400 cursor-help" />
                        <span className="hidden group-hover:block absolute left-0 top-5 z-10 bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 w-48 shadow-xl">
                          <span className="font-medium text-white/90 block mb-1">Correcties:</span>
                          {(s.corrections || []).map((c, ci) => (
                            <span key={ci} className="block">- {c}</span>
                          ))}
                        </span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-white/70 mt-1">{s.description}</p>

                  <div className="flex items-center gap-3 mt-1.5">
                    {s.tooth && (
                      <span className="text-xs text-white/40">Element {s.tooth}</span>
                    )}
                    <span className="text-xs font-medium text-white/60">
                      {formatCurrency(parseFloat(s.unitPrice) || 0)}
                    </span>
                  </div>

                  {/* Warnings */}
                  {s.warnings && s.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {s.warnings.map((w, wi) => (
                        <div
                          key={wi}
                          className={`flex items-start gap-1.5 text-xs rounded-lg px-2 py-1.5 ${
                            w.severity === 'error'
                              ? 'bg-red-500/10 text-red-300'
                              : 'bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{w.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reasoning toggle */}
                  {s.reasoning && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleReasoning(i); }}
                      className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 mt-2 transition-colors"
                    >
                      {expandedReasoning.has(i) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      AI redenering
                    </button>
                  )}
                  {expandedReasoning.has(i) && s.reasoning && (
                    <p className="text-xs text-white/30 mt-1 pl-1 border-l border-white/10">
                      {s.reasoning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Total + actions */}
          <div className="sticky bottom-0 pt-3 pb-1 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e] to-transparent">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40">
                {selected.size} van {suggestions.length} geselecteerd
              </span>
              <span className="text-sm font-semibold text-white/90">
                Totaal: {formatCurrency(selectedTotal)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirm}
                disabled={selected.size === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/80 hover:bg-emerald-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Bevestigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
