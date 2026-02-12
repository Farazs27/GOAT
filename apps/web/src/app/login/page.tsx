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
    <>
      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .logo-animate {
          animation: slideInFromLeft 0.8s cubic-bezier(0.22, 1, 0.36, 1) both, logoFloat 4s ease-in-out 1s infinite;
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(6px) translateY(-4px); }
        }
        .title-animate {
          animation: fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
        }
        .subtitle-animate {
          animation: fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both;
        }
        .card-animate {
          animation: fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both;
        }
        .footer-animate {
          animation: fadeSlideUp 0.5s ease 0.7s both;
        }
      `}</style>
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden liquid-glass-bg">
      {/* Ambient floating blobs - same as dashboard */}
      <div className="ambient-blob ambient-blob-1" style={{ top: '-10%', left: '-5%', position: 'absolute' }} />
      <div className="ambient-blob ambient-blob-2" style={{ bottom: '-10%', right: '-5%', position: 'absolute' }} />
      <div className="ambient-blob ambient-blob-3" style={{ top: '40%', left: '30%', position: 'absolute' }} />

      <div className="w-full max-w-md lg:max-w-lg relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-2">
          <div className="mx-auto -mt-40 -mb-36 sm:-mt-48 sm:-mb-44">
            <img src="/images/nexiom-logo.png" alt="NEXIOM" className="logo-animate h-72 sm:h-96 lg:h-[28rem] w-auto mx-auto" />
          </div>
          <h1 className="title-animate text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3" style={{ color: 'rgba(245, 230, 211, 0.95)' }}>
            Medewerker Portaal
          </h1>
          <p className="subtitle-animate text-base sm:text-lg" style={{ color: 'rgba(234, 216, 192, 0.6)' }}>
            Log in op uw account
          </p>
        </div>

        {/* Glass login card */}
        <div className="card-animate glass-card p-4 sm:p-6 lg:p-7">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-4 text-sm rounded-xl flex items-center gap-3" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.2)' }}>
                  <span className="text-xs font-bold" style={{ color: '#f87171' }}>!</span>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs sm:text-sm font-semibold mb-1.5"
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
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 glass-input rounded-xl transition-all duration-200 text-sm sm:text-base focus:outline-none focus:border-[#EAD8C0]/30 focus:ring-2 focus:ring-[#EAD8C0]/10"
                    style={{ color: 'rgba(245, 230, 211, 0.95)' }}
                    placeholder="naam@praktijk.nl"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-semibold mb-1.5"
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
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 glass-input rounded-xl transition-all duration-200 text-sm sm:text-base focus:outline-none focus:border-[#EAD8C0]/30 focus:ring-2 focus:ring-[#EAD8C0]/10"
                    style={{ color: 'rgba(245, 230, 211, 0.95)' }}
                    placeholder="••••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 px-5 btn-liquid-primary font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
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
          <div className="mt-4 sm:mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="glass-light rounded-xl p-3 sm:p-4 space-y-2">
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
          <div className="mt-4 text-center">
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
        <div className="footer-animate text-center mt-6 sm:mt-8">
          <p className="text-xs sm:text-sm" style={{ color: 'rgba(234, 216, 192, 0.2)' }}>
            NEXIOM &copy; 2026 &middot; v1.0
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
