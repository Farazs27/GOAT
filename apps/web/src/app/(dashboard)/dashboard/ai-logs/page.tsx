'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import {
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Filter,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

interface AiMessage {
  id: string;
  role: string;
  content: string;
  richCards: unknown;
  feedback: string | null;
  createdAt: string;
}

interface AiSession {
  id: string;
  patient: { id: string; firstName: string; lastName: string };
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  feedbackSummary: { thumbsUp: number; thumbsDown: number };
  lastActivity: string;
  messages: AiMessage[];
}

export default function AiLogsPage() {
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<AiSession | null>(null);
  const [filterNegative, setFilterNegative] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (filterNegative) params.set('hasFeedback', 'true');

      const res = await authFetch(`/api/dashboard/ai-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setTotal(data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [offset, filterNegative]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filteredSessions = searchQuery
    ? sessions.filter((s) => {
        const name = `${s.patient.firstName} ${s.patient.lastName}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      })
    : sessions;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Assistent Logs</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Bekijk alle AI-gesprekken en feedback van patienten
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] w-fit">
        <div className="px-4 py-2 rounded-lg bg-white/[0.08] text-sm font-medium text-[var(--text-primary)]">
          Gesprekken
        </div>
        <Link
          href="/dashboard/ai-logs/nudges"
          className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors"
        >
          Nudges
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Zoek patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <button
          onClick={() => setFilterNegative(!filterNegative)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors ${
            filterNegative
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.08] hover:bg-white/[0.06]'
          }`}
        >
          <Filter className="h-4 w-4" />
          Alleen met feedback
        </button>
        <span className="text-sm text-[var(--text-tertiary)]">
          {total} gesprekken totaal
        </span>
      </div>

      {/* Session List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">Laden...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-[var(--text-secondary)]">Geen AI-gesprekken gevonden</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10] transition-all duration-200 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">
                    {session.patient.firstName} {session.patient.lastName}
                  </span>
                  {session.title && (
                    <span className="text-xs text-[var(--text-tertiary)] truncate">
                      - {session.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-tertiary)]">
                  <span>{formatDate(session.lastActivity as string)}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {session.messageCount}
                  </span>
                  {session.feedbackSummary.thumbsUp > 0 && (
                    <span className="flex items-center gap-1 text-green-400">
                      <ThumbsUp className="h-3 w-3" />
                      {session.feedbackSummary.thumbsUp}
                    </span>
                  )}
                  {session.feedbackSummary.thumbsDown > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <ThumbsDown className="h-3 w-3" />
                      {session.feedbackSummary.thumbsDown}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-[var(--text-secondary)] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vorige
          </button>
          <span className="text-sm text-[var(--text-tertiary)]">
            {offset + 1}-{Math.min(offset + limit, total)} van {total}
          </span>
          <button
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-[var(--text-secondary)] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volgende
          </button>
        </div>
      )}

      {/* Slide-out Panel */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedSession(null)}
          />
          <div className="relative w-full max-w-lg bg-[var(--bg-primary)] border-l border-white/[0.08] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 p-4 border-b border-white/[0.06] bg-[var(--bg-primary)] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  {selectedSession.patient.firstName} {selectedSession.patient.lastName}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {selectedSession.title || 'Gesprek'} - {formatDate(selectedSession.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-5 w-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {selectedSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'assistant'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-[#e8945a]/20 text-[#e8945a]'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[var(--text-tertiary)]">
                        {msg.role === 'assistant' ? 'AI' : 'Patient'}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {new Date(msg.createdAt).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.feedback === 'up' && (
                        <ThumbsUp className="h-3 w-3 text-green-400" />
                      )}
                      {msg.feedback === 'down' && (
                        <ThumbsDown className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
