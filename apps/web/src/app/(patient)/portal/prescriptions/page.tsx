"use client";

import { useEffect, useState } from "react";
import {
  Pill,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  ACTIVE: "Actief",
  COMPLETED: "Afgerond",
  DISCONTINUED: "Gestopt",
  CANCELLED: "Geannuleerd",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  COMPLETED: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  DISCONTINUED: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  CANCELLED: "bg-white/5 text-white/30 border border-white/10",
};

const statusIcons: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle2 className="w-4 h-4 text-emerald-400/70" />,
  COMPLETED: <CheckCircle2 className="w-4 h-4 text-blue-400/70" />,
  DISCONTINUED: <AlertCircle className="w-4 h-4 text-amber-400/70" />,
  CANCELLED: <XCircle className="w-4 h-4 text-white/30" />,
};

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Prescription {
  id: string;
  medicationName: string;
  genericName: string | null;
  dosage: string;
  frequency: string;
  duration: string | null;
  quantity: number | null;
  route: string;
  instructions: string | null;
  status: string;
  prescribedAt: string;
  discontinuedAt: string | null;
  appointment: {
    startTime: string;
  } | null;
  prescriber: { firstName: string; lastName: string } | null;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("patient_token");
    fetch("/api/patient-portal/prescriptions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setPrescriptions(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const activePrescriptions = prescriptions.filter(
    (p) => p.status === "ACTIVE",
  );
  const pastPrescriptions = prescriptions.filter((p) => p.status !== "ACTIVE");

  const PrescriptionCard = ({
    prescription,
    index,
    isActive,
  }: {
    prescription: Prescription;
    index: number;
    isActive: boolean;
  }) => (
    <div
      className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:border-white/[0.14] hover:shadow-lg hover:shadow-orange-500/5"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s, border-color 0.3s, box-shadow 0.3s`,
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-500/10 border border-emerald-500/15" : "bg-orange-500/10 border border-orange-500/15"}`}
            >
              <Pill
                className={`w-5 h-5 ${isActive ? "text-emerald-400/70" : "text-orange-400/70"}`}
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white/90">
                {prescription.medicationName}
              </h3>
              {prescription.genericName && (
                <p className="text-xs text-white/40">
                  {prescription.genericName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusIcons[prescription.status]}
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusColors[prescription.status] || "bg-white/10 text-white/40"}`}
            >
              {statusLabels[prescription.status] || prescription.status}
            </span>
          </div>
        </div>

        {/* Dosage info */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-300/80 border border-orange-500/15">
            <Pill className="w-3 h-3" />
            {prescription.dosage}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-white/50 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <Clock className="w-3 h-3 text-white/30" />
            {prescription.frequency}
          </span>
          {prescription.route && prescription.route !== "oraal" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/50 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              {prescription.route}
            </span>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
          {/* Prescriber */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-orange-400/60" />
            </div>
            <div>
              <p className="text-[11px] text-white/30">Voorgeschreven door</p>
              <p className="text-sm text-white/70">
                {prescription.prescriber?.firstName}{" "}
                {prescription.prescriber?.lastName}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 text-orange-400/60" />
            </div>
            <div>
              <p className="text-[11px] text-white/30">Datum</p>
              <p className="text-sm text-white/70">
                {formatDate(prescription.prescribedAt)}
              </p>
            </div>
          </div>

          {/* Duration */}
          {prescription.duration && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-orange-400/60" />
              </div>
              <div>
                <p className="text-[11px] text-white/30">Duur</p>
                <p className="text-sm text-white/70">{prescription.duration}</p>
              </div>
            </div>
          )}

          {/* Quantity */}
          {prescription.quantity && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-orange-400/60" />
              </div>
              <div>
                <p className="text-[11px] text-white/30">Hoeveelheid</p>
                <p className="text-sm text-white/70">
                  {prescription.quantity} stuks
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {prescription.instructions && (
          <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[11px] text-white/30 mb-1.5">Instructies</p>
            <p className="text-sm text-white/60 leading-relaxed">
              {prescription.instructions}
            </p>
          </div>
        )}

        {/* Discontinued date */}
        {prescription.discontinuedAt && (
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <p className="text-xs text-amber-400/70">
              Gestopt op: {formatDate(prescription.discontinuedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white/95 mb-2">
          Mijn Medicatie
        </h1>
        <p className="text-base text-white/40">
          Overzicht van al uw voorgeschreven medicatie
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-orange-400 rounded-full animate-spin" />
          <p className="text-sm text-white/30">Medicatie laden...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-10 text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.5s ease 0.1s",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
              <Pill className="w-7 h-7 text-orange-400/60" />
            </div>
            <p className="text-sm text-white/35 mt-1">
              Geen medicatie gevonden
            </p>
            <p className="text-xs text-white/20">
              Uw voorgeschreven medicatie wordt hier weergegeven
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Active prescriptions */}
          {activePrescriptions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-semibold text-white/85">
                  Actieve medicatie
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                  {activePrescriptions.length}
                </span>
              </div>
              <div className="space-y-4">
                {activePrescriptions.map((prescription, index) => (
                  <PrescriptionCard
                    key={prescription.id}
                    prescription={prescription}
                    index={index}
                    isActive={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past prescriptions */}
          {pastPrescriptions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-semibold text-white/50">
                  Eerdere medicatie
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/30 text-xs font-semibold border border-white/[0.06]">
                  {pastPrescriptions.length}
                </span>
              </div>
              <div className="space-y-4">
                {pastPrescriptions.map((prescription, index) => (
                  <PrescriptionCard
                    key={prescription.id}
                    prescription={prescription}
                    index={index}
                    isActive={false}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
