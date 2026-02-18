'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Flag,
  Plus,
  ChevronDown,
  Info,
  Clock,
  User as UserIcon,
  AlertTriangle,
  MessageCircle,
  CheckCircle,
  Calendar,
  Activity,
  X,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import HygienistNoteForm from '@/components/patient/hygienist-note-form';

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

export default function PatientNotesPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [activeTab, setActiveTab] = useState<'dentist' | 'hygienist'>('dentist');
  const [dentistNotes, setDentistNotes] = useState<ClinicalNote[]>([]);
  const [hygienistNotes, setHygienistNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'SOAP' | 'PROGRESS'>('SOAP');
  const [flagDropdownNoteId, setFlagDropdownNoteId] = useState<string | null>(null);
  const [flagComment, setFlagComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const [dentistRes, hygienistRes] = await Promise.all([
        authFetch(`/api/patients/${patientId}/clinical-notes?type=SOAP,PROGRESS`),
        authFetch(`/api/patients/${patientId}/clinical-notes?type=HYGIENE`),
      ]);

      if (dentistRes.ok) {
        const data = await dentistRes.json();
        setDentistNotes(data);
      }
      if (hygienistRes.ok) {
        const data = await hygienistRes.json();
        setHygienistNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    // Get user role from token
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
      }
    } catch {
      // ignore
    }
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateDentistNote = async () => {
    if (!newNoteContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/patients/${patientId}/clinical-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteType: newNoteType,
          content: newNoteContent,
        }),
      });
      if (res.ok) {
        setNewNoteContent('');
        setShowNewNote(false);
        fetchNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFlag = async (noteId: string, flagType: string) => {
    try {
      const res = await authFetch(`/api/patients/${patientId}/clinical-notes/${noteId}/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagType, comment: flagComment || undefined }),
      });
      if (res.ok) {
        setFlagDropdownNoteId(null);
        setFlagComment('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Error adding flag:', error);
    }
  };

  const handleDeleteFlag = async (noteId: string, flagId: string) => {
    try {
      const res = await authFetch(
        `/api/patients/${patientId}/clinical-notes/${noteId}/flags?flagId=${flagId}`,
        { method: 'DELETE' }
      );
      if (res.ok) fetchNotes();
    } catch (error) {
      console.error('Error deleting flag:', error);
    }
  };

  const canCreateDentist = userRole === 'DENTIST';
  const canCreateHygienist = userRole === 'HYGIENIST';

  const renderHygieneContent = (note: ClinicalNote) => {
    try {
      const data = JSON.parse(note.content);
      return (
        <div className="space-y-3">
          {note.isPerioSummary && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">Parodontale sessie samenvatting</span>
              {note.perioChartId && (
                <Link
                  href={`/patients/${patientId}?tab=odontogram&mode=perio&chartId=${note.perioChartId}`}
                  className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 underline"
                >
                  Bekijk chart
                </Link>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.04] rounded-xl p-3">
              <span className="text-xs text-gray-400">Mondhygiene Score</span>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <div
                    key={n}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      n <= (data.oralHygieneScore || 0)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/[0.06] text-gray-500'
                    }`}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3">
              <span className="text-xs text-gray-400">BOP%</span>
              <p className="text-lg font-semibold text-white mt-1">{data.bopPercentage ?? '-'}%</p>
            </div>
          </div>
          {data.homeCareInstructions && (
            <div className="bg-white/[0.04] rounded-xl p-3">
              <span className="text-xs text-gray-400">Thuiszorg instructies</span>
              <p className="text-sm text-gray-200 mt-1">{data.homeCareInstructions}</p>
            </div>
          )}
          {data.complianceNotes && (
            <div className="bg-white/[0.04] rounded-xl p-3">
              <span className="text-xs text-gray-400">Compliantie</span>
              <p className="text-sm text-gray-200 mt-1">{data.complianceNotes}</p>
            </div>
          )}
          {data.nextVisitRecommendation && (
            <div className="bg-white/[0.04] rounded-xl p-3">
              <span className="text-xs text-gray-400">Volgende afspraak aanbeveling</span>
              <p className="text-sm text-gray-200 mt-1">{data.nextVisitRecommendation}</p>
            </div>
          )}
        </div>
      );
    } catch {
      return <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>;
    }
  };

  const renderNoteCard = (note: ClinicalNote) => (
    <div
      key={note.id}
      className={`bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.18] ${
        note.isPerioSummary ? 'border-emerald-500/20' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400">
              {new Date(note.createdAt).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-300">{note.author.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ROLE_BADGES[note.author.role] || 'bg-gray-500/20 text-gray-300'}`}>
              {note.author.role === 'DENTIST' ? 'Tandarts' : note.author.role === 'HYGIENIST' ? 'Mondhygienist' : note.author.role}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-gray-400 uppercase">
            {note.noteType}
          </span>
        </div>

        {/* Flag button */}
        <div className="relative">
          <button
            onClick={() => setFlagDropdownNoteId(flagDropdownNoteId === note.id ? null : note.id)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
            title="Flag toevoegen"
          >
            <Flag className="w-4 h-4 text-gray-400" />
          </button>

          {flagDropdownNoteId === note.id && (
            <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/[0.15] rounded-xl p-3 shadow-2xl">
              <p className="text-xs text-gray-400 mb-2">Flag toevoegen</p>
              <div className="space-y-1 mb-2">
                {FLAG_TYPES.map(ft => (
                  <button
                    key={ft}
                    onClick={() => handleAddFlag(note.id, ft)}
                    className="w-full text-left text-sm px-3 py-1.5 rounded-lg hover:bg-white/[0.08] text-gray-200 transition-colors"
                  >
                    {ft}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Opmerking (optioneel)..."
                value={flagComment}
                onChange={e => setFlagComment(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-white/[0.05] border border-white/[0.12] rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/[0.25]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Flags */}
      {note.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.flags.map(flag => (
            <span
              key={flag.id}
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${FLAG_COLORS[flag.flagType] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}
              title={`Door ${flag.createdBy.name}${flag.comment ? ': ' + flag.comment : ''}`}
            >
              {flag.flagType === 'Urgent' && <AlertTriangle className="w-3 h-3" />}
              {flag.flagType === 'Needs follow-up' && <Calendar className="w-3 h-3" />}
              {flag.flagType === 'Discuss at next visit' && <MessageCircle className="w-3 h-3" />}
              {flag.flagType === 'Noted' && <CheckCircle className="w-3 h-3" />}
              {flag.flagType}
              <button
                onClick={() => handleDeleteFlag(note.id, flag.id)}
                className="ml-0.5 hover:text-white transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      {note.noteType === 'HYGIENE' ? (
        renderHygieneContent(note)
      ) : (
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Klinische Notities</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('dentist')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === 'dentist'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-white/[0.06] text-gray-400 border border-white/[0.12] hover:bg-white/[0.09]'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Tandarts Notities
            <span className="text-[10px] bg-white/[0.1] px-1.5 py-0.5 rounded-full">{dentistNotes.length}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('hygienist')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === 'hygienist'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-white/[0.06] text-gray-400 border border-white/[0.12] hover:bg-white/[0.09]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Mondhygi&euml;nist Notities
            <span className="text-[10px] bg-white/[0.1] px-1.5 py-0.5 rounded-full">{hygienistNotes.length}</span>
          </div>
        </button>
      </div>

      {/* Dentist tab */}
      {activeTab === 'dentist' && (
        <div className="space-y-4">
          {canCreateDentist && (
            <>
              {!showNewNote ? (
                <button
                  onClick={() => setShowNewNote(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl transition-all duration-300 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Nieuwe notitie
                </button>
              ) : (
                <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Nieuwe tandarts notitie</h3>
                    <button onClick={() => setShowNewNote(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {(['SOAP', 'PROGRESS'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setNewNoteType(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          newNoteType === t
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-white/[0.06] text-gray-400 border border-white/[0.12]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    placeholder="Schrijf uw notitie..."
                    rows={5}
                    className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                  <button
                    onClick={handleCreateDentistNote}
                    disabled={submitting || !newNoteContent.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              )}
            </>
          )}

          {dentistNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen tandarts notities gevonden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dentistNotes.map(renderNoteCard)}
            </div>
          )}
        </div>
      )}

      {/* Hygienist tab */}
      {activeTab === 'hygienist' && (
        <div className="space-y-4">
          {canCreateHygienist && (
            <HygienistNoteForm
              patientId={patientId}
              onNoteCreated={fetchNotes}
            />
          )}

          {hygienistNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen mondhygienist notities gevonden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hygienistNotes.map(renderNoteCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
