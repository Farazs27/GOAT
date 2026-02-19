'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Phone, Calendar } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  insuranceCompany: string | null;
  isActive: boolean;
}

const colors = [
  'from-emerald-400 to-emerald-600',
  'from-teal-400 to-teal-600',
  'from-green-400 to-green-600',
  'from-cyan-400 to-cyan-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
];

export default function HygienistPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await authFetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data.data || []);
    } catch {
      setError('Fout bij het laden van patiënten');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const dob = new Date(patient.dateOfBirth).toLocaleDateString('nl-NL');
    return (
      patient.firstName.toLowerCase().includes(q) ||
      patient.lastName.toLowerCase().includes(q) ||
      patient.patientNumber.toLowerCase().includes(q) ||
      dob.includes(q)
    );
  });

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('nl-NL');
  const getInitials = (firstName: string, lastName: string) =>
    `${firstName[0]}${lastName[0]}`.toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 md:pt-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white/90 tracking-tight">Patiënten</h2>
          <p className="text-white/40 text-sm mt-1">Patiëntoverzicht</p>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="p-5 border-b border-white/[0.06]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Zoek op naam, nummer of geboortedatum..."
              className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-xl pl-9 pr-3 py-2 text-sm text-white/90 placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-5">
          {error && <p className="text-red-400 mb-4">{error}</p>}

          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-white/20" />
              <p className="text-white/40">Geen patiënten gevonden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((patient, index) => (
                <Link key={patient.id} href={`/hygienist/patients/${patient.id}`} className="block">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center shadow-lg flex-shrink-0`}
                      >
                        <span className="text-xs font-bold text-white">
                          {getInitials(patient.firstName, patient.lastName)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white/90">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-xs text-white/40">{patient.patientNumber}</div>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center text-xs text-white/30">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(patient.dateOfBirth)}
                          </span>
                          {patient.phone && (
                            <span className="flex items-center text-xs text-white/30">
                              <Phone className="h-3 w-3 mr-1" />
                              {patient.phone}
                            </span>
                          )}
                          {patient.insuranceCompany && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs border border-emerald-500/15">
                              {patient.insuranceCompany}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-white/20 flex-shrink-0 ml-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
