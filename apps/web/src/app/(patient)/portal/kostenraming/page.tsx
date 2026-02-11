"use client";

import { useState, useEffect } from "react";
import {
  Euro,
  FileText,
  Check,
  X,
  ChevronDown,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Treatment {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  nzaCode: {
    code: string;
    description: string;
  } | null;
  toothNumber: number | null;
}

interface Estimate {
  id: string;
  title: string;
  description: string | null;
  status: "PROPOSED" | "ACCEPTED" | "CANCELLED";
  proposedAt: string | null;
  acceptedAt: string | null;
  totalEstimate: number;
  insuranceEstimate: number;
  patientEstimate: number;
  practitioner: {
    firstName: string | null;
    lastName: string | null;
  };
  treatments: Treatment[];
}

export default function KostenramingPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    estimateId: string;
    action: "accept" | "decline";
    title: string;
  } | null>(null);

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("patient_token");
      if (!token) {
        throw new Error("Niet ingelogd");
      }

      const response = await fetch("/api/patient-portal/cost-estimates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Kon kostenramingen niet ophalen");
      }

      const data = await response.json();
      setEstimates(data.estimates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAction = async (estimateId: string, action: "accept" | "decline") => {
    try {
      setActionLoading(estimateId);
      const token = localStorage.getItem("patient_token");
      if (!token) {
        throw new Error("Niet ingelogd");
      }

      const response = await fetch(
        `/api/patient-portal/cost-estimates/${estimateId}/respond`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        throw new Error("Kon actie niet uitvoeren");
      }

      // Refresh estimates list
      await fetchEstimates();
      setConfirmDialog(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Er is een fout opgetreden");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (estimateId: string) => {
    try {
      const token = localStorage.getItem("patient_token");
      if (!token) {
        throw new Error("Niet ingelogd");
      }

      const response = await fetch(
        `/api/patient-portal/cost-estimates/${estimateId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Kon PDF niet downloaden");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kostenraming-${estimateId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Er is een fout opgetreden");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROPOSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
            <FileText className="w-3.5 h-3.5" />
            In afwachting
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
            <Check className="w-3.5 h-3.5" />
            Geaccepteerd
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
            <X className="w-3.5 h-3.5" />
            Afgewezen
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6 max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-white/95 mb-2">Fout</h2>
          <p className="text-white/50">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Euro className="w-8 h-8 text-[#e8945a]" />
          <h1 className="text-3xl font-bold text-white/95">Kostenramingen</h1>
        </div>
        <p className="text-white/50 text-sm">
          Bekijk en accepteer uw kostenramingen
        </p>
      </div>

      {/* Estimates List */}
      {estimates.length === 0 ? (
        <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white/95 mb-2">
            Geen kostenramingen
          </h2>
          <p className="text-white/50">
            U heeft momenteel geen openstaande of eerdere kostenramingen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {estimates.map((estimate) => {
            const isExpanded = expandedIds.has(estimate.id);
            const practitionerName = [
              estimate.practitioner.firstName,
              estimate.practitioner.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={estimate.id}
                className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6 space-y-4 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white/95 mb-1">
                      {estimate.title}
                    </h2>
                    {estimate.description && (
                      <p className="text-white/50 text-sm mb-2">
                        {estimate.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-white/40">
                      {practitionerName && (
                        <span>Behandelaar: {practitionerName}</span>
                      )}
                      <span>Voorgesteld: {formatDate(estimate.proposedAt)}</span>
                    </div>
                  </div>
                  {getStatusBadge(estimate.status)}
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.12]">
                    <div className="text-white/40 text-xs mb-1">
                      Totale kosten
                    </div>
                    <div className="text-white/95 text-lg font-semibold">
                      {formatCurrency(estimate.totalEstimate)}
                    </div>
                  </div>
                  <div className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.12]">
                    <div className="text-white/40 text-xs mb-1">
                      Vergoeding verzekering
                    </div>
                    <div className="text-green-400 text-lg font-semibold">
                      {formatCurrency(estimate.insuranceEstimate)}
                    </div>
                  </div>
                  <div className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.12]">
                    <div className="text-white/40 text-xs mb-1">
                      Eigen bijdrage
                    </div>
                    <div className="text-[#e8945a] text-2xl font-bold">
                      {formatCurrency(estimate.patientEstimate)}
                    </div>
                  </div>
                </div>

                {/* Treatment Details (Collapsible) */}
                {estimate.treatments.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleExpanded(estimate.id)}
                      className="flex items-center gap-2 text-white/70 hover:text-white/95 transition-colors text-sm font-medium"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                      Behandelingsdetails ({estimate.treatments.length}{" "}
                      {estimate.treatments.length === 1
                        ? "behandeling"
                        : "behandelingen"}
                      )
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {estimate.treatments.map((treatment) => (
                          <div
                            key={treatment.id}
                            className="bg-white/[0.06] rounded-lg p-3 border border-white/[0.12] grid grid-cols-12 gap-3 items-center text-sm"
                          >
                            <div className="col-span-5 text-white/95">
                              {treatment.description}
                              {treatment.nzaCode && (
                                <div className="text-white/40 text-xs mt-0.5">
                                  {treatment.nzaCode.code}
                                </div>
                              )}
                            </div>
                            {treatment.toothNumber && (
                              <div className="col-span-1 text-white/50 text-center">
                                {treatment.toothNumber}
                              </div>
                            )}
                            <div
                              className={`${
                                treatment.toothNumber ? "col-span-2" : "col-span-3"
                              } text-white/50 text-center`}
                            >
                              {treatment.quantity}x
                            </div>
                            <div className="col-span-2 text-white/70 text-right">
                              {formatCurrency(treatment.unitPrice)}
                            </div>
                            <div className="col-span-2 text-white/95 font-semibold text-right">
                              {formatCurrency(treatment.totalPrice)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  {estimate.status === "PROPOSED" && (
                    <>
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            estimateId: estimate.id,
                            action: "accept",
                            title: estimate.title,
                          })
                        }
                        disabled={actionLoading === estimate.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === estimate.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Accepteren
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            estimateId: estimate.id,
                            action: "decline",
                            title: estimate.title,
                          })
                        }
                        disabled={actionLoading === estimate.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        Afwijzen
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDownloadPdf(estimate.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.09] text-white/70 hover:text-white/95 rounded-lg font-medium transition-colors ml-auto"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-500/10 backdrop-blur-2xl shadow-xl shadow-black/10 border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-300 font-semibold mb-1">Let op</h3>
            <p className="text-amber-200/80 text-sm leading-relaxed">
              Dit is een schatting. Het exacte vergoedingsbedrag hangt af van uw
              verzekeringspolis en de door u gekozen aanvullende dekking.
              Definitieve kosten kunnen afwijken.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-white/[0.12] rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white/95 mb-2">
              {confirmDialog.action === "accept"
                ? "Kostenraming accepteren"
                : "Kostenraming afwijzen"}
            </h3>
            <p className="text-white/50 mb-6">
              {confirmDialog.action === "accept"
                ? `Weet u zeker dat u de kostenraming "${confirmDialog.title}" wilt accepteren?`
                : `Weet u zeker dat u de kostenraming "${confirmDialog.title}" wilt afwijzen?`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleAction(confirmDialog.estimateId, confirmDialog.action)
                }
                disabled={actionLoading === confirmDialog.estimateId}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmDialog.action === "accept"
                    ? "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                }`}
              >
                {actionLoading === confirmDialog.estimateId ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : confirmDialog.action === "accept" ? (
                  "Ja, accepteren"
                ) : (
                  "Ja, afwijzen"
                )}
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={actionLoading === confirmDialog.estimateId}
                className="flex-1 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.09] text-white/70 hover:text-white/95 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
