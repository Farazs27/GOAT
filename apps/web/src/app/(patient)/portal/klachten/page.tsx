"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Lightbulb,
  ThumbsUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

type ComplaintType = "KLACHT" | "SUGGESTIE" | "COMPLIMENT";
type ComplaintSubject =
  | "BEHANDELING"
  | "COMMUNICATIE"
  | "WACHTTIJD"
  | "HYGIENE"
  | "BEREIKBAARHEID"
  | "FACTURERING"
  | "PERSONEEL"
  | "OVERIG";
type ComplaintStatus = "ONTVANGEN" | "IN_BEHANDELING" | "AFGEHANDELD";

interface Complaint {
  id: string;
  type: ComplaintType;
  subject: ComplaintSubject;
  description: string;
  referenceNumber: string;
  status: ComplaintStatus;
  response: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  attachmentUrl: string | null;
}

const subjectLabels: Record<ComplaintSubject, string> = {
  BEHANDELING: "Behandeling",
  COMMUNICATIE: "Communicatie",
  WACHTTIJD: "Wachttijd",
  HYGIENE: "Hygiëne",
  BEREIKBAARHEID: "Bereikbaarheid",
  FACTURERING: "Facturering",
  PERSONEEL: "Personeel",
  OVERIG: "Overig",
};

const typeConfig = {
  KLACHT: {
    label: "Klacht",
    icon: AlertCircle,
    color: "text-orange-400",
    bgHover: "hover:bg-orange-500/10",
    border: "border-orange-500/30",
    bgActive: "bg-orange-500/20",
  },
  SUGGESTIE: {
    label: "Suggestie",
    icon: Lightbulb,
    color: "text-blue-400",
    bgHover: "hover:bg-blue-500/10",
    border: "border-blue-500/30",
    bgActive: "bg-blue-500/20",
  },
  COMPLIMENT: {
    label: "Compliment",
    icon: ThumbsUp,
    color: "text-green-400",
    bgHover: "hover:bg-green-500/10",
    border: "border-green-500/30",
    bgActive: "bg-green-500/20",
  },
};

