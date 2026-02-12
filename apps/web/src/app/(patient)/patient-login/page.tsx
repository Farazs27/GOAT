"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, ArrowRight } from "lucide-react";

export default function PatientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [bsnLastFour, setBsnLastFour] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/patient-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, bsnLastFour }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Inloggen mislukt");
      }

      const data = await res.json();
      localStorage.setItem("patient_token", data.access_token);
      localStorage.setItem("patient_refresh_token", data.refresh_token);
      localStorage.setItem("patient_data", JSON.stringify(data.patient));
      router.push("/portal");
    } catch (err: any) {
      setError(err.message || "Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle warm gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#e8945a]/[0.03] via-transparent to-[#e8945a]/[0.02] pointer-events-none" />

      <div className="w-full max-w-md lg:max-w-lg relative z-10">
        {/* Logo - responsive sizing */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#e8945a] to-[#d4864a] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#e8945a]/20 mx-auto mb-4 sm:mb-5 lg:mb-6">
            <img src="/images/nexiom-logo.png" alt="NEXIOM" className="w-10 sm:w-12 lg:w-14 h-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white/95 mb-2 sm:mb-3 tracking-tight">
            Pati&euml;ntenportaal
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/45">
            Welkom bij NEXIOM
          </p>
        </div>

        {/* Login card - touch optimized */}
        <div className="bg-white/[0.07] backdrop-blur-3xl border border-white/[0.12] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/20">
          <h2 className="text-xl sm:text-2xl font-semibold text-white/90 mb-2">
            Inloggen
          </h2>
          <p className="text-base sm:text-lg text-white/45 mb-6 sm:mb-8">
            Gebruik uw e-mailadres en de laatste 4 cijfers van uw BSN
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm sm:text-base flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-medium text-white/60 mb-2 sm:mb-3">
                E-mailadres
              </label>
              <div className="relative">
                <Mail className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="uw@email.nl"
                  className="w-full pl-12 sm:pl-14 pr-5 py-4 sm:py-5 rounded-2xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl text-white/90 text-base sm:text-lg placeholder:text-white/30 outline-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 transition-all duration-200 min-h-[56px] sm:min-h-[64px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-white/60 mb-2 sm:mb-3">
                Laatste 4 cijfers BSN
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-white/25" />
                <input
                  type="text"
                  value={bsnLastFour}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setBsnLastFour(val);
                  }}
                  required
                  placeholder="0000"
                  maxLength={4}
                  inputMode="numeric"
                  className="w-full pl-12 sm:pl-14 pr-5 py-4 sm:py-5 rounded-2xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl text-white/90 text-2xl sm:text-3xl placeholder:text-white/30 outline-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 transition-all duration-200 tracking-[0.5em] text-center font-mono min-h-[56px] sm:min-h-[64px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || bsnLastFour.length !== 4}
              className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4864a] text-white font-medium text-lg sm:text-xl shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed min-h-[56px] sm:min-h-[64px] touch-target flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Bezig met inloggen...
                </span>
              ) : (
                <>
                  Inloggen
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 pt-6 border-t border-white/[0.06] text-center space-y-4">
            <a
              href="/register"
              className="block text-sm sm:text-base text-[#e8945a]/70 hover:text-[#e8945a] transition-colors"
            >
              Nog geen account? Registreren
            </a>

            {/* Demo Credentials */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-2">
              <p className="text-xs sm:text-sm text-white/40 font-medium">
                Testgegevens:
              </p>
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm text-white/30">
                  <span className="text-white/50">Email:</span>{" "}
                  peter.jansen@email.nl
                </p>
                <p className="text-xs sm:text-sm text-white/30">
                  <span className="text-white/50">BSN laatste 4:</span> 6782
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/30">
              Problemen met inloggen? Neem contact op met uw tandartspraktijk.
            </p>
          </div>
        </div>

        {/* Staff login link */}
        <div className="text-center mt-6 sm:mt-8">
          <a
            href="/login"
            className="text-sm sm:text-base text-white/30 hover:text-white/50 transition-colors"
          >
            Medewerker? Ga naar medewerker login
          </a>
        </div>
      </div>
    </div>
  );
}
