'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';

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
}

export default function SoapNoteForm({ patientId, notes, onNoteCreated }: SoapNoteFormProps) {
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [plan, setPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      onNoteCreated();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
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
          <h4 className="text-sm font-medium text-white/80 mb-4">Nieuwe SOAP-notitie</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex space-x-2">
              <button type="submit" disabled={submitting}
                className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40">
                {submitting ? 'Opslaan...' : 'Opslaan'}
              </button>
              <button type="button"
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setShowForm(false)}>
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
