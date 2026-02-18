'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Flag,
  Plus,
  ChevronDown,
  Clock,
  User as UserIcon,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  X,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface NoteFlag {
  id: string;
  flagType: string;
  comment: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; role: string };
}

interface ClinicalNote {
  id: string;
  noteType: string;
  content: string;
  isConfidential: boolean;
  createdAt: string;
  isPerioSummary: boolean;
  perioChartId: string | null;
  author: { id: string; name: string; role: string };
  flags: NoteFlag[];
}

const FLAG_TYPES = ['Needs follow-up', 'Noted', 'Urgent', 'Discuss at next visit'] as const;

const FLAG_COLORS: Record<string, string> = {
  'Urgent': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Needs follow-up': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Discuss at next visit': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Noted': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const ROLE_BADGES: Record<string, string> = {
  DENTIST: 'bg-blue-500/20 text-blue-300',
  HYGIENIST: 'bg-emerald-500/20 text-emerald-300',
  PRACTICE_ADMIN: 'bg-purple-500/20 text-purple-300',
};

const ROLE_LABELS: Record<string, string> = {
  DENTIST: 'Tandarts',
  HYGIENIST: 'Hygiënist',
  PRACTICE_ADMIN: 'Admin',
};

type FilterTab = 'all' | 'mine' | 'dentist';

