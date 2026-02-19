'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Search, ChevronRight, Loader2, User } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
}

export default function ClinicalNotesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/patients?limit=50')
      .then(r => r.json())
      .then(data => setPatients(data.data || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? patients.filter(p =>
        `${p.firstName} ${p.lastName} ${p.patientNumber}`.toLowerCase().includes(search.toLowerCase())
      )
    : patients;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white/90 flex items-center gap-3">
          <FileText className="w-6 h-6 text-emerald-400" />
          Klinische Notities
        </h1>
      </div>

      <p className="text-sm text-white/40">Selecteer een patiënt om notities te bekijken.</p>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek patiënt..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-sm text-white/90 placeholder-white/30 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-2xl"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-8">Geen patiënten gevonden</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <Link
              key={p.id}
              href={`/hygienist/patients/${p.id}/notes`}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.09] hover:border-emerald-500/30 transition-all group backdrop-blur-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <span className="text-sm font-medium text-white/80">{p.firstName} {p.lastName}</span>
                  <span className="text-xs text-white/30 ml-2">#{p.patientNumber}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
