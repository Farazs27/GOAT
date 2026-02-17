"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  X,
  ChevronDown,
  CalendarCheck,
  CalendarPlus,
  Plus,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  CHECKUP: "Controle",
  TREATMENT: "Behandeling",
  EMERGENCY: "Spoed",
  CONSULTATION: "Consult",
  HYGIENE: "Mondhygiëne",
};

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "Wacht op goedkeuring",
  SCHEDULED: "Gepland",
  CONFIRMED: "Bevestigd",
  CHECKED_IN: "Ingecheckt",
  IN_PROGRESS: "Bezig",
  COMPLETED: "Afgerond",
  NO_SHOW: "Niet verschenen",
  CANCELLED: "Geannuleerd",
};

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  SCHEDULED: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  CONFIRMED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  CHECKED_IN: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  NO_SHOW: "bg-red-500/10 text-red-400 border border-red-500/20",
  CANCELLED: "bg-white/5 text-white/30 border border-white/10",
};

const typeBadgeColors: Record<string, string> = {
  CHECKUP: "bg-orange-500/15 text-orange-300",
  TREATMENT: "bg-orange-500/15 text-orange-300",
  EMERGENCY: "bg-red-500/15 text-red-300",
  CONSULTATION: "bg-orange-500/15 text-orange-300",
  HYGIENE: "bg-orange-500/15 text-orange-300",
};

const CANCEL_REASONS = [
  "Kan niet komen",
  "Voel me niet lekker",
  "Wil andere datum",
  "Andere reden",
];

function getDayNumber(d: string) {
  return new Date(d).getDate();
}

function getMonthShort(d: string) {
  return new Date(d)
    .toLocaleDateString("nl-NL", { month: "short" })
    .toUpperCase();
}

function getWeekday(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", { weekday: "long" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateCompact(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateLong(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function canModify(startTime: string) {
  return new Date(startTime).getTime() - Date.now() >= 24 * 60 * 60 * 1000;
}

interface Slot {
  date: string;
  startTime: string;
  endTime: string;
}

