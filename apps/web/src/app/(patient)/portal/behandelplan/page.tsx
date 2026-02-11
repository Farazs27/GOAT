"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ClipboardList, Loader2, Euro, ArrowRight } from "lucide-react";
import { TreatmentTimeline } from "@/components/patient-portal/treatment-timeline";
import { getTreatmentModelPath } from "@/lib/treatment-models";
import Link from "next/link";

// Dynamically import 3D component with no SSR
const TreatmentModel3D = dynamic(
  () => import("@/components/patient-portal/treatment-model-3d"),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#e8945a] animate-spin" />
      </div>
    ),
  }
);

interface Treatment {
  id: string;
  description: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  performedAt?: string;
  tooth?: {
    toothNumber: number;
  };
  nzaCode?: {
    code: string;
    descriptionNl: string;
  };
  performer: {
    firstName: string;
    lastName: string;
  };
  appointment?: {
    startTime: string;
    status: string;
  };
}

interface TreatmentPlan {
  id: string;
  title: string;
  description?: string;
  status: "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  acceptedAt?: string;
  totalEstimate?: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  treatments: Treatment[];
}

const statusConfig = {
  ACCEPTED: {
    label: "Geaccepteerd",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  IN_PROGRESS: {
    label: "In behandeling",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  COMPLETED: {
    label: "Voltooid",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
};

function formatCurrency(val: number | string | undefined) {
  if (!val) return null;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(val));
}

export default function BehandelplanPage() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const token = localStorage.getItem("patient_token");
      if (!token) return;

      try {
        const response = await fetch("/api/patient-portal/treatment-plans", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setPlans(data);

        // Auto-select first treatment of first plan
        if (data.length > 0 && data[0].treatments.length > 0) {
          setSelectedTreatmentId(data[0].treatments[0].id);
        }
      } catch (error) {
        console.error("Error fetching treatment plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e8945a]/10 border border-[#e8945a]/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#e8945a]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white/90">Behandelplan</h1>
            <p className="text-sm text-white/40">
              Uw geplande en voltooide behandelingen
            </p>
          </div>
        </div>

        {/* Empty state */}
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-lg font-medium text-white/70 mb-1">
            Geen behandelplannen
          </h3>
          <p className="text-sm text-white/40">
            Er zijn nog geen behandelplannen voor u aangemaakt
          </p>
        </div>
      </div>
    );
  }

  const activePlan = plans[activePlanIndex];
  const selectedTreatment = activePlan.treatments.find(
    (t) => t.id === selectedTreatmentId
  );

  // Get 3D model path — check selected treatment first, then fall back to plan name
  const modelPath = selectedTreatment
    ? (getTreatmentModelPath(selectedTreatment.description, selectedTreatment.nzaCode?.code)
      ?? getTreatmentModelPath(activePlan.title))
    : getTreatmentModelPath(activePlan.title);

  const statusInfo = statusConfig[activePlan.status];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#e8945a]/10 border border-[#e8945a]/20 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-[#e8945a]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white/90">Behandelplan</h1>
          <p className="text-sm text-white/40">
            Uw geplande en voltooide behandelingen in 3D
          </p>
        </div>
      </div>

      {/* Plan selector tabs (if multiple plans) */}
      {plans.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {plans.map((plan, index) => {
            const isActive = activePlanIndex === index;
            return (
              <button
                key={plan.id}
                onClick={() => {
                  setActivePlanIndex(index);
                  // Auto-select first treatment when switching plans
                  if (plan.treatments.length > 0) {
                    setSelectedTreatmentId(plan.treatments[0].id);
                  }
                }}
                className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-white/[0.08] text-[#e8945a] border border-white/[0.12] shadow-lg shadow-black/10"
                    : "bg-white/[0.06] text-white/60 border border-white/[0.12] backdrop-blur-2xl hover:bg-white/[0.1] hover:text-white/80"
                }`}
              >
                {plan.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Active plan header */}
      <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-white/90">
                {activePlan.title}
              </h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
              >
                {statusInfo.label}
              </span>
            </div>
            {activePlan.description && (
              <p className="text-sm text-white/50">{activePlan.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
              <span>
                Opgesteld door: {activePlan.creator.firstName}{" "}
                {activePlan.creator.lastName}
              </span>
              {activePlan.acceptedAt && (
                <>
                  <span className="text-white/20">•</span>
                  <span>
                    Geaccepteerd op{" "}
                    {new Date(activePlan.acceptedAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          {activePlan.totalEstimate && (
            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.06] border border-white/[0.12] backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/10">
              <Euro className="w-4 h-4 text-[#e8945a]" />
              <div className="text-right">
                <p className="text-xs text-white/40">Schatting</p>
                <p className="text-lg font-semibold text-white/90">
                  {formatCurrency(activePlan.totalEstimate)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout: Timeline + 3D preview */}
      <div className="grid lg:grid-cols-[1fr,400px] gap-6">
        {/* Timeline (left) */}
        <div className="space-y-4">
          <TreatmentTimeline
            treatments={activePlan.treatments}
            selectedTreatmentId={selectedTreatmentId}
            onSelectTreatment={setSelectedTreatmentId}
          />
        </div>

        {/* 3D Preview (right, sticky) */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <div className="aspect-square">
            {selectedTreatment ? (
              <TreatmentModel3D
                modelPath={modelPath}
                description={selectedTreatment.description}
              />
            ) : (
              <div className="h-full bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 flex items-center justify-center">
                <p className="text-sm text-white/40">Selecteer een behandeling</p>
              </div>
            )}
          </div>

          {/* Treatment details card */}
          {selectedTreatment && (
            <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 p-5 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300">
              <h3 className="text-sm font-semibold text-white/90 mb-3">
                Behandeldetails
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Behandeling</span>
                  <span className="text-white/80 font-medium text-right max-w-[200px]">
                    {selectedTreatment.description}
                  </span>
                </div>
                {selectedTreatment.tooth && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Element</span>
                    <span className="text-[#e8945a] font-medium">
                      {selectedTreatment.tooth.toothNumber}
                    </span>
                  </div>
                )}
                {selectedTreatment.nzaCode && (
                  <div className="flex justify-between">
                    <span className="text-white/40">NZA code</span>
                    <span className="text-white/80 font-mono text-xs">
                      {selectedTreatment.nzaCode.code}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/40">Behandelaar</span>
                  <span className="text-white/80">
                    {selectedTreatment.performer.firstName}{" "}
                    {selectedTreatment.performer.lastName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link to cost estimate */}
      <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 p-6 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8945a]/10 border border-[#e8945a]/20 flex items-center justify-center">
              <Euro className="w-5 h-5 text-[#e8945a]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white/90">
                Kostenraming bekijken
              </h3>
              <p className="text-sm text-white/40">
                Bekijk de gedetailleerde kostenraming voor dit behandelplan
              </p>
            </div>
          </div>
          <Link
            href="/portal/kostenraming"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4864a] text-white font-medium shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all"
          >
            <span className="text-sm font-medium">Bekijk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
