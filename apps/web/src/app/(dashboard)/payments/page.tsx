'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Banknote,
  Building2,
  Clock,
  AlertTriangle,
  Send,
  Search,
  TrendingUp,
  DollarSign,
  Filter,
  Landmark,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

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
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  total: string;
  paidAmount: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
  payments: Payment[];
}

interface InvoiceStats {
  monthTotal: number;
  outstandingAmount: number;
  overdueCount: number;
}

type StatusFilter = 'all' | 'paid' | 'outstanding' | 'overdue';
type MethodFilter = 'all' | 'IDEAL' | 'PIN' | 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD';

const PAYMENT_METHOD_ICONS: Record<string, typeof CreditCard> = {
  IDEAL: Landmark,
  PIN: CreditCard,
  CREDIT_CARD: CreditCard,
  CASH: Banknote,
  CONTANT: Banknote,
  BANK_TRANSFER: Building2,
  OVERBOEKING: Building2,
  SEPA_DIRECT_DEBIT: Building2,
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  IDEAL: 'iDEAL',
  SEPA_DIRECT_DEBIT: 'Incasso',
  BANK_TRANSFER: 'Overboeking',
  CASH: 'Contant',
  CONTANT: 'Contant',
  PIN: 'PIN',
  CREDIT_CARD: 'Creditcard',
};

const PAYMENT_METHOD_CLASSES: Record<string, string> = {
  PIN: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  CONTANT: 'bg-green-500/20 text-green-300 border-green-500/20',
  CASH: 'bg-green-500/20 text-green-300 border-green-500/20',
  IDEAL: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
  OVERBOEKING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
  BANK_TRANSFER: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
  SEPA_DIRECT_DEBIT: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
  CREDIT_CARD: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PAID: 'bg-green-500/20 text-green-300 border-green-500/20',
  SENT: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  PARTIALLY_PAID: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
  OVERDUE: 'bg-red-500/20 text-red-300 border-red-500/20',
  DRAFT: 'bg-gray-500/20 text-gray-300 border-gray-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Betaald',
  SENT: 'Verzonden',
  PARTIALLY_PAID: 'Deels betaald',
  OVERDUE: 'Achterstallig',
  DRAFT: 'Concept',
  CANCELLED: 'Geannuleerd',
  CREDITED: 'Gecrediteerd',
};

