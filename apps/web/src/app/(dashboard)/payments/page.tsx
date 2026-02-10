'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  payments: Payment[];
}

interface InvoiceStats {
  monthTotal: number;
  outstandingAmount: number;
  overdueCount: number;
}

export default function PaymentsPage() {
  const [stats, setStats] = useState<InvoiceStats>({
    monthTotal: 0,
    outstandingAmount: 0,
    overdueCount: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getPaymentMethodClasses = (method: string) => {
    const methodUpper = method.toUpperCase();
    switch (methodUpper) {
      case 'PIN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/20';
      case 'CONTANT':
      case 'CASH':
        return 'bg-green-500/20 text-green-300 border-green-500/20';
      case 'IDEAL':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/20';
      case 'OVERBOEKING':
      case 'BANK_TRANSFER':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/20';
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/20 text-green-300 border-green-500/20';
      case 'SENT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/20';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20';
      case 'OVERDUE':
        return 'bg-red-500/20 text-red-300 border-red-500/20';
      case 'DRAFT':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/20';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Betaald';
      case 'SENT':
        return 'Verzonden';
      case 'PARTIALLY_PAID':
        return 'Deels betaald';
      case 'OVERDUE':
        return 'Achterstallig';
      case 'DRAFT':
        return 'Concept';
      default:
        return status;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await authFetch('/api/invoices/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch invoices (API returns { data: [...], meta: {...} })
        const invoicesResponse = await authFetch('/api/invoices?limit=100');
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

  // Extract and sort all payments chronologically
  const allPayments = invoices
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

  // Filter outstanding invoices
  const outstandingInvoices = invoices.filter((invoice) =>
    ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-white/90">Laden...</div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Totaal betaald deze maand
          </div>
          <div className="text-3xl font-bold text-green-400">
            {formatCurrency(stats.monthTotal)}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Openstaand
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {formatCurrency(stats.outstandingAmount)}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Achterstallig
          </div>
          <div className="text-3xl font-bold text-red-400">
            {stats.overdueCount}
          </div>
        </div>
      </div>

      {/* Betalingsoverzicht */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white/90 mb-6">
          Betalingsoverzicht
        </h2>
        {allPayments.length === 0 ? (
          <p className="text-white/50 text-center py-8">
            Geen betalingen gevonden
          </p>
        ) : (
          <div className="space-y-3">
            {allPayments.map((payment) => {
              const methodLabels: Record<string, string> = {
                IDEAL: 'iDEAL', SEPA_DIRECT_DEBIT: 'Incasso', BANK_TRANSFER: 'Overboeking',
                CASH: 'Contant', PIN: 'PIN', CREDIT_CARD: 'Creditcard',
              };
              return (
                <div
                  key={payment.id}
                  className="glass-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="min-w-[100px]">
                      <div className="text-sm text-white/90">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/90 font-medium">
                        {payment.invoice.patient.firstName}{' '}
                        {payment.invoice.patient.lastName}
                      </div>
                      <div className="text-xs text-white/50">
                        Factuur #{payment.invoice.invoiceNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-400">
                        {formatCurrency(Number(payment.amount))}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-xs font-medium ${getPaymentMethodClasses(payment.method)}`}
                      >
                        {methodLabels[payment.method] || payment.method}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Openstaande facturen */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white/90 mb-6">
          Openstaande facturen
        </h2>
        {outstandingInvoices.length === 0 ? (
          <p className="text-white/50 text-center py-8">
            Geen openstaande facturen
          </p>
        ) : (
          <div className="space-y-3">
            {outstandingInvoices.map((invoice) => {
              const remaining = Number(invoice.total) - Number(invoice.paidAmount);
              const isOverdue = invoice.status === 'OVERDUE';
              return (
                <div
                  key={invoice.id}
                  className="glass-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="min-w-[120px]">
                      <div className="text-sm text-white/90 font-medium">
                        #{invoice.invoiceNumber}
                      </div>
                      <div className="text-xs text-white/50">
                        {formatDate(invoice.invoiceDate)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/90 font-medium">
                        {invoice.patient.firstName} {invoice.patient.lastName}
                      </div>
                      <div className="text-xs text-white/50">
                        Vervaldatum: {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="text-xs text-white/40">Totaal</div>
                      <div className="text-sm text-white/90">
                        {formatCurrency(Number(invoice.total))}
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="text-xs text-white/40">Betaald</div>
                      <div className="text-sm text-white/90">
                        {formatCurrency(Number(invoice.paidAmount))}
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="text-xs text-white/40">Openstaand</div>
                      <div
                        className={`text-sm font-semibold ${
                          isOverdue ? 'text-red-400' : 'text-yellow-400'
                        }`}
                      >
                        {formatCurrency(remaining)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-xs font-medium ${getStatusBadgeClasses(invoice.status)}`}
                      >
                        {getStatusLabel(invoice.status)}
                      </span>
                      <Link
                        href="/billing"
                        className="bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/20 px-4 py-2 transition-colors"
                      >
                        Betaling registreren
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
