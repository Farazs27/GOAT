'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PerioChart from '@/components/hygienist/periodontogram/perio-chart';
import PerioEntryPanel, { type PerioSiteData } from '@/components/hygienist/periodontogram/perio-entry-panel';

interface PerioSessionSummary {
  id: string;
  sessionType: string;
  sessionNote: string | null;
  createdAt: string;
  author: { id: string; firstName: string | null; lastName: string | null };
  sites: PerioSiteData[];
}

// Default all 32 teeth as present (user can customize later)
const ALL_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

export default function PerioPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [sessions, setSessions] = useState<PerioSessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sites, setSites] = useState<PerioSiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [presentTeeth] = useState<number[]>(ALL_TEETH);

  // Current entry position (derived from entry panel state)
  const [currentTooth, setCurrentTooth] = useState<number | undefined>(18);
  const [currentSurface, setCurrentSurface] = useState<'buccal' | 'lingual'>('buccal');

  const getToken = () => localStorage.getItem('access_token');

  // Fetch patient info
  useEffect(() => {
    const token = getToken();
    fetch(`/api/patients/${patientId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPatientName(`${data.firstName || ''} ${data.lastName || ''}`.trim());
      })
      .catch(() => {});
  }, [patientId]);

  // Fetch existing sessions
  useEffect(() => {
    setLoading(true);
    const token = getToken();
    fetch(`/api/hygienist/perio-sessions?patientId=${patientId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PerioSessionSummary[]) => {
        setSessions(data);
        if (data.length > 0) {
          setCurrentSessionId(data[0].id);
          setSites(data[0].sites || []);
        }
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  // Create new session
  const handleNewSession = async () => {
    const token = getToken();
    try {
      const resp = await fetch('/api/hygienist/perio-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId,
          sessionType: 'FULL',
          sites: [],
        }),
      });
      if (resp.ok) {
        const session = await resp.json();
        setSessions((prev) => [session, ...prev]);
        setCurrentSessionId(session.id);
        setSites([]);
      }
    } catch {
      // Silently fail
    }
  };

  // Load selected session
  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSessionId(session.id);
      setSites(session.sites || []);
    }
  };

  const handleSitesChange = useCallback((newSites: PerioSiteData[]) => {
    setSites(newSites);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400 text-sm">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h1 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Periodontogram
          </h1>
          {patientName && (
            <span className="text-sm text-slate-400">- {patientName}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Session selector */}
          {sessions.length > 0 && (
            <select
              value={currentSessionId || ''}
              onChange={(e) => handleSessionSelect(e.target.value)}
              className="bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-xl text-xs text-slate-300 px-3 py-1.5 focus:border-blue-400/50 outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.createdAt).toLocaleDateString('nl-NL')} - {s.sessionType}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleNewSession}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
          >
            Nieuwe Sessie
          </button>
        </div>
      </div>

      {/* Main content */}
      {!currentSessionId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-4">Geen parodontale sessies gevonden</p>
            <button
              onClick={handleNewSession}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
            >
              Start Nieuwe Sessie
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Chart (60%) */}
          <div className="w-3/5 overflow-auto p-4 border-r border-slate-700/50">
            <PerioChart
              presentTeeth={presentTeeth}
              sites={sites}
              currentTooth={currentTooth}
              currentSurface={currentSurface}
            />
          </div>

          {/* Right: Entry panel (40%) */}
          <div className="w-2/5 overflow-auto p-4">
            <PerioEntryPanel
              presentTeeth={presentTeeth}
              sessionId={currentSessionId}
              onSitesChange={handleSitesChange}
              initialSites={sites}
            />
          </div>
        </div>
      )}
    </div>
  );
}
