'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Phone, Calendar, Upload, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react';
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

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    patient?: { id: string; patientNumber: string; firstName: string; lastName: string };
    stats?: { treatmentsImported: number; treatmentsUnmatched: number; totalTreatments: number; invoicesCreated?: number };
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await authFetch('/api/patients');
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

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/patients/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult({ success: false, error: data.error || 'Import mislukt' });
      } else {
        setImportResult({ success: true, patient: data.patient, stats: data.stats });
        fetchPatients();
      }
    } catch {
      setImportResult({ success: false, error: 'Verbindingsfout bij import' });
    } finally {
      setImporting(false);
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
        <div className="flex items-center gap-2">
          <label className={`flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? 'Importeren...' : 'Importeer PDF'}
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
          </label>
          <Link href="/patients/new">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20">
              <Plus className="h-4 w-4" />
              Nieuwe patiënt
            </button>
          </Link>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border ${
          importResult.success
            ? 'bg-emerald-500/15 border-emerald-500/30'
            : 'bg-red-500/15 border-red-500/30'
        }`}>
          {importResult.success ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            {importResult.success ? (
              <>
                <p className="text-sm font-medium text-emerald-300">
                  {importResult.patient?.firstName} {importResult.patient?.lastName} succesvol geïmporteerd ({importResult.patient?.patientNumber})
                </p>
                {importResult.stats && (
                  <p className="text-xs text-emerald-300/70 mt-1">
                    {importResult.stats.treatmentsImported} behandelingen geïmporteerd
                    {importResult.stats.invoicesCreated ? `, ${importResult.stats.invoicesCreated} facturen` : ''}
                    {importResult.stats.treatmentsUnmatched > 0 && `, ${importResult.stats.treatmentsUnmatched} niet-gekoppeld (opgeslagen als notitie)`}
                  </p>
                )}
                <Link href={`/patients/${importResult.patient?.id}`} className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block">
                  Bekijk patiënt →
                </Link>
              </>
            ) : (
              <p className="text-sm text-red-300">{importResult.error}</p>
            )}
          </div>
          <button onClick={() => setImportResult(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-4 w-4 text-white/40" />
          </button>
        </div>
      )}

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
