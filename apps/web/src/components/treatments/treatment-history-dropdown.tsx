'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface HistoryItem {
  id: string;
  description: string;
  status: string;
  performedAt: string | null;
  createdAt: string;
  nzaCode: string | null;
  nzaDescription: string | null;
  toothNumber: number | null;
  practitionerName: string;
  appointmentDate: string | null;
  appointmentType: string | null;
  treatmentPlanTitle: string | null;
}

interface TreatmentHistoryDropdownProps {
  patientId: string;
  toothNumber?: number | null;
  nzaCode?: string | null;
  currentTreatmentId: string;
  token: string | null;
  /** If true, uses authFetch style (dashboard). If false, uses plain fetch with Bearer token. */
  useAuthFetch?: boolean;
}

const statusLabels: Record<string, string> = {
  PLANNED: 'Gepland',
  IN_PROGRESS: 'Bezig',
  COMPLETED: 'Klaar',
  CANCELLED: 'Geannuleerd',
};

const statusColors: Record<string, string> = {
  PLANNED: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/20',
};

export default function TreatmentHistoryDropdown({
  patientId,
  toothNumber,
  nzaCode,
  currentTreatmentId,
  token,
}: TreatmentHistoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchHistory = async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ patientId });
      if (toothNumber) params.set('toothNumber', String(toothNumber));
      if (nzaCode) params.set('nzaCode', nzaCode);

      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
      const res = await fetch(`/api/treatments/history?${params}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data: HistoryItem[] = await res.json();
        // Exclude the current treatment from history
        setHistory(data.filter((h) => h.id !== currentTreatmentId));
      }
    } catch (err) {
      console.error('Failed to fetch treatment history', err);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  const toggle = () => {
    if (!open) fetchHistory();
    setOpen(!open);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors mt-0.5"
        title="Behandelgeschiedenis bekijken"
      >
        <Clock className="h-3 w-3" />
        <span>Geschiedenis</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '400px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="mt-1.5 rounded-lg glass-light border border-white/5 p-2 space-y-1">
          {loading && (
            <div className="flex items-center justify-center py-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
            </div>
          )}

          {!loading && fetched && history.length === 0 && (
            <p className="text-[10px] text-white/25 text-center py-2">Geen eerdere behandelingen gevonden</p>
          )}

          {!loading &&
            history.map((h) => (
              <div
                key={h.id}
                className="flex items-start gap-2 p-1.5 rounded-md bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/50 font-medium">
                      {formatDate(h.appointmentDate || h.createdAt)}
                    </span>
                    <span className={`px-1 py-0.5 rounded text-[8px] border ${statusColors[h.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}>
                      {statusLabels[h.status] || h.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">
                    {h.practitionerName}
                    {h.treatmentPlanTitle && <span> &middot; {h.treatmentPlanTitle}</span>}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
