'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { Plus, Search, Sparkles, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface DsdDesignItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  patient: { firstName: string; lastName: string };
  creator: { firstName: string; lastName: string };
  image: { filePath: string; fileName: string };
  _count: { versions: number };
}

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface PatientImageOption {
  id: string;
  fileName: string;
  filePath: string;
  imageType: string;
}

const IMAGE_CATEGORIES = [
  { key: 'all', label: 'Alle', types: null as string[] | null },
  { key: 'intraoral_scan', label: 'Intraoral Scan', types: ['INTRAORAL_SCAN'] },
  { key: 'intraoral_photo', label: 'Intraoral Foto', types: ['INTRAORAL', 'INTRAORAL_PHOTO'] },
  { key: 'facial', label: 'Gezichtsfoto', types: ['FACIAL', 'EXTRAORAL'] },
  { key: 'xray', label: 'Röntgen', types: ['XRAY'] },
  { key: 'cephalometric', label: 'Cefalometrisch', types: ['CEPHALOMETRIC'] },
];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-300',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300',
  REVIEW: 'bg-amber-500/20 text-amber-300',
  APPROVED: 'bg-green-500/20 text-green-300',
  ARCHIVED: 'bg-red-500/20 text-red-300',
};

export default function SmileDesignPage() {
  const router = useRouter();
  const [designs, setDesigns] = useState<DsdDesignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [patientImages, setPatientImages] = useState<PatientImageOption[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageCategory, setImageCategory] = useState('all');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const loadDesigns = useCallback(async () => {
    try {
      const res = await authFetch('/api/smile-design');
      if (res.ok) setDesigns(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDesigns(); }, [loadDesigns]);

  // Search patients
  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    const timer = setTimeout(async () => {
      const res = await authFetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : data.data ?? data.patients ?? []);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Load patient images
  useEffect(() => {
    if (!selectedPatient) { setPatientImages([]); return; }
    (async () => {
      const res = await authFetch(`/api/patients/${selectedPatient.id}/images`);
      if (res.ok) setPatientImages(await res.json());
    })();
  }, [selectedPatient]);

  const handleCreate = async () => {
    if (!selectedPatient || !selectedImage || !title.trim()) return;
    setCreating(true);
    try {
      const res = await authFetch('/api/smile-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          patientId: selectedPatient.id,
          imageId: selectedImage,
        }),
      });
      if (res.ok) {
        const design = await res.json();
        router.push(`/smile-design/${design.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Smile Design</h1>
            <p className="text-sm text-[var(--text-secondary)]">Digital Smile Design workspace</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-liquid-primary px-4 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nieuw ontwerp
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">Nieuw Smile Design</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Smile Design analyse..."
                className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
              />
            </div>

            {/* Patient Search */}
            <div className="relative">
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Patiënt</label>
              {selectedPatient ? (
                <div className="glass-input px-3 py-2.5 rounded-xl text-sm flex items-center justify-between">
                  <span className="text-[var(--text-primary)]">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </span>
                  <button
                    onClick={() => { setSelectedPatient(null); setPatientSearch(''); setSelectedImage(''); }}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >×</button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Zoek patiënt..."
                      className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  {patients.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 glass-card rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {patients.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(''); }}
                          className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
                        >
                          {p.firstName} {p.lastName}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Image Selection with Category Tabs */}
            {selectedPatient && (
              <div className="md:col-span-2">
                <label className="block text-sm text-[var(--text-secondary)] mb-2">Afbeelding selecteren</label>

                {/* Category tabs */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {IMAGE_CATEGORIES.map((cat) => {
                    const count = cat.types
                      ? patientImages.filter((img) => cat.types!.includes(img.imageType)).length
                      : patientImages.length;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setImageCategory(cat.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          imageCategory === cat.key
                            ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                            : 'bg-white/[0.04] text-[var(--text-tertiary)] hover:bg-white/[0.08] hover:text-[var(--text-secondary)] border border-transparent'
                        }`}
                      >
                        {cat.label}
                        {count > 0 && (
                          <span className={`ml-1.5 ${imageCategory === cat.key ? 'text-[var(--accent-primary)]/70' : 'text-[var(--text-tertiary)]/60'}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Filtered images */}
                {(() => {
                  const activeCat = IMAGE_CATEGORIES.find((c) => c.key === imageCategory);
                  const filtered = activeCat?.types
                    ? patientImages.filter((img) => activeCat.types!.includes(img.imageType))
                    : patientImages;

                  if (patientImages.length === 0) {
                    return <p className="text-sm text-[var(--text-tertiary)]">Geen afbeeldingen gevonden voor deze patiënt</p>;
                  }

                  if (filtered.length === 0) {
                    return (
                      <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">
                        Geen afbeeldingen in deze categorie
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {filtered.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImage(img.id)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            selectedImage === img.id
                              ? 'border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20'
                              : 'border-white/[0.06] hover:border-white/[0.12]'
                          }`}
                        >
                          <div className="aspect-video bg-white/[0.03] flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.filePath} alt={img.fileName} className="w-full h-full object-cover" />
                          </div>
                          <div className="px-2 py-1.5">
                            <div className="text-xs text-[var(--text-secondary)] truncate">{img.fileName}</div>
                            <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{img.imageType.replace(/_/g, ' ')}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => { setShowCreate(false); setSelectedPatient(null); setTitle(''); }}
              className="px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-white/[0.06] transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedPatient || !selectedImage || !title.trim() || creating}
              className="btn-liquid-primary px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Aanmaken...' : 'Aanmaken'}
            </button>
          </div>
        </div>
      )}

      {/* Design List */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : designs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ImageIcon className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">Nog geen Smile Designs</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Maak een nieuw ontwerp om te beginnen</p>
        </div>
      ) : (
        <div className="space-y-3">
          {designs.map((design) => (
            <button
              key={design.id}
              onClick={() => router.push(`/smile-design/${design.id}`)}
              className="glass-card w-full p-4 flex items-center gap-4 hover:bg-white/[0.06] transition-all group text-left"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/[0.03] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={design.image.filePath} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[var(--text-primary)] truncate">{design.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[design.status] ?? STATUS_STYLES.DRAFT}`}>
                    {design.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {design.patient.firstName} {design.patient.lastName}
                  <span className="mx-2 text-[var(--text-tertiary)]">·</span>
                  {design._count.versions} versie{design._count.versions !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true, locale: nl })}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
