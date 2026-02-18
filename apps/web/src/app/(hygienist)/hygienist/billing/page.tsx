'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Euro,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Download,
  Loader2,
  CreditCard,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { CodeBrowserPanel } from '@/components/declaratie/code-browser-panel';

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

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
}

interface NzaCode {
  id: string;
  code: string;
  descriptionNl: string;
  maxTariff: string;
  category: string;
}

interface NewLine {
  nzaCodeId?: string;
  code: string;
  description: string;
  toothNumber: string;
  unitPrice: string;
  quantity: string;
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

// P-code categories for hygienist quick filter
const HYGIENE_CATEGORIES = ['Preventieve mondzorg', 'Parodontologie', 'Mondhygiëne', 'Preventie'];

export default function HygienistBillingPage() {
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
  const [currentUserId, setCurrentUserId] = useState('');

  // New invoice state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [invoiceLines, setInvoiceLines] = useState<NewLine[]>([]);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [showCodeBrowser, setShowCodeBrowser] = useState(false);
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [hygieneCodesOnly, setHygieneCodesOnly] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const queryStr = params.toString();
      const [invRes, statsRes] = await Promise.all([
        authFetch(`/api/invoices${queryStr ? `?${queryStr}` : ''}`),
        authFetch('/api/invoices/stats'),
      ]);
      const invData = await invRes.json();
      const statsData = await statsRes.json();
      const invoicesList = invData.data || (Array.isArray(invData) ? invData : []);

      // Auto-detect overdue
      const now = new Date();
      const overdueUpdates: Promise<Response>[] = [];
      for (const inv of invoicesList) {
        if ((inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID') && new Date(inv.dueDate) < now) {
          overdueUpdates.push(
            authFetch(`/api/invoices/${inv.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'OVERDUE' }) })
          );
        }
      }

      if (overdueUpdates.length > 0) {
        await Promise.allSettled(overdueUpdates);
        const refreshRes = await authFetch(`/api/invoices${queryStr ? `?${queryStr}` : ''}`);
        const refreshData = await refreshRes.json();
        setInvoices(refreshData.data || (Array.isArray(refreshData) ? refreshData : []));
      } else {
        setInvoices(invoicesList);
      }

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
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase().includes(q) ||
      inv.patient.patientNumber.toLowerCase().includes(q)
    );
  });

  const searchPatients = async (q: string) => {
    if (q.length < 2) { setPatientResults([]); return; }
    try {
      const res = await authFetch(`/api/patients?search=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setPatientResults(data.data || []);
    } catch { setPatientResults([]); }
  };

  const handleCodeSelect = (code: NzaCode) => {
    const line: NewLine = {
      nzaCodeId: code.id,
      code: code.code,
      description: code.descriptionNl,
      toothNumber: '',
      unitPrice: String(code.maxTariff),
      quantity: '1',
    };
    if (editingLineIdx !== null) {
      const updated = [...invoiceLines];
      updated[editingLineIdx] = line;
      setInvoiceLines(updated);
      setEditingLineIdx(null);
    } else {
      setInvoiceLines([...invoiceLines, line]);
    }
    setShowCodeBrowser(false);
  };

  const removeLine = (idx: number) => {
    setInvoiceLines(invoiceLines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof NewLine, value: string) => {
    const updated = [...invoiceLines];
    updated[idx] = { ...updated[idx], [field]: value };
    setInvoiceLines(updated);
  };

  const lineTotal = (line: NewLine) => (parseFloat(line.unitPrice || '0') * parseInt(line.quantity || '1')).toFixed(2);
  const invoiceTotal = invoiceLines.reduce((sum, l) => sum + parseFloat(lineTotal(l)), 0);

  const createInvoice = async () => {
    if (!selectedPatient || invoiceLines.length === 0) return;
    setCreating(true);
    try {
      await authFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient.id,
          notes: invoiceNotes || undefined,
          lines: invoiceLines.map((l) => ({
            nzaCodeId: l.nzaCodeId,
            description: l.description,
            nzaCode: l.code,
            toothNumber: l.toothNumber ? parseInt(l.toothNumber) : undefined,
            quantity: parseInt(l.quantity) || 1,
            unitPrice: parseFloat(l.unitPrice) || 0,
          })),
        }),
      });
      setShowNewInvoice(false);
      setSelectedPatient(null);
      setInvoiceLines([]);
      setInvoiceNotes('');
      fetchData();
    } catch (e) {
      console.error('Failed to create invoice', e);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await authFetch(`/api/invoices/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    fetchData();
  };

  const handlePayment = async (invoiceId: string) => {
    if (!paymentAmount) return;
    await authFetch('/api/invoices/payments', {
      method: 'POST',
      body: JSON.stringify({ invoiceId, amount: parseFloat(paymentAmount), method: paymentMethod }),
    });
    setShowPayment(null);
    setPaymentAmount('');
    fetchData();
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingPdf(invoiceId);
    try {
      const res = await authFetch(`/api/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error('PDF failed');
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
      console.error('PDF failed', e);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(val));

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Declaratie</h1>
          <p className="text-sm text-white/40 mt-1">Facturatie en P-code declaraties</p>
        </div>
        <button
          onClick={() => setShowNewInvoice(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nieuwe factuur
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Openstaand', value: formatCurrency(stats.outstanding), icon: Euro, color: 'text-amber-400' },
            { label: 'Deze maand', value: formatCurrency(stats.monthTotal), icon: FileText, color: 'text-emerald-400' },
            { label: 'Facturen', value: String(stats.monthCount), icon: FileText, color: 'text-blue-400' },
            { label: 'Achterstallig', value: String(stats.overdueCount), icon: AlertTriangle, color: stats.overdueCount > 0 ? 'text-red-400' : 'text-white/40' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.12] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-white/40">{stat.label}</span>
                </div>
                <div className="text-xl font-bold text-white/80">{stat.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek factuur of patiënt..."
            className="w-full pl-9 pr-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/60 outline-none focus:border-emerald-500/50 transition-all"
        >
          <option value="" className="bg-[#1a1a2e]">Alle statussen</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k} className="bg-[#1a1a2e]">{v}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      )}

      {/* Invoices list */}
      {!loading && filteredInvoices.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Geen facturen gevonden</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              id={`invoice-${inv.id}`}
              className="bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-xl shadow-black/10 overflow-hidden"
            >
              {/* Invoice header row */}
              <div
                onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm font-semibold text-white/80">{inv.invoiceNumber}</span>
                    <span className="text-xs text-white/30 ml-2">{formatDate(inv.invoiceDate)}</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {inv.patient.firstName} {inv.patient.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white/80">{formatCurrency(inv.total)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[inv.status] || ''}`}>
                    {statusLabels[inv.status] || inv.status}
                  </span>
                  {expandedId === inv.id ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === inv.id && (
                <div className="border-t border-white/[0.08] p-4 space-y-4">
                  {/* Lines */}
                  <div>
                    <h3 className="text-xs font-semibold text-white/50 uppercase mb-2">Declaratieregels</h3>
                    <div className="space-y-1">
                      {inv.lines.map((line) => (
                        <div key={line.id} className="flex items-center justify-between py-1.5 px-2 bg-white/[0.03] rounded-lg">
                          <div className="flex items-center gap-2">
                            {line.nzaCode && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">{line.nzaCode}</span>}
                            <span className="text-sm text-white/60">{line.description}</span>
                            {line.toothNumber && <span className="text-[10px] text-white/30">E{line.toothNumber}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-white/50">
                            <span>{line.quantity}x</span>
                            <span>{formatCurrency(line.unitPrice)}</span>
                            <span className="font-medium text-white/70">{formatCurrency(line.lineTotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-end">
                    <div className="space-y-1 text-right text-sm">
                      <div className="flex justify-between gap-8">
                        <span className="text-white/40">Subtotaal</span>
                        <span className="text-white/60">{formatCurrency(inv.subtotal)}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-white/40">Verzekering</span>
                        <span className="text-emerald-300/70">{formatCurrency(inv.insuranceAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-white/40">Patiënt</span>
                        <span className="text-white/70 font-semibold">{formatCurrency(inv.patientAmount)}</span>
                      </div>
                      {Number(inv.paidAmount) > 0 && (
                        <div className="flex justify-between gap-8">
                          <span className="text-white/40">Betaald</span>
                          <span className="text-emerald-300">{formatCurrency(inv.paidAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                    {inv.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(inv.id, 'SENT')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/20 hover:bg-blue-500/30 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Verzenden
                      </button>
                    )}
                    {(inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE') && (
                      <button
                        onClick={() => { setShowPayment(inv.id); setPaymentAmount(String(Number(inv.patientAmount) - Number(inv.paidAmount))); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Betaling
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                      disabled={downloadingPdf === inv.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] text-white/50 border border-white/[0.12] hover:bg-white/[0.09] transition-all"
                    >
                      {downloadingPdf === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      PDF
                    </button>
                  </div>

                  {/* Payment modal inline */}
                  {showPayment === inv.id && (
                    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08] space-y-3">
                      <h4 className="text-sm font-medium text-white/70">Betaling registreren</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">Bedrag</label>
                          <input
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.12] rounded-lg text-sm text-white/80 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">Methode</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.12] rounded-lg text-sm text-white/80 outline-none"
                          >
                            {Object.entries(methodLabels).map(([k, v]) => (
                              <option key={k} value={k} className="bg-[#1a1a2e]">{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePayment(inv.id)}
                          className="px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all"
                        >
                          Bevestigen
                        </button>
                        <button
                          onClick={() => setShowPayment(null)}
                          className="px-4 py-2 rounded-lg text-xs font-medium bg-white/[0.06] text-white/40 border border-white/[0.12] hover:bg-white/[0.09] transition-all"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New invoice modal */}
      {showNewInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-2xl w-full max-w-2xl mb-10">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white/90">Nieuwe factuur</h2>
              <button onClick={() => setShowNewInvoice(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white/60 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Patient search */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Patiënt</label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between bg-white/[0.06] rounded-xl px-3 py-2.5 border border-white/[0.12]">
                    <span className="text-sm text-white/80">{selectedPatient.firstName} {selectedPatient.lastName} <span className="text-white/30">#{selectedPatient.patientNumber}</span></span>
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-white/30 hover:text-white/50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={patientSearch}
                      onChange={(e) => { setPatientSearch(e.target.value); searchPatients(e.target.value); }}
                      placeholder="Zoek patiënt..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/50 transition-all"
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/[0.12] rounded-xl overflow-hidden z-10 shadow-xl">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPatient(p); setPatientResults([]); }}
                            className="w-full px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/[0.06] transition-colors"
                          >
                            {p.firstName} {p.lastName} <span className="text-white/30">#{p.patientNumber}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Declaratie lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-white/50">Declaratieregels</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[10px] text-white/40">
                      <input
                        type="checkbox"
                        checked={hygieneCodesOnly}
                        onChange={(e) => setHygieneCodesOnly(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Hygiene codes
                    </label>
                    <button
                      onClick={() => { setEditingLineIdx(null); setShowCodeBrowser(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Code toevoegen
                    </button>
                  </div>
                </div>

                {invoiceLines.length === 0 ? (
                  <p className="text-xs text-white/30 py-4 text-center">Nog geen regels toegevoegd</p>
                ) : (
                  <div className="space-y-2">
                    {invoiceLines.map((line, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/[0.04] rounded-xl p-3 border border-white/[0.08]">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono shrink-0">{line.code}</span>
                        <span className="text-sm text-white/60 flex-1 truncate">{line.description}</span>
                        <input
                          value={line.toothNumber}
                          onChange={(e) => updateLine(idx, 'toothNumber', e.target.value)}
                          placeholder="E"
                          className="w-12 px-1.5 py-1 text-xs bg-white/[0.05] border border-white/[0.08] rounded text-white/60 text-center outline-none"
                        />
                        <input
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                          type="number"
                          min="1"
                          className="w-12 px-1.5 py-1 text-xs bg-white/[0.05] border border-white/[0.08] rounded text-white/60 text-center outline-none"
                        />
                        <input
                          value={line.unitPrice}
                          onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)}
                          type="number"
                          step="0.01"
                          className="w-20 px-1.5 py-1 text-xs bg-white/[0.05] border border-white/[0.08] rounded text-white/60 text-right outline-none"
                        />
                        <span className="text-xs font-medium text-white/70 w-16 text-right">{formatCurrency(lineTotal(line))}</span>
                        <button onClick={() => removeLine(idx)} className="text-white/20 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <span className="text-sm font-bold text-white/80">Totaal: {formatCurrency(invoiceTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Notities</label>
                <textarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  rows={2}
                  placeholder="Optioneel..."
                  className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>

              <button
                onClick={createInvoice}
                disabled={!selectedPatient || invoiceLines.length === 0 || creating}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Factuur aanmaken
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code browser modal */}
      {showCodeBrowser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white/80">NZa Code Browser</h3>
              <button onClick={() => setShowCodeBrowser(false)} className="text-white/40 hover:text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CodeBrowserPanel
                onSelectCode={(code: any) => handleCodeSelect(code)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
