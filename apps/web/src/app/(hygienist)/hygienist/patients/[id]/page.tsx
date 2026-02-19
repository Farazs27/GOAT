'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Activity,
  FileText,
  ClipboardList,
  Image as ImageIcon,
  FolderOpen,
  AlertTriangle,
  Pill,
  Phone,
  Mail,
  Calendar,
  Shield,
  Upload,
  ZoomIn,
  X,
  Loader2,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import dynamic from 'next/dynamic';

const TreatmentPlanBuilder = dynamic(() => import('@/components/treatments/treatment-plan-builder'), { ssr: false });

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string | null;
  email: string | null;
  phone: string | null;
  medicalAlerts: string[];
  medications: string[];
  insuranceCompany: string | null;
}

interface ClinicalNote {
  id: string;
  noteType: string;
  content: string;
  createdAt: string;
  author: { name: string; role: string };
}

interface TreatmentPlan {
  id: string;
  title: string;
  status: string;
  totalEstimate: string | number | null;
  createdAt: string;
  treatments: { id: string; description: string; status: string }[];
}

interface AnamnesisForm {
  id: string;
  formType: string;
  status: string;
  updatedAt: string;
}

interface PatientImage {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  imageType: string;
  notes: string | null;
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  documentType: string;
  createdAt: string;
}

const planStatusLabels: Record<string, string> = {
  DRAFT: 'Concept', PROPOSED: 'Voorgesteld', ACCEPTED: 'Geaccepteerd',
  IN_PROGRESS: 'Bezig', COMPLETED: 'Afgerond', CANCELLED: 'Geannuleerd', APPROVED: 'Goedgekeurd',
};

const planStatusColors: Record<string, string> = {
  DRAFT: 'bg-white/5 text-white/40 border-white/10',
  PROPOSED: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  ACCEPTED: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  CANCELLED: 'bg-white/5 text-white/30 border-white/10',
};

type Tab = 'perio' | 'notes' | 'treatment' | 'anamnesis' | 'images' | 'documents';

const tabs: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: 'perio', label: 'Perio', icon: Activity },
  { key: 'notes', label: 'Klinische Notities', icon: FileText },
  { key: 'treatment', label: 'Behandelplan', icon: ClipboardList },
  { key: 'anamnesis', label: 'Anamnese', icon: Shield },
  { key: 'images', label: 'Afbeeldingen', icon: ImageIcon },
  { key: 'documents', label: 'Documenten', icon: FolderOpen },
];

