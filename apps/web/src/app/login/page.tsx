"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden liquid-glass-bg">
      {/* Ambient floating blobs - same as dashboard */}
      <div className="ambient-blob ambient-blob-1" style={{ top: '-10%', left: '-5%', position: 'absolute' }} />
      <div className="ambient-blob ambient-blob-2" style={{ bottom: '-10%', right: '-5%', position: 'absolute' }} />
      <div className="ambient-blob ambient-blob-3" style={{ top: '40%', left: '30%', position: 'absolute' }} />

      <div className="w-full max-w-md lg:max-w-lg relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="mx-auto mb-4 sm:mb-5 lg:mb-6">
            <img src="/images/nexiom-logo-md.png" alt="NEXIOM" className="h-14 sm:h-16 lg:h-20 w-auto mx-auto" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-2 sm:mb-3" style={{ color: 'rgba(245, 230, 211, 0.95)' }}>
            Medewerker Portaal
          </h1>
          <p className="text-base sm:text-lg" style={{ color: 'rgba(234, 216, 192, 0.6)' }}>
            Log in op uw NEXIOM account
          </p>
        </div>

        {/* Glass login card */}
        <div className="glass-card p-6 sm:p-8 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && (
              <div className="p-4 text-sm rounded-xl flex items-center gap-3" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.2)' }}>
                  <span className="text-xs font-bold" style={{ color: '#f87171' }}>!</span>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm sm:text-base font-semibold mb-2"
                  style={{ color: 'rgba(245, 230, 211, 0.95)' }}
                >
                  E-mailadres
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(234, 216, 192, 0.4)' }} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 sm:py-5 glass-input rounded-xl transition-all duration-200 text-base sm:text-lg focus:outline-none"
                    style={{ color: 'rgba(245, 230, 211, 0.95)' }}
                    placeholder="naam@praktijk.nl"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm sm:text-base font-semibold mb-2"
                  style={{ color: 'rgba(245, 230, 211, 0.95)' }}
                >
                  Wachtwoord
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(234, 216, 192, 0.4)' }} />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 sm:py-5 glass-input rounded-xl transition-all duration-200 text-base sm:text-lg focus:outline-none"
                    style={{ color: 'rgba(245, 230, 211, 0.95)' }}
                    placeholder="••••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 sm:py-5 px-6 btn-liquid-primary font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-base sm:text-lg min-h-[56px]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#2B2118]/30 border-t-[#2B2118] rounded-full animate-spin" />
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
          <div className="mt-6 sm:mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="glass-light rounded-xl p-4 sm:p-5 space-y-3">
              <p className="text-sm sm:text-base font-medium mb-3" style={{ color: 'rgba(234, 216, 192, 0.6)' }}>
                Testgegevens:
              </p>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm" style={{ color: 'rgba(234, 216, 192, 0.4)' }}>Tandarts:</span>
                  <span className="text-sm font-mono px-2 py-1 rounded break-all" style={{ color: 'rgba(245, 230, 211, 0.8)', background: 'rgba(255,255,255,0.04)' }}>
                    faraz@tandarts-amsterdam.nl
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm" style={{ color: 'rgba(234, 216, 192, 0.4)' }}>Wachtwoord:</span>
                  <span className="text-sm font-mono px-2 py-1 rounded" style={{ color: 'rgba(245, 230, 211, 0.8)', background: 'rgba(255,255,255,0.04)' }}>
                    Sharifi1997
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm" style={{ color: 'rgba(234, 216, 192, 0.4)' }}>Admin:</span>
                  <span className="text-sm font-mono px-2 py-1 rounded break-all" style={{ color: 'rgba(245, 230, 211, 0.8)', background: 'rgba(255,255,255,0.04)' }}>
                    admin@dentflow.nl
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm" style={{ color: 'rgba(234, 216, 192, 0.4)' }}>Admin PW:</span>
                  <span className="text-sm font-mono px-2 py-1 rounded" style={{ color: 'rgba(245, 230, 211, 0.8)', background: 'rgba(255,255,255,0.04)' }}>
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
              className="inline-flex items-center gap-2 text-sm sm:text-base font-medium transition-colors"
              style={{ color: '#EAD8C0' }}
            >
              Patient? Ga naar patientenportaal
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs sm:text-sm" style={{ color: 'rgba(234, 216, 192, 0.2)' }}>
            NEXIOM &copy; 2026 &middot; v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
