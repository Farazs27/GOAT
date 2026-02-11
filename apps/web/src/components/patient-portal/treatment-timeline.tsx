"use client";

import { CheckCircle2, Clock, Circle, XCircle, User, Calendar } from "lucide-react";

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

interface TreatmentTimelineProps {
  treatments: Treatment[];
  selectedTreatmentId: string | null;
  onSelectTreatment: (treatmentId: string) => void;
}

const statusConfig = {
  COMPLETED: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    label: "Voltooid",
  },
  IN_PROGRESS: {
    icon: Clock,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    label: "In behandeling",
  },
  PLANNED: {
    icon: Circle,
    color: "text-white/40",
    bgColor: "bg-white/[0.06]",
    borderColor: "border-white/[0.08]",
    label: "Gepland",
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    label: "Geannuleerd",
  },
};

export function TreatmentTimeline({
  treatments,
  selectedTreatmentId,
  onSelectTreatment,
}: TreatmentTimelineProps) {
  if (treatments.length === 0) {
    return (
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <Clock className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-lg font-medium text-white/70 mb-1">Geen behandelingen</h3>
        <p className="text-sm text-white/40">
          Dit behandelplan bevat nog geen behandelingen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {treatments.map((treatment, index) => {
        const config = statusConfig[treatment.status];
        const Icon = config.icon;
        const isSelected = selectedTreatmentId === treatment.id;
        const isLast = index === treatments.length - 1;

        return (
          <div key={treatment.id} className="relative">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[28px] top-[60px] w-0.5 h-[calc(100%+8px)] bg-white/[0.08]" />
            )}

            {/* Treatment card */}
            <button
              onClick={() => onSelectTreatment(treatment.id)}
              className={`w-full text-left transition-all duration-300 ${
                isSelected ? "scale-[1.02]" : "hover:scale-[1.01]"
              } ${isLast ? "" : "mb-2"}`}
            >
              <div
                className={`bg-white/[0.04] backdrop-blur-xl border rounded-3xl p-5 transition-all duration-300 ${
                  isSelected
                    ? "border-[#e8945a] ring-2 ring-[#e8945a]/20 shadow-lg shadow-[#e8945a]/10"
                    : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${config.bgColor} ${config.borderColor}`}
                  >
                    <Icon
                      className={`w-6 h-6 ${config.color} ${
                        treatment.status === "IN_PROGRESS" ? "animate-pulse" : ""
                      }`}
                    />
                  </div>

                  {/* Treatment details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-base font-semibold text-white/90">
                        {treatment.description}
                      </h3>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${config.bgColor} ${config.color} ${config.borderColor}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5">
                      {treatment.tooth && (
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <span className="font-medium text-[#e8945a]">
                            Element {treatment.tooth.toothNumber}
                          </span>
                        </div>
                      )}

                      {treatment.nzaCode && (
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <span className="text-white/35">NZA:</span>
                          <span className="text-white/60">
                            {treatment.nzaCode.code} - {treatment.nzaCode.descriptionNl}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                          <User className="w-3.5 h-3.5" />
                          <span className="text-white/60">
                            {treatment.performer.firstName} {treatment.performer.lastName}
                          </span>
                        </div>

                        {treatment.performedAt && (
                          <>
                            <span className="text-white/20">•</span>
                            <div className="flex items-center gap-1.5 text-xs text-white/50">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-white/60">
                                {new Date(treatment.performedAt).toLocaleDateString("nl-NL", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </>
                        )}

                        {!treatment.performedAt && treatment.appointment && (
                          <>
                            <span className="text-white/20">•</span>
                            <div className="flex items-center gap-1.5 text-xs text-white/50">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-white/60">
                                {new Date(treatment.appointment.startTime).toLocaleDateString(
                                  "nl-NL",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
