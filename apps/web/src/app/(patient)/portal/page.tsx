"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MessageSquare, FileText, Receipt } from "lucide-react";

interface DashboardData {
  nextAppointment: {
    startTime: string;
    endTime: string;
    appointmentType: string;
    practitioner: { firstName: string; lastName: string };
  } | null;
  unreadMessages: number;
  recentDocuments: number;
  unpaidInvoices: { count: number; totalAmount: number };
}

const appointmentTypeLabels: Record<string, string> = {
  CHECKUP: "Controle",
  TREATMENT: "Behandeling",
  EMERGENCY: "Spoed",
  CONSULTATION: "Consult",
  HYGIENE: "Mondhygiene",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PatientDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pd = localStorage.getItem("patient_data");
    if (pd) setPatientData(JSON.parse(pd));

    const token = localStorage.getItem("patient_token");
    fetch("/api/patient-portal/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = patientData?.firstName || "Patient";

  const loadingPulse = (
    <div className="h-8 w-24 rounded-lg bg-white/[0.05] animate-pulse" />
  );

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: "rgba(255,255,255,0.95)" }}
        >
          Welkom terug, {firstName}
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Hier vindt u een overzicht van uw tandheelkundige zorg
        </p>
      </div>

      {/* 4 Summary Widgets - 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Volgende Afspraak */}
        <Link
          href="/portal/appointments"
          className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-6 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300 group"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(232,148,90,0.12)",
                border: "1px solid rgba(232,148,90,0.2)",
              }}
            >
              <Calendar className="w-6 h-6" style={{ color: "#e8945a" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Volgende Afspraak
              </p>
              {loading ? (
                loadingPulse
              ) : data?.nextAppointment ? (
                <>
                  <p
                    className="text-base font-semibold capitalize"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {formatDate(data.nextAppointment.startTime)}
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: "#e8945a" }}
                  >
                    {formatTime(data.nextAppointment.startTime)} -{" "}
                    {formatTime(data.nextAppointment.endTime)}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {appointmentTypeLabels[data.nextAppointment.appointmentType] ||
                      data.nextAppointment.appointmentType}{" "}
                    - {data.nextAppointment.practitioner.firstName}{" "}
                    {data.nextAppointment.practitioner.lastName}
                  </p>
                </>
              ) : (
                <>
                  <p
                    className="text-base font-semibold"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Geen afspraken
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "#e8945a" }}
                  >
                    Plan een afspraak
                  </p>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* 2. Ongelezen Berichten */}
        <Link
          href="/portal/messages"
          className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-6 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300 group"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <MessageSquare className="w-6 h-6" style={{ color: "#6366f1" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Ongelezen Berichten
              </p>
              {loading ? (
                loadingPulse
              ) : (
                <>
                  <p
                    className="text-3xl font-bold"
                    style={{
                      color:
                        (data?.unreadMessages || 0) > 0
                          ? "#e8945a"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    {data?.unreadMessages || 0}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {(data?.unreadMessages || 0) === 0
                      ? "Alles gelezen"
                      : "Bekijk berichten"}
                  </p>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* 3. Recente Documenten */}
        <Link
          href="/portal/documents"
          className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-6 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300 group"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <FileText className="w-6 h-6" style={{ color: "#10b981" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Recente Documenten
              </p>
              {loading ? (
                loadingPulse
              ) : (
                <>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {data?.recentDocuments || 0}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Laatste 30 dagen
                  </p>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* 4. Openstaande Facturen */}
        <Link
          href="/portal/invoices"
          className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-6 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300 group"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <Receipt className="w-6 h-6" style={{ color: "#f59e0b" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Openstaande Facturen
              </p>
              {loading ? (
                loadingPulse
              ) : (
                <>
                  <p
                    className="text-3xl font-bold"
                    style={{
                      color:
                        (data?.unpaidInvoices?.count || 0) > 0
                          ? "#e8945a"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    {data?.unpaidInvoices?.count || 0}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {(data?.unpaidInvoices?.count || 0) > 0
                      ? `Totaal: ${new Intl.NumberFormat("nl-NL", {
                          style: "currency",
                          currency: "EUR",
                        }).format(data?.unpaidInvoices?.totalAmount || 0)}`
                      : "Alles betaald"}
                  </p>
                </>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
