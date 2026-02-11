"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Calendar,
  CreditCard,
  AlertCircle,
  Check,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  Filter,
  X,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  insuranceAmount: number;
  patientAmount: number;
  status: "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  lineCount: number;
  practiceName: string;
  totalPaid: number;
  hasPayments: boolean;
  lastPaymentDate: string | null;
}

interface Summary {
  totalInvoices: number;
  unpaidCount: number;
  overdueCount: number;
  totalAmount: number;
  unpaidAmount: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "PAID":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    case "PARTIALLY_PAID":
      return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    case "OVERDUE":
      return "text-red-400 bg-red-400/10 border-red-400/30";
    case "SENT":
    default:
      return "text-blue-400 bg-blue-400/10 border-blue-400/30";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "PAID":
      return "Betaald";
    case "PARTIALLY_PAID":
      return "Gedeeltelijk betaald";
    case "OVERDUE":
      return "Overschreden";
    case "SENT":
    default:
      return "Verstuurd";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "PAID":
      return Check;
    case "PARTIALLY_PAID":
      return Clock;
    case "OVERDUE":
      return AlertCircle;
    case "SENT":
    default:
      return FileText;
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchInvoices = async (filterStatus?: string) => {
    try {
      const token = localStorage.getItem("patient_token");
      const url = filterStatus
        ? `/api/patient-portal/invoices?status=${filterStatus}`
        : "/api/patient-portal/invoices";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(statusFilter);
  }, [statusFilter]);

