'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pill, AlertCircle, Download, Printer, Mail } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Prescription {
  id: string;
  medicationName: string;
  genericName: string | null;
  dosage: string;
  frequency: string;
  duration: string | null;
  quantity: number | null;
  route: string;
  instructions: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED' | 'CANCELLED';
  prescribedAt: string;
  discontinuedAt: string | null;
  prescriber: { firstName: string; lastName: string };
}

const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/20',
  COMPLETED: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  DISCONTINUED: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  CANCELLED: 'bg-white/10 text-white/40 border-white/10',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actief',
  COMPLETED: 'Voltooid',
  DISCONTINUED: 'Gestopt',
  CANCELLED: 'Geannuleerd',
};

interface PrescriptionListProps {
  patientId: string;
  appointmentId?: string;
  refreshKey?: number;
}

export default function PrescriptionList({ patientId, appointmentId, refreshKey }: PrescriptionListProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/prescriptions?patientId=${patientId}`;
      if (appointmentId) url += `&appointmentId=${appointmentId}`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, appointmentId]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions, refreshKey]);

  const [emailSent, setEmailSent] = useState<string | null>(null);

  async function handleDownload(id: string) {
    try {
      const res = await authFetch(`/api/prescriptions/${id}/pdf`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recept-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // download failed
    }
  }

  async function handlePrint(id: string) {
    try {
      const res = await authFetch(`/api/prescriptions/${id}/pdf`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.addEventListener('load', () => win.print());
      }
    } catch {
      // print failed
    }
  }

  function handleEmail(id: string) {
    setEmailSent(id);
    setTimeout(() => setEmailSent(null), 2000);
  }

  async function handleDiscontinue(id: string) {
    const res = await authFetch(`/api/prescriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'DISCONTINUED' }),
    });
    if (res.ok) {
      fetchPrescriptions();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <Pill className="h-10 w-10 mx-auto mb-2 text-white/15" />
        <p className="text-sm text-white/30">Geen recepten gevonden</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {prescriptions.map((rx) => (
        <div key={rx.id} className={`glass-light rounded-xl p-3 ${rx.status === 'ACTIVE' ? 'border border-green-500/20' : 'border border-white/5'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">{rx.medicationName}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${STATUS_CLASSES[rx.status]}`}>
                  {STATUS_LABELS[rx.status]}
                </span>
              </div>
              {rx.genericName && (
                <p className="text-[10px] text-white/30 mt-0.5">{rx.genericName}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
                <span>{rx.dosage}</span>
                <span>{rx.frequency}</span>
                {rx.duration && <span>{rx.duration}</span>}
                {rx.quantity && <span>{rx.quantity} st.</span>}
              </div>
              {rx.instructions && (
                <div className="flex items-start gap-1.5 mt-1.5">
                  <AlertCircle className="h-3 w-3 text-amber-400/60 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-white/40">{rx.instructions}</p>
                </div>
              )}
              <p className="text-[10px] text-white/25 mt-1.5">
                {rx.prescriber.firstName} {rx.prescriber.lastName} &middot;{' '}
                {new Date(rx.prescribedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {rx.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => handleDownload(rx.id)}
                    title="Download PDF"
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handlePrint(rx.id)}
                    title="Printen"
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleEmail(rx.id)}
                    title="E-mail verzenden"
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {emailSent === rx.id ? (
                      <span className="text-[9px] text-green-300 whitespace-nowrap">Verzonden</span>
                    ) : (
                      <Mail className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDiscontinue(rx.id)}
                    className="px-2.5 py-1.5 text-[10px] rounded-lg text-amber-300 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                  >
                    Stoppen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
