'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Euro, AlertTriangle, Search, ChevronDown, ChevronUp, X, CreditCard, Download, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface InvoiceLine {
  id: string;
  description: string;
  nzaCode?: string;
  toothNumber?: number;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

interface Payment {
  id: string;
  amount: string;
  method: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  total: string;
  insuranceAmount: string;
  patientAmount: string;
  paidAmount: string;
  status: string;
  notes?: string;
  claimStatus?: string;
  claimReference?: string;
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  lines: InvoiceLine[];
  payments: Payment[];
}

interface Stats {
  outstanding: number;
  monthTotal: number;
  monthCount: number;
  overdueCount: number;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Concept',
  SENT: 'Verzonden',
  PARTIALLY_PAID: 'Deels betaald',
  PAID: 'Betaald',
  OVERDUE: 'Achterstallig',
  CANCELLED: 'Geannuleerd',
  CREDITED: 'Gecrediteerd',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-300 border-gray-500/20',
  SENT: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  PARTIALLY_PAID: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  PAID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  OVERDUE: 'bg-red-500/20 text-red-300 border-red-500/20',
  CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/10',
  CREDITED: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
};

const methodLabels: Record<string, string> = {
  IDEAL: 'iDEAL',
  SEPA_DIRECT_DEBIT: 'Incasso',
  BANK_TRANSFER: 'Overboeking',
  CASH: 'Contant',
  PIN: 'PIN',
  CREDIT_CARD: 'Creditcard',
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('PIN');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [invRes, statsRes] = await Promise.all([
        authFetch(`/api/invoices${statusFilter ? `?status=${statusFilter}` : ''}`),
        authFetch('/api/invoices/stats'),
      ]);
      const invData = await invRes.json();
      const statsData = await statsRes.json();
      const invoicesList = invData.data || (Array.isArray(invData) ? invData : []);
      setInvoices(invoicesList);
      setStats({
        outstanding: statsData.outstandingAmount || 0,
        monthTotal: statsData.monthTotal || 0,
        monthCount: invoicesList.length,
        overdueCount: statsData.overdueCount || 0,
      });
    } catch (e) {
      console.error('Failed to fetch invoices', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase().includes(q) ||
      inv.patient.patientNumber.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = async (id: string, status: string) => {
    await authFetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handlePayment = async (invoiceId: string) => {
    if (!paymentAmount) return;
    await authFetch('/api/invoices/payments', {
      method: 'POST',
      body: JSON.stringify({
        invoiceId,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
      }),
    });
    setShowPayment(null);
    setPaymentAmount('');
    fetchData();
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingPdf(invoiceId);
    try {
      const res = await authFetch(`/api/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factuur-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF download failed', e);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(val));
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Facturatie</h1>
          <p className="text-sm text-white/50 mt-1">Facturen en betalingen beheren</p>
        </div>
        <button
          onClick={() => setShowNewInvoice(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nieuwe factuur
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">Deze maand</span>
            </div>
            <p className="text-2xl font-bold text-white/90">{formatCurrency(stats.monthTotal)}</p>
            <p className="text-xs text-white/40 mt-1">{stats.monthCount} facturen</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Euro className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">Openstaand</span>
            </div>
            <p className="text-2xl font-bold text-white/90">{formatCurrency(stats.outstanding)}</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">Achterstallig</span>
            </div>
            <p className="text-2xl font-bold text-white/90">{stats.overdueCount}</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">Betaald deze maand</span>
            </div>
            <p className="text-2xl font-bold text-white/90">
              {formatCurrency(stats.monthTotal - stats.outstanding)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Zoek op factuurnummer, patiënt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-sm outline-none bg-transparent text-white/70"
        >
          <option value="">Alle statussen</option>
          <option value="DRAFT">Concept</option>
          <option value="SENT">Verzonden</option>
          <option value="PARTIALLY_PAID">Deels betaald</option>
          <option value="PAID">Betaald</option>
          <option value="OVERDUE">Achterstallig</option>
        </select>
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-white/50 text-sm">Facturen laden...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <FileText className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">Geen facturen gevonden</p>
            <p className="text-white/30 text-sm mt-1">Maak een nieuwe factuur aan om te beginnen</p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div key={inv.id} className="glass-card rounded-2xl overflow-hidden">
              {/* Invoice row */}
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white/90">{inv.invoiceNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs border ${statusColors[inv.status] || statusColors.DRAFT}`}>
                      {statusLabels[inv.status] || inv.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 mt-0.5">
                    {inv.patient.firstName} {inv.patient.lastName} ({inv.patient.patientNumber})
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-white/90">{formatCurrency(inv.total)}</p>
                  <p className="text-xs text-white/40">{formatDate(inv.invoiceDate)} — vervalt {formatDate(inv.dueDate)}</p>
                </div>
                <div className="shrink-0 text-white/30">
                  {expandedId === inv.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === inv.id && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider">Subtotaal</p>
                      <p className="text-sm text-white/70 mt-1">{formatCurrency(inv.subtotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider">Verzekering</p>
                      <p className="text-sm text-white/70 mt-1">{formatCurrency(inv.insuranceAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider">Patiënt deel</p>
                      <p className="text-sm text-white/70 mt-1">{formatCurrency(inv.patientAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider">Betaald</p>
                      <p className="text-sm text-emerald-400 mt-1">{formatCurrency(inv.paidAmount)}</p>
                    </div>
                  </div>

                  {/* Lines */}
                  {(inv.lines || []).length > 0 && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Regels</p>
                      <div className="rounded-xl overflow-hidden border border-white/5">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                              <th className="text-left px-3 py-2 font-medium">Code</th>
                              <th className="text-left px-3 py-2 font-medium">Omschrijving</th>
                              <th className="text-center px-3 py-2 font-medium">Element</th>
                              <th className="text-center px-3 py-2 font-medium">Aantal</th>
                              <th className="text-right px-3 py-2 font-medium">Prijs</th>
                              <th className="text-right px-3 py-2 font-medium">Totaal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(inv.lines || []).map((line) => (
                              <tr key={line.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-3 py-2">
                                  {line.nzaCode ? (
                                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-mono">
                                      {line.nzaCode}
                                    </span>
                                  ) : (
                                    <span className="text-white/20">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-white/70">{line.description}</td>
                                <td className="px-3 py-2 text-center text-white/50">
                                  {line.toothNumber || '-'}
                                </td>
                                <td className="px-3 py-2 text-center text-white/50">{line.quantity}</td>
                                <td className="px-3 py-2 text-right text-white/60">{formatCurrency(line.unitPrice)}</td>
                                <td className="px-3 py-2 text-right font-medium text-white/90">{formatCurrency(line.lineTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Payments */}
                  {(inv.payments || []).length > 0 && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Betalingen</p>
                      <div className="space-y-1">
                        {(inv.payments || []).map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white/70">{methodLabels[p.method] || p.method}</span>
                              <span className="text-xs text-white/40">
                                {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-emerald-400">{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {inv.notes && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Notities</p>
                      <p className="text-sm text-white/50">{inv.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {inv.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(inv.id, 'SENT')}
                        className="px-3 py-1.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-xs font-medium text-white shadow-lg shadow-blue-500/20 transition-all"
                      >
                        Verzenden
                      </button>
                    )}
                    {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status) && (
                      <button
                        onClick={() => {
                          setShowPayment(inv.id);
                          setPaymentAmount(String(Number(inv.patientAmount) - Number(inv.paidAmount)));
                        }}
                        className="px-3 py-1.5 bg-emerald-500/80 hover:bg-emerald-500 rounded-xl text-xs font-medium text-white shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        Betaling registreren
                      </button>
                    )}
                    {inv.status !== 'DRAFT' && (
                      <button
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        disabled={downloadingPdf === inv.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
                      >
                        {downloadingPdf === inv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        PDF downloaden
                      </button>
                    )}
                    {inv.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(inv.id, 'CANCELLED')}
                        className="px-3 py-1.5 glass rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      >
                        Annuleren
                      </button>
                    )}
                  </div>

                  {/* Payment form */}
                  {showPayment === inv.id && (
                    <div className="glass rounded-xl p-4 space-y-3 border border-white/10">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white/90">Betaling registreren</p>
                        <button onClick={() => setShowPayment(null)} className="text-white/40 hover:text-white">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-wider">Bedrag</label>
                          <input
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full glass-input rounded-xl px-3 py-2 text-sm mt-1 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-wider">Methode</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full glass-input rounded-xl px-3 py-2 text-sm mt-1 outline-none bg-transparent text-white/70"
                          >
                            <option value="PIN">PIN</option>
                            <option value="CASH">Contant</option>
                            <option value="IDEAL">iDEAL</option>
                            <option value="BANK_TRANSFER">Overboeking</option>
                            <option value="SEPA_DIRECT_DEBIT">Incasso</option>
                            <option value="CREDIT_CARD">Creditcard</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePayment(inv.id)}
                        className="px-4 py-2 bg-emerald-500/80 hover:bg-emerald-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        Betaling bevestigen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Invoice Modal (placeholder — will create quick invoice form) */}
      {showNewInvoice && (
        <NewInvoiceModal onClose={() => setShowNewInvoice(false)} onCreated={fetchData} />
      )}
    </div>
  );
}

function NewInvoiceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientId, setPatientId] = useState('');
  const [lines, setLines] = useState([{ description: '', nzaCode: '', unitPrice: '', quantity: '1', toothNumber: '' }]);
  const [insuranceAmount, setInsuranceAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nzaResults, setNzaResults] = useState<any[]>([]);
  const [activeNzaField, setActiveNzaField] = useState<number | null>(null);
  const [nzaSearchQuery, setNzaSearchQuery] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    authFetch('/api/patients?limit=100')
      .then((r) => r.json())
      .then((d) => setPatients(Array.isArray(d) ? d : d.data || []));
    return () => { document.body.style.overflow = ''; };
  }, []);

  const addLine = () => setLines([...lines, { description: '', nzaCode: '', unitPrice: '', quantity: '1', toothNumber: '' }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines];
    (updated[i] as any)[field] = value;
    setLines(updated);
  };

  const searchNzaCodes = async (query: string) => {
    if (query.length < 1) {
      setNzaResults([]);
      return;
    }
    try {
      const res = await authFetch(`/api/nza-codes?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setNzaResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to search NZa codes', e);
      setNzaResults([]);
    }
  };

  const handleNzaCodeChange = (i: number, value: string) => {
    updateLine(i, 'nzaCode', value);
    setActiveNzaField(i);
    setNzaSearchQuery(value);
    searchNzaCodes(value);
  };

  const selectNzaCode = (i: number, code: any) => {
    updateLine(i, 'nzaCode', code.code);
    updateLine(i, 'description', code.descriptionNl);
    updateLine(i, 'unitPrice', String(code.maxTariff));
    setActiveNzaField(null);
    setNzaResults([]);
    setNzaSearchQuery('');
  };

  const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.unitPrice) || 0) * (parseInt(l.quantity) || 1), 0);

  const handleSubmit = async () => {
    if (!patientId || lines.length === 0) return;
    setSubmitting(true);
    await authFetch('/api/invoices', {
      method: 'POST',
      body: JSON.stringify({
        patientId,
        insuranceAmount: parseFloat(insuranceAmount) || 0,
        notes: notes || undefined,
        lines: lines
          .filter((l) => l.description && l.unitPrice)
          .map((l) => ({
            description: l.description,
            nzaCode: l.nzaCode || undefined,
            unitPrice: parseFloat(l.unitPrice),
            quantity: parseInt(l.quantity) || 1,
            toothNumber: l.toothNumber ? parseInt(l.toothNumber) : undefined,
          })),
      }),
    });
    setSubmitting(false);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/90">Nieuwe factuur</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Patient */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider">Patiënt</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2.5 text-sm mt-1 outline-none bg-transparent text-white/70"
            >
              <option value="">Selecteer patiënt...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientNumber})</option>
              ))}
            </select>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/40 uppercase tracking-wider">Regels</label>
              <button onClick={addLine} className="text-xs text-blue-400 hover:text-blue-300">+ Regel toevoegen</button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2 relative">
                    <input
                      placeholder="NZa code"
                      value={line.nzaCode}
                      onChange={(e) => handleNzaCodeChange(i, e.target.value)}
                      onFocus={() => {
                        setActiveNzaField(i);
                        if (line.nzaCode) {
                          setNzaSearchQuery(line.nzaCode);
                          searchNzaCodes(line.nzaCode);
                        }
                      }}
                      onBlur={() => setTimeout(() => setActiveNzaField(null), 200)}
                      className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                    />
                    {activeNzaField === i && nzaResults.length > 0 && (
                      <div className="absolute z-50 mt-1 w-64 glass-card rounded-xl border border-white/10 max-h-48 overflow-y-auto">
                        {nzaResults.map((code) => (
                          <div
                            key={code.id}
                            onClick={() => selectNzaCode(i, code)}
                            className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm"
                          >
                            <div className="font-mono text-blue-300">{code.code}</div>
                            <div className="text-white/60 text-xs">{code.descriptionNl}</div>
                            <div className="text-white/50 text-xs text-right">
                              {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(code.maxTariff)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    placeholder="Omschrijving"
                    value={line.description}
                    onChange={(e) => updateLine(i, 'description', e.target.value)}
                    className="col-span-4 glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <input
                    placeholder="Element"
                    value={line.toothNumber}
                    onChange={(e) => updateLine(i, 'toothNumber', e.target.value)}
                    className="col-span-1 glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <input
                    placeholder="Aantal"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                    className="col-span-1 glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <input
                    placeholder="Prijs"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                    className="col-span-2 glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <div className="col-span-1 text-right text-sm text-white/50">
                    {formatLineTotal(line)}
                  </div>
                  <button onClick={() => removeLine(i)} className="col-span-1 text-white/30 hover:text-red-400 text-center">
                    <X className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider">Verzekeringsdeel</label>
              <input
                type="number"
                step="0.01"
                value={insuranceAmount}
                onChange={(e) => setInsuranceAmount(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm mt-1 outline-none"
              />
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-xs text-white/40 uppercase tracking-wider">Subtotaal</p>
              <p className="text-lg font-semibold text-white/90 mt-1">
                {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(subtotal)}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider">Notities</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm mt-1 outline-none resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !patientId}
            className="px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Aanmaken...' : 'Factuur aanmaken'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatLineTotal(line: { unitPrice: string; quantity: string }) {
  const total = (parseFloat(line.unitPrice) || 0) * (parseInt(line.quantity) || 1);
  if (total === 0) return '-';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(total);
}