  const handleDownloadPdf = async (
    invoiceId: string,
    invoiceNumber: string,
  ) => {
    setDownloadingId(invoiceId);

    try {
      const token = localStorage.getItem("patient_token");
      const response = await fetch(
        `/api/patient-portal/invoices/${invoiceId}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factuur-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePayNow = async (invoiceId: string) => {
    setPayingId(invoiceId);

    try {
      const token = localStorage.getItem("patient_token");
      const response = await fetch(
        `/api/patient-portal/payments/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invoiceId }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Redirect to Mollie checkout
        window.location.href = data.checkoutUrl;
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create payment");
        setPayingId(null);
      }
    } catch (error) {
      console.error("Failed to create payment:", error);
      alert("Er is een fout opgetreden bij het aanmaken van de betaling");
      setPayingId(null);
    }
  };

  const isOverdue = (invoice: Invoice) => {
    return invoice.status !== "PAID" && new Date(invoice.dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white/95 mb-2">Facturen</h1>
          <p className="text-lg text-white/50">
            Beheer en download uw facturen
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white/95 mb-2">Facturen</h1>
          <p className="text-lg text-white/50">
            Beheer en download uw facturen
          </p>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 rounded-xl border border-white/[0.12] text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-all"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white/90 font-medium">Filter op status</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-white/40 hover:text-white/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === ""
                  ? "bg-[#e8945a] text-white"
                  : "bg-white/[0.06] text-white/70 hover:bg-white/[0.09]"
              }`}
            >
              Alle ({summary?.totalInvoices || 0})
            </button>
            <button
              onClick={() => setStatusFilter("SENT")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === "SENT"
                  ? "bg-[#e8945a] text-white"
                  : "bg-white/[0.06] text-white/70 hover:bg-white/[0.09]"
              }`}
            >
              Verstuurd
            </button>
            <button
              onClick={() => setStatusFilter("OVERDUE")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === "OVERDUE"
                  ? "bg-[#e8945a] text-white"
                  : "bg-white/[0.06] text-white/70 hover:bg-white/[0.09]"
              }`}
            >
              Overschreden ({summary?.overdueCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === "PAID"
                  ? "bg-[#e8945a] text-white"
                  : "bg-white/[0.06] text-white/70 hover:bg-white/[0.09]"
              }`}
            >
              Betaald
            </button>
            <button
              onClick={() => setStatusFilter("PARTIALLY_PAID")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === "PARTIALLY_PAID"
                  ? "bg-[#e8945a] text-white"
                  : "bg-white/[0.06] text-white/70 hover:bg-white/[0.09]"
              }`}
            >
              Gedeeltelijk betaald
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <FileText className="w-5 h-5 text-white/60" />
              </div>
              <h3 className="text-white/60 text-sm">Totaal facturen</h3>
            </div>
            <p className="text-2xl font-bold text-white/90">
              {summary.totalInvoices}
            </p>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-white/60 text-sm">Onbetaald</h3>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {summary.unpaidCount}
            </p>
            <p className="text-sm text-white/40">
              {formatCurrency(summary.unpaidAmount)}
            </p>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white/60 text-sm">Overschreden</h3>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {summary.overdueCount}
            </p>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-white/60 text-sm">Totaal bedrag</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(summary.totalAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-3xl overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/70 mb-2">
              Geen facturen gevonden
            </h3>
            <p className="text-sm text-white/40">
              {statusFilter
                ? "Er zijn geen facturen met deze status."
                : "U heeft nog geen facturen."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/[0.12]">
                <tr className="text-left">
                  <th className="px-6 py-4 text-white/40 text-sm font-medium">
                    Factuur
                  </th>
                  <th className="px-6 py-4 text-white/40 text-sm font-medium">
                    Datum
                  </th>
                  <th className="px-6 py-4 text-white/40 text-sm font-medium">
                    Vervaldatum
                  </th>
                  <th className="px-6 py-4 text-white/40 text-sm font-medium">
                    Bedrag
                  </th>
                  <th className="px-6 py-4 text-white/40 text-sm font-medium">
                    Status
                  </th>
                  <th className="px-6 py-4 text-white/40 text-sm font-medium text-right">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.12]">
                {invoices.map((invoice) => {
                  const StatusIcon = getStatusIcon(invoice.status);
                  const overdue = isOverdue(invoice);

                  return (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        overdue ? "bg-red-500/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white/90 font-medium">
                            #{invoice.invoiceNumber}
                          </p>
                          <p className="text-white/40 text-sm">
                            {invoice.lineCount} items
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white/80">
                            {formatDate(invoice.invoiceDate)}
                          </p>
                          <p className="text-white/40 text-xs">
                            {formatFullDate(invoice.invoiceDate)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p
                            className={`text-sm ${overdue ? "text-red-400 font-medium" : "text-white/80"}`}
                          >
                            {formatDate(invoice.dueDate)}
                          </p>
                          {overdue && (
                            <p className="text-red-400 text-xs">Overschreden</p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white/90 font-medium">
                            {formatCurrency(invoice.patientAmount)}
                          </p>
                          {invoice.insuranceAmount > 0 && (
                            <p className="text-white/40 text-xs">
                              Verzekering:{" "}
                              {formatCurrency(invoice.insuranceAmount)}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(invoice.status)}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-white/80 text-sm">
                              {getStatusLabel(invoice.status)}
                            </p>
                            {invoice.hasPayments && (
                              <p className="text-white/40 text-xs">
                                Betaald: {formatCurrency(invoice.totalPaid)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Show payment button for unpaid invoices */}
                          {(invoice.status === "SENT" ||
                            invoice.status === "PARTIALLY_PAID" ||
                            invoice.status === "OVERDUE") && (
                            <button
                              onClick={() => handlePayNow(invoice.id)}
                              disabled={payingId === invoice.id}
                              className="px-3 py-2 rounded-xl bg-[#e8945a] text-white hover:bg-[#d4864a] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
                              title="Betaal nu"
                            >
                              {payingId === invoice.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CreditCard className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                Betaal nu
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDownloadPdf(
                                invoice.id,
                                invoice.invoiceNumber,
                              )
                            }
                            disabled={downloadingId === invoice.id}
                            className="p-2 rounded-xl border border-white/[0.12] text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download PDF"
                          >
                            {downloadingId === invoice.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-4">
        <div className="flex items-center gap-3 text-white/50">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">
            Vragen over uw facturen? Neem contact op met de praktijk via het
            berichtenportaal.
          </p>
        </div>
      </div>
    </div>
  );
}
