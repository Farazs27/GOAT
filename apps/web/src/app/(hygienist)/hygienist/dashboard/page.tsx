'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import {
  Clock,
  AlertTriangle,
  Activity,
  MessageSquare,
  Calendar,
  Users,
  Bell,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
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

interface StaffMessages {
  conversations?: Array<{ id: string; unreadCount?: number }>;
}

const glassCard = {
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
};

export default function HygienistDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [unreadStaff, setUnreadStaff] = useState(0);
  const [unreadPatient, setUnreadPatient] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Goedemorgen');
    else if (hour < 18) setGreeting('Goedemiddag');
    else setGreeting('Goedenavond');

    // Fetch dashboard data
    authFetch('/api/dashboard/hygienist')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch unread message counts
    authFetch('/api/staff-chat')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: StaffMessages | null) => {
        if (d?.conversations) {
          const count = d.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadStaff(count);
        }
      })
      .catch(() => {});
  }, []);

  const userName = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        return u.firstName || '';
      }
    } catch {}
    return '';
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-white/40 text-center py-12">Kon dashboard niet laden</div>;
  }

  const nextAppointment = data.todayAppointments.find(
    (a) => new Date(a.startTime) > new Date()
  );
  const highRiskCount = data.bopTrends.filter((t) => t.bopPercent > 25).length;
  const overdueRecallCount = data.overduePatients.length;
  const dueThisWeekCount = data.overduePatients.filter((p) => p.daysOverdue <= 7).length;
  const recentPatients = data.todayAppointments
    .filter((a) => new Date(a.startTime) < new Date())
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-8 pt-4 md:pt-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white/90 tracking-tight">
          {greeting}{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-white/40 mt-1 text-sm">Mondhygienist Dashboard</p>
      </div>

      {/* Top 4 Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vandaag */}
        <div className="rounded-2xl p-5 transition-all duration-300 hover:border-emerald-500/20" style={glassCard}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <h2 className="font-semibold text-white/90 text-sm">Vandaag</h2>
          </div>
          <p className="text-3xl font-bold text-white/90">{data.todayAppointments.length}</p>
          <p className="text-xs text-white/40 mt-1">afspraken</p>
          {nextAppointment && (
            <div className="mt-3 pt-3 border-t border-white/[0.08]">
              <p className="text-xs text-white/40">Volgende:</p>
              <p className="text-sm text-white/70 font-medium mt-0.5">
                {new Date(nextAppointment.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {nextAppointment.patientName}
              </p>
            </div>
          )}
        </div>

        {/* Recalls */}
        <div className="rounded-2xl p-5 transition-all duration-300 hover:border-red-500/20" style={glassCard}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-red-400" />
            </div>
            <h2 className="font-semibold text-white/90 text-sm">Recalls</h2>
            {overdueRecallCount > 0 && (
              <span className="ml-auto text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                {overdueRecallCount}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-white/90">{overdueRecallCount}</p>
          <p className="text-xs text-white/40 mt-1">overdue</p>
          <div className="mt-3 pt-3 border-t border-white/[0.08]">
            <p className="text-sm text-white/50">
              <span className="text-white/70 font-medium">{dueThisWeekCount}</span> deze week
            </p>
          </div>
        </div>

        {/* Perio Risico */}
        <div className="rounded-2xl p-5 transition-all duration-300 hover:border-orange-500/20" style={glassCard}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-orange-400" />
            </div>
            <h2 className="font-semibold text-white/90 text-sm">Perio Risico</h2>
          </div>
          <p className="text-3xl font-bold text-white/90">{highRiskCount}</p>
          <p className="text-xs text-white/40 mt-1">hoog risico</p>
          <div className="mt-3 pt-3 border-t border-white/[0.08]">
            <p className="text-sm text-white/50">
              <span className="text-white/70 font-medium">{data.pendingPerioCharts.length}</span> charts openstaand
            </p>
          </div>
        </div>

        {/* Berichten */}
        <div className="rounded-2xl p-5 transition-all duration-300 hover:border-blue-500/20" style={glassCard}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <h2 className="font-semibold text-white/90 text-sm">Berichten</h2>
          </div>
          <p className="text-3xl font-bold text-white/90">{unreadStaff + unreadPatient}</p>
          <p className="text-xs text-white/40 mt-1">ongelezen</p>
          <div className="mt-3 pt-3 border-t border-white/[0.08]">
            <p className="text-sm text-white/50">
              <span className="text-white/70 font-medium">{unreadStaff}</span> team
              {' / '}
              <span className="text-white/70 font-medium">{unreadPatient}</span> patient
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Agenda vandaag */}
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="font-semibold text-white/90 text-sm">Agenda vandaag</h2>
            </div>
            <Link href="/hygienist/agenda" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Bekijk alles <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.todayAppointments.length === 0 ? (
            <p className="text-sm text-white/30 py-4">Geen afspraken vandaag</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.todayAppointments.map((a) => {
                const isPast = new Date(a.startTime) < new Date();
                return (
                  <Link
                    key={a.id}
                    href={`/hygienist/patients/${a.patientId}`}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                      isPast ? 'bg-white/[0.02] opacity-60' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="text-sm font-mono text-white/40 w-12">
                      {new Date(a.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-sm font-medium text-white/80 flex-1 group-hover:text-white/95 transition-colors truncate">
                      {a.patientName}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium whitespace-nowrap">
                      {a.appointmentType}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recente patienten */}
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="font-semibold text-white/90 text-sm">Recente patienten</h2>
            </div>
            <Link href="/hygienist/patients" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Bekijk alles <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentPatients.length === 0 ? (
            <p className="text-sm text-white/30 py-4">Nog geen patienten gezien vandaag</p>
          ) : (
            <div className="space-y-2">
              {recentPatients.map((a) => (
                <Link
                  key={a.id}
                  href={`/hygienist/patients/${a.patientId}?tab=odontogram&mode=perio`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white/50">
                    {a.patientName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate group-hover:text-white/95">{a.patientName}</p>
                    <p className="text-xs text-white/30">
                      {new Date(a.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}{a.appointmentType}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400/70 font-medium whitespace-nowrap">Perio</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Vervallen recalls */}
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <h2 className="font-semibold text-white/90 text-sm">Vervallen recalls</h2>
            </div>
          </div>
          {data.overduePatients.length === 0 ? (
            <p className="text-sm text-white/30 py-4">Geen overdue patienten</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.overduePatients.slice(0, 5).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{p.patientName}</p>
                    <p className="text-xs text-white/30">
                      Laatste bezoek: {new Date(p.lastVisit).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-lg whitespace-nowrap">
                      {p.daysOverdue}d
                    </span>
                    <button
                      onClick={() => {
                        // TODO: integrate with nudge/recall system
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-medium whitespace-nowrap"
                    >
                      Herinnering
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
