'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
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
  totalAmount: number;
  paidAmount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  payments: Payment[];
}

interface InvoiceStats {
  totalPaidThisMonth: number;
  totalOutstanding: number;
  totalOverdue: number;
}

export default function PaymentsPage() {
  const [stats, setStats] = useState<InvoiceStats>({
    totalPaidThisMonth: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
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

  const getPaymentMethodColor = (method: string) => {
    const methodUpper = method.toUpperCase();
    switch (methodUpper) {
      case 'PIN':
        return 'blue';
      case 'CONTANT':
      case 'CASH':
        return 'green';
      case 'IDEAL':
        return 'purple';
      case 'OVERBOEKING':
      case 'BANK_TRANSFER':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'green';
      case 'SENT':
        return 'blue';
      case 'PARTIALLY_PAID':
        return 'yellow';
      case 'OVERDUE':
        return 'red';
      case 'DRAFT':
        return 'gray';
      default:
        return 'gray';
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
        const token = localStorage.getItem('access_token');
        const headers = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        // Fetch stats
        const statsResponse = await fetch('/api/invoices/stats', { headers });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch invoices
        const invoicesResponse = await fetch('/api/invoices', { headers });
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData);
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
      invoice.payments.map((payment) => ({
        ...payment,
        invoice,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
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
            {formatCurrency(stats.totalPaidThisMonth)}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Openstaand
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {formatCurrency(stats.totalOutstanding)}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Achterstallig
          </div>
          <div className="text-3xl font-bold text-red-400">
            {formatCurrency(stats.totalOverdue)}
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
              const color = getPaymentMethodColor(payment.paymentMethod);
              return (
                <div
                  key={payment.id}
                  className="glass-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="min-w-[100px]">
                      <div className="text-sm text-white/90">
                        {formatDate(payment.paymentDate)}
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
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg bg-${color}-500/20 text-${color}-300 border border-${color}-500/20 text-xs font-medium`}
                      >
                        {payment.paymentMethod}
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
              const remaining = invoice.totalAmount - invoice.paidAmount;
              const isOverdue = invoice.status === 'OVERDUE';
              const statusColor = getStatusBadgeColor(invoice.status);
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
                        {formatDate(invoice.issueDate)}
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
                        {formatCurrency(invoice.totalAmount)}
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="text-xs text-white/40">Betaald</div>
                      <div className="text-sm text-white/90">
                        {formatCurrency(invoice.paidAmount)}
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
                        className={`px-2.5 py-0.5 rounded-lg bg-${statusColor}-500/20 text-${statusColor}-300 border border-${statusColor}-500/20 text-xs font-medium`}
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
