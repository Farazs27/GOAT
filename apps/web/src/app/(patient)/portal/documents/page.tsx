'use client';

import { useEffect, useState } from 'react';


const statusLabels: Record<string, string> = {
  DRAFT: 'Concept',
  SENT: 'Verzonden',
  PARTIALLY_PAID: 'Deels betaald',
  PAID: 'Betaald',
  OVERDUE: 'Verlopen',
  CANCELLED: 'Geannuleerd',
  CREDITED: 'Gecrediteerd',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-white/10 text-white/50',
  SENT: 'bg-blue-500/15 text-blue-300',
  PARTIALLY_PAID: 'bg-amber-500/15 text-amber-300',
  PAID: 'bg-emerald-500/15 text-emerald-300',
  OVERDUE: 'bg-red-500/15 text-red-300',
  CANCELLED: 'bg-white/10 text-white/40',
  CREDITED: 'bg-purple-500/15 text-purple-300',
};

function formatCurrency(val: number | string) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(val));
}

export default function DocumentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'invoices' | 'documents'>('invoices');

  useEffect(() => {
    const token = localStorage.getItem('patient_token');
    fetch(`/api/patient-portal/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white/95 mb-2">Documenten</h1>
        <p className="text-lg text-white/50">Uw facturen en documenten</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('invoices')}
          className={`px-6 py-3 rounded-2xl text-base font-medium transition-all ${
            tab === 'invoices'
              ? 'bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-teal-300 border border-teal-500/20'
              : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
          }`}
        >
          Facturen
        </button>
        <button
          onClick={() => setTab('documents')}
          className={`px-6 py-3 rounded-2xl text-base font-medium transition-all ${
            tab === 'documents'
              ? 'bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-teal-300 border border-teal-500/20'
              : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
          }`}
        >
          Documenten
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-white/40 py-8">
          <div className="w-5 h-5 border-2 border-white/20 border-t-teal-400 rounded-full animate-spin" />
          Laden...
        </div>
      ) : tab === 'invoices' ? (
        <div className="space-y-4">
          {data?.invoices?.length > 0 ? (
            data.invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="patient-glass-card rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white/90">{inv.invoiceNumber}</h3>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[inv.status] || 'bg-white/10 text-white/50'}`}>
                        {statusLabels[inv.status] || inv.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/40">
                      {new Date(inv.invoiceDate).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-white/40">Totaal</p>
                      <p className="text-xl font-bold text-white/90">{formatCurrency(inv.total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/40">Eigen bijdrage</p>
                      <p className="text-base font-semibold text-teal-300">{formatCurrency(inv.patientAmount)}</p>
                    </div>
                    <button className="px-4 py-2.5 rounded-2xl border border-white/10 text-sm text-white/60 hover:bg-white/5 hover:text-white/80 transition-all">
                      Bekijken
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="patient-glass-card rounded-3xl p-8 text-center">
              <p className="text-base text-white/40">Geen facturen gevonden</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.documents?.length > 0 ? (
            data.documents.map((doc: any) => (
              <div
                key={doc.id}
                className="patient-glass-card rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white/90">{doc.title}</h3>
                      <p className="text-sm text-white/40">
                        {doc.documentType} — {new Date(doc.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2.5 rounded-2xl border border-white/10 text-sm text-white/60 hover:bg-white/5 transition-all">
                    Downloaden
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="patient-glass-card rounded-3xl p-8 text-center">
              <p className="text-base text-white/40">Geen documenten gevonden</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
