'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { FileUp, Download, Filter, X, Search } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: string;
  url: string;
  createdAt: string;
  uploadedBy?: { firstName: string; lastName: string } | null;
  patient?: { firstName: string; lastName: string; id: string } | null;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const glassCard = {
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
};

const CATEGORIES = ['X-ray', 'Report', 'Consent', 'Perio', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
  'X-ray': 'bg-blue-500/15 text-blue-400',
  Report: 'bg-purple-500/15 text-purple-400',
  Consent: 'bg-emerald-500/15 text-emerald-400',
  Perio: 'bg-orange-500/15 text-orange-400',
  Other: 'bg-white/10 text-white/50',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterPatient, setFilterPatient] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadForm, setUploadForm] = useState({ patientId: '', category: 'Other', name: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocuments();
    loadPatients();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    try {
      // Load documents from patients
      const pRes = await authFetch('/api/patients?limit=200');
      if (pRes.ok) {
        const pData = await pRes.json();
        const patientList: Patient[] = Array.isArray(pData) ? pData : pData.patients || [];
        const allDocs: Document[] = [];
        const recent = patientList.slice(0, 50);
        await Promise.all(
          recent.map(async (p) => {
            try {
              const res = await authFetch(`/api/patients/${p.id}?include=documents`);
              if (res.ok) {
                const data = await res.json();
                const docs = data.documents || [];
                docs.forEach((d: Document) => {
                  allDocs.push({ ...d, patient: { firstName: p.firstName, lastName: p.lastName, id: p.id } });
                });
              }
            } catch {}
          })
        );
        allDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDocuments(allDocs);
      }
    } catch {}
    setLoading(false);
  }

  async function loadPatients() {
    try {
      const res = await authFetch('/api/patients?limit=200');
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : data.patients || []);
      }
    } catch {}
  }

  async function uploadDocument() {
    if (!selectedFile || !uploadForm.patientId) return;
    setUploading(true);
    try {
      // Upload to Vercel Blob via patient images endpoint or generic upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patientId', uploadForm.patientId);
      formData.append('category', uploadForm.category);
      formData.append('name', uploadForm.name || selectedFile.name);

      const res = await authFetch('/api/patient-images', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setShowUpload(false);
        setSelectedFile(null);
        setUploadForm({ patientId: '', category: 'Other', name: '' });
        loadDocuments();
      }
    } catch {}
    setUploading(false);
  }

  const filteredDocs = documents.filter((d) => {
    if (filterPatient && d.patient?.id !== filterPatient) return false;
    if (filterCategory && d.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = d.name?.toLowerCase() || '';
      const patientName = d.patient ? `${d.patient.firstName} ${d.patient.lastName}`.toLowerCase() : '';
      if (!name.includes(q) && !patientName.includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 md:pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white/90 tracking-tight">Documenten</h1>
          <p className="text-white/40 mt-1 text-sm">{filteredDocs.length} van {documents.length} documenten</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium"
        >
          <FileUp className="w-4 h-4" /> Uploaden
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/90">Document uploaden</h2>
            <button onClick={() => setShowUpload(false)} className="text-white/40 hover:text-white/70">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={uploadForm.patientId}
              onChange={(e) => setUploadForm((p) => ({ ...p, patientId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 outline-none"
            >
              <option value="" className="bg-gray-900">Selecteer patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <select
              value={uploadForm.category}
              onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-gray-900">{c}</option>
              ))}
            </select>
            <input
              value={uploadForm.name}
              onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Document naam (optioneel)"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none"
            />
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] cursor-pointer hover:bg-white/[0.08] transition-colors">
              <FileUp className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60">
                {selectedFile ? selectedFile.name : 'Kies bestand...'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <button
            onClick={uploadDocument}
            disabled={uploading || !selectedFile || !uploadForm.patientId}
            className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {uploading ? 'Uploaden...' : 'Uploaden'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoeken..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 outline-none text-sm"
          />
        </div>
        <select
          value={filterPatient}
          onChange={(e) => setFilterPatient(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 outline-none text-sm"
        >
          <option value="" className="bg-gray-900">Alle patienten</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id} className="bg-gray-900">
              {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white/90 outline-none text-sm"
        >
          <option value="" className="bg-gray-900">Alle categorien</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-gray-900">{c}</option>
          ))}
        </select>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl overflow-hidden" style={glassCard}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Patient</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Document</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Categorie</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((d) => (
              <tr key={d.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-4 text-sm text-white/80">
                  {d.patient ? `${d.patient.firstName} ${d.patient.lastName}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-white/80 font-medium">{d.name}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CATEGORY_COLORS[d.category] || CATEGORY_COLORS.Other}`}>
                    {d.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white/50">
                  {new Date(d.createdAt).toLocaleDateString('nl-NL')}
                </td>
                <td className="px-6 py-4">
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/30 text-sm">
                  Geen documenten gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
