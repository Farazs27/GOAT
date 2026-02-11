"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  Download,
  Calendar,
  User,
  Clock,
  Check,
  AlertTriangle,
  Loader2,
  FileText,
  CheckCircle,
} from "lucide-react";

interface Referral {
  id: string;
  specialistType: string;
  specialistName: string | null;
  specialistPractice: string | null;
  reason: string;
  urgency: "ROUTINE" | "URGENT" | "EMERGENCY";
  status: "SENT" | "APPOINTMENT_MADE" | "COMPLETED" | "CANCELLED";
  referralDate: string;
  appointmentMadeAt: string | null;
  completedAt: string | null;
  pdfUrl: string | null;
  referringDentist: string | null;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Check }
> = {
  SENT: {
    label: "Verstuurd",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    icon: ExternalLink,
  },
  APPOINTMENT_MADE: {
    label: "Afspraak gemaakt",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    icon: Calendar,
  },
  COMPLETED: {
    label: "Afgerond",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    icon: Check,
  },
  CANCELLED: {
    label: "Geannuleerd",
    color: "text-red-400 bg-red-400/10 border-red-400/30",
    icon: AlertTriangle,
  },
};

const urgencyConfig: Record<string, { label: string; color: string }> = {
  ROUTINE: { label: "Regulier", color: "text-white/50 bg-white/[0.06] backdrop-blur-2xl" },
  URGENT: { label: "Spoed", color: "text-amber-400 bg-amber-400/10" },
  EMERGENCY: { label: "Noodgeval", color: "text-red-400 bg-red-400/10" },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function VerwijzingenPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem("patient_token");
      const response = await fetch("/api/patient-portal/referrals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setReferrals(data.referrals);
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleMarkAppointmentMade = async (id: string) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem("patient_token");
      const response = await fetch(
        `/api/patient-portal/referrals/${id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "APPOINTMENT_MADE" }),
        }
      );
      if (response.ok) {
        setReferrals((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "APPOINTMENT_MADE" as const,
                  appointmentMadeAt: new Date().toISOString(),
                }
              : r
          )
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadPdf = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white/95 mb-2">
            Verwijzingen
          </h1>
          <p className="text-lg text-white/50">
            Uw verwijsbrieven naar specialisten
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
      <div>
        <h1 className="text-3xl font-bold text-white/95 mb-2">Verwijzingen</h1>
        <p className="text-lg text-white/50">
          Uw verwijsbrieven naar specialisten
        </p>
      </div>

      {/* Referrals List */}
      {referrals.length === 0 ? (
        <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-3xl p-12 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/70 mb-2">
            Geen verwijzingen
          </h3>
          <p className="text-sm text-white/40">
            U heeft nog geen verwijsbrieven ontvangen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((referral) => {
            const status = statusConfig[referral.status] || statusConfig.SENT;
            const urgency =
              urgencyConfig[referral.urgency] || urgencyConfig.ROUTINE;
            const StatusIcon = status.icon;

            return (
              <div
                key={referral.id}
                className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.18]"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#e8945a]/10 flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-[#e8945a]" />
                      </div>
                      <div>
                        <h3 className="text-white/90 font-semibold">
                          {referral.specialistType}
                        </h3>
                        {referral.specialistName && (
                          <p className="text-sm text-white/50">
                            {referral.specialistName}
                            {referral.specialistPractice &&
                              ` — ${referral.specialistPractice}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-white/70 mb-3">
                      {referral.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(referral.referralDate)}</span>
                      </div>
                      {referral.referringDentist && (
                        <div className="flex items-center gap-1.5 text-white/40">
                          <User className="w-4 h-4" />
                          <span>{referral.referringDentist}</span>
                        </div>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${urgency.color}`}
                      >
                        {urgency.label}
                      </span>
                    </div>

                    {referral.appointmentMadeAt && (
                      <p className="text-xs text-white/40 mt-2">
                        Afspraak gemaakt op{" "}
                        {formatDate(referral.appointmentMadeAt)}
                      </p>
                    )}
                  </div>

                  {/* Status + Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium ${status.color}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </div>

                    <div className="flex items-center gap-2">
                      {referral.pdfUrl && (
                        <button
                          onClick={() => handleDownloadPdf(referral.pdfUrl!)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.12] text-white/60 hover:text-white/90 hover:border-white/[0.15] transition-all text-sm"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      )}

                      {referral.status === "SENT" && (
                        <button
                          onClick={() =>
                            handleMarkAppointmentMade(referral.id)
                          }
                          disabled={updatingId === referral.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e8945a] text-white text-sm font-medium hover:bg-[#d4864a] transition-all duration-300 disabled:opacity-50 shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
                        >
                          {updatingId === referral.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Afspraak gemaakt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-4">
        <div className="flex items-start gap-3 text-white/50">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">
            Heeft u een verwijsbrief ontvangen? Maak zo snel mogelijk een
            afspraak bij de specialist en klik op &quot;Afspraak gemaakt&quot;
            zodat uw tandarts op de hoogte is.
          </p>
        </div>
      </div>
    </div>
  );
}