export default function PaymentsPage() {
  const [stats, setStats] = useState<InvoiceStats>({
    monthTotal: 0,
    outstandingAmount: 0,
    overdueCount: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, invoicesResponse] = await Promise.all([
          authFetch('/api/invoices/stats'),
          authFetch('/api/invoices?limit=200'),
        ]);

        if (statsResponse.ok) {
          setStats(await statsResponse.json());
        }
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData.data || (Array.isArray(invoicesData) ? invoicesData : []));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sendReminder = async (invoiceId: string) => {
    setSendingReminder(invoiceId);
    try {
      const response = await authFetch(`/api/invoices/${invoiceId}/reminder`, {
        method: 'POST',
      });
      if (response.ok) {
        setReminderSuccess(invoiceId);
        setTimeout(() => setReminderSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
    } finally {
      setSendingReminder(null);
    }
  };

  // Compute all payments with invoice reference
  const allPayments = useMemo(() => {
    return invoices
      .flatMap((invoice) =>
        (invoice.payments || []).map((payment) => ({
          ...payment,
          invoice,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime()
      );
  }, [invoices]);

  // Compute outstanding invoices
  const outstandingInvoices = useMemo(() => {
    return invoices
      .filter((invoice) => ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status))
      .sort((a, b) => {
        // Overdue first, then by due date ascending
        if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
        if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [invoices]);

  // Compute average payment time in days
  const avgPaymentDays = useMemo(() => {
    const paidInvoices = invoices.filter(
      (inv) => inv.status === 'PAID' && inv.payments.length > 0
    );
    if (paidInvoices.length === 0) return 0;
    const totalDays = paidInvoices.reduce((sum, inv) => {
      const lastPayment = inv.payments.sort(
        (a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime()
      )[0];
      const invoiceDate = new Date(inv.invoiceDate);
      const payDate = new Date(lastPayment.paidAt || lastPayment.createdAt);
      return sum + Math.max(0, Math.floor((payDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)));
    }, 0);
    return Math.round(totalDays / paidInvoices.length);
  }, [invoices]);

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    let filtered = allPayments;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.invoice.patient.firstName.toLowerCase().includes(q) ||
          p.invoice.patient.lastName.toLowerCase().includes(q) ||
          `${p.invoice.patient.firstName} ${p.invoice.patient.lastName}`.toLowerCase().includes(q) ||
          p.invoice.invoiceNumber.toLowerCase().includes(q)
      );
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter((p) => p.method === methodFilter);
    }

    if (statusFilter === 'paid') {
      // Only show payments (they are all paid)
      return filtered;
    }

    return filtered;
  }, [allPayments, searchQuery, methodFilter, statusFilter]);

  // Filter outstanding invoices based on search
  const filteredOutstanding = useMemo(() => {
    let filtered = outstandingInvoices;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.patient.firstName.toLowerCase().includes(q) ||
          inv.patient.lastName.toLowerCase().includes(q) ||
          `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'overdue') {
      filtered = filtered.filter((inv) => inv.status === 'OVERDUE');
    }

    return filtered;
  }, [outstandingInvoices, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white/90 mb-2">Betalingen</h1>
        <p className="text-white/50">
          Overzicht van alle betalingen en openstaande facturen
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Ontvangen deze maand
            </div>
            <div className="p-2 rounded-xl bg-green-500/20">
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {formatCurrency(stats.monthTotal)}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Openstaand totaal
            </div>
            <div className="p-2 rounded-xl bg-yellow-500/20">
              <Wallet className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {formatCurrency(stats.outstandingAmount)}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Achterstallig
            </div>
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-400">
            {stats.overdueCount}
          </div>
          <div className="text-xs text-white/30 mt-1">facturen</div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Gem. betaaltijd
            </div>
            <div className="p-2 rounded-xl bg-blue-500/20">
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {avgPaymentDays}
          </div>
          <div className="text-xs text-white/30 mt-1">dagen</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Zoek op patientnaam of factuurnummer..."
              className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm outline-none text-white/90 placeholder-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-white/30 mr-1" />
            {(['all', 'paid', 'outstanding', 'overdue'] as StatusFilter[]).map((status) => {
              const labels: Record<StatusFilter, string> = {
                all: 'Alles',
                paid: 'Betaald',
                outstanding: 'Openstaand',
                overdue: 'Achterstallig',
              };
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {labels[status]}
                </button>
              );
            })}
          </div>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as MethodFilter)}
            className="glass-input rounded-xl px-3 py-2 text-sm outline-none text-white/90 bg-transparent"
          >
            <option value="all">Alle methoden</option>
            <option value="IDEAL">iDEAL</option>
            <option value="PIN">PIN</option>
            <option value="CASH">Contant</option>
            <option value="BANK_TRANSFER">Overboeking</option>
            <option value="CREDIT_CARD">Creditcard</option>
          </select>
        </div>
      </div>

      {/* Payment List */}
      {(statusFilter === 'all' || statusFilter === 'paid') && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Betalingsoverzicht
          </h2>
          {filteredPayments.length === 0 ? (
            <p className="text-white/50 text-center py-8">
              Geen betalingen gevonden
            </p>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map((payment) => {
                const MethodIcon = PAYMENT_METHOD_ICONS[payment.method] || CreditCard;
                return (
                  <div
                    key={payment.id}
                    className="glass-light rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                  >
                    {/* Method Icon */}
                    <div className={`p-2.5 rounded-xl ${PAYMENT_METHOD_CLASSES[payment.method] || 'bg-gray-500/20'}`}>
                      <MethodIcon className="h-4 w-4" />
                    </div>

                    {/* Patient & Invoice */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/90 font-medium">
                        {payment.invoice.patient.firstName}{' '}
                        {payment.invoice.patient.lastName}
                      </div>
                      <div className="text-xs text-white/40">
                        Factuur #{payment.invoice.invoiceNumber}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-sm text-white/50 min-w-[100px]">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </div>

                    {/* Method badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-lg border text-xs font-medium ${PAYMENT_METHOD_CLASSES[payment.method] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}
                    >
                      {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                    </span>

                    {/* Amount */}
                    <div className="text-sm font-semibold text-green-400 min-w-[90px] text-right">
                      {formatCurrency(Number(payment.amount))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Outstanding Invoices */}
      {(statusFilter === 'all' || statusFilter === 'outstanding' || statusFilter === 'overdue') && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            Openstaande facturen
            {filteredOutstanding.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-medium">
                {filteredOutstanding.length}
              </span>
            )}
          </h2>
          {filteredOutstanding.length === 0 ? (
            <p className="text-white/50 text-center py-8">
              Geen openstaande facturen
            </p>
          ) : (
            <div className="space-y-2">
              {filteredOutstanding.map((invoice) => {
                const remaining = Number(invoice.total) - Number(invoice.paidAmount);
                const isOverdue = invoice.status === 'OVERDUE';
                const daysOverdue = getDaysOverdue(invoice.dueDate);
                const isVeryOverdue = daysOverdue > 30;

                return (
                  <div
                    key={invoice.id}
                    className="glass-light rounded-xl p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Overdue indicator */}
                      <div className={`p-2.5 rounded-xl ${isOverdue ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                        {isOverdue ? (
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-400" />
                        )}
                      </div>

                      {/* Invoice info */}
                      <div className="min-w-[120px]">
                        <div className="text-sm text-white/90 font-medium">
                          #{invoice.invoiceNumber}
                        </div>
                        <div className="text-xs text-white/40">
                          {formatDate(invoice.invoiceDate)}
                        </div>
                      </div>

                      {/* Patient name */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/90 font-medium">
                          {invoice.patient.firstName} {invoice.patient.lastName}
                        </div>
                        <div className="text-xs text-white/40">
                          Vervaldatum: {formatDate(invoice.dueDate)}
                        </div>
                      </div>

                      {/* Days overdue */}
                      {isOverdue && daysOverdue > 0 && (
                        <div className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${isVeryOverdue ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30'}`}>
                          {daysOverdue} dagen te laat
                        </div>
                      )}

                      {/* Amounts */}
                      <div className="text-right min-w-[80px]">
                        <div className="text-xs text-white/40">Openstaand</div>
                        <div
                          className={`text-sm font-semibold ${
                            isOverdue ? 'text-red-400' : 'text-yellow-400'
                          }`}
                        >
                          {formatCurrency(remaining)}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-xs font-medium ${STATUS_BADGE_CLASSES[invoice.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}
                      >
                        {STATUS_LABELS[invoice.status] || invoice.status}
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sendReminder(invoice.id)}
                          disabled={sendingReminder === invoice.id}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            reminderSuccess === invoice.id
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                          } disabled:opacity-50`}
                          title="Betalingsherinnering sturen"
                        >
                          {reminderSuccess === invoice.id ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Verstuurd
                            </>
                          ) : sendingReminder === invoice.id ? (
                            <>
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border border-amber-300 border-t-transparent" />
                              Versturen...
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              Herinnering sturen
                            </>
                          )}
                        </button>
                        <Link
                          href="/billing"
                          className="flex items-center gap-1.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-xs font-medium text-white shadow-lg shadow-blue-500/20 px-3 py-2 transition-colors"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Betaling
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
