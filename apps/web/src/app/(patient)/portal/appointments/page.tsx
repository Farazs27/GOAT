"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  X,
  ChevronDown,
  CalendarCheck,
  Plus,
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
  PENDING_APPROVAL: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
  SCHEDULED: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  CHECKED_IN: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  IN_PROGRESS: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  NO_SHOW: "bg-red-500/15 text-red-300 border border-red-500/20",
  CANCELLED: "bg-white/5 text-white/30 border border-white/10",
};

const typeBadgeColors: Record<string, string> = {
  CHECKUP: "bg-orange-500/15 text-orange-300",
  TREATMENT: "bg-orange-500/15 text-orange-300",
  EMERGENCY: "bg-red-500/15 text-red-300",
  CONSULTATION: "bg-orange-500/15 text-orange-300",
  HYGIENE: "bg-orange-500/15 text-orange-300",
};

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

export default function AppointmentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showAllPast, setShowAllPast] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchAppointments = () => {
    const token = localStorage.getItem("patient_token");
    fetch("/api/patient-portal/appointments", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchAppointments, []);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    setConfirmId(null);
    const token = localStorage.getItem("patient_token");
    try {
      const res = await fetch(`/api/patient-portal/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Annuleren mislukt");
      } else {
        fetchAppointments();
      }
    } catch {
      alert("Er is iets misgegaan");
    } finally {
      setCancelling(null);
    }
  };

  const upcomingCount = data?.upcoming?.length || 0;
  const pastAppointments = data?.past || [];
  const visiblePast = showAllPast
    ? pastAppointments
    : pastAppointments.slice(0, 5);

  return (
    <div className="space-y-10">
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
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          Afspraak Maken
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-orange-400 rounded-full animate-spin" />
          <p className="text-sm text-white/30">Afspraken laden...</p>
        </div>
      ) : (
        <>
          {/* Upcoming Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-white/85">
                Aankomende afspraken
              </h2>
              {upcomingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 text-xs font-semibold border border-orange-500/20">
                  {upcomingCount}
                </span>
              )}
            </div>

            {upcomingCount > 0 ? (
              <div className="space-y-4">
                {data.upcoming.map((appt: any, i: number) => (
                  <div
                    key={appt.id}
                    className="group relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:border-white/[0.14] hover:shadow-lg hover:shadow-orange-500/5"
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
                      <div className="flex-1 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          {/* Time + Status */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 text-white/80">
                              <Clock className="w-4 h-4 text-orange-400/60" />
                              <span className="text-base font-semibold">
                                {formatTime(appt.startTime)} –{" "}
                                {formatTime(appt.endTime)}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusColors[appt.status] || "bg-white/10 text-white/40"}`}
                            >
                              {statusLabels[appt.status] || appt.status}
                            </span>
                          </div>

                          {/* Details row */}
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl ${typeBadgeColors[appt.appointmentType] || "bg-orange-500/15 text-orange-300"}`}
                            >
                              <Calendar className="w-3 h-3" />
                              {typeLabels[appt.appointmentType] ||
                                appt.appointmentType}
                            </span>
                            {appt.practitioner && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-white/50 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                                <User className="w-3 h-3 text-white/30" />
                                {appt.practitioner.firstName}{" "}
                                {appt.practitioner.lastName}
                              </span>
                            )}
                            {appt.room && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-white/50 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                                <MapPin className="w-3 h-3 text-white/30" />
                                Kamer {appt.room}
                              </span>
                            )}
                          </div>

                          {appt.notes && (
                            <p className="text-xs text-white/30 mt-1">
                              {appt.notes}
                            </p>
                          )}
                        </div>

                        {/* Cancel button */}
                        {appt.status !== "CANCELLED" && (
                          <div className="shrink-0">
                            {confirmId === appt.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCancel(appt.id)}
                                  disabled={cancelling === appt.id}
                                  className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50"
                                >
                                  {cancelling === appt.id
                                    ? "Bezig..."
                                    : "Bevestigen"}
                                </button>
                                <button
                                  onClick={() => setConfirmId(null)}
                                  className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmId(appt.id)}
                                className="px-4 py-2 rounded-xl border border-white/10 text-white/40 text-xs font-medium hover:border-red-500/30 hover:text-red-300 hover:bg-red-500/5 transition-all"
                              >
                                Annuleren
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-10 text-center"
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
                    Geen aankomende afspraken
                  </p>
                  <p className="text-xs text-white/20 mb-4">
                    Plan direct een nieuwe afspraak
                  </p>
                  <Link
                    href="/portal/appointments/book"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-sm font-medium hover:bg-orange-500/25 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Afspraak Maken
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Past Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-white/50">
                Eerdere afspraken
              </h2>
              {pastAppointments.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/30 text-xs font-semibold border border-white/[0.06]">
                  {pastAppointments.length}
                </span>
              )}
            </div>

            {pastAppointments.length > 0 ? (
              <div className="space-y-2.5">
                {visiblePast.map((appt: any, i: number) => (
                  <div
                    key={appt.id}
                    className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl px-5 py-4 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.08]"
                    style={{
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? "translateY(0)" : "translateY(8px)",
                      transition: `opacity 0.4s ease ${0.3 + i * 0.05}s, transform 0.4s ease ${0.3 + i * 0.05}s, background-color 0.3s, border-color 0.3s`,
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-sm font-medium text-white/40 min-w-[90px]">
                          {formatDateCompact(appt.startTime)}
                        </span>
                        <span className="text-sm text-white/25 hidden sm:inline">
                          {formatTime(appt.startTime)} –{" "}
                          {formatTime(appt.endTime)}
                        </span>
                        <span className="text-xs text-white/35 px-2.5 py-1 rounded-lg bg-white/[0.04]">
                          {typeLabels[appt.appointmentType] ||
                            appt.appointmentType}
                        </span>
                        {appt.practitioner && (
                          <span className="text-xs text-white/25">
                            {appt.practitioner.firstName}{" "}
                            {appt.practitioner.lastName}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0 ${statusColors[appt.status] || "bg-white/5 text-white/30"}`}
                      >
                        {statusLabels[appt.status] || appt.status}
                      </span>
                    </div>
                  </div>
                ))}

                {pastAppointments.length > 5 && (
                  <button
                    onClick={() => setShowAllPast(!showAllPast)}
                    className="w-full mt-3 py-3 rounded-2xl border border-white/[0.06] text-white/30 text-xs font-medium hover:text-white/50 hover:border-white/[0.1] hover:bg-white/[0.02] transition-all flex items-center justify-center gap-1.5"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllPast ? "rotate-180" : ""}`}
                    />
                    {showAllPast
                      ? "Toon minder"
                      : `Toon meer (${pastAppointments.length - 5})`}
                  </button>
                )}
              </div>
            ) : (
              <div
                className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 text-center"
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
        </>
      )}
    </div>
  );
}
