"use client";

import { useEffect, useState } from "react";
import {
  Stethoscope,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Euro,
  Hash,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  PLANNED: "Gepland",
  IN_PROGRESS: "In behandeling",
  COMPLETED: "Afgerond",
  CANCELLED: "Geannuleerd",
};

const statusColors: Record<string, string> = {
  PLANNED: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  IN_PROGRESS: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  CANCELLED: "bg-white/5 text-white/30 border border-white/10",
};

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount));
}

interface Treatment {
  id: string;
  description: string;
  status: string;
  performedAt: string | null;
  durationMinutes: number | null;
  quantity: number;
  unitPrice: string | null;
  totalPrice: string | null;
  notes: string | null;
  tooth: { toothNumber: number } | null;
  appointment: {
    startTime: string;
    practitioner: { firstName: string; lastName: string } | null;
  } | null;
  performer: { firstName: string; lastName: string } | null;
  nzaCode: { code: string; descriptionNl: string } | null;
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("patient_token");
    fetch("/api/patient-portal/treatments", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setTreatments(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const groupedTreatments = treatments.reduce(
    (acc, treatment) => {
      const date = treatment.performedAt || treatment.appointment?.startTime;
      const monthYear = date
        ? new Date(date).toLocaleDateString("nl-NL", {
            month: "long",
            year: "numeric",
          })
        : "Onbekende datum";

      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(treatment);
      return acc;
    },
    {} as Record<string, Treatment[]>,
  );

  const sortedMonths = Object.keys(groupedTreatments).sort((a, b) => {
    if (a === "Onbekende datum") return 1;
    if (b === "Onbekende datum") return -1;
    const dateA = new Date(
      groupedTreatments[a][0]?.performedAt ||
        groupedTreatments[a][0]?.appointment?.startTime ||
        0,
    );
    const dateB = new Date(
      groupedTreatments[b][0]?.performedAt ||
        groupedTreatments[b][0]?.appointment?.startTime ||
        0,
    );
    return dateB.getTime() - dateA.getTime();
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white/95 mb-2">
          Mijn Behandelingen
        </h1>
        <p className="text-base text-white/40">
          Overzicht van al uw uitgevoerde behandelingen
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-orange-400 rounded-full animate-spin" />
          <p className="text-sm text-white/30">Behandelingen laden...</p>
        </div>
      ) : treatments.length === 0 ? (
        <div
          className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-10 text-center shadow-xl shadow-black/10"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.5s ease 0.1s",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-orange-400/60" />
            </div>
            <p className="text-sm text-white/35 mt-1">
              Geen behandelingen gevonden
            </p>
            <p className="text-xs text-white/20">
              Uw behandelingen worden hier weergegeven na uw bezoek
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedMonths.map((monthYear, monthIndex) => (
            <section key={monthYear}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-white/70 capitalize">
                  {monthYear}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-xs font-medium border border-white/[0.12]">
                  {groupedTreatments[monthYear].length}
                </span>
              </div>

              <div className="space-y-3">
                {groupedTreatments[monthYear].map((treatment, index) => (
                  <div
                    key={treatment.id}
                    className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl overflow-hidden shadow-xl shadow-black/10 transition-all duration-300 hover:translate-y-[-2px] hover:bg-white/[0.09] hover:border-white/[0.18] hover:shadow-lg hover:shadow-orange-500/5"
                    style={{
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? "translateY(0)" : "translateY(12px)",
                      transition: `opacity 0.5s ease ${monthIndex * 0.1 + index * 0.05}s, transform 0.5s ease ${monthIndex * 0.1 + index * 0.05}s, border-color 0.3s, box-shadow 0.3s`,
                    }}
                  >
                    {/* Main row */}
                    <button
                      onClick={() => toggleExpand(treatment.id)}
                      className="w-full flex items-center gap-4 p-5 text-left"
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-5 h-5 text-orange-400/70" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-base font-semibold text-white/90 truncate">
                            {treatment.description}
                          </h3>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusColors[treatment.status] || "bg-white/10 text-white/40"}`}
                          >
                            {statusLabels[treatment.status] || treatment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs text-white/40">
                            <Calendar className="w-3.5 h-3.5 text-orange-400/50" />
                            {formatDate(
                              treatment.performedAt ||
                                treatment.appointment?.startTime,
                            )}
                          </span>
                          {treatment.tooth && (
                            <span className="flex items-center gap-1.5 text-xs text-white/40">
                              <Hash className="w-3.5 h-3.5 text-orange-400/50" />
                              Tand {treatment.tooth.toothNumber}
                            </span>
                          )}
                          {treatment.totalPrice && (
                            <span className="flex items-center gap-1.5 text-xs text-white/40">
                              <Euro className="w-3.5 h-3.5 text-orange-400/50" />
                              {formatCurrency(Number(treatment.totalPrice))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand icon */}
                      <div className="shrink-0 text-white/20">
                        {expandedId === treatment.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {expandedId === treatment.id && (
                      <div className="px-5 pb-5 pt-2 border-t border-white/[0.12]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                          {/* Practitioner */}
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-orange-400/60" />
                            </div>
                            <div>
                              <p className="text-xs text-white/30 mb-0.5">
                                Behandelaar
                              </p>
                              <p className="text-sm text-white/70">
                                {treatment.performer?.firstName}{" "}
                                {treatment.performer?.lastName}
                              </p>
                            </div>
                          </div>

                          {/* Duration */}
                          {treatment.durationMinutes && (
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 text-orange-400/60" />
                              </div>
                              <div>
                                <p className="text-xs text-white/30 mb-0.5">
                                  Duur
                                </p>
                                <p className="text-sm text-white/70">
                                  {treatment.durationMinutes} minuten
                                </p>
                              </div>
                            </div>
                          )}

                          {/* NZA Code */}
                          {treatment.nzaCode && (
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-orange-400/60" />
                              </div>
                              <div>
                                <p className="text-xs text-white/30 mb-0.5">
                                  Code
                                </p>
                                <p className="text-sm text-white/70">
                                  {treatment.nzaCode.code}
                                </p>
                                <p className="text-xs text-white/40 mt-0.5">
                                  {treatment.nzaCode.descriptionNl}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Cost details */}
                          {(treatment.unitPrice || treatment.totalPrice) && (
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shrink-0">
                                <Euro className="w-4 h-4 text-orange-400/60" />
                              </div>
                              <div>
                                <p className="text-xs text-white/30 mb-0.5">
                                  Kosten
                                </p>
                                <p className="text-sm text-white/70">
                                  {treatment.quantity > 1
                                    ? `${treatment.quantity} x `
                                    : ""}
                                  {formatCurrency(Number(treatment.unitPrice))}
                                </p>
                                {treatment.totalPrice && (
                                  <p className="text-xs text-orange-400/70 mt-0.5 font-medium">
                                    Totaal:{" "}
                                    {formatCurrency(
                                      Number(treatment.totalPrice),
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {treatment.notes && (
                          <div className="mt-4 p-4 rounded-2xl bg-white/[0.06] border border-white/[0.12] backdrop-blur-2xl">
                            <p className="text-xs text-white/30 mb-1.5">
                              Opmerkingen
                            </p>
                            <p className="text-sm text-white/60 leading-relaxed">
                              {treatment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