export default function AppointmentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [mounted, setMounted] = useState(false);

  // Cancel state
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelling, setCancelling] = useState(false);

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  // Past expanded
  const [expandedPast, setExpandedPast] = useState<Set<string>>(new Set());
  const [treatments, setTreatments] = useState<Record<string, any[]>>({});

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getToken = () => localStorage.getItem("patient_token");

  const fetchAppointments = useCallback(() => {
    const token = getToken();
    fetch("/api/patient-portal/appointments", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchAppointments, [fetchAppointments]);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Cancel handler
  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/patient-portal/appointments/${cancelId}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.message || "Annuleren mislukt");
      } else {
        showToast("Afspraak geannuleerd");
        fetchAppointments();
      }
    } catch {
      showToast("Er is iets misgegaan");
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  };

  // Reschedule: fetch slots
  const openReschedule = async (id: string) => {
    setRescheduleId(id);
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/patient-portal/appointments/${id}/reschedule`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      } else {
        const err = await res.json();
        showToast(err.message || "Kon beschikbare tijden niet ophalen");
        setRescheduleId(null);
      }
    } catch {
      showToast("Er is iets misgegaan");
      setRescheduleId(null);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Reschedule: confirm
  const confirmReschedule = async () => {
    if (!rescheduleId || !selectedSlot) return;
    setRescheduling(true);
    try {
      const res = await fetch(`/api/patient-portal/appointments/${rescheduleId}/reschedule`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slotStart: selectedSlot }),
      });
      if (res.ok) {
        showToast("Afspraak verplaatst");
        fetchAppointments();
      } else {
        const err = await res.json();
        showToast(err.message || "Verplaatsen mislukt");
      }
    } catch {
      showToast("Er is iets misgegaan");
    } finally {
      setRescheduling(false);
      setRescheduleId(null);
    }
  };

  // ICS download
  const downloadIcs = async (id: string) => {
    const res = await fetch(`/api/patient-portal/appointments/${id}/ics`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "afspraak.ics";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Toggle past card expansion
  const togglePastExpand = async (id: string) => {
    const next = new Set(expandedPast);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      // Fetch treatments if not cached
      if (!treatments[id]) {
        try {
          const res = await fetch(`/api/patient-portal/appointments`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          if (res.ok) {
            // treatments are included in appointment data if available
            // For now we show what's in the appointment data
          }
        } catch {
          // silent
        }
      }
    }
    setExpandedPast(next);
  };

  const upcomingList = data?.upcoming || [];
  const pastList = data?.past || [];

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-white/[0.12] backdrop-blur-2xl border border-white/[0.18] rounded-2xl shadow-xl shadow-black/20 text-sm text-white/90 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white/95 mb-2">
            Mijn Afspraken
          </h1>
          <p className="text-base text-white/40">
            Bekijk en beheer uw aankomende en eerdere afspraken
          </p>
        </div>
        <Link
          href="/portal/appointments/book"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#e8945a] to-[#d4864a] text-white font-medium rounded-2xl shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          Afspraak Maken
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 p-1 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === "upcoming"
              ? "bg-white/[0.12] text-white shadow-sm border border-white/[0.12]"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          Aankomend
          {upcomingList.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 text-xs font-semibold">
              {upcomingList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === "past"
              ? "bg-white/[0.12] text-white shadow-sm border border-white/[0.12]"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          Afgelopen
          {pastList.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-xs font-semibold">
              {pastList.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-orange-400 rounded-full animate-spin" />
          <p className="text-sm text-white/30">Afspraken laden...</p>
        </div>
      ) : (
        <>
          {/* Upcoming Tab */}
          {activeTab === "upcoming" && (
            <section>
              {upcomingList.length > 0 ? (
                <div className="space-y-4">
                  {upcomingList.map((appt: any, i: number) => {
                    const modifiable = canModify(appt.startTime);
                    return (
                      <div
                        key={appt.id}
                        className="group relative bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:bg-white/[0.09] hover:border-white/[0.18] hover:shadow-lg hover:shadow-orange-500/5"
                        style={{
                          opacity: mounted ? 1 : 0,
                          transform: mounted ? "translateY(0)" : "translateY(12px)",
                          transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s, border-color 0.3s, box-shadow 0.3s`,
                        }}
                      >
                        {/* Left accent bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-600 rounded-l-3xl" />

                        <div className="flex flex-col sm:flex-row items-stretch">
                          {/* Date block */}
                          <div className="flex sm:flex-col items-center sm:justify-center gap-1 px-6 py-5 sm:py-6 sm:px-8 sm:border-r border-b sm:border-b-0 border-white/[0.06] sm:min-w-[100px]">
                            <span className="text-3xl font-bold text-white/90 leading-none">
                              {getDayNumber(appt.startTime)}
                            </span>
                            <span className="text-xs font-semibold text-orange-400/80 tracking-wider uppercase sm:mt-1">
                              {getMonthShort(appt.startTime)}
                            </span>
                            <span className="text-[11px] text-white/30 capitalize sm:mt-0.5 hidden sm:block">
                              {getWeekday(appt.startTime)}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-5 sm:p-6">
                            <div className="space-y-3">
                              {/* Time + Status + Reminder */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5 text-white/80">
                                  <Clock className="w-4 h-4 text-orange-400/60" />
                                  <span className="text-base font-semibold">
                                    {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                                  </span>
                                </div>
                                <span
                                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusColors[appt.status] || "bg-white/10 text-white/40"}`}
                                >
                                  {statusLabels[appt.status] || appt.status}
                                </span>
                                {appt.reminderSentAt && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                                    Herinnering verstuurd
                                  </span>
                                )}
                                {appt.confirmationSentAt && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15">
                                    Bevestiging verstuurd
                                  </span>
                                )}
                              </div>

                              {/* Details row */}
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl ${typeBadgeColors[appt.appointmentType] || "bg-orange-500/15 text-orange-300"}`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  {typeLabels[appt.appointmentType] || appt.appointmentType}
                                </span>
                                {appt.practitioner && (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-white/50 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                                    <User className="w-3 h-3 text-white/30" />
                                    {appt.practitioner.firstName} {appt.practitioner.lastName}
                                  </span>
                                )}
                                {appt.room && (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-white/50 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                                    <MapPin className="w-3 h-3 text-white/30" />
                                    Kamer {appt.room}
                                  </span>
                                )}
                                {appt.durationMinutes && (
                                  <span className="text-xs text-white/30">
                                    {appt.durationMinutes} min
                                  </span>
                                )}
                              </div>

                              {appt.notes && (
                                <p className="text-xs text-white/30 line-clamp-2">
                                  {appt.notes}
                                </p>
                              )}

                              {/* Action buttons */}
                              <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                  onClick={() => downloadIcs(appt.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.06] border border-white/[0.12] backdrop-blur-xl text-white/70 rounded-xl hover:bg-white/[0.1] transition-all text-xs font-medium"
                                >
                                  <CalendarPlus className="w-3.5 h-3.5" />
                                  Agenda toevoegen
                                </button>
                                {modifiable ? (
                                  <button
                                    onClick={() => openReschedule(appt.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.06] border border-white/[0.12] backdrop-blur-xl text-white/70 rounded-xl hover:bg-white/[0.1] transition-all text-xs font-medium"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Wijzigen
                                  </button>
                                ) : (
                                  <span
                                    title="Kan niet meer wijzigen (minder dan 24 uur)"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.03] border border-white/[0.06] text-white/20 rounded-xl text-xs font-medium cursor-not-allowed"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Wijzigen
                                  </span>
                                )}
                                {appt.status !== "CANCELLED" && (
                                  modifiable ? (
                                    <button
                                      onClick={() => {
                                        setCancelId(appt.id);
                                        setCancelReason(CANCEL_REASONS[0]);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-500/8 border border-red-500/15 text-red-300/70 rounded-xl hover:bg-red-500/15 hover:text-red-300 transition-all text-xs font-medium"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Annuleren
                                    </button>
                                  ) : (
                                    <span
                                      title="Kan niet meer annuleren (minder dan 24 uur)"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.03] border border-white/[0.06] text-white/20 rounded-xl text-xs font-medium cursor-not-allowed"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Annuleren
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 p-10 text-center"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: "opacity 0.5s ease 0.1s",
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
                      <CalendarCheck className="w-7 h-7 text-orange-400/60" />
                    </div>
                    <p className="text-sm text-white/35 mt-1">
                      U heeft geen komende afspraken
                    </p>
                    <p className="text-xs text-white/20 mb-4">
                      Plan direct een nieuwe afspraak
                    </p>
                    <Link
                      href="/portal/appointments/book"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#e8945a] to-[#d4864a] text-white font-medium rounded-2xl shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Afspraak Maken
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Past Tab */}
          {activeTab === "past" && (
            <section>
              {pastList.length > 0 ? (
                <div className="space-y-3">
                  {pastList.map((appt: any, i: number) => {
                    const isExpanded = expandedPast.has(appt.id);
                    return (
                      <div
                        key={appt.id}
                        className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-xl shadow-black/10 transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.18] overflow-hidden"
                        style={{
                          opacity: mounted ? 1 : 0,
                          transform: mounted ? "translateY(0)" : "translateY(8px)",
                          transition: `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s, background-color 0.3s, border-color 0.3s`,
                        }}
                      >
                        <button
                          onClick={() => togglePastExpand(appt.id)}
                          className="w-full px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left"
                        >
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-sm font-medium text-white/40 min-w-[90px]">
                              {formatDateCompact(appt.startTime)}
                            </span>
                            <span className="text-sm text-white/25 hidden sm:inline">
                              {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                            </span>
                            <span className="text-xs text-white/35 px-2.5 py-1 rounded-lg bg-white/[0.04]">
                              {typeLabels[appt.appointmentType] || appt.appointmentType}
                            </span>
                            {appt.practitioner && (
                              <span className="text-xs text-white/25">
                                {appt.practitioner.firstName} {appt.practitioner.lastName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0 ${statusColors[appt.status] || "bg-white/5 text-white/30"}`}
                            >
                              {statusLabels[appt.status] || appt.status}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-white/20 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="px-5 pb-4 border-t border-white/[0.06]">
                            <div className="pt-4 space-y-2">
                              {appt.treatments && appt.treatments.length > 0 ? (
                                <>
                                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                                    Uitgevoerde behandelingen
                                  </p>
                                  {appt.treatments.map((t: any, ti: number) => (
                                    <div
                                      key={ti}
                                      className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-xl"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400/40" />
                                      <span className="text-xs text-white/50">
                                        {t.description}
                                        {t.toothId && (
                                          <span className="text-white/25 ml-1.5">
                                            Tand {t.toothId}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <p className="text-xs text-white/25 py-2">
                                  Geen behandelgegevens beschikbaar
                                </p>
                              )}
                              {appt.notes && (
                                <p className="text-xs text-white/20 mt-2 pt-2 border-t border-white/[0.04]">
                                  {appt.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-xl shadow-black/10 p-8 text-center"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: "opacity 0.5s ease 0.3s",
                  }}
                >
                  <p className="text-sm text-white/25">
                    Geen eerdere afspraken gevonden
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Cancel Dialog */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-2xl shadow-black/40 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white/90">
                  Weet u het zeker?
                </h3>
                <p className="text-xs text-white/40">
                  Uw afspraak wordt geannuleerd
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/50 block mb-2">
                Reden voor annulering
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl text-sm text-white/80 focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 outline-none transition-all appearance-none"
              >
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={r} className="bg-[#1a1a2e] text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.12] text-white/70 rounded-2xl hover:bg-white/[0.1] transition-all text-sm font-medium"
              >
                Terug
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-2xl hover:bg-red-500/25 transition-all text-sm font-semibold disabled:opacity-50"
              >
                {cancelling ? "Bezig..." : "Annuleren"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-2xl shadow-black/40 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white/90">
                  Kies een nieuw tijdstip
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  Selecteer een beschikbaar moment
                </p>
              </div>
              <button
                onClick={() => setRescheduleId(null)}
                className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-white/10 border-t-orange-400 rounded-full animate-spin" />
              </div>
            ) : slots.length > 0 ? (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <button
                    key={slot.startTime}
                    onClick={() => setSelectedSlot(slot.startTime)}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-left transition-all duration-200 ${
                      selectedSlot === slot.startTime
                        ? "bg-[#e8945a]/15 border-[#e8945a]/40 shadow-lg shadow-[#e8945a]/10"
                        : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${selectedSlot === slot.startTime ? "text-[#e8945a]" : "text-white/70"}`}>
                          {formatDateLong(slot.startTime)}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </p>
                      </div>
                      {selectedSlot === slot.startTime && (
                        <div className="w-6 h-6 rounded-full bg-[#e8945a] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30 text-center py-6">
                Geen beschikbare tijdsloten gevonden
              </p>
            )}

            {slots.length > 0 && (
              <button
                onClick={confirmReschedule}
                disabled={!selectedSlot || rescheduling}
                className="w-full px-4 py-3 bg-[#e8945a] hover:bg-[#d4864a] text-white font-semibold rounded-2xl shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {rescheduling ? "Bezig met verplaatsen..." : "Bevestigen"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
