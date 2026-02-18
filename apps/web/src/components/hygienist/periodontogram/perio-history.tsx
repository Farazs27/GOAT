'use client';

import React, { useState, useMemo } from 'react';
import type { PerioSiteData } from './perio-summary';
import { calculatePerioStats } from './perio-summary';

// ── Types ──────────────────────────────────────────────────

export interface PerioSession {
  id: string;
  createdAt: string;
  sessionType: string;
  sessionNote?: string | null;
  sites: PerioSiteData[];
}

type ViewMode = 'overlay' | 'side-by-side';

// ── Color helpers (static) ─────────────────────────────────

const improvedClass = 'text-emerald-400';
const worsenedClass = 'text-red-400';
const neutralClass = 'text-slate-400';

function deltaColor(current: number, previous: number, lowerIsBetter: boolean) {
  if (current === previous) return neutralClass;
  const improved = lowerIsBetter ? current < previous : current > previous;
  return improved ? improvedClass : worsenedClass;
}

function deltaLabel(current: number, previous: number, lowerIsBetter: boolean) {
  if (current === previous) return 'unchanged';
  const improved = lowerIsBetter ? current < previous : current > previous;
  return improved ? 'improved' : 'worsened';
}

// ── Tooth chart bar (shared for overlay) ───────────────────

const MAX_DEPTH = 12;

