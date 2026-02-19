'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Plus,
  Euro,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  X,
  Download,
  Loader2,
  CreditCard,
  Send,
  AlertTriangle,
  Sparkles,
  Bot,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  category?: string;
}

interface NzaCategory {
  code: string;
  name: string;
  subcategories: { name: string; codes: NzaCode[] }[];
}

interface NewLine {
  nzaCodeId?: string;
  code: string;
  description: string;
  toothNumber: string;
  unitPrice: string;
  quantity: string;
  notes: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  codes?: Array<{ code: string; description: string; nzaCodeId: string; unitPrice: number; toothNumbers: number[]; isCompanion: boolean }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  DRAFT: 'Concept', SENT: 'Verzonden', PARTIALLY_PAID: 'Deels betaald',
  PAID: 'Betaald', OVERDUE: 'Achterstallig', CANCELLED: 'Geannuleerd', CREDITED: 'Gecrediteerd',
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
  IDEAL: 'iDEAL', SEPA_DIRECT_DEBIT: 'Incasso', BANK_TRANSFER: 'Overboeking',
  CASH: 'Contant', PIN: 'PIN', CREDIT_CARD: 'Creditcard',
};

const HYGIENE_CATEGORIES = [
  { id: 'preventie', label: 'Preventie', keywords: ['preventie', 'preventief', 'mondhyg', 'fluoride', 'profylax', 'reinig'] },
  { id: 'parodontologie', label: 'Parodontologie', keywords: ['parodont', 'perio', 'pocket', 'scaling', 'rootplaning'] },
  { id: 'controle', label: 'Controle', keywords: ['controle', 'consult', 'onderzoek', 'dpsi'] },
  { id: 'rontgen', label: 'Röntgen', keywords: ['rontgen', 'röntgen', 'x-ray', 'bitewing', 'foto'] },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HygienistBillingPage() {
  // Invoice list state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('PIN');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // 3-column overlay state
  const [showOverlay, setShowOverlay] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [invoiceLines, setInvoiceLines] = useState<NewLine[]>([]);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Code browser state
  const [nzaCategories, setNzaCategories] = useState<NzaCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [codeSearch, setCodeSearch] = useState('');
  const [loadingCodes, setLoadingCodes] = useState(false);

  // AI chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Active line for notes
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────────

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

      const now = new Date();
      const overdueUpdates: Promise<Response>[] = [];
      for (const inv of invoicesList) {
        if ((inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID') && new Date(inv.dueDate) < now) {
          overdueUpdates.push(authFetch(`/api/invoices/${inv.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'OVERDUE' }) }));
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
      setStats({ outstanding: statsData.outstandingAmount || 0, monthTotal: statsData.monthTotal || 0, monthCount: invoicesList.length, overdueCount: statsData.overdueCount || 0 });
    } catch (e) { console.error('Failed to fetch invoices', e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadNzaCodes = useCallback(async () => {
    if (nzaCategories.length > 0) return;
    setLoadingCodes(true);
    try {
      const res = await authFetch('/api/nza-codes?grouped=true&all=true');
      const data = await res.json();
      setNzaCategories(data.categories || []);
    } catch { /* ignore */ }
    finally { setLoadingCodes(false); }
  }, [nzaCategories.length]);

  // ─── Code filtering ─────────────────────────────────────────────────────────

  const getCategoryNzaCodes = useCallback((categoryId: string): NzaCode[] => {
    const category = HYGIENE_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return [];
    const codes: NzaCode[] = [];
    const addedIds = new Set<string>();
    for (const cat of nzaCategories) {
      for (const sub of cat.subcategories) {
        for (const code of sub.codes) {
          if (addedIds.has(code.id)) continue;
          const text = `${cat.name} ${sub.name} ${code.descriptionNl} ${code.code}`.toLowerCase();
          if (category.keywords.some(kw => text.includes(kw))) {
            codes.push(code);
            addedIds.add(code.id);
          }
        }
      }
    }
    return codes;
  }, [nzaCategories]);

  const filteredCodes = useMemo(() => {
    if (!selectedCategory) return [];
    const codes = getCategoryNzaCodes(selectedCategory);
    if (!codeSearch) return codes;
    const q = codeSearch.toLowerCase();
    return codes.filter(c => c.code.toLowerCase().includes(q) || c.descriptionNl.toLowerCase().includes(q));
  }, [selectedCategory, codeSearch, getCategoryNzaCodes]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return inv.invoiceNumber.toLowerCase().includes(q) || `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase().includes(q);
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
    setInvoiceLines(prev => [...prev, {
      nzaCodeId: code.id,
      code: code.code,
      description: code.descriptionNl,
      toothNumber: '',
      unitPrice: String(code.maxTariff),
      quantity: '1',
      notes: '',
    }]);
    setActiveLineIdx(invoiceLines.length);
  };

  const removeLine = (idx: number) => {
    setInvoiceLines(prev => prev.filter((_, i) => i !== idx));
    if (activeLineIdx === idx) setActiveLineIdx(null);
    else if (activeLineIdx !== null && activeLineIdx > idx) setActiveLineIdx(activeLineIdx - 1);
  };

  const updateLine = (idx: number, field: keyof NewLine, value: string) => {
    setInvoiceLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
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
            notes: l.notes || undefined,
          })),
        }),
      });
      setShowOverlay(false);
      setSelectedPatient(null);
      setInvoiceLines([]);
      setInvoiceNotes('');
      setChatMessages([]);
      fetchData();
    } catch (e) { console.error('Failed to create invoice', e); }
    finally { setCreating(false); }
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
      a.href = url; a.download = `factuur-${invoiceNumber}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error('PDF failed', e); }
    finally { setDownloadingPdf(null); }
  };

  // ─── AI Chat ────────────────────────────────────────────────────────────────

  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const history = chatMessages.slice(-6).map(m => ({
        role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
        content: m.text,
      }));
      const res = await authFetch('/api/ai/treatment-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: data.response || 'Geen codes gedetecteerd.',
        codes: data.suggestions || [],
      }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Er is een fout opgetreden.' }]);
    } finally { setChatLoading(false); }
  };

  const addCodeFromAI = (code: NonNullable<ChatMessage['codes']>[number]) => {
    setInvoiceLines(prev => [...prev, {
      nzaCodeId: code.nzaCodeId,
      code: code.code,
      description: code.description,
      toothNumber: code.toothNumbers?.[0] ? String(code.toothNumbers[0]) : '',
      unitPrice: String(code.unitPrice),
      quantity: '1',
      notes: '',
    }]);
  };

  const openOverlay = () => {
    setShowOverlay(true);
    loadNzaCodes();
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(val));
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  // ─── Invoice List View ──────────────────────────────────────────────────────

  if (!showOverlay) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white/90 tracking-tight">Declaratie</h1>
            <p className="text-sm text-white/40 mt-1">Facturatie en P-code declaraties</p>
          </div>
          <button onClick={openOverlay} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
            <Plus className="w-4 h-4" /> Nieuwe factuur
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
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Zoek factuur of patiënt..."
              className="w-full pl-9 pr-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/50 transition-all" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/60 outline-none">
            <option value="" className="bg-[#1a1a2e]">Alle statussen</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#1a1a2e]">{v}</option>)}
          </select>
        </div>

        {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>}

        {!loading && filteredInvoices.length === 0 && (
          <div className="text-center py-16"><FileText className="w-12 h-12 text-white/20 mx-auto mb-3" /><p className="text-white/40 text-sm">Geen facturen gevonden</p></div>
        )}

        {!loading && (
          <div className="space-y-3">
            {filteredInvoices.map((inv) => (
              <div key={inv.id} className="bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-xl shadow-black/10 overflow-hidden">
                <div onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.03] transition-all">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm font-semibold text-white/80">{inv.invoiceNumber}</span>
                      <span className="text-xs text-white/30 ml-2">{formatDate(inv.invoiceDate)}</span>
                    </div>
                    <span className="text-sm text-white/60">{inv.patient.firstName} {inv.patient.lastName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white/80">{formatCurrency(inv.total)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[inv.status] || ''}`}>{statusLabels[inv.status] || inv.status}</span>
                    {expandedId === inv.id ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>
                </div>

                {expandedId === inv.id && (
                  <div className="border-t border-white/[0.08] p-4 space-y-4">
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
                    <div className="flex justify-end">
                      <div className="space-y-1 text-right text-sm">
                        <div className="flex justify-between gap-8"><span className="text-white/40">Subtotaal</span><span className="text-white/60">{formatCurrency(inv.subtotal)}</span></div>
                        <div className="flex justify-between gap-8"><span className="text-white/40">Verzekering</span><span className="text-emerald-300/70">{formatCurrency(inv.insuranceAmount)}</span></div>
                        <div className="flex justify-between gap-8"><span className="text-white/40">Patiënt</span><span className="text-white/70 font-semibold">{formatCurrency(inv.patientAmount)}</span></div>
                        {Number(inv.paidAmount) > 0 && <div className="flex justify-between gap-8"><span className="text-white/40">Betaald</span><span className="text-emerald-300">{formatCurrency(inv.paidAmount)}</span></div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                      {inv.status === 'DRAFT' && (
                        <button onClick={() => handleStatusChange(inv.id, 'SENT')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/20 hover:bg-blue-500/30 transition-all">
                          <Send className="w-3.5 h-3.5" /> Verzenden
                        </button>
                      )}
                      {(inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE') && (
                        <button onClick={() => { setShowPayment(inv.id); setPaymentAmount(String(Number(inv.patientAmount) - Number(inv.paidAmount))); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all">
                          <CreditCard className="w-3.5 h-3.5" /> Betaling
                        </button>
                      )}
                      <button onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)} disabled={downloadingPdf === inv.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] text-white/50 border border-white/[0.12] hover:bg-white/[0.09] transition-all">
                        {downloadingPdf === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                      </button>
                    </div>
                    {showPayment === inv.id && (
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08] space-y-3">
                        <h4 className="text-sm font-medium text-white/70">Betaling registreren</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/40 mb-1 block">Bedrag</label>
                            <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.12] rounded-lg text-sm text-white/80 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-white/40 mb-1 block">Methode</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.12] rounded-lg text-sm text-white/80 outline-none">
                              {Object.entries(methodLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#1a1a2e]">{v}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handlePayment(inv.id)} className="px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all">Bevestigen</button>
                          <button onClick={() => setShowPayment(null)} className="px-4 py-2 rounded-lg text-xs font-medium bg-white/[0.06] text-white/40 border border-white/[0.12] hover:bg-white/[0.09] transition-all">Annuleren</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── 3-Column Overlay ───────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: 'rgba(10, 14, 10, 0.96)', backdropFilter: 'blur(40px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowOverlay(false)} className="p-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-all">
            <ChevronLeft className="w-5 h-5 text-white/40" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white/90">Nieuwe Declaratie</h1>
            {selectedPatient ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-emerald-300">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-white/30 hover:text-white/50"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div className="relative mt-1">
                <input value={patientSearch} onChange={(e) => { setPatientSearch(e.target.value); searchPatients(e.target.value); }}
                  placeholder="Zoek patiënt..." className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.06] border border-white/[0.1] text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/40 w-64 transition-all" />
                {patientResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-[#141a14]/98 backdrop-blur-2xl border border-white/[0.12] rounded-xl overflow-hidden z-10 shadow-2xl">
                    {patientResults.map(p => (
                      <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientSearch(''); }}
                        className="w-full px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/[0.06] transition-colors">
                        {p.firstName} {p.lastName} <span className="text-white/30">#{p.patientNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setShowOverlay(false)} className="p-2.5 rounded-2xl border border-white/[0.08] hover:bg-white/[0.04] transition-all">
          <X className="h-5 w-5 text-white/40" />
        </button>
      </div>

      {/* 3-Panel Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — Code Browser */}
        <div className="w-[300px] border-r border-white/[0.08] overflow-y-auto flex-shrink-0" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {loadingCodes ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" /></div>
          ) : selectedCategory ? (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
                <button onClick={() => { setSelectedCategory(null); setCodeSearch(''); }} className="flex items-center gap-2 text-sm mb-2 hover:opacity-80 transition-opacity text-emerald-400">
                  <ChevronLeft className="h-4 w-4" /> Terug
                </button>
                <h3 className="text-sm font-semibold text-white/90">{HYGIENE_CATEGORIES.find(c => c.id === selectedCategory)?.label}</h3>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <input type="text" value={codeSearch} onChange={e => setCodeSearch(e.target.value)} placeholder="Zoek code..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-emerald-500/40 outline-none transition-all text-white/90" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {filteredCodes.length === 0 ? (
                  <p className="text-center py-8 text-sm text-white/30">Geen codes gevonden</p>
                ) : filteredCodes.map(code => (
                  <button key={code.id} onClick={() => handleCodeSelect(code)}
                    className="w-full text-left p-3 rounded-xl border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">{code.code}</span>
                      <span className="text-[11px] font-medium text-emerald-300">&euro;{Number(code.maxTariff).toFixed(2)}</span>
                    </div>
                    <p className="text-[12px] leading-tight text-white/70">{code.descriptionNl}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-white/50">Categorieën</h3>
              <div className="space-y-2">
                {HYGIENE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                    className="w-full text-left p-4 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl hover:bg-white/[0.07] hover:border-emerald-500/30 transition-all duration-300 group">
                    <span className="text-sm font-medium text-white/80 group-hover:text-emerald-300 transition-colors">{cat.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-white/50">Alle codes</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <input type="text" value={codeSearch} onChange={e => { setCodeSearch(e.target.value); if (!selectedCategory && e.target.value.length > 0) setSelectedCategory(HYGIENE_CATEGORIES[0].id); }}
                    placeholder="Zoek alle NZa codes..." className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-emerald-500/40 outline-none transition-all text-white/90" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE PANEL — Lines + AI Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Lines list */}
          <div className="flex-1 overflow-y-auto p-5">
            {invoiceLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 text-sm mb-1">Nog geen regels toegevoegd</p>
                <p className="text-white/25 text-xs">Selecteer codes links of gebruik de AI chatbar hieronder</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">Declaratieregels</h3>
                {invoiceLines.map((line, idx) => (
                  <div key={idx} onClick={() => setActiveLineIdx(idx)}
                    className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                      activeLineIdx === idx
                        ? 'border-emerald-500/40 bg-emerald-500/[0.06] shadow-lg shadow-emerald-500/5'
                        : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">{line.code}</span>
                        <span className="text-sm text-white/80">{line.description}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeLine(idx); }} className="p-1 rounded hover:bg-red-500/15 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-white/20 hover:text-red-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/30">Element:</span>
                        <input value={line.toothNumber} onChange={(e) => updateLine(idx, 'toothNumber', e.target.value)} onClick={e => e.stopPropagation()} placeholder="—"
                          className="w-10 px-1.5 py-0.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded text-white/60 text-center outline-none focus:border-emerald-500/40" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/30">Aantal:</span>
                        <input value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} onClick={e => e.stopPropagation()} type="number" min="1"
                          className="w-10 px-1.5 py-0.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded text-white/60 text-center outline-none focus:border-emerald-500/40" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/30">Tarief:</span>
                        <input value={line.unitPrice} onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)} onClick={e => e.stopPropagation()} type="number" step="0.01"
                          className="w-16 px-1.5 py-0.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded text-white/60 text-right outline-none focus:border-emerald-500/40" />
                      </div>
                      <span className="text-sm font-semibold text-emerald-300 ml-auto">&euro;{lineTotal(line)}</span>
                    </div>
                    {line.notes && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <StickyNote className="w-3 h-3 text-amber-400/50 mt-0.5 flex-shrink-0" />
                        <span className="text-[11px] text-white/40 italic">{line.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Chat Bar */}
          <div className="border-t border-white/[0.08] flex-shrink-0" style={{ background: 'rgba(10,14,10,0.95)' }}>
            {chatMessages.length > 0 && (
              <div className="max-h-[250px] overflow-y-auto px-4 py-2.5 space-y-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-500/15">
                        <Bot className="h-3 w-3 text-emerald-400" />
                      </div>
                    )}
                    <div className="max-w-[85%] space-y-1.5">
                      <div className={`px-3 py-1.5 rounded-2xl text-[12px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-br-md bg-emerald-500/15 text-white/85'
                          : 'rounded-bl-md border border-white/[0.06] bg-white/[0.03] text-white/85'
                      }`}>{msg.text}</div>
                      {msg.codes && msg.codes.length > 0 && (
                        <div className="space-y-1">
                          {msg.codes.filter(c => !c.isCompanion).map((code, ci) => (
                            <div key={ci} className="flex items-center justify-between p-2 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">{code.code}</span>
                                <span className="text-[11px] text-white/70">{code.description}</span>
                                <span className="text-[11px] font-medium text-emerald-300">&euro;{code.unitPrice.toFixed(2)}</span>
                              </div>
                              <button onClick={() => addCodeFromAI(code)} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all">
                                + Toevoegen
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 bg-emerald-500/15">
                      <Bot className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div className="px-3 py-1.5 rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.03]">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="px-4 py-3 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/10">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400/50" />
              </div>
              <div className="flex-1 relative">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                  placeholder="Beschrijf de behandeling in natuurlijke taal..."
                  className="w-full px-3.5 py-2 pr-10 rounded-2xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all text-white/90" />
                <button onClick={handleChatSend} disabled={!chatInput.trim() || chatLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all disabled:opacity-20 hover:bg-white/[0.08] text-emerald-400">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Totals + Notes */}
        <div className="w-[280px] border-l border-white/[0.08] overflow-y-auto flex-shrink-0 flex flex-col" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {/* Totals */}
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">Overzicht</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Regels</span>
                <span className="text-white/60">{invoiceLines.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Subtotaal</span>
                <span className="text-white/70">{formatCurrency(invoiceTotal)}</span>
              </div>
              <div className="h-px bg-white/[0.08] my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/60">Totaal</span>
                <span className="text-lg font-bold text-emerald-300">{formatCurrency(invoiceTotal)}</span>
              </div>
            </div>
          </div>

          {/* Line notes */}
          <div className="p-4 flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              {activeLineIdx !== null && invoiceLines[activeLineIdx] ? (
                <>Notitie: <span className="text-emerald-300">{invoiceLines[activeLineIdx].code}</span></>
              ) : 'Selecteer een regel'}
            </h3>
            {activeLineIdx !== null && invoiceLines[activeLineIdx] ? (
              <textarea
                value={invoiceLines[activeLineIdx].notes}
                onChange={(e) => updateLine(activeLineIdx, 'notes', e.target.value)}
                placeholder="Toelichting bij deze declaratieregel..."
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all resize-none min-h-[120px] text-white/80"
              />
            ) : (
              <p className="text-xs text-white/25 italic">Klik op een declaratieregel om notities toe te voegen</p>
            )}
          </div>

          {/* General notes */}
          <div className="p-4 border-t border-white/[0.06]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Factuurnotities</h3>
            <textarea
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              placeholder="Algemene opmerkingen..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-emerald-500/40 outline-none transition-all resize-none text-white/80"
            />
          </div>

          {/* Save button */}
          <div className="p-4 border-t border-white/[0.06]">
            <button onClick={createInvoice} disabled={!selectedPatient || invoiceLines.length === 0 || creating}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Factuur aanmaken
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