const statusConfig = {
  ONTVANGEN: {
    label: "Ontvangen",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  IN_BEHANDELING: {
    label: "In behandeling",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  AFGEHANDELD: {
    label: "Afgehandeld",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
};

export default function ComplaintsPage() {
  const [activeTab, setActiveTab] = useState<"new" | "list">("new");
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
  const [subject, setSubject] = useState<ComplaintSubject>("BEHANDELING");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(
    null
  );

  // Fetch complaints when switching to list tab
  useEffect(() => {
    if (activeTab === "list") {
      fetchComplaints();
    }
  }, [activeTab]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("patient_token");
      if (!token) {
        throw new Error("Geen authenticatie token gevonden");
      }

      const response = await fetch("/api/patient-portal/complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Fout bij ophalen meldingen");
      }

      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      alert("Selecteer een type melding");
      return;
    }

    if (description.length < 20) {
      alert("Beschrijving moet minimaal 20 tekens bevatten");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("patient_token");
      if (!token) {
        throw new Error("Geen authenticatie token gevonden");
      }

      const response = await fetch("/api/patient-portal/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedType,
          subject,
          description,
          anonymous,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fout bij indienen melding");
      }

      const data = await response.json();
      setReferenceNumber(data.referenceNumber);
      setSubmitted(true);

      // Reset form
      setSelectedType(null);
      setSubject("BEHANDELING");
      setDescription("");
      setAnonymous(false);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Er is een fout opgetreden bij het indienen"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedComplaintId(expandedComplaintId === id ? null : id);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white/95 mb-2">
            Klachtenformulier
          </h1>
          <p className="text-white/50">
            Heeft u een klacht, suggestie of compliment? Laat het ons weten.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-2 flex gap-2">
          <button
            onClick={() => {
              setActiveTab("new");
              setSubmitted(false);
            }}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
              activeTab === "new"
                ? "bg-[#e8945a] text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            Nieuw formulier
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
              activeTab === "list"
                ? "bg-[#e8945a] text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            Mijn meldingen
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "new" ? (
          <div className="space-y-6">
            {submitted ? (
              // Success Card
              <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white/95">
                    Uw melding is ontvangen
                  </h2>
                  <p className="text-white/50">
                    Bedankt voor uw feedback. Wij zullen uw melding zo spoedig
                    mogelijk behandelen.
                  </p>
                  <div className="bg-white/[0.06] border border-white/[0.12] rounded-xl p-4 mt-4">
                    <p className="text-white/50 text-sm mb-1">
                      Referentienummer
                    </p>
                    <p className="text-xl font-mono font-bold text-[#e8945a]">
                      {referenceNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setReferenceNumber("");
                    }}
                    className="mt-4 px-6 py-2 bg-[#e8945a] hover:bg-[#d17d45] text-white rounded-xl transition-all duration-300 shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
                  >
                    Nieuwe melding maken
                  </button>
                </div>
              </div>
            ) : (
              // Form
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
                  <label className="block text-white/95 font-medium mb-4">
                    Type melding *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(
                      Object.keys(typeConfig) as Array<
                        keyof typeof typeConfig
                      >
                    ).map((type) => {
                      const config = typeConfig[type];
                      const Icon = config.icon;
                      const isSelected = selectedType === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedType(type)}
                          className={`p-6 border rounded-xl transition-all ${
                            isSelected
                              ? `${config.bgActive} ${config.border}`
                              : `border-white/[0.12] ${config.bgHover}`
                          }`}
                        >
                          <Icon className={`w-8 h-8 ${config.color} mx-auto mb-3`} />
                          <p
                            className={`font-medium ${
                              isSelected ? "text-white/95" : "text-white/70"
                            }`}
                          >
                            {config.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subject */}
                <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
                  <label
                    htmlFor="subject"
                    className="block text-white/95 font-medium mb-2"
                  >
                    Onderwerp *
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as ComplaintSubject)}
                    className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-4 py-3 text-white/95 focus:outline-none focus:border-[#e8945a] transition-colors"
                  >
                    {(
                      Object.entries(subjectLabels) as Array<
                        [ComplaintSubject, string]
                      >
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
                  <label
                    htmlFor="description"
                    className="block text-white/95 font-medium mb-2"
                  >
                    Beschrijving * (minimaal 20 tekens)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-4 py-3 text-white/95 focus:outline-none focus:border-[#e8945a] transition-colors resize-none"
                    placeholder="Beschrijf hier uw melding..."
                  />
                  <p className="text-white/50 text-sm mt-2">
                    {description.length} / 20 tekens minimum
                  </p>
                </div>

                {/* Anonymous */}
                <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-white/[0.12] bg-white/[0.06] text-[#e8945a] focus:ring-[#e8945a] focus:ring-offset-0"
                    />
                    <div>
                      <p className="text-white/95 font-medium">
                        Anonieme melding
                      </p>
                      <p className="text-white/50 text-sm mt-1">
                        Uw gegevens worden niet gekoppeld aan deze melding. Let
                        op: u kunt dan geen reactie ontvangen.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !selectedType || description.length < 20}
                  className="w-full bg-[#e8945a] hover:bg-[#d17d45] text-white font-medium py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
                >
                  {submitting ? "Verzenden..." : "Melding verzenden"}
                </button>
              </form>
            )}
          </div>
        ) : (
          // Complaints List
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-8 text-center">
                <p className="text-white/50">Meldingen laden...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-8 text-center">
                <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/50">
                  U heeft nog geen meldingen ingediend
                </p>
              </div>
            ) : (
              complaints.map((complaint) => {
                const typeConf = typeConfig[complaint.type];
                const statusConf = statusConfig[complaint.status];
                const isExpanded = expandedComplaintId === complaint.id;

                return (
                  <div
                    key={complaint.id}
                    className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-xs font-mono font-bold ${typeConf.color}`}
                          >
                            {complaint.referenceNumber}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConf.color}`}
                          >
                            {statusConf.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white/95 mb-1">
                          {typeConf.label} - {subjectLabels[complaint.subject]}
                        </h3>
                        <p className="text-white/50 text-sm">
                          {new Date(complaint.createdAt).toLocaleDateString(
                            "nl-NL",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${typeConf.bgActive}`}>
                        {(() => {
                          const Icon = typeConf.icon;
                          return <Icon className={`w-6 h-6 ${typeConf.color}`} />;
                        })()}
                      </div>
                    </div>

                    <p className="text-white/70 mb-4">{complaint.description}</p>

                    {complaint.response && (
                      <div>
                        <button
                          onClick={() => toggleExpand(complaint.id)}
                          className="flex items-center gap-2 text-[#e8945a] hover:text-[#d17d45] transition-colors mb-2"
                        >
                          <span className="font-medium">Reactie van praktijk</span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="bg-white/[0.06] border border-white/[0.12] rounded-xl p-4 mt-2">
                            <p className="text-white/70">{complaint.response}</p>
                            {complaint.resolvedAt && (
                              <p className="text-white/50 text-sm mt-3">
                                Afgehandeld op{" "}
                                {new Date(complaint.resolvedAt).toLocaleDateString(
                                  "nl-NL",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Wkkgz Info Section */}
        <div className="bg-blue-500/10 backdrop-blur-2xl shadow-xl shadow-black/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white/95 mb-3">
                Klachtenregeling conform Wkkgz
              </h3>
              <div className="space-y-2 text-white/70 text-sm">
                <p>
                  Op grond van de Wet kwaliteit, klachten en geschillen zorg
                  (Wkkgz) heeft u het recht om een klacht in te dienen over de
                  zorg die u heeft ontvangen.
                </p>
                <p>
                  Wij streven ernaar uw klacht binnen 6 weken af te handelen. U
                  ontvangt een schriftelijke reactie op uw klacht.
                </p>
                <p>
                  Indien u niet tevreden bent met de afhandeling van uw klacht,
                  kunt u zich wenden tot de Geschillencommissie Zorg
                  (www.degeschillencommissiezorg.nl).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
