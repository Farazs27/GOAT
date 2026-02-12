'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Phone, Calendar, Upload, Loader2, CheckCircle, AlertTriangle, X, Filter, ChevronDown } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

const CATEGORIES = [
  'Actief', 'Inactief', 'Definitief Archief', 'Algemeen', 'Orthodontie',
  'Restoratief', 'Multidisciplinair', 'Endodontologie', 'Parodontologie', 'Nazorg',
] as const;

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Actief': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  'Inactief': { bg: 'bg-gray-500/15', text: 'text-gray-300', border: 'border-gray-500/20' },
  'Definitief Archief': { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/20' },
  'Algemeen': { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/20' },
  'Orthodontie': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/20' },
  'Restoratief': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/20' },
  'Multidisciplinair': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/20' },
  'Endodontologie': { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-500/20' },
  'Parodontologie': { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/20' },
  'Nazorg': { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/20' },
};

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
  patientCategories?: { category: string }[];
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [addCategoryFor, setAddCategoryFor] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    patient?: { id: string; patientNumber: string; firstName: string; lastName: string };
    stats?: { treatmentsImported: number; treatmentsUnmatched: number; totalTreatments: number; invoicesCreated?: number };
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [selectedCategories]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAddCategoryFor(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategories.length > 0) {
        params.set('categories', selectedCategories.join(','));
      }
      const url = `/api/patients${params.toString() ? `?${params}` : ''}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      const fetched: Patient[] = data.data || [];
      setPatients(fetched);

      // Compute counts from all patients (only when no filter active)
      if (selectedCategories.length === 0) {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) counts[cat] = 0;
        for (const p of fetched) {
          for (const pc of (p.patientCategories || [])) {
            if (counts[pc.category] !== undefined) counts[pc.category]++;
          }
        }
        setCategoryCounts(counts);
      }
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

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const addCategoryToPatient = async (patientId: string, category: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    const existing = (patient.patientCategories || []).map(c => c.category);
    if (existing.includes(category)) return;
    const updated = [...existing, category];
    await authFetch(`/api/patients/${patientId}/categories`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: updated }),
    });
    setAddCategoryFor(null);
    fetchPatients();
  };

  const removeCategoryFromPatient = async (e: React.MouseEvent, patientId: string, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    const updated = (patient.patientCategories || []).map(c => c.category).filter(c => c !== category);
    await authFetch(`/api/patients/${patientId}/categories`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: updated }),
    });
    fetchPatients();
  };

  const filteredPatients = patients.filter(patient => {
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

      <div className="flex gap-6">
        {/* Sidebar filter */}
        <div className="w-60 flex-shrink-0">
          <div className="glass-card rounded-2xl p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-white/50" />
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Categorieën</h3>
            </div>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="text-xs text-blue-400 hover:text-blue-300 mb-3 transition-colors"
              >
                Wis filters
              </button>
            )}
            <div className="space-y-1">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                const c = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                      isSelected
                        ? `${c.bg} ${c.text} ${c.border} border`
                        : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className={`text-xs ${isSelected ? c.text : 'text-white/30'}`}>
                      {categoryCounts[cat] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Zoek op naam, nummer of geboortedatum..."
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
                  {filteredPatients.map((patient, index) => {
                    const patientCats = (patient.patientCategories || []).map(c => c.category);
                    return (
                      <Link key={patient.id} href={`/patients/${patient.id}`} className="block">
                        <div className="flex items-center justify-between p-4 glass-light rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer">
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center shadow-lg flex-shrink-0`}>
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
                                  <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs border border-blue-500/15">
                                    {patient.insuranceCompany}
                                  </span>
                                )}
                              </div>
                              {/* Category chips */}
                              {patientCats.length > 0 && (
                                <div className="flex items-center flex-wrap gap-1 mt-2">
                                  {patientCats.map(cat => {
                                    const c = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Algemeen'];
                                    return (
                                      <span
                                        key={cat}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${c.bg} ${c.text} border ${c.border}`}
                                      >
                                        {cat}
                                        <button
                                          onClick={(e) => removeCategoryFromPatient(e, patient.id, cat)}
                                          className="hover:opacity-70 transition-opacity"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </span>
                                    );
                                  })}
                                  {/* Add category button */}
                                  <div className="relative" ref={addCategoryFor === patient.id ? dropdownRef : undefined}>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setAddCategoryFor(addCategoryFor === patient.id ? null : patient.id);
                                      }}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5 transition-all border border-dashed border-white/10"
                                    >
                                      <Plus className="h-2.5 w-2.5" />
                                    </button>
                                    {addCategoryFor === patient.id && (
                                      <div className="absolute top-full left-0 mt-1 z-50 w-48 glass-card rounded-xl border border-white/10 shadow-2xl py-1 max-h-60 overflow-y-auto">
                                        {CATEGORIES.filter(c => !patientCats.includes(c)).map(cat => {
                                          const cc = CATEGORY_COLORS[cat];
                                          return (
                                            <button
                                              key={cat}
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                addCategoryToPatient(patient.id, cat);
                                              }}
                                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${cc.text}`}
                                            >
                                              {cat}
                                            </button>
                                          );
                                        })}
                                        {CATEGORIES.filter(c => !patientCats.includes(c)).length === 0 && (
                                          <p className="px-3 py-1.5 text-xs text-white/30">Alle categorieën toegewezen</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {patientCats.length === 0 && (
                                <div className="mt-2">
                                  <div className="relative" ref={addCategoryFor === patient.id ? dropdownRef : undefined}>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setAddCategoryFor(addCategoryFor === patient.id ? null : patient.id);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5 transition-all border border-dashed border-white/10"
                                    >
                                      <Plus className="h-2.5 w-2.5" />
                                      <span>Categorie</span>
                                    </button>
                                    {addCategoryFor === patient.id && (
                                      <div className="absolute top-full left-0 mt-1 z-50 w-48 glass-card rounded-xl border border-white/10 shadow-2xl py-1 max-h-60 overflow-y-auto">
                                        {CATEGORIES.map(cat => {
                                          const cc = CATEGORY_COLORS[cat];
                                          return (
                                            <button
                                              key={cat}
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                addCategoryToPatient(patient.id, cat);
                                              }}
                                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${cc.text}`}
                                            >
                                              {cat}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-white/20 flex-shrink-0 ml-2">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
