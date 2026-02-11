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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full blur-2xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4">
            <span className="text-2xl font-bold text-white tracking-tight">
              DF
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Medewerker Portaal
          </h1>
          <p className="text-gray-600">Log in op uw DentFlow account</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  E-mailadres
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="naam@praktijk.nl"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Wachtwoord
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="••••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
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

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900 mb-2">
                📋 Testgegevens:
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Tandarts:</span>
                  <span className="text-sm font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded">
                    faraz@tandarts-amsterdam.nl
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Wachtwoord:</span>
                  <span className="text-sm font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded">
                    Sharifi1997
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Admin:</span>
                  <span className="text-sm font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded">
                    admin@dentflow.nl
                  </span>
                </div>
                <div className="flex items-center justify-between">
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
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Patiënt? Ga naar patiëntenportaal
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            DentFlow &copy; 2026 &middot; v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
