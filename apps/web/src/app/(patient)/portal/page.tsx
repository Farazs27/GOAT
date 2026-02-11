"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HealthInsight {
  overallScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  keyFindings: string[];
  personalizedTips: {
    icon: string;
    title: string;
    description: string;
  }[];
  areasNeedingAttention: string[];
  analyzedAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCountdown(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} dag${days > 1 ? "en" : ""} en ${hours} uur`;
  if (hours > 0) return `${hours} uur`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${mins} minuten`;
}

function getDaysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const appointmentTypeLabels: Record<string, string> = {
  CHECKUP: "Controle",
  TREATMENT: "Behandeling",
  EMERGENCY: "Spoed",
  CONSULTATION: "Consult",
  HYGIENE: "Mondhygiene",
};

const riskLevelConfig = {
  LOW: {
    label: "Laag risico",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.15)",
  },
  MEDIUM: {
    label: "Matig risico",
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.15)",
  },
  HIGH: {
    label: "Hoog risico",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
  },
};

// Circular progress component
function CircularProgress({
  score,
  size = 120,
}: {
  score: number;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getGradientColor = () => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#e8945a" />
            <stop offset="100%" stopColor="#d4864a" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-bold"
          style={{ color: "rgba(255,255,255,0.95)" }}
        >
          {score}
        </span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          / 100
        </span>
      </div>
    </div>
  );
}

// Icon component
function Icon({
  name,
  className = "",
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const icons: Record<string, React.ReactNode> = {
    ShieldCheck: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    Heart: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    ),
    Sparkles: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
    Target: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    Clock: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    AlertCircle: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    ),
    Calendar: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    ),
    ChevronDown: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
        />
      </svg>
    ),
    ChevronUp: (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>
    ),
  };

  const icon = icons[name];
  if (!icon) return null;

  return <span style={style}>{icon}</span>;
}

// Expandable card component
function ExpandableCard({
  title,
  icon,
  children,
  defaultExpanded = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div style={{ color: "#e8945a" }}>{icon}</div>
          <span
            className="font-medium"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {title}
          </span>
        </div>
        <Icon
          name={expanded ? "ChevronUp" : "ChevronDown"}
          className="w-5 h-5"
          style={{ color: "rgba(255,255,255,0.4)" }}
        />
      </button>
      {expanded && <div className="px-4 pb-4 animate-fadeIn">{children}</div>}
    </div>
  );
}

