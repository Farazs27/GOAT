"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  Send,
} from "lucide-react";

interface RecallItem {
  id: string;
  patient: { id: string; name: string; email: string };
  intervalMonths: number;
  nextDueDate: string;
  status: "DUE" | "OVERDUE" | "COMPLETED" | "CANCELLED";
  lastCompletedAt: string | null;
  reminderSentAt: string | null;
}

type FilterTab = "ALL" | "OVERDUE" | "DUE" | "COMPLETED";

export default function RecallsPage() {
  const [recalls, setRecalls] = useState<RecallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [showSetup, setShowSetup] = useState<string | null>(null);
  const [intervalInput, setIntervalInput] = useState(6);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRecalls = useCallback(async () => {
    const statusParam = filter === "ALL" ? "" : `?status=${filter}`;
    const res = await authFetch(`/api/hygienist/recalls${statusParam}`);
    if (res.ok) {
      const data = await res.json();
      setRecalls(data.recalls);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchRecalls();
  }, [fetchRecalls]);

  const handleMarkCompleted = async (recallId: string) => {
    setActionLoading(recallId);
    const res = await authFetch("/api/hygienist/recalls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markCompleted: true, recallId }),
    });
    if (res.ok) {
      fetchRecalls();
    }
    setActionLoading(null);
  };

  const handleSendReminder = async (recall: RecallItem) => {
    setActionLoading(`remind-${recall.id}`);
    // Create a conversation message using the recall template
    await authFetch("/api/hygienist/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: recall.patient.id,
        subject: "Recall herinnering",
        initialMessage: `Beste ${recall.patient.name}, het is tijd voor uw periodieke controle. Wij adviseren u om een afspraak te maken voor uw volgende behandeling. U kunt online boeken via het patientenportaal of bel ons op het praktijknummer.`,
      }),
    });
    setActionLoading(null);
    // Note: we don't refetch since reminder is sent via messaging
  };

  const handleSetInterval = async (patientId: string) => {
    setActionLoading(`setup-${patientId}`);
    await authFetch("/api/hygienist/recalls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, intervalMonths: intervalInput }),
    });
    setShowSetup(null);
    fetchRecalls();
    setActionLoading(null);
  };

  const getStatusInfo = (status: string, nextDueDate: string) => {
    const now = new Date();
    const due = new Date(nextDueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);

    if (status === "COMPLETED") {
      return { label: "Voltooid", color: "bg-emerald-500/20 text-emerald-300", icon: CheckCircle2 };
    }
    if (status === "OVERDUE" || diffDays < 0) {
      return { label: "Vervallen", color: "bg-red-500/20 text-red-300", icon: AlertCircle };
    }
    if (diffDays <= 14) {
      return { label: "Binnenkort", color: "bg-yellow-500/20 text-yellow-300", icon: Clock };
    }
    return { label: "Gepland", color: "bg-blue-500/20 text-blue-300", icon: Calendar };
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: "Alle" },
    { key: "OVERDUE", label: "Vervallen" },
    { key: "DUE", label: "Binnenkort" },
    { key: "COMPLETED", label: "Voltooid" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Recalls</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 glass-card rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
              filter === tab.key
                ? "bg-white/[0.08] text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recall Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-medium">Patient</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-medium">Interval</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-medium">Volgende datum</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-medium">Status</th>
              <th className="text-left px-5 py-3 text-[var(--text-muted)] font-medium">Laatste voltooid</th>
              <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Acties</th>
            </tr>
          </thead>
          <tbody>
            {recalls.map((recall) => {
              const statusInfo = getStatusInfo(recall.status, recall.nextDueDate);
              const StatusIcon = statusInfo.icon;
              return (
                <tr key={recall.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{recall.patient.name}</td>
                  <td className="px-5 py-3 text-[var(--text-muted)]">{recall.intervalMonths} mnd</td>
                  <td className="px-5 py-3 text-[var(--text-muted)]">
                    {new Date(recall.nextDueDate).toLocaleDateString("nl-NL")}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)]">
                    {recall.lastCompletedAt
                      ? new Date(recall.lastCompletedAt).toLocaleDateString("nl-NL")
                      : "-"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleSendReminder(recall)}
                        disabled={actionLoading === `remind-${recall.id}`}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-all text-[var(--text-tertiary)] hover:text-[#e8945a] disabled:opacity-40"
                        title="Herinnering sturen"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setShowSetup(showSetup === recall.patient.id ? null : recall.patient.id);
                          setIntervalInput(recall.intervalMonths);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-all text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                        title="Recall instellen"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      {recall.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleMarkCompleted(recall.id)}
                          disabled={actionLoading === recall.id}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-all text-[var(--text-tertiary)] hover:text-emerald-400 disabled:opacity-40"
                          title="Markeer voltooid"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {/* Interval Setup Popover */}
                    {showSetup === recall.patient.id && (
                      <div className="absolute right-8 mt-1 w-48 glass-card rounded-xl border border-white/[0.1] shadow-xl z-10 p-3">
                        <div className="text-xs text-[var(--text-muted)] mb-2">Recall interval (maanden)</div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1}
                            max={24}
                            value={intervalInput}
                            onChange={(e) => setIntervalInput(Number(e.target.value))}
                            className="flex-1 glass-input rounded-lg px-2 py-1.5 text-sm outline-none w-16"
                          />
                          <button
                            onClick={() => handleSetInterval(recall.patient.id)}
                            disabled={actionLoading === `setup-${recall.patient.id}`}
                            className="px-3 py-1.5 text-xs rounded-lg bg-[#e8945a] hover:bg-[#d4864a] text-white transition-all disabled:opacity-40"
                          >
                            Opslaan
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {recalls.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-muted)]">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Geen recalls gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