export default function HygienistPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('perio');
  const [loading, setLoading] = useState(true);
  const [recentNotes, setRecentNotes] = useState<ClinicalNote[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [anamnesisForms, setAnamnesisForms] = useState<AnamnesisForm[]>([]);
  const [images, setImages] = useState<PatientImage[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [perioSummary, setPerioSummary] = useState<{ lastSession: string | null; bopPercent: number | null; riskScore: string | null }>({ lastSession: null, bopPercent: null, riskScore: null });
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    try {
      const res = await authFetch(`/api/patients/${patientId}`);
      const data = await res.json();
      setPatient(data);
    } catch (e) {
      console.error('Failed to fetch patient', e);
    }
  }, [patientId]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await authFetch(`/api/patients/${patientId}/clinical-notes`);
      const data = await res.json();
      const notes = Array.isArray(data) ? data : data.data || [];
      setRecentNotes(notes.slice(0, 3));
    } catch { setRecentNotes([]); }
  }, [patientId]);

  const fetchTreatmentPlans = useCallback(async () => {
    try {
      const res = await authFetch(`/api/patients/${patientId}?include=treatmentPlans`);
      const data = await res.json();
      setTreatmentPlans(data.treatmentPlans || []);
    } catch { setTreatmentPlans([]); }
  }, [patientId]);

  const fetchAnamnesis = useCallback(async () => {
    try {
      const res = await authFetch(`/api/anamnesis?patientId=${patientId}`);
      const data = await res.json();
      setAnamnesisForms(Array.isArray(data) ? data : data.data || []);
    } catch { setAnamnesisForms([]); }
  }, [patientId]);

  const fetchImages = useCallback(async () => {
    try {
      const res = await authFetch(`/api/patient-images?patientId=${patientId}`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : data.data || []);
    } catch { setImages([]); }
  }, [patientId]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await authFetch(`/api/patients/${patientId}?include=documents`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch { setDocuments([]); }
  }, [patientId]);

  const fetchPerioSummary = useCallback(async () => {
    try {
      const res = await authFetch(`/api/patients/${patientId}/history?type=periodontal`);
      const data = await res.json();
      const charts = data.periodontalCharts || data.data || [];
      if (charts.length > 0) {
        const latest = charts[0];
        setPerioSummary({
          lastSession: latest.chartDate || latest.createdAt,
          bopPercent: latest.bopPercent ?? latest.metadata?.bopPercent ?? null,
          riskScore: latest.riskLevel || latest.metadata?.riskLevel || null,
        });
      }
    } catch { /* ignore */ }
  }, [patientId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPatient(), fetchPerioSummary()]).finally(() => setLoading(false));
  }, [fetchPatient, fetchPerioSummary]);

  useEffect(() => {
    if (activeTab === 'notes') fetchNotes();
    if (activeTab === 'treatment') fetchTreatmentPlans();
    if (activeTab === 'anamnesis') fetchAnamnesis();
    if (activeTab === 'images') fetchImages();
    if (activeTab === 'documents') fetchDocuments();
  }, [activeTab, fetchNotes, fetchTreatmentPlans, fetchAnamnesis, fetchImages, fetchDocuments]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('imageType', 'CLINICAL');
      await authFetch('/api/patient-images', { method: 'POST', body: formData, headers: {} });
      fetchImages();
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  const riskBadgeColors: Record<string, string> = {
    LOW: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
    MODERATE: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
    HIGH: 'bg-red-500/20 text-red-300 border-red-500/20',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-20 text-white/40">Patiënt niet gevonden</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug
      </button>

      {/* Patient header */}
      <div className="bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-xl shadow-black/10 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #34d399, #10b981)' }}>
              <span className="text-xl font-bold text-white">
                {patient.firstName[0]}{patient.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white/90">{patient.firstName} {patient.lastName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/40">
                <span>#{patient.patientNumber}</span>
                {patient.dateOfBirth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(patient.dateOfBirth)}
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {patient.phone}
                  </span>
                )}
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {patient.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {perioSummary.riskScore && (
              <span className={`text-xs px-2.5 py-1 rounded-full border ${riskBadgeColors[perioSummary.riskScore] || 'bg-white/5 text-white/40 border-white/10'}`}>
                Risico: {perioSummary.riskScore}
              </span>
            )}
          </div>
        </div>

        {/* Medical alerts */}
        {(patient.medicalAlerts?.length > 0 || patient.medications?.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {patient.medicalAlerts?.map((alert, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/20">
                <AlertTriangle className="w-3 h-3" />
                {alert}
              </span>
            ))}
            {patient.medications?.map((med, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                <Pill className="w-3 h-3" />
                {med}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/[0.06] text-white/40 border border-transparent hover:text-white/60 hover:bg-white/[0.09]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-xl shadow-black/10 p-6">
        {/* PERIO TAB */}
        {activeTab === 'perio' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Periodontaal Overzicht
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08]">
                <div className="text-xs text-white/40 mb-1">Laatste sessie</div>
                <div className="text-lg font-semibold text-white/80">
                  {perioSummary.lastSession ? formatDate(perioSummary.lastSession) : 'Geen data'}
                </div>
              </div>
              <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08]">
                <div className="text-xs text-white/40 mb-1">BOP %</div>
                <div className="text-lg font-semibold text-white/80">
                  {perioSummary.bopPercent !== null ? `${perioSummary.bopPercent}%` : '--'}
                </div>
              </div>
              <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08]">
                <div className="text-xs text-white/40 mb-1">Risicoscore</div>
                <div className="text-lg font-semibold text-white/80">
                  {perioSummary.riskScore ? (
                    <span className={`text-sm px-2 py-0.5 rounded-full border ${riskBadgeColors[perioSummary.riskScore] || ''}`}>
                      {perioSummary.riskScore}
                    </span>
                  ) : '--'}
                </div>
              </div>
            </div>

            <Link
              href={`/hygienist/patients/${patientId}/perio`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
            >
              <Activity className="w-4 h-4" />
              Open Periodontogram
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Klinische Notities
              </h2>
              <Link
                href={`/hygienist/patients/${patientId}/notes`}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Alle notities bekijken
              </Link>
            </div>

            {recentNotes.length === 0 ? (
              <p className="text-sm text-white/30 py-4">Geen notities gevonden</p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div key={note.id} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          note.author.role === 'DENTIST' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {note.author.role === 'DENTIST' ? 'Tandarts' : 'Hygiënist'}
                        </span>
                        <span className="text-xs text-white/40">{note.author.name}</span>
                      </div>
                      <span className="text-xs text-white/30">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TREATMENT PLANS TAB */}
        {activeTab === 'treatment' && (
          <TreatmentPlanBuilder
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
          />
        )}

        {/* ANAMNESIS TAB */}
        {activeTab === 'anamnesis' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Anamnese
            </h2>
            {anamnesisForms.length === 0 ? (
              <p className="text-sm text-white/30 py-4">Geen anamneseformulieren gevonden</p>
            ) : (
              <div className="space-y-3">
                {anamnesisForms.map((form) => (
                  <div key={form.id} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-white/80">{form.formType}</span>
                      <span className="text-xs text-white/40 ml-3">{formatDate(form.updatedAt)}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      form.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {form.status === 'COMPLETED' ? 'Ingevuld' : 'Open'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IMAGES TAB */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                Afbeeldingen
              </h2>
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                Uploaden
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploaden...
              </div>
            )}

            {images.length === 0 ? (
              <p className="text-sm text-white/30 py-4">Geen afbeeldingen gevonden</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setPreviewImage(img.filePath)}
                    className="aspect-square bg-white/[0.04] rounded-xl border border-white/[0.08] overflow-hidden cursor-pointer hover:border-emerald-500/30 transition-all group relative"
                  >
                    <img src={img.filePath} alt={img.fileName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white/80" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60">
                      <span className="text-[10px] text-white/70 truncate block">{img.fileName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewImage && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                <button className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white/60 hover:text-white" onClick={() => setPreviewImage(null)}>
                  <X className="w-6 h-6" />
                </button>
                <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-xl" />
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-emerald-400" />
              Documenten
            </h2>
            {documents.length === 0 ? (
              <p className="text-sm text-white/30 py-4">Geen documenten gevonden</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-white/[0.04] rounded-xl p-4 border border-white/[0.08] hover:bg-white/[0.06] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-white/30" />
                      <div>
                        <span className="text-sm font-medium text-white/80 block">{doc.title || doc.fileName}</span>
                        <span className="text-xs text-white/30">{doc.documentType} - {formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
