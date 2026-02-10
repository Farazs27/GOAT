'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function PatientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [bsnLastFour, setBsnLastFour] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/patient-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, bsnLastFour }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Inloggen mislukt');
      }

      const data = await res.json();
      localStorage.setItem('patient_token', data.access_token);
      localStorage.setItem('patient_refresh_token', data.refresh_token);
      localStorage.setItem('patient_data', JSON.stringify(data.patient));
      router.push('/portal');
    } catch (err: any) {
      setError(err.message || 'Er is iets misgegaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen patient-gradient-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="fixed top-20 left-10 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl pointer-events-none patient-float-slow" />
      <div className="fixed bottom-20 right-10 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl pointer-events-none patient-float-medium" />
      <div className="fixed top-1/2 left-1/3 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none patient-float-fast" />
      <div className="fixed bottom-1/3 left-1/4 w-72 h-72 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none patient-float-medium" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/20 mx-auto mb-5">
            <span className="text-2xl font-bold text-white">DF</span>
          </div>
          <h1 className="text-3xl font-bold text-white/95 mb-2">Patiëntenportaal</h1>
          <p className="text-lg text-white/50">Welkom bij DentFlow</p>
        </div>

        {/* Login card */}
        <div className="patient-glass-card rounded-3xl p-8">
          <h2 className="text-xl font-semibold text-white/90 mb-2">Inloggen</h2>
          <p className="text-base text-white/50 mb-8">
            Gebruik uw e-mailadres en de laatste 4 cijfers van uw BSN
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-base">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="uw@email.nl"
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-base placeholder:text-white/30 outline-none focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Laatste 4 cijfers BSN
              </label>
              <input
                type="text"
                value={bsnLastFour}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setBsnLastFour(val);
                }}
                required
                placeholder="1234"
                maxLength={4}
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-base placeholder:text-white/30 outline-none focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/10 transition-all tracking-[0.5em] text-center text-2xl font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || bsnLastFour.length !== 4}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold text-lg shadow-lg shadow-teal-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Bezig met inloggen...
                </span>
              ) : (
                'Inloggen'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/40">
              Problemen met inloggen? Neem contact op met uw tandartspraktijk.
            </p>
          </div>
        </div>

        {/* Back to main site */}
        <div className="text-center mt-8">
          <a
            href="/login"
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Medewerker? Ga naar medewerker login
          </a>
        </div>
      </div>
    </div>
  );
}
