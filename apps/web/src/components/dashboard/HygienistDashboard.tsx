'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Clock, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface HygienistData {
  todayAppointments: Array<{
    id: string;
    startTime: string;
    endTime: string;
    appointmentType: string;
    status: string;
    patientName: string;
    patientId: string;
  }>;
  pendingPerioCharts: Array<{
    patientId: string;
    patientName: string;
    appointmentDate: string;
  }>;
  overduePatients: Array<{
    patientId: string;
    patientName: string;
    lastVisit: string;
    daysOverdue: number;
  }>;
  bopTrends: Array<{
    date: string;
    bopPercent: number;
    patientName: string;
  }>;
}

export function HygienistDashboard() {
  const [data, setData] = useState<HygienistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/dashboard/hygienist')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-[var(--text-secondary)] text-center py-12">Kon dashboard niet laden</div>;
  }

  const maxBop = Math.max(...data.bopTrends.map((t) => t.bopPercent), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mondhygienist Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">Vandaag</h2>
            <span className="ml-auto text-sm text-[var(--text-secondary)]">
              {data.todayAppointments.length} afspraken
            </span>
          </div>
          {data.todayAppointments.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Geen afspraken vandaag</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.todayAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <span className="text-sm font-mono text-[var(--text-secondary)] w-12">
                    {new Date(a.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] flex-1">{a.patientName}</span>
                  <span className="text-xs px-2 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                    {a.appointmentType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending perio charts */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-[var(--text-primary)]">Openstaande Paro Charts</h2>
            <span className="ml-auto text-sm text-[var(--text-secondary)]">
              {data.pendingPerioCharts.length}
            </span>
          </div>
          {data.pendingPerioCharts.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Alle charts bijgewerkt</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.pendingPerioCharts.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{p.patientName}</span>
                    <span className="text-xs text-[var(--text-secondary)] ml-2">
                      {new Date(p.appointmentDate).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/patienten/${p.patientId}/odontogram?mode=perio`}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                  >
                    Start
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue patients */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-[var(--text-primary)]">Overdue Patienten</h2>
            <span className="ml-auto text-sm text-[var(--text-secondary)]">
              {data.overduePatients.length}
            </span>
          </div>
          {data.overduePatients.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Geen overdue patienten</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.overduePatients.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{p.patientName}</span>
                    <span className="text-xs text-[var(--text-secondary)] ml-2">
                      Laatste bezoek: {new Date(p.lastVisit).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-red-500">{p.daysOverdue}d overdue</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOP Trends */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-[var(--text-primary)]">BOP Trends</h2>
          </div>
          {data.bopTrends.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Nog geen paro charts opgeslagen</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end gap-2 h-32">
                {data.bopTrends.map((t, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-[var(--text-primary)]">{t.bopPercent}%</span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${Math.max((t.bopPercent / maxBop) * 100, 8)}%`,
                        backgroundColor:
                          t.bopPercent <= 10
                            ? 'var(--success, #22c55e)'
                            : t.bopPercent <= 25
                              ? 'var(--warning, #f59e0b)'
                              : 'var(--error, #ef4444)',
                      }}
                    />
                    <span className="text-[10px] text-[var(--text-secondary)] truncate w-full text-center">
                      {new Date(t.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {data.bopTrends.map((t, i) => (
                  <div key={i} className="flex items-center text-xs text-[var(--text-secondary)]">
                    <span className="truncate flex-1">{t.patientName}</span>
                    <span className="font-mono ml-2">{t.bopPercent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
