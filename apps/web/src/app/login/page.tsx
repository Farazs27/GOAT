"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Inloggen mislukt");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch {
      setError("Er is een fout opgetreden. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decoration - adjusted for all screen sizes */}
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-64 lg:h-64 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full blur-2xl" />

      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl relative z-10">
        {/* Logo and title - responsive sizing */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4 sm:mb-5 lg:mb-6">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              DF
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Medewerker Portaal
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Log in op uw DentFlow account
          </p>
        </div>

        {/* Login form - touch-optimized */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
                >
                  E-mailadres
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 sm:py-4.5 lg:py-5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg"
                    placeholder="naam@praktijk.nl"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
                >
                  Wachtwoord
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 sm:py-4.5 lg:py-5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg"
                    placeholder="••••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 sm:py-5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg text-base sm:text-lg min-h-[56px] touch-target"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Bezig met inloggen...
                </>
              ) : (
                <>
                  Inloggen
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials - responsive layout */}
          <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-100">
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 sm:p-5 space-y-3">
              <p className="text-sm sm:text-base font-medium text-blue-900 mb-3">
                📋 Testgegevens:
              </p>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-blue-700">Tandarts:</span>
                  <span className="text-sm font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded break-all">
                    faraz@tandarts-amsterdam.nl
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-blue-700">Wachtwoord:</span>
                  <span className="text-sm font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded">
                    Sharifi1997
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-blue-700">Admin:</span>
                  <span className="text-sm font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded break-all">
                    admin@dentflow.nl
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-blue-700">Admin PW:</span>
                  <span className="text-sm font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded">
                    Welcome123
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Patient portal link */}
          <div className="mt-6 text-center">
            <a
              href="/patient-login"
              className="inline-flex items-center gap-2 text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Patiënt? Ga naar patiëntenportaal
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs sm:text-sm text-gray-400">
            DentFlow &copy; 2026 &middot; v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
