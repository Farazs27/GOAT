"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  AlertTriangle,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerioOverview {
  totalPatients: number;
  avgBop: number;
  avgPlaque: number;
  highRiskCount: number;
  totalSessions: number;
}

interface TrendData {
  month: string;
  bopPercent: number;
  sessionCount: number;
}

interface TreatmentStats {
  totalTreatments: number;
  totalRevenue: number;
  topCodes: { code: string; description: string; count: number }[];
}

interface ComplianceRow {
  id: string;
  name: string;
  lastVisit: string | null;
  recallStatus: string | null;
  recallDue: string | null;
  bopPercent: number | null;
  bopTrend: "up" | "down" | "stable";
  riskLevel: "high" | "medium" | "low" | null;
}

export default function ReportsPage() {
  const [overview, setOverview] = useState<PerioOverview | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [treatmentStats, setTreatmentStats] = useState<TreatmentStats | null>(null);
  const [compliance, setCompliance] = useState<ComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [r1, r2, r3, r4] = await Promise.all([
        authFetch("/api/hygienist/reports?type=perio-overview"),
        authFetch("/api/hygienist/reports?type=trends"),
        authFetch("/api/hygienist/reports?type=treatment-stats"),
        authFetch("/api/hygienist/reports?type=compliance"),
      ]);

      if (r1.ok) setOverview(await r1.json());
      if (r2.ok) {
        const d = await r2.json();
        setTrends(d.trends);
      }
      if (r3.ok) setTreatmentStats(await r3.json());
      if (r4.ok) {
        const d = await r4.json();
        setCompliance(d.compliance);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30" />
      </div>
    );
  }

  const riskColorMap = {
    high: "bg-red-500/20 text-red-300",
    medium: "bg-yellow-500/20 text-yellow-300",
    low: "bg-emerald-500/20 text-emerald-300",
  };

  const recallStatusMap: Record<string, string> = {
    DUE: "bg-yellow-500/20 text-yellow-300",
    OVERDUE: "bg-red-500/20 text-red-300",
    COMPLETED: "bg-emerald-500/20 text-emerald-300",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Rapporten</h1>

      {/* Perio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Patienten met perio data"
          value={overview?.totalPatients ?? 0}
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Gem. BOP%"
          value={`${overview?.avgBop ?? 0}%`}
          accent={overview && overview.avgBop > 30 ? "red" : "green"}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Gem. Plaque Index"
          value={`${overview?.avgPlaque ?? 0}%`}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Hoog risico"
          value={overview?.highRiskCount ?? 0}
          accent="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BOP Trend */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">BOP% Trend (6 maanden)</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                />
                <Line type="monotone" dataKey="bopPercent" stroke="#e8945a" strokeWidth={2} dot={{ fill: "#e8945a" }} name="BOP %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--text-muted)] text-sm">Geen data</div>
          )}
        </div>

        {/* Sessions per Month */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Sessies per maand</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                />
                <Bar dataKey="sessionCount" fill="#e8945a" radius={[6, 6, 0, 0]} name="Sessies" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--text-muted)] text-sm">Geen data</div>
          )}
        </div>
      </div>

      {/* Treatment Stats */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Behandelstatistieken deze maand</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{treatmentStats?.totalTreatments ?? 0}</div>
            <div className="text-xs text-[var(--text-muted)]">Behandelingen</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              EUR {treatmentStats?.totalRevenue?.toLocaleString("nl-NL", { minimumFractionDigits: 2 }) ?? "0,00"}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Omzet</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-2">Top verrichtingscodes</div>
            {treatmentStats?.topCodes.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-[var(--text-secondary)] truncate">{c.code} - {c.description}</span>
                <span className="text-[var(--text-muted)] ml-2">{c.count}x</span>
              </div>
            )) ?? <div className="text-sm text-[var(--text-muted)]">Geen data</div>}
          </div>
        </div>
      </div>

      {/* Patient Compliance Table */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Patientcompliance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 text-[var(--text-muted)] font-medium">Patient</th>
                <th className="text-left py-2 text-[var(--text-muted)] font-medium">Laatste bezoek</th>
                <th className="text-left py-2 text-[var(--text-muted)] font-medium">Recall</th>
                <th className="text-left py-2 text-[var(--text-muted)] font-medium">BOP%</th>
                <th className="text-left py-2 text-[var(--text-muted)] font-medium">Trend</th>
                <th className="text-left py-2 text-[var(--text-muted)] font-medium">Risico</th>
              </tr>
            </thead>
            <tbody>
              {compliance.map((row) => (
                <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="py-2.5 text-[var(--text-secondary)]">{row.name}</td>
                  <td className="py-2.5 text-[var(--text-muted)]">
                    {row.lastVisit ? new Date(row.lastVisit).toLocaleDateString("nl-NL") : "-"}
                  </td>
                  <td className="py-2.5">
                    {row.recallStatus ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${recallStatusMap[row.recallStatus] || "bg-white/[0.06] text-[var(--text-muted)]"}`}>
                        {row.recallStatus}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 text-[var(--text-secondary)]">
                    {row.bopPercent !== null ? `${row.bopPercent}%` : "-"}
                  </td>
                  <td className="py-2.5">
                    {row.bopTrend === "up" && <TrendingUp className="h-4 w-4 text-red-400" />}
                    {row.bopTrend === "down" && <TrendingDown className="h-4 w-4 text-emerald-400" />}
                    {row.bopTrend === "stable" && <Minus className="h-4 w-4 text-[var(--text-muted)]" />}
                  </td>
                  <td className="py-2.5">
                    {row.riskLevel ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${riskColorMap[row.riskLevel]}`}>
                        {row.riskLevel === "high" ? "Hoog" : row.riskLevel === "medium" ? "Midden" : "Laag"}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {compliance.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">Geen patienten gevonden</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "red" | "green";
}) {
  const accentColor = accent === "red" ? "text-red-400" : accent === "green" ? "text-emerald-400" : "text-[var(--text-primary)]";
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-[var(--text-muted)]">{icon}</div>
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${accentColor}`}>{value}</div>
    </div>
  );
}
