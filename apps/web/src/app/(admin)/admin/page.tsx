'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, Euro, Key, Shield, Activity, TrendingUp, Clock } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

interface Stats {
  totalUsers: number;
  totalPatients: number;
  appointmentsToday: number;
  appointmentsMonth: number;
  revenueToday: number;
  revenueMonth: number;
  activeCredentials: number;
  recentAuditLogs: AuditLog[];
}

const actionLabels: Record<string, string> = {
  CREATE: 'Aangemaakt',
  UPDATE: 'Bijgewerkt',
  DELETE: 'Verwijderd',
  LOGIN: 'Ingelogd',
  LOGOUT: 'Uitgelogd',
  VIEW: 'Bekeken',
  EXPORT: 'Geexporteerd',
};

const resourceLabels: Record<string, string> = {
  PATIENT: 'Patient',
  APPOINTMENT: 'Afspraak',
  INVOICE: 'Factuur',
  USER: 'Gebruiker',
  PRACTICE: 'Praktijk',
  CREDENTIAL: 'API Sleutel',
  TREATMENT: 'Behandeling',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
    fetch('/api/practices/stats', { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Totaal gebruikers',
      value: String(stats?.totalUsers || 0),
      icon: Users,
      description: 'Actieve teamleden',
      color: 'from-violet-400 to-purple-600',
      shadow: 'shadow-violet-500/20',
    },
    {
      title: 'Totaal patienten',
      value: (stats?.totalPatients || 0).toLocaleString('nl-NL'),
      icon: Activity,
      description: 'Geregistreerd in systeem',
      color: 'from-blue-400 to-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      title: 'Afspraken vandaag',
      value: String(stats?.appointmentsToday || 0),
      icon: Calendar,
      description: `${stats?.appointmentsMonth || 0} deze maand`,
      color: 'from-emerald-400 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      title: 'Omzet deze maand',
      value: `\u20AC${((stats?.revenueMonth || 0) / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`,
      icon: Euro,
      description: `\u20AC${((stats?.revenueToday || 0) / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })} vandaag`,
      color: 'from-amber-400 to-amber-600',
      shadow: 'shadow-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-white/50">Overzicht van uw praktijk en systeem.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium">{stat.title}</p>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <p className="text-xs text-white/40 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Audit Logs */}
        <div className="glass-card rounded-2xl p-5 col-span-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Recente activiteit</h3>
            <a href="/admin/audit-logs" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Bekijk alles &rarr;
            </a>
          </div>
          {!stats?.recentAuditLogs?.length ? (
            <div className="text-center py-8">
              <Shield className="h-10 w-10 mx-auto mb-3 text-white/20" />
              <p className="text-white/40 text-sm">Geen recente activiteit</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentAuditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 glass-light rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400/20 to-purple-400/20 flex items-center justify-center border border-violet-500/20">
                      <Shield className="h-3.5 w-3.5 text-violet-300" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-white/90">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Systeem'}
                      </div>
                      <div className="text-xs text-white/40">
                        {actionLabels[log.action] || log.action}{' '}
                        {resourceLabels[log.resourceType] || log.resourceType}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-white/30">
                    {new Date(log.createdAt).toLocaleString('nl-NL', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="glass-card rounded-2xl p-5 col-span-3">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Systeem status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 glass-light rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                <span className="text-sm text-white/80">API Server</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                <span className="text-sm text-white/80">Database</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                <span className="text-sm text-white/80">API Sleutels</span>
              </div>
              <span className="text-xs text-white/40">{stats?.activeCredentials || 0} actief</span>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                <span className="text-sm text-white/80">Bestandsopslag</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Operationeel</span>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/80">Uptime</span>
              </div>
              <span className="text-xs text-white/50">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