export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [healthInsights, setHealthInsights] = useState<HealthInsight | null>(
    null,
  );
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    const pd = localStorage.getItem("patient_data");
    if (pd) setPatientData(JSON.parse(pd));

    const token = localStorage.getItem("patient_token");

    // Fetch dashboard data
    fetch(`/api/patient-portal/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});

    // Fetch health insights
    fetch(`/api/patient-portal/health-insights`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((insights) => {
        setHealthInsights(insights);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setHealthLoading(false);
      });
  }, []);

  const firstName = patientData?.firstName || "Patient";
  const nextAppt = data?.nextAppointment;
  const countdown = nextAppt ? getCountdown(nextAppt.startTime) : null;
  const daysUntil = nextAppt ? getDaysUntil(nextAppt.startTime) : null;

  const openInvoiceCount =
    data?.recentInvoices?.filter((i: any) => i.status !== "PAID").length || 0;
  const pendingConsents = data?.pendingConsents || 0;
  const lastVisitDate = data?.lastVisit ? formatShortDate(data.lastVisit) : "-";

  const loadingSpinner = (
    <div
      className="flex items-center gap-3"
      style={{ color: "rgba(255,255,255,0.3)" }}
    >
      <div
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          borderTopColor: "#e8945a",
        }}
      />
      Laden...
    </div>
  );

  const riskConfig = healthInsights
    ? riskLevelConfig[healthInsights.riskLevel]
    : null;

  return (
    <div className="space-y-6">
      {/* Hero / Welcome card — spans full width */}
      <div className="patient-glass-card rounded-3xl p-8 lg:p-10 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-3xl"
          style={{
            background:
              "linear-gradient(90deg, #e8945a, #d4864a, rgba(232,148,90,0.2))",
          }}
        />
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(232,148,90,0.06), transparent 70%)",
          }}
        />
        <div className="relative z-10">
          <h1
            className="text-3xl lg:text-4xl font-bold mb-2"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Welkom terug, {firstName}
          </h1>
          <p
            className="text-base lg:text-lg mb-6"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Hier vindt u een overzicht van uw tandheelkundige zorg
          </p>

          {loading ? (
            loadingSpinner
          ) : nextAppt ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(232,148,90,0.12)",
                    border: "1px solid rgba(232,148,90,0.2)",
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: "#e8945a" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#e8945a" }}
                  >
                    Volgende afspraak
                  </p>
                  <p
                    className="text-lg font-semibold capitalize"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {formatDate(nextAppt.startTime)} om{" "}
                    {formatTime(nextAppt.startTime)}
                  </p>
                </div>
              </div>
              {countdown && (
                <div
                  className="px-4 py-2 rounded-2xl"
                  style={{
                    background: "rgba(232,148,90,0.1)",
                    border: "1px solid rgba(232,148,90,0.15)",
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#e8945a" }}
                  >
                    Over {countdown}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-base" style={{ color: "rgba(255,255,255,0.4)" }}>
              U heeft geen aankomende afspraken.
            </p>
          )}
        </div>
      </div>

      {/* Stats row — bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Volgende afspraak */}
        <div className="patient-stat-card p-5">
          <p
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Volgende afspraak
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {loading
              ? "..."
              : daysUntil !== null && daysUntil > 0
                ? `${daysUntil}d`
                : "-"}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {loading
              ? ""
              : nextAppt
                ? formatShortDate(nextAppt.startTime)
                : "Geen gepland"}
          </p>
        </div>

        {/* Openstaande facturen */}
        <div className="patient-stat-card p-5">
          <p
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Openstaande facturen
          </p>
          <p
            className="text-2xl font-bold"
            style={{
              color: openInvoiceCount > 0 ? "#e8945a" : "rgba(255,255,255,0.9)",
            }}
          >
            {loading ? "..." : openInvoiceCount}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {openInvoiceCount === 0 ? "Alles betaald" : "Actie vereist"}
          </p>
        </div>

        {/* Toestemmingen */}
        <div className="patient-stat-card p-5">
          <p
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Toestemmingen
          </p>
          <p
            className="text-2xl font-bold"
            style={{
              color: pendingConsents > 0 ? "#e8945a" : "rgba(255,255,255,0.9)",
            }}
          >
            {loading ? "..." : pendingConsents}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {pendingConsents === 0 ? "Alles ondertekend" : "In afwachting"}
          </p>
        </div>

        {/* Laatste bezoek */}
        <div className="patient-stat-card p-5">
          <p
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Laatste bezoek
          </p>
          <p
            className="text-xl font-bold"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {loading ? "..." : lastVisitDate}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Vorige afspraak
          </p>
        </div>
      </div>

      {/* Health Insights Section */}
      <div className="patient-glass-card rounded-3xl p-7 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-3xl"
          style={{
            background: "linear-gradient(90deg, #10b981, #e8945a, #ef4444)",
          }}
        />

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: "#10b981" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Mondgezondheid
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              AI-geanalyseerde gezondheidsinformatie
            </p>
          </div>
        </div>

        {healthLoading ? (
          loadingSpinner
        ) : healthInsights ? (
          <div className="space-y-6">
            {/* Score and Risk Level */}
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="flex flex-col items-center">
                <CircularProgress score={healthInsights.overallScore} />
                <p
                  className="mt-3 text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Gezondheidsscore
                </p>
              </div>

              <div className="flex-1 space-y-4">
                {riskConfig && (
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{
                      background: riskConfig.bgColor,
                      border: `1px solid ${riskConfig.color}30`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: riskConfig.color }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: riskConfig.color }}
                    >
                      {riskConfig.label}
                    </span>
                  </div>
                )}

                <p
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Laatste analyse:{" "}
                  {new Date(healthInsights.analyzedAt).toLocaleDateString(
                    "nl-NL",
                  )}
                </p>
              </div>
            </div>

            {/* Expandable Cards */}
            <div className="space-y-3">
              {/* Key Findings */}
              <ExpandableCard
                title="Belangrijkste bevindingen"
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                    />
                  </svg>
                }
                defaultExpanded={true}
              >
                <ul className="space-y-2">
                  {healthInsights.keyFindings.map((finding, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      <span style={{ color: "#e8945a" }}>•</span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </ExpandableCard>

              {/* Personalized Tips */}
              <ExpandableCard
                title="Persoonlijke tips"
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                    />
                  </svg>
                }
              >
                <div className="space-y-3">
                  {healthInsights.personalizedTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(232,148,90,0.1)" }}
                      >
                        <Icon
                          name={tip.icon}
                          className="w-4 h-4"
                          style={{ color: "#e8945a" }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "rgba(255,255,255,0.9)" }}
                        >
                          {tip.title}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ExpandableCard>

              {/* Areas Needing Attention */}
              {healthInsights.areasNeedingAttention.length > 0 && (
                <ExpandableCard
                  title="Aandachtspunten"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  }
                >
                  <ul className="space-y-2">
                    {healthInsights.areasNeedingAttention.map((area, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        <span style={{ color: "#f59e0b" }}>⚠</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </ExpandableCard>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Geen gezondheidsgegevens beschikbaar
            </p>
          </div>
        )}
      </div>

      {/* Bento grid: appointment detail + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next appointment detail card — 2 cols */}
        <div className="lg:col-span-2 patient-glass-card rounded-3xl p-7 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-1 h-full rounded-l-3xl"
            style={{
              background:
                "linear-gradient(180deg, #e8945a, rgba(232,148,90,0.2))",
            }}
          />
          <div className="pl-4">
            <h2
              className="text-lg font-semibold mb-5"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Afspraakdetails
            </h2>

            {loading ? (
              loadingSpinner
            ) : nextAppt ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div>
                    <p
                      className="text-2xl font-bold capitalize"
                      style={{ color: "rgba(255,255,255,0.95)" }}
                    >
                      {formatDate(nextAppt.startTime)}
                    </p>
                    <p
                      className="text-lg font-medium mt-1"
                      style={{ color: "#e8945a" }}
                    >
                      {formatTime(nextAppt.startTime)} -{" "}
                      {formatTime(nextAppt.endTime)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  <div
                    className="px-4 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      Type
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {appointmentTypeLabels[nextAppt.appointmentType] ||
                        nextAppt.appointmentType}
                    </p>
                  </div>
                  <div
                    className="px-4 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      Behandelaar
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {nextAppt.practitioner?.firstName}{" "}
                      {nextAppt.practitioner?.lastName}
                    </p>
                  </div>
                  {nextAppt.room && (
                    <div
                      className="px-4 py-2.5 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-xs mb-0.5"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        Kamer
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "rgba(255,255,255,0.8)" }}
                      >
                        {nextAppt.room}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p
                className="text-base"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Geen aankomende afspraken. Neem contact op met de praktijk om
                een afspraak te plannen.
              </p>
            )}
          </div>
        </div>

        {/* Quick actions card — 1 col */}
        <div className="patient-glass-card rounded-3xl p-7">
          <h2
            className="text-lg font-semibold mb-5"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Snelle acties
          </h2>
          <div className="space-y-3">
            <Link
              href="/portal/anamnesis"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(232,148,90,0.12)" }}
              >
                <svg
                  className="w-4.5 h-4.5"
                  style={{ color: "#e8945a", width: "18px", height: "18px" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                  />
                </svg>
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Anamnese invullen
              </span>
            </Link>

            <Link
              href="/portal/profile"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(232,148,90,0.12)" }}
              >
                <svg
                  className="w-4.5 h-4.5"
                  style={{ color: "#e8945a", width: "18px", height: "18px" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Profiel bewerken
              </span>
            </Link>

            <Link
              href="/portal/documents"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(232,148,90,0.12)" }}
              >
                <svg
                  className="w-4.5 h-4.5"
                  style={{ color: "#e8945a", width: "18px", height: "18px" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Documenten bekijken
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent invoices card — full width */}
      <div className="patient-glass-card rounded-3xl p-7">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-semibold"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Recente Facturen
          </h2>
          <Link
            href="/portal/documents"
            className="text-sm font-medium transition-colors"
            style={{ color: "#e8945a" }}
          >
            Alle bekijken
          </Link>
        </div>

        {loading ? (
          loadingSpinner
        ) : data?.recentInvoices?.length > 0 ? (
          <div className="space-y-2.5">
            {data.recentInvoices.map((inv: any) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {inv.invoiceNumber}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {new Date(inv.invoiceDate).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {new Intl.NumberFormat("nl-NL", {
                      style: "currency",
                      currency: "EUR",
                    }).format(Number(inv.total))}
                  </p>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      inv.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : inv.status === "OVERDUE"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {inv.status === "PAID"
                      ? "Betaald"
                      : inv.status === "OVERDUE"
                        ? "Verlopen"
                        : "Open"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p
            className="text-sm py-4"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Geen recente facturen gevonden.
          </p>
        )}
      </div>
    </div>
  );
}