function OverlayBar({
  tooth,
  currentDepth,
  previousDepth,
}: {
  tooth: number;
  currentDepth: number;
  previousDepth: number;
}) {
  const currentPct = Math.min((currentDepth / MAX_DEPTH) * 100, 100);
  const previousPct = Math.min((previousDepth / MAX_DEPTH) * 100, 100);
  const improved = currentDepth < previousDepth;
  const worsened = currentDepth > previousDepth;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative h-24 w-5 rounded bg-slate-800 overflow-hidden">
        {/* Previous session (ghost) */}
        <div
          className="absolute bottom-0 w-full bg-slate-600/40 border border-dashed border-slate-500/50 rounded-t"
          style={{ height: `${previousPct}%` }}
        />
        {/* Current session (filled) */}
        <div
          className={`absolute bottom-0 w-full rounded-t ${
            improved
              ? 'bg-emerald-500/70'
              : worsened
              ? 'bg-red-500/70'
              : 'bg-sky-500/70'
          }`}
          style={{ height: `${currentPct}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-400">{tooth}</span>
    </div>
  );
}

// ── Summary delta row ──────────────────────────────────────

function SummaryDelta({
  label,
  current,
  previous,
  unit,
  lowerIsBetter,
}: {
  label: string;
  current: number;
  previous: number;
  unit: string;
  lowerIsBetter: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-400 w-24">{label}:</span>
      <span className="text-slate-300">
        {previous}
        {unit}
      </span>
      <span className="text-slate-500">-&gt;</span>
      <span className="text-white font-medium">
        {current}
        {unit}
      </span>
      <span className={`text-xs ${deltaColor(current, previous, lowerIsBetter)}`}>
        ({deltaLabel(current, previous, lowerIsBetter)})
      </span>
    </div>
  );
}

// ── Side-by-side mini chart ────────────────────────────────

function MiniChart({ sites, label }: { sites: PerioSiteData[]; label: string }) {
  const stats = calculatePerioStats(sites);
  // Group by tooth, compute average PD per tooth
  const toothMap = new Map<number, number[]>();
  sites.forEach((s) => {
    const arr = toothMap.get(s.toothNumber) || [];
    arr.push(s.probingDepth);
    toothMap.set(s.toothNumber, arr);
  });

  const teeth = Array.from(toothMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([num, depths]) => ({
      num,
      avgPD: Math.round((depths.reduce((a, b) => a + b, 0) / depths.length) * 10) / 10,
    }));

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-xs font-medium text-slate-300 mb-2">{label}</h4>
      <div className="flex items-end gap-0.5 overflow-x-auto pb-1">
        {teeth.map((t) => {
          const pct = Math.min((t.avgPD / MAX_DEPTH) * 100, 100);
          const color =
            t.avgPD < 4
              ? 'bg-emerald-500/70'
              : t.avgPD < 6
              ? 'bg-amber-500/70'
              : 'bg-red-500/70';
          return (
            <div key={t.num} className="flex flex-col items-center gap-0.5">
              <div className="relative h-16 w-4 rounded bg-slate-800 overflow-hidden">
                <div
                  className={`absolute bottom-0 w-full rounded-t ${color}`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500">{t.num}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-slate-400">
        <div>BOP: {stats.bopPercent}%</div>
        <div>Mean PD: {stats.meanPD}mm</div>
        <div>Sites {'>'}=6mm: {stats.sitesGte6}</div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

interface PerioHistoryProps {
  sessions: PerioSession[];
  currentSessionId?: string;
}

export default function PerioHistory({ sessions, currentSessionId }: PerioHistoryProps) {
  const [mode, setMode] = useState<ViewMode>('overlay');

  // Current session = most recent or specified
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [sessions]
  );

  const currentSession = currentSessionId
    ? sortedSessions.find((s) => s.id === currentSessionId) ?? sortedSessions[0]
    : sortedSessions[0];

  const previousSessions = sortedSessions.filter((s) => s.id !== currentSession?.id);
  const [selectedPreviousId, setSelectedPreviousId] = useState<string>(
    previousSessions[0]?.id ?? ''
  );

  const previousSession = previousSessions.find((s) => s.id === selectedPreviousId);

  if (!currentSession || sortedSessions.length < 2) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm text-slate-400">
        Minimaal 2 sessies nodig voor vergelijking
      </div>
    );
  }

  const currentStats = calculatePerioStats(currentSession.sites);
  const previousStats = previousSession
    ? calculatePerioStats(previousSession.sites)
    : null;

  // Build overlay data: average PD per tooth for both sessions
  const buildToothAvg = (sites: PerioSiteData[]) => {
    const map = new Map<number, number[]>();
    sites.forEach((s) => {
      const arr = map.get(s.toothNumber) || [];
      arr.push(s.probingDepth);
      map.set(s.toothNumber, arr);
    });
    return new Map(
      Array.from(map.entries()).map(([k, v]) => [
        k,
        Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10,
      ])
    );
  };

  const currentToothAvg = buildToothAvg(currentSession.sites);
  const previousToothAvg = previousSession
    ? buildToothAvg(previousSession.sites)
    : new Map<number, number>();

  const allTeeth = Array.from(
    new Set([...currentToothAvg.keys(), ...previousToothAvg.keys()])
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-3">
      {/* Mode toggle + session selector */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setMode('overlay')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'overlay'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overlay
          </button>
          <button
            onClick={() => setMode('side-by-side')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'side-by-side'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Naast elkaar
          </button>
        </div>

        <select
          value={selectedPreviousId}
          onChange={(e) => setSelectedPreviousId(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-slate-300"
        >
          {previousSessions.map((s) => (
            <option key={s.id} value={s.id}>
              {new Date(s.createdAt).toLocaleDateString('nl-NL')} — {s.sessionType}
            </option>
          ))}
        </select>
      </div>

      {/* Overlay mode */}
      {mode === 'overlay' && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded bg-sky-500/70" /> Huidig
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded border border-dashed border-slate-500/50 bg-slate-600/40" />{' '}
              Vorig
            </span>
          </div>
          <div className="flex items-end gap-1 overflow-x-auto pb-2">
            {allTeeth.map((tooth) => (
              <OverlayBar
                key={tooth}
                tooth={tooth}
                currentDepth={currentToothAvg.get(tooth) ?? 0}
                previousDepth={previousToothAvg.get(tooth) ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Side-by-side mode */}
      {mode === 'side-by-side' && previousSession && (
        <div className="flex gap-3">
          <MiniChart
            sites={previousSession.sites}
            label={`${new Date(previousSession.createdAt).toLocaleDateString('nl-NL')}`}
          />
          <div className="w-px bg-white/10" />
          <MiniChart
            sites={currentSession.sites}
            label={`${new Date(currentSession.createdAt).toLocaleDateString('nl-NL')} (huidig)`}
          />
        </div>
      )}

      {/* Summary delta */}
      {previousStats && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 space-y-1">
          <h4 className="text-xs font-medium text-slate-300 mb-2">Vergelijking</h4>
          <SummaryDelta
            label="BOP"
            current={currentStats.bopPercent}
            previous={previousStats.bopPercent}
            unit="%"
            lowerIsBetter
          />
          <SummaryDelta
            label="Plaque"
            current={currentStats.plaquePercent}
            previous={previousStats.plaquePercent}
            unit="%"
            lowerIsBetter
          />
          <SummaryDelta
            label="Mean PD"
            current={currentStats.meanPD}
            previous={previousStats.meanPD}
            unit="mm"
            lowerIsBetter
          />
          <SummaryDelta
            label="Sites >=6"
            current={currentStats.sitesGte6}
            previous={previousStats.sitesGte6}
            unit=""
            lowerIsBetter
          />
        </div>
      )}
    </div>
  );
}
