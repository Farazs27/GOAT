"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Car,
  Bus,
  Accessibility,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface PracticeInfo {
  name: string;
  address: {
    street: string;
    city: string;
    postal: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  settings: {
    openingHours: {
      monday?: { open: string; close: string } | null;
      tuesday?: { open: string; close: string } | null;
      wednesday?: { open: string; close: string } | null;
      thursday?: { open: string; close: string } | null;
      friday?: { open: string; close: string } | null;
      saturday?: { open: string; close: string } | null;
      sunday?: { open: string; close: string } | null;
    };
    accessibility: {
      parking?: string;
      publicTransport?: string;
      wheelchair?: boolean;
    };
    emergency: {
      phone?: string;
      instructions?: string;
    };
    houseRules: string[];
  };
}

export default function PraktijkPage() {
  const [practice, setPractice] = useState<PracticeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  useEffect(() => {
    const fetchPracticeInfo = async () => {
      try {
        const token = localStorage.getItem("patient_token");
        if (!token) {
          setError("Niet ingelogd");
          return;
        }

        const response = await fetch("/api/patient-portal/practice-info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Kon praktijk informatie niet ophalen");
        }

        const data = await response.json();
        setPractice(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Er ging iets mis");
      } finally {
        setLoading(false);
      }
    };

    fetchPracticeInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
      </div>
    );
  }

  if (error || !practice) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/95 text-lg">{error || "Geen gegevens beschikbaar"}</p>
        </div>
      </div>
    );
  }

  const fullAddress = `${practice.address.street}, ${practice.address.postal} ${practice.address.city}`;

  const dayNames = {
    monday: "Maandag",
    tuesday: "Dinsdag",
    wednesday: "Woensdag",
    thursday: "Donderdag",
    friday: "Vrijdag",
    saturday: "Zaterdag",
    sunday: "Zondag",
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white/95 mb-3">
            Praktijk Informatie
          </h1>
          <p className="text-white/50 text-lg">
            Alle informatie over onze praktijk op een rij
          </p>
        </div>

        {/* Practice Name Hero */}
        <div className="bg-gradient-to-br from-[#e8945a]/20 to-[#e8945a]/5 backdrop-blur-2xl shadow-xl shadow-black/10 border border-[#e8945a]/20 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#e8945a]/20 p-4 rounded-2xl">
              <Building2 className="w-8 h-8 text-[#e8945a]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white/95">
              {practice.name}
            </h2>
          </div>
          <p className="text-white/60 text-lg">
            Welkom bij onze praktijk. Wij staan voor u klaar met professionele
            en persoonlijke tandheelkundige zorg.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Address & Map */}
          <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-[#e8945a]" />
              <h3 className="text-2xl font-semibold text-white/95">Locatie</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-2 mb-4">
                  <p className="text-white/90 text-lg font-medium">
                    {practice.address.street}
                  </p>
                  <p className="text-white/90 text-lg">
                    {practice.address.postal} {practice.address.city}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    fullAddress
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#e8945a]/20 hover:bg-[#e8945a]/30 text-[#e8945a] px-4 py-2 rounded-xl transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Route plannen
                </a>
              </div>

              <div className="bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.12] h-64">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    fullAddress
                  )}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Practice Location"
                />
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-[#e8945a]" />
              <h3 className="text-2xl font-semibold text-white/95">
                Openingstijden
              </h3>
            </div>

            <div className="space-y-3">
              {Object.entries(dayNames).map(([key, dayName]) => {
                const hours =
                  practice.settings.openingHours[
                    key as keyof typeof practice.settings.openingHours
                  ];
                return (
                  <div
                    key={key}
                    className="flex justify-between items-center py-2 border-b border-white/[0.12] last:border-0"
                  >
                    <span className="text-white/70 font-medium">{dayName}</span>
                    {hours ? (
                      <span className="text-white/90">
                        {hours.open} - {hours.close}
                      </span>
                    ) : (
                      <span className="text-white/40 italic">Gesloten</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Phone className="w-6 h-6 text-[#e8945a]" />
              <h3 className="text-2xl font-semibold text-white/95">Contact</h3>
            </div>

            <div className="space-y-4">
              <a
                href={`tel:${practice.contact.phone}`}
                className="flex items-center gap-3 p-4 bg-white/[0.06] hover:bg-white/[0.09] rounded-xl transition-colors group"
              >
                <div className="bg-[#e8945a]/20 p-3 rounded-xl group-hover:bg-[#e8945a]/30 transition-colors">
                  <Phone className="w-5 h-5 text-[#e8945a]" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Telefoon</p>
                  <p className="text-white/90 font-medium">
                    {practice.contact.phone || "Niet beschikbaar"}
                  </p>
                </div>
              </a>

              <a
                href={`mailto:${practice.contact.email}`}
                className="flex items-center gap-3 p-4 bg-white/[0.06] hover:bg-white/[0.09] rounded-xl transition-colors group"
              >
                <div className="bg-[#e8945a]/20 p-3 rounded-xl group-hover:bg-[#e8945a]/30 transition-colors">
                  <Mail className="w-5 h-5 text-[#e8945a]" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Email</p>
                  <p className="text-white/90 font-medium break-all">
                    {practice.contact.email || "Niet beschikbaar"}
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Accessibility */}
          <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Accessibility className="w-6 h-6 text-[#e8945a]" />
              <h3 className="text-2xl font-semibold text-white/95">
                Bereikbaarheid
              </h3>
            </div>

            <div className="space-y-4">
              {practice.settings.accessibility.parking && (
                <div className="flex items-start gap-3">
                  <div className="bg-[#e8945a]/20 p-2 rounded-lg mt-1">
                    <Car className="w-4 h-4 text-[#e8945a]" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm mb-1">Parkeren</p>
                    <p className="text-white/90">
                      {practice.settings.accessibility.parking}
                    </p>
                  </div>
                </div>
              )}

              {practice.settings.accessibility.publicTransport && (
                <div className="flex items-start gap-3">
                  <div className="bg-[#e8945a]/20 p-2 rounded-lg mt-1">
                    <Bus className="w-4 h-4 text-[#e8945a]" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm mb-1">
                      Openbaar Vervoer
                    </p>
                    <p className="text-white/90">
                      {practice.settings.accessibility.publicTransport}
                    </p>
                  </div>
                </div>
              )}

              {practice.settings.accessibility.wheelchair !== undefined && (
                <div className="flex items-center gap-3 p-3 bg-white/[0.06] rounded-xl">
                  <Accessibility className="w-5 h-5 text-[#e8945a]" />
                  <span className="text-white/90">
                    {practice.settings.accessibility.wheelchair
                      ? "Rolstoeltoegankelijk"
                      : "Niet rolstoeltoegankelijk"}
                  </span>
                </div>
              )}

              {!practice.settings.accessibility.parking &&
                !practice.settings.accessibility.publicTransport &&
                practice.settings.accessibility.wheelchair === undefined && (
                  <p className="text-white/40 italic">
                    Geen bereikbaarheidsinformatie beschikbaar
                  </p>
                )}
            </div>
          </div>

          {/* Emergency */}
          {(practice.settings.emergency.phone ||
            practice.settings.emergency.instructions) && (
            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-2xl shadow-xl shadow-black/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="text-2xl font-semibold text-white/95">
                  Spoed & Noodgevallen
                </h3>
              </div>

              <div className="space-y-4">
                {practice.settings.emergency.phone && (
                  <a
                    href={`tel:${practice.settings.emergency.phone}`}
                    className="flex items-center gap-3 p-4 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors group"
                  >
                    <div className="bg-red-500/30 p-3 rounded-xl group-hover:bg-red-500/40 transition-colors">
                      <Phone className="w-5 h-5 text-red-300" />
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">Spoednummer</p>
                      <p className="text-white/95 font-semibold text-lg">
                        {practice.settings.emergency.phone}
                      </p>
                    </div>
                  </a>
                )}

                {practice.settings.emergency.instructions && (
                  <div className="p-4 bg-white/[0.06] rounded-xl">
                    <p className="text-white/90 leading-relaxed">
                      {practice.settings.emergency.instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* House Rules */}
          {practice.settings.houseRules &&
            practice.settings.houseRules.length > 0 && (
              <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-6 md:col-span-2">
                <button
                  onClick={() => setRulesExpanded(!rulesExpanded)}
                  className="w-full flex items-center justify-between group"
                >
                  <h3 className="text-2xl font-semibold text-white/95">
                    Huisregels
                  </h3>
                  {rulesExpanded ? (
                    <ChevronUp className="w-6 h-6 text-[#e8945a] group-hover:text-[#e8945a]/80 transition-colors" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-[#e8945a] group-hover:text-[#e8945a]/80 transition-colors" />
                  )}
                </button>

                {rulesExpanded && (
                  <ul className="mt-6 space-y-3">
                    {practice.settings.houseRules.map((rule, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/[0.06] rounded-xl"
                      >
                        <span className="text-[#e8945a] font-bold mt-0.5">
                          {index + 1}.
                        </span>
                        <span className="text-white/90 flex-1">{rule}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
