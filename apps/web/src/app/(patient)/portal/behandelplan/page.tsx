"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { ClipboardList, Loader2, Euro, ArrowRight, Check, XIcon, PenLine, AlertCircle, CheckCircle2 } from "lucide-react";
import { TreatmentTimeline } from "@/components/patient-portal/treatment-timeline";
import { getTreatmentModelPath } from "@/lib/treatment-models";
import { SignatureWidget } from "@/components/patient/signature-widget";
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
  estimatedCost?: number | null;
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
  status: "DRAFT" | "PROPOSED" | "ACCEPTED" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  acceptedAt?: string;
  totalEstimate?: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  treatments: Treatment[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  DRAFT: {
    label: "Concept",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  PROPOSED: {
    label: "Voorgesteld",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  ACCEPTED: {
    label: "Geaccepteerd",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  APPROVED: {
    label: "Goedgekeurd",
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
  CANCELLED: {
    label: "Geannuleerd",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [signingPlanId, setSigningPlanId] = useState<string | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [signSuccess, setSignSuccess] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetchPlans();
  }, []);

  // Scroll detection for signing flow
  useEffect(() => {
    if (signingPlanId && scrollRef.current) {
      const el = scrollRef.current;
      if (el.scrollHeight <= el.clientHeight) {
        setHasScrolledToBottom(true);
      }
    }
  }, [signingPlanId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
      setHasScrolledToBottom(true);
    }
  };

  const handlePlanAction = async (planId: string, action: "accept" | "reject") => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;
    setActionLoading(planId);
    try {
      const response = await fetch(`/api/patient-portal/treatment-plans/${planId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        await fetchPlans();
      }
    } catch (error) {
      console.error("Error updating treatment plan:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignPlan = async (planId: string, data: { signatureData: string; signedByName: string; signerRelation: string }) => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;
    setSignLoading(true);
    try {
      const response = await fetch(`/api/patient-portal/treatment-plans/${planId}/sign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setSignSuccess("Behandelplan goedgekeurd!");
        setSigningPlanId(null);
        await fetchPlans();
        setTimeout(() => setSignSuccess(''), 5000);
      }
    } catch (error) {
      console.error("Error signing treatment plan:", error);
    } finally {
      setSignLoading(false);
    }
  };

  const openSigningFlow = (planId: string) => {
    setSigningPlanId(planId);
    setHasScrolledToBottom(false);
  };

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

  // Get 3D model path
  const modelPath = selectedTreatment
    ? (getTreatmentModelPath(selectedTreatment.description, selectedTreatment.nzaCode?.code)
      ?? getTreatmentModelPath(activePlan.title))
    : getTreatmentModelPath(activePlan.title);

  const statusInfo = statusConfig[activePlan.status] || statusConfig.DRAFT;

  // Signing flow view
  if (signingPlanId === activePlan.id) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => setSigningPlanId(null)}
          className="flex items-center gap-2 text-white/50 hover:text-[#e8945a] transition-colors text-sm group"
        >
          <XIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Terug naar behandelplan
        </button>

        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10 p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white/90">
              Akkoord & Ondertekenen
            </h2>
            <p className="text-sm text-white/40 mt-1">{activePlan.title}</p>
          </div>

          {/* Treatment summary with scroll tracking */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="rounded-2xl bg-white/[0.06] border border-white/[0.12] p-6 max-h-[60vh] overflow-y-auto space-y-4"
          >
            {activePlan.description && (
              <p className="text-sm text-white/70 leading-relaxed">{activePlan.description}</p>
            )}

            <h3 className="text-sm font-semibold text-white/80">Behandelingen</h3>
            <div className="space-y-2">
              {activePlan.treatments.map((t) => (
                <div key={t.id} className="flex justify-between items-center py-2 border-b border-white/[0.06] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{t.description}</p>
                    {t.nzaCode && (
                      <p className="text-xs text-white/40 font-mono">{t.nzaCode.code}</p>
                    )}
                  </div>
                  {t.estimatedCost ? (
                    <span className="text-sm text-[#e8945a] font-medium ml-4">
                      {formatCurrency(t.estimatedCost)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {activePlan.totalEstimate && (
              <div className="flex justify-between items-center pt-3 border-t border-white/[0.12]">
                <span className="text-sm font-medium text-white/60">Totaal geschat</span>
                <span className="text-lg font-semibold text-[#e8945a]">
                  {formatCurrency(activePlan.totalEstimate)}
                </span>
              </div>
            )}
          </div>

          {/* Scroll prompt */}
          {!hasScrolledToBottom && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#e8945a]/[0.08] border border-[#e8945a]/20 text-[#e8945a] text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Scroll naar beneden om te ondertekenen
            </div>
          )}

          {/* Signature widget - only after scroll */}
          {hasScrolledToBottom && (
            <SignatureWidget
              onSign={(data) => handleSignPlan(activePlan.id, data)}
              onCancel={() => setSigningPlanId(null)}
              loading={signLoading}
            />
          )}
        </div>
      </div>
    );
  }

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

      {/* Success toast */}
      {signSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300">{signSuccess}</p>
        </div>
      )}

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
                  <span className="text-white/20">&#8226;</span>
                  <span>
                    Goedgekeurd op{" "}
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

          <div className="flex items-center gap-3">
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

        {/* Sign button for PROPOSED plans */}
        {activePlan.status === "PROPOSED" && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => openSigningFlow(activePlan.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e8945a] hover:bg-[#d4864a] text-white font-medium shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all"
            >
              <PenLine className="w-4 h-4" />
              Akkoord & Ondertekenen
            </button>
            <button
              onClick={() => handlePlanAction(activePlan.id, "reject")}
              disabled={actionLoading === activePlan.id}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.09] text-white/70 font-medium transition-all disabled:opacity-50"
            >
              <XIcon className="w-4 h-4" />
              Afwijzen
            </button>
          </div>
        )}

        {/* Approved label */}
        {activePlan.status === "APPROVED" && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">
                Goedgekeurd op{" "}
                {activePlan.acceptedAt
                  ? new Date(activePlan.acceptedAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
              </span>
            </div>
          </div>
        )}
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
                {selectedTreatment.estimatedCost ? (
                  <div className="flex justify-between">
                    <span className="text-white/40">Kosten</span>
                    <span className="text-[#e8945a] font-medium">
                      {formatCurrency(selectedTreatment.estimatedCost)}
                    </span>
                  </div>
                ) : null}
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4783e] text-white font-medium shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all"
          >
            <span className="text-sm font-medium">Bekijk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
