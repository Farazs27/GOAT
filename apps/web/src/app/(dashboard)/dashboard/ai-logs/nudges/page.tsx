'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import {
  Bell,
  CheckCircle2,
  Minus,
  MessageCircle,
  Smartphone,
  TrendingUp,
  MousePointerClick,
  CalendarCheck,
} from 'lucide-react';

interface Nudge {
  id: string;
  patient: { firstName: string; lastName: string };
  nudgeType: string;
  channel: string;
  message: string;
  sentAt: string;
  clickedAt: string | null;
  bookedAt: string | null;
  hasBookedSince: boolean;
}

export default function NudgeLogsPage() {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchNudges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (channelFilter) params.set('channel', channelFilter);

      const res = await authFetch(`/api/dashboard/nudge-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNudges(data.nudges);
        setTotal(data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [offset, channelFilter]);

  useEffect(() => {
    fetchNudges();
  }, [fetchNudges]);

  const clickedCount = nudges.filter((n) => n.clickedAt).length;
  const bookedCount = nudges.filter((n) => n.hasBookedSince).length;
  const clickRate = total > 0 ? ((clickedCount / nudges.length) * 100).toFixed(1) : '0';
  const bookingRate = total > 0 ? ((bookedCount / nudges.length) * 100).toFixed(1) : '0';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const channelIcon = (ch: string) =>
    ch === 'whatsapp' ? (
      <MessageCircle className="h-4 w-4 text-green-400" />
    ) : (
      <Smartphone className="h-4 w-4 text-blue-400" />
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Assistent Logs</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Nudge geschiedenis en conversie tracking
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] w-fit">
        <Link
          href="/dashboard/ai-logs"
          className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors"
        >
          Gesprekken
        </Link>
        <div className="px-4 py-2 rounded-lg bg-white/[0.08] text-sm font-medium text-[var(--text-primary)]">
          Nudges
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{total}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Totaal verzonden</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <MousePointerClick className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{clickRate}%</p>
              <p className="text-xs text-[var(--text-tertiary)]">Klikpercentage</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CalendarCheck className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{bookingRate}%</p>
              <p className="text-xs text-[var(--text-tertiary)]">Boekingsconversie</p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Filter */}
      <div className="flex items-center gap-2">
        {['', 'whatsapp', 'in_app'].map((ch) => (
          <button
            key={ch}
            onClick={() => { setChannelFilter(ch); setOffset(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              channelFilter === ch
                ? 'bg-white/[0.10] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {ch === '' ? 'Alles' : ch === 'whatsapp' ? 'WhatsApp' : 'In-app'}
          </button>
        ))}
      </div>

      {/* Nudge Table */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Laden...</div>
      ) : nudges.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-secondary)]">Geen nudges gevonden</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--text-tertiary)] border-b border-white/[0.06]">
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Kanaal</th>
                <th className="pb-3 font-medium">Bericht</th>
                <th className="pb-3 font-medium">Verzonden</th>
                <th className="pb-3 font-medium">Geklikt</th>
                <th className="pb-3 font-medium">Geboekt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {nudges.map((nudge) => (
                <tr key={nudge.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 text-[var(--text-primary)] font-medium">
                    {nudge.patient.firstName} {nudge.patient.lastName}
                  </td>
                  <td className="py-3 text-[var(--text-secondary)] capitalize">
                    {nudge.nudgeType.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-1.5">
                      {channelIcon(nudge.channel)}
                      <span className="text-[var(--text-secondary)]">
                        {nudge.channel === 'whatsapp' ? 'WhatsApp' : 'In-app'}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 text-[var(--text-secondary)] max-w-[200px] truncate">
                    {nudge.message}
                  </td>
                  <td className="py-3 text-[var(--text-tertiary)]">
                    {formatDate(nudge.sentAt)}
                  </td>
                  <td className="py-3">
                    {nudge.clickedAt ? (
                      <span className="text-[var(--text-secondary)]">
                        {formatDate(nudge.clickedAt)}
                      </span>
                    ) : (
                      <Minus className="h-4 w-4 text-[var(--text-tertiary)]" />
                    )}
                  </td>
                  <td className="py-3">
                    {nudge.hasBookedSince ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <Minus className="h-4 w-4 text-[var(--text-tertiary)]" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
}
