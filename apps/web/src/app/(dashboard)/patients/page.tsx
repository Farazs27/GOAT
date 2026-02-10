'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Phone, Calendar } from 'lucide-react';

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

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/patients', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data.data || []);
    } catch (err) {
      setError('Fout bij het laden van patiënten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.patientNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('nl-NL');
  const getInitials = (firstName: string, lastName: string) => `${firstName[0]}${lastName[0]}`.toUpperCase();

  const colors = [
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-rose-500',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-teal-500',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Patiënten</h2>
          <p className="text-white/50">Beheer alle patiënten van uw praktijk</p>
        </div>
        <Link href="/patients/new">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" />
            Nieuwe patiënt
          </button>
        </Link>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Zoek op naam of patiëntnummer..."
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
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
                <Link key={patient.id} href={`/patients/${patient.id}`} className="block">
                  <div className="flex items-center justify-between p-4 glass-light rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center shadow-lg`}>
                        <span className="text-xs font-bold text-white">
                          {getInitials(patient.firstName, patient.lastName)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white/90">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-xs text-white/40">{patient.patientNumber}</div>
                        <div className="flex items-center space-x-4 mt-1">
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
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs border border-blue-500/15">
                              {patient.insuranceCompany}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-white/20">
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