export default function HygienistPatientNotesPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showNewNote, setShowNewNote] = useState(false);
  const [flagDropdownNoteId, setFlagDropdownNoteId] = useState<string | null>(null);
  const [flagComment, setFlagComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandShorthand, setExpandShorthand] = useState(false);

  // SOAP form state
  const [soapSubjective, setSoapSubjective] = useState('');
  const [soapObjective, setSoapObjective] = useState('');
  const [soapAssessment, setSoapAssessment] = useState('');
  const [soapPlan, setSoapPlan] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await authFetch(`/api/patients/${patientId}/clinical-notes`);
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error('Failed to fetch notes', e);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = notes.filter((n) => {
    if (filterTab === 'mine') return n.author.id === currentUserId;
    if (filterTab === 'dentist') return n.author.role === 'DENTIST';
    return true;
  });

  const createNote = async () => {
    const content = [
      soapSubjective && `S: ${soapSubjective}`,
      soapObjective && `O: ${soapObjective}`,
      soapAssessment && `A: ${soapAssessment}`,
      soapPlan && `P: ${soapPlan}`,
    ].filter(Boolean).join('\n\n');

    if (!content.trim()) return;

    setSubmitting(true);
    try {
      let finalContent = content;

      // AI shorthand expansion
      if (expandShorthand) {
        try {
          const expandRes = await authFetch('/api/ai/expand-notes', {
            method: 'POST',
            body: JSON.stringify({ text: content }),
          });
          if (expandRes.ok) {
            const expandData = await expandRes.json();
            finalContent = expandData.expanded || content;
          }
        } catch { /* use original content */ }
      }

      await authFetch(`/api/patients/${patientId}/clinical-notes`, {
        method: 'POST',
        body: JSON.stringify({
          content: finalContent,
          noteType: 'HYGIENE',
        }),
      });

      setShowNewNote(false);
      setSoapSubjective('');
      setSoapObjective('');
      setSoapAssessment('');
      setSoapPlan('');
      fetchNotes();
    } catch (e) {
      console.error('Failed to create note', e);
    } finally {
      setSubmitting(false);
    }
  };

  const addFlag = async (noteId: string, flagType: string) => {
    try {
      await authFetch(`/api/patients/${patientId}/clinical-notes/${noteId}/flags`, {
        method: 'POST',
        body: JSON.stringify({ flagType, comment: flagComment || undefined }),
      });
      setFlagDropdownNoteId(null);
      setFlagComment('');
      fetchNotes();
    } catch (e) {
      console.error('Failed to add flag', e);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const parseSoap = (content: string) => {
    const sections: { label: string; text: string }[] = [];
    const soapRegex = /([SOAP]):\s*([\s\S]*?)(?=(?:\n[SOAP]:)|$)/g;
    let match;
    while ((match = soapRegex.exec(content)) !== null) {
      const labels: Record<string, string> = { S: 'Subjectief', O: 'Objectief', A: 'Beoordeling', P: 'Plan' };
      sections.push({ label: labels[match[1]] || match[1], text: match[2].trim() });
    }
    return sections.length > 0 ? sections : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/hygienist/patients/${patientId}`}
            className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white/40 hover:text-white/60 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white/90 tracking-tight">Klinische Notities</h1>
            <p className="text-sm text-white/40 mt-0.5">Gedeelde notities van tandarts en hygiënist</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewNote(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nieuwe notitie
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {([
          { key: 'all' as FilterTab, label: 'Alle' },
          { key: 'mine' as FilterTab, label: 'Mijn notities' },
          { key: 'dentist' as FilterTab, label: 'Tandarts' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterTab === tab.key
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/[0.06] text-white/40 border border-transparent hover:text-white/60'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">
              ({tab.key === 'all' ? notes.length : tab.key === 'mine' ? notes.filter(n => n.author.id === currentUserId).length : notes.filter(n => n.author.role === 'DENTIST').length})
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      )}

      {/* Notes list */}
      {!loading && filteredNotes.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Geen notities gevonden</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const soapSections = parseSoap(note.content);
            return (
              <div
                key={note.id}
                className="bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-xl shadow-black/10 p-5"
              >
                {/* Note header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGES[note.author.role] || 'bg-white/10 text-white/50'}`}>
                      {ROLE_LABELS[note.author.role] || note.author.role}
                    </span>
                    <span className="text-sm text-white/60">{note.author.name}</span>
                    {note.isPerioSummary && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        <Activity className="w-3 h-3" />
                        Perio
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">
                      {note.noteType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">{formatDate(note.createdAt)}</span>
                    <div className="relative">
                      <button
                        onClick={() => setFlagDropdownNoteId(flagDropdownNoteId === note.id ? null : note.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/50 hover:bg-white/[0.06] transition-all"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                      {flagDropdownNoteId === note.id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#1a1a2e] border border-white/[0.12] rounded-xl shadow-xl z-10 w-56 p-3 space-y-2">
                          {FLAG_TYPES.map((ft) => (
                            <button
                              key={ft}
                              onClick={() => addFlag(note.id, ft)}
                              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all ${FLAG_COLORS[ft] || ''} hover:opacity-80`}
                            >
                              {ft}
                            </button>
                          ))}
                          <input
                            value={flagComment}
                            onChange={(e) => setFlagComment(e.target.value)}
                            placeholder="Opmerking..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white/[0.05] border border-white/[0.12] rounded-lg text-white/70 placeholder-white/30 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Flags */}
                {note.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {note.flags.map((f) => (
                      <span key={f.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${FLAG_COLORS[f.flagType] || 'bg-white/5 text-white/40 border-white/10'}`}>
                        {f.flagType}
                        {f.comment && ` - ${f.comment}`}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                {soapSections ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {soapSections.map((s, i) => (
                      <div key={i} className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
                        <div className="text-[10px] font-semibold text-white/40 uppercase mb-1">{s.label}</div>
                        <p className="text-sm text-white/70 whitespace-pre-wrap">{s.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New note modal */}
      {showNewNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white/90">Nieuwe notitie (SOAP)</h2>
              <button onClick={() => setShowNewNote(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* AI shorthand toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/40 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI afkortingen uitbreiden
                </label>
                <button
                  onClick={() => setExpandShorthand(!expandShorthand)}
                  className={`w-10 h-5 rounded-full transition-all ${expandShorthand ? 'bg-emerald-500/40' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${expandShorthand ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* SOAP fields */}
              {([
                { key: 'S', label: 'Subjectief', value: soapSubjective, set: setSoapSubjective, placeholder: 'Klachten patiënt...' },
                { key: 'O', label: 'Objectief', value: soapObjective, set: setSoapObjective, placeholder: 'Bevindingen onderzoek...' },
                { key: 'A', label: 'Assessment', value: soapAssessment, set: setSoapAssessment, placeholder: 'Diagnose / beoordeling...' },
                { key: 'P', label: 'Plan', value: soapPlan, set: setSoapPlan, placeholder: 'Behandelplan / vervolg...' },
              ] as const).map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">{field.key}: {field.label}</label>
                  <textarea
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    rows={2}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/50 transition-all resize-none"
                  />
                </div>
              ))}

              <button
                onClick={createNote}
                disabled={submitting || (!soapSubjective && !soapObjective && !soapAssessment && !soapPlan)}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Notitie opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
