'use client';

import { useState } from 'react';
import { FileText, Sparkles, Loader2, Check, Pencil, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ClinicalNote {
  id: string;
  noteType: string;
  content: string;
  createdAt: string;
  author: { firstName: string; lastName: string; role: string };
}

interface SoapNoteFormProps {
  patientId: string;
  notes: ClinicalNote[];
  onNoteCreated: () => void;
  autoOpen?: boolean;
}

interface AiSuggestion {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  originalShorthand: string;
}

export default function SoapNoteForm({ patientId, notes, onNoteCreated, autoOpen = false }: SoapNoteFormProps) {
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [plan, setPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(autoOpen);

  // AI shorthand state
  const [shorthandMode, setShorthandMode] = useState(false);
  const [shorthandText, setShorthandText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiError, setAiError] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !analysis && !plan) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/clinical-notes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, noteType: 'SOAP',
          content: JSON.stringify({ subjective, objective, analysis, plan }),
        }),
      });
      if (!response.ok) throw new Error('Failed to create note');
      setSubjective(''); setObjective(''); setAnalysis(''); setPlan('');
      setShorthandText(''); setAiSuggestion(null); setShorthandMode(false);
      setShowForm(false);
      onNoteCreated();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleAiExpand = async () => {
    if (!shorthandText.trim() || shorthandText.trim().length < 3) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestion(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/ai/expand-notes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ shorthand: shorthandText, format: 'soap' }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'AI-uitbreiding mislukt');
      }
      const data = await response.json();
      setAiSuggestion({
        subjective: data.expanded.subjective || '',
        objective: data.expanded.objective || '',
        assessment: data.expanded.assessment || '',
        plan: data.expanded.plan || '',
        originalShorthand: data.originalShorthand,
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (!aiSuggestion) return;
    setSubjective(aiSuggestion.subjective);
    setObjective(aiSuggestion.objective);
    setAnalysis(aiSuggestion.assessment);
    setPlan(aiSuggestion.plan);
    setShorthandMode(false);
    setAiSuggestion(null);
  };

  const handleEditSuggestion = () => {
    if (!aiSuggestion) return;
    setSubjective(aiSuggestion.subjective);
    setObjective(aiSuggestion.objective);
    setAnalysis(aiSuggestion.assessment);
    setPlan(aiSuggestion.plan);
    setShorthandMode(false);
    setAiSuggestion(null);
  };

  const handleDismissSuggestion = () => {
    setAiSuggestion(null);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('nl-NL');

  const parseSoapContent = (content: string) => {
    try { return JSON.parse(content); } catch { return { text: content }; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Clinische notities</h3>
        {!showForm && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20"
            onClick={() => setShowForm(true)}
          >
            <FileText className="h-4 w-4" />
            Nieuwe SOAP-notitie
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white/80">Nieuwe SOAP-notitie</h4>
            {/* Shorthand mode toggle */}
            <button
              type="button"
              onClick={() => { setShorthandMode(!shorthandMode); setAiSuggestion(null); setAiError(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                shorthandMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Shorthand modus
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {shorthandMode ? (
              <>
                {/* Shorthand textarea */}
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Verkorte notitie</label>
                  <textarea
                    className="mt-1 w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none min-h-[140px] resize-none"
                    placeholder="Typ verkorte notities, bijv: pt kl pijn 36, perc+, vit-, dx irr pulp, wkb gestart..."
                    value={shorthandText}
                    onChange={(e) => setShorthandText(e.target.value)}
                  />
                </div>

                {/* AI expand button */}
                <button
                  type="button"
                  onClick={handleAiExpand}
                  disabled={aiLoading || shorthandText.trim().length < 3}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500/80 hover:bg-amber-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {aiLoading ? 'Bezig met uitbreiden...' : 'AI Uitbreiden'}
                </button>

                {aiError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                    {aiError}
                  </div>
                )}

                {/* AI suggestion panel */}
                {aiSuggestion && (
                  <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                        <Sparkles className="h-3 w-3" />
                        AI-suggestie
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { label: 'Subjectief', value: aiSuggestion.subjective },
                        { label: 'Objectief', value: aiSuggestion.objective },
                        { label: 'Analyse', value: aiSuggestion.assessment },
                        { label: 'Plan', value: aiSuggestion.plan },
                      ].map((field) => (
                        field.value && (
                          <div key={field.label} className="rounded-xl bg-white/5 p-3">
                            <p className="text-xs text-amber-300/60 uppercase tracking-wider mb-1">{field.label}</p>
                            <p className="text-sm text-white/70">{field.value}</p>
                          </div>
                        )
                      ))}
                    </div>

                    {/* Original shorthand collapsible */}
                    <button
                      type="button"
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="flex items-center gap-1 text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                      {showOriginal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      Originele tekst
                    </button>
                    {showOriginal && (
                      <div className="rounded-lg bg-white/5 p-3 text-xs text-white/30 italic">
                        {aiSuggestion.originalShorthand}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAcceptSuggestion}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/80 hover:bg-green-500 rounded-lg text-xs font-medium text-white transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Overnemen
                      </button>
                      <button
                        type="button"
                        onClick={handleEditSuggestion}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Bewerken
                      </button>
                      <button
                        type="button"
                        onClick={handleDismissSuggestion}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-white/60 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Afwijzen
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Normal SOAP fields */
              <>
                {[
                  { id: 'subjective', label: 'Subjectief', placeholder: 'Klachten en anamnese van de patiënt...', value: subjective, setter: setSubjective },
                  { id: 'objective', label: 'Objectief', placeholder: 'Klinische bevindingen en onderzoeksresultaten...', value: objective, setter: setObjective },
                  { id: 'analysis', label: 'Analyse', placeholder: 'Diagnose en interpretatie...', value: analysis, setter: setAnalysis },
                  { id: 'plan', label: 'Plan', placeholder: 'Behandelplan en vervolgafspraken...', value: plan, setter: setPlan },
                ].map((field) => (
                  <div key={field.id}>
                    <label className="text-xs text-white/40 uppercase tracking-wider">{field.label}</label>
                    <textarea
                      className="mt-1 w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none min-h-[80px] resize-none"
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                    />
                  </div>
                ))}
              </>
            )}
            <div className="flex space-x-2">
              {!shorthandMode && (
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40">
                  {submitting ? 'Opslaan...' : 'Opslaan'}
                </button>
              )}
              <button type="button"
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => { setShowForm(false); setShorthandMode(false); setAiSuggestion(null); }}>
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes timeline */}
      <div className="space-y-3">
        {notes.length === 0 && !showForm && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-white/40 text-sm">Geen notities gevonden</p>
          </div>
        )}
        {notes.map((note) => {
          const soap = parseSoapContent(note.content);
          return (
            <div key={note.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs border border-purple-500/20">
                    {note.noteType}
                  </span>
                  <span className="text-sm text-white/50">
                    {note.author.firstName} {note.author.lastName}
                  </span>
                </div>
                <span className="text-xs text-white/30">{formatDate(note.createdAt)}</span>
              </div>
              {note.noteType === 'SOAP' && soap.subjective !== undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {soap.subjective && (
                    <div className="glass-light rounded-xl p-3">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Subjectief</p>
                      <p className="text-white/70">{soap.subjective}</p>
                    </div>
                  )}
                  {soap.objective && (
                    <div className="glass-light rounded-xl p-3">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Objectief</p>
                      <p className="text-white/70">{soap.objective}</p>
                    </div>
                  )}
                  {soap.analysis && (
                    <div className="glass-light rounded-xl p-3">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Analyse</p>
                      <p className="text-white/70">{soap.analysis}</p>
                    </div>
                  )}
                  {soap.plan && (
                    <div className="glass-light rounded-xl p-3">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Plan</p>
                      <p className="text-white/70">{soap.plan}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/70">{soap.text || note.content}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
