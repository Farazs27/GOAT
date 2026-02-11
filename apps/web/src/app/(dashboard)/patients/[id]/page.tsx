'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  User,
  FileText,
  ClipboardList,
  CreditCard,
  Image as ImageIcon,
  Edit,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Shield,
  AlertTriangle,
  Pill,
  ExternalLink,
  Upload,
  ZoomIn,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import type { ToothData, SurfaceData } from '@/components/odontogram/odontogram';

// Dynamic imports for heavy components
const Odontogram = dynamic(() => import('@/components/odontogram/odontogram'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
    </div>
  ),
});
const SoapNoteForm = dynamic(() => import('@/components/clinical/soap-note-form'));
const TreatmentPlanBuilder = dynamic(() => import('@/components/treatments/treatment-plan-builder'));
const PrescriptionList = dynamic(() => import('@/components/prescriptions/prescription-list'));
const MedicalHistoryPanel = dynamic(() => import('@/components/patient-history/medical-history-panel'));

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostal: string | null;
  insuranceCompany: string | null;
  insuranceNumber: string | null;
  bsn: string | null;
  medicalAlerts: string[];
  medications: string[];
}

interface PatientImage {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  imageType: string;
  notes: string | null;
  createdAt: string;
}

interface ClinicalNote {
  id: string;
  noteType: string;
  content: string;
  createdAt: string;
  author: { firstName: string; lastName: string; role: string };
}

interface TreatmentRecord {
  id: string;
  description: string;
  status: string;
  performedAt: string | null;
  createdAt: string;
  nzaCode: { code: string; descriptionNl: string } | null;
  tooth: { toothNumber: number } | null;
  performer: { firstName: string; lastName: string };
}

const TREATMENT_STATUS_CLASSES: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  PLANNED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // BSN state
  const [showBsn, setShowBsn] = useState(false);
  const [fullBsn, setFullBsn] = useState<string | null>(null);
  const [bsnReason, setBsnReason] = useState('');
  const [showBsnDialog, setShowBsnDialog] = useState(false);

  // Clinical notes
  const [notes, setNotes] = useState<ClinicalNote[]>([]);

  // Images / Rontgen
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageModal, setImageModal] = useState<{ index: number } | null>(null);

  // Odontogram data
  const [odontogramTeeth, setOdontogramTeeth] = useState<ToothData[]>([]);
  const [odontogramSurfaces, setOdontogramSurfaces] = useState<SurfaceData[]>([]);

  // Medical history panel
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);

  // Outstanding balance
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  // Treatment history for overview timeline
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentRecord[]>([]);

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const response = await authFetch(`/api/patients/${patientId}`);
      if (!response.ok) throw new Error('Failed to fetch patient');
      setPatient(await response.json());
    } catch (err) {
      setError('Fout bij het laden van patientgegevens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = useCallback(async () => {
    try {
      const response = await authFetch(`/api/clinical-notes?patientId=${patientId}`);
      if (response.ok) setNotes(await response.json());
    } catch (err) {
      console.error(err);
    }
  }, [patientId]);

  const fetchPatientImages = useCallback(async () => {
    try {
      const response = await authFetch(`/api/patients/${patientId}/images`);
      if (response.ok) setPatientImages(await response.json());
    } catch (err) {
      console.error(err);
    }
  }, [patientId]);

  const fetchOdontogramData = useCallback(async () => {
    try {
      const response = await authFetch(`/api/patients/${patientId}/odontogram`);
      if (response.ok) {
        const data = await response.json();
        setOdontogramTeeth(data.teeth || []);
        setOdontogramSurfaces(data.surfaces || []);
      }
    } catch (err) {
      // Gracefully handle if endpoint doesn't exist yet
      console.error('Odontogram fetch failed:', err);
    }
  }, [patientId]);

  const fetchTreatmentHistory = useCallback(async () => {
    try {
      const response = await authFetch(`/api/patients/${patientId}/history`);
      if (response.ok) {
        const data = await response.json();
        setTreatmentHistory(data.treatments || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [patientId]);

  const uploadPatientImage = async (file: File, imageType: string = 'XRAY') => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', imageType);
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/patients/${patientId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) fetchPatientImages();
    } catch (err) {
      console.error(err);
    }
    setImageUploading(false);
  };

  const deletePatientImage = async (imageId: string) => {
    try {
      await authFetch(`/api/patients/${patientId}/images/${imageId}`, {
        method: 'DELETE',
      });
      fetchPatientImages();
      setImageModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    fetchPatientImages();
  }, [fetchPatientImages]);

  useEffect(() => {
    fetchOdontogramData();
  }, [fetchOdontogramData]);

  useEffect(() => {
    fetchTreatmentHistory();
  }, [fetchTreatmentHistory]);

  const fetchOutstandingBalance = useCallback(async () => {
    try {
      const response = await authFetch(`/api/invoices?patientId=${patientId}&limit=200`);
      if (response.ok) {
        const data = await response.json();
        const invoiceList = data.data || (Array.isArray(data) ? data : []);
        const total = invoiceList
          .filter((inv: { status: string }) => ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status))
          .reduce((sum: number, inv: { total: string; paidAmount: string }) => {
            return sum + (Number(inv.total) - Number(inv.paidAmount));
          }, 0);
        setOutstandingBalance(total);
      }
    } catch (err) {
      console.error('Failed to fetch outstanding balance:', err);
    }
  }, [patientId]);

  useEffect(() => {
    fetchOutstandingBalance();
  }, [fetchOutstandingBalance]);

  const handleToothSelect = useCallback((toothNumber: number) => {
    console.log('Tooth selected:', toothNumber);
  }, []);

  const handleTreatmentApply = useCallback(async (data: {
    toothNumber: number;
    treatmentType: string;
    nzaCode: string;
    surfaces?: string[];
  }) => {
    try {
      const response = await authFetch(`/api/patients/${patientId}/odontogram`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.ok) {
        // Refresh odontogram data after applying treatment
        fetchOdontogramData();
      }
    } catch (err) {
      console.error('Treatment apply failed:', err);
    }
  }, [patientId, fetchOdontogramData]);

  const requestBsn = async () => {
    if (bsnReason.length < 5) return;
    try {
      const response = await authFetch(`/api/patients/${patientId}/bsn`, {
        method: 'POST',
        body: JSON.stringify({ reason: bsnReason }),
      });
      if (!response.ok) throw new Error('Failed to get BSN');
      const data = await response.json();
      setFullBsn(data.bsn);
      setShowBsn(true);
      setShowBsnDialog(false);
      setBsnReason('');
      setTimeout(() => { setShowBsn(false); setFullBsn(null); }, 30000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error || 'Patient niet gevonden'}</p>
        <Link href="/patients">
          <button className="mt-4 px-4 py-2 glass rounded-xl text-white/80 hover:bg-white/10 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 inline" />
            Terug naar patienten
          </button>
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('nl-NL');
  const getInitials = (firstName: string, lastName: string) => `${firstName[0]}${lastName[0]}`.toUpperCase();

  const tabs = [
    { id: 'overview', icon: User, label: 'Overzicht' },
    { id: 'odontogram', icon: ImageIcon, label: 'Gebitsstatus' },
    { id: 'treatments', icon: ClipboardList, label: 'Behandelingen' },
    { id: 'notes', icon: FileText, label: 'Notities' },
    { id: 'prescriptions', icon: Pill, label: 'Recepten' },
    { id: 'invoices', icon: CreditCard, label: 'Facturen' },
    { id: 'rontgen', icon: ImageIcon, label: 'Rontgen' },
  ];

  // Group treatment history by date for timeline
  const treatmentsByDate = treatmentHistory.reduce(
    (acc, t) => {
      const dateKey = new Date(t.performedAt || t.createdAt).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(t);
      return acc;
    },
    {} as Record<string, TreatmentRecord[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/patients">
            <button className="p-2.5 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-white/40 text-sm">
              {patient.patientNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMedicalHistory(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-medium transition-all"
          >
            <FolderOpen className="h-4 w-4" />
            Dossier
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
            <Edit className="h-4 w-4" />
            Bewerken
          </button>
        </div>
      </div>

      {/* Outstanding Balance Banner */}
      {outstandingBalance > 0 && (
        <Link href="/billing">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-medium text-amber-300">
                Openstaand bedrag:{' '}
                {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(outstandingBalance)}
              </span>
            </div>
            <span className="text-xs text-amber-400/70">Bekijk facturen &rarr;</span>
          </div>
        </Link>
      )}

      {/* Patient Info Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <span className="text-2xl font-bold text-white">
              {getInitials(patient.firstName, patient.lastName)}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Geboortedatum</p>
              <p className="font-medium text-white/90 mt-1">{formatDate(patient.dateOfBirth)}</p>
            </div>
            {patient.phone && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Telefoon</p>
                <p className="font-medium text-white/90 mt-1 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-blue-400" />
                  {patient.phone}
                </p>
              </div>
            )}
            {patient.email && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">E-mail</p>
                <p className="font-medium text-white/90 mt-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-400" />
                  {patient.email}
                </p>
              </div>
            )}
            {patient.insuranceCompany && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Verzekeraar</p>
                <span className="inline-block mt-1 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm border border-blue-500/20">
                  {patient.insuranceCompany}
                </span>
              </div>
            )}
            {/* BSN */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">BSN</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="font-medium font-mono text-white/90">
                  {showBsn && fullBsn ? fullBsn : (patient.bsn || 'Niet ingevuld')}
                </p>
                {patient.bsn && (
                  <button
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => {
                      if (showBsn) { setShowBsn(false); setFullBsn(null); }
                      else setShowBsnDialog(true);
                    }}
                  >
                    {showBsn
                      ? <EyeOff className="h-3.5 w-3.5 text-white/50" />
                      : <Eye className="h-3.5 w-3.5 text-white/50" />
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BSN reason dialog */}
        {showBsnDialog && (
          <div className="mt-5 pt-5 border-t border-white/10">
            <div className="max-w-md space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <p className="text-sm font-medium text-white/80">Reden voor inzien BSN</p>
              </div>
              <input
                type="text"
                placeholder="bijv. Inzien voor facturatie (min. 5 tekens)"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                value={bsnReason}
                onChange={(e) => setBsnReason(e.target.value)}
              />
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40"
                  onClick={requestBsn}
                  disabled={bsnReason.length < 5}
                >
                  Toon BSN
                </button>
                <button
                  className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => { setShowBsnDialog(false); setBsnReason(''); }}
                >
                  Annuleren
                </button>
              </div>
              <p className="text-xs text-white/30">
                Toegang wordt gelogd in het auditlogboek.
              </p>
            </div>
          </div>
        )}

        {/* Medical alerts */}
        {patient.medicalAlerts && patient.medicalAlerts.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <p className="text-xs text-white/40 uppercase tracking-wider">Medische waarschuwingen</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient.medicalAlerts.map((alert, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm border border-red-500/20"
                >
                  {alert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {patient.medications && patient.medications.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-white/40 uppercase tracking-wider">Medicatie</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient.medications.map((med, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-sm border border-amber-500/20"
                >
                  {med}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-1 glass rounded-2xl p-1.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content with transition wrapper */}
        <div className="transition-opacity duration-200 ease-in-out">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Patientgegevens</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-white/40">Adres</p>
                    <p className="text-white/80 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      {patient.addressStreet || 'Niet ingevuld'}
                    </p>
                    <p className="text-white/80 ml-5">
                      {patient.addressPostal} {patient.addressCity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Verzekering</p>
                    <p className="text-white/80 mt-0.5">{patient.insuranceCompany || 'Niet ingevuld'}</p>
                    <p className="text-xs text-white/40 mt-0.5">Polis: {patient.insuranceNumber || 'Niet ingevuld'}</p>
                  </div>
                </div>
              </div>

              {/* Treatment history timeline */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Laatste activiteit</h3>
                {treatmentHistory.length === 0 ? (
                  <p className="text-white/40 text-sm">Geen recente activiteit</p>
                ) : (
                  <div className="relative pl-6 space-y-4 max-h-80 overflow-y-auto">
                    {/* Vertical timeline line */}
                    <div className="absolute left-2 top-1 bottom-1 w-px bg-white/10" />

                    {Object.entries(treatmentsByDate).slice(0, 5).map(([date, items]) => (
                      <div key={date} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-blue-500/30 shadow-sm shadow-blue-500/20" />
                        <p className="text-[10px] text-white/30 font-medium mb-1.5">{date}</p>
                        <div className="space-y-1.5">
                          {items.map((t) => (
                            <div key={t.id} className="p-2 rounded-lg bg-white/5 border border-white/5">
                              <div className="flex items-center gap-2 mb-0.5">
                                {t.nzaCode && (
                                  <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                    {t.nzaCode.code}
                                  </span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TREATMENT_STATUS_CLASSES[t.status] || 'bg-white/10 text-white/40 border-white/10'}`}>
                                  {t.status}
                                </span>
                                {t.tooth && (
                                  <span className="text-[10px] text-white/40">
                                    Element {t.tooth.toothNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/80">
                                {t.nzaCode?.descriptionNl || t.description}
                              </p>
                              <p className="text-[10px] text-white/30 mt-0.5">
                                {t.performer.firstName} {t.performer.lastName}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'odontogram' && (
            <Odontogram
              patientId={patientId}
              teeth={odontogramTeeth}
              surfaces={odontogramSurfaces}
              onToothSelect={handleToothSelect}
              onTreatmentApply={handleTreatmentApply}
            />
          )}

          {activeTab === 'treatments' && (
            <TreatmentPlanBuilder patientId={patientId} />
          )}

          {activeTab === 'notes' && (
            <SoapNoteForm
              patientId={patientId}
              notes={notes}
              onNoteCreated={fetchNotes}
            />
          )}

          {activeTab === 'prescriptions' && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Recepten</h3>
              <PrescriptionList patientId={patientId} />
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Facturen</h3>
              <p className="text-white/40 text-sm">Geen facturen gevonden — wordt geimplementeerd in Phase 3</p>
            </div>
          )}

          {activeTab === 'rontgen' && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Rontgenfoto&apos;s</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.open(`visiquick://patient/${patientId}`, '_self')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Openen in VisiQuick
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4" />
                    {imageUploading ? 'Uploaden...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*,.dcm,.dicom"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPatientImage(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              {patientImages.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 text-white/15" />
                  <p className="text-sm text-white/30">Geen rontgenfoto&apos;s gevonden</p>
                  <p className="text-xs text-white/20 mt-1">Upload een afbeelding of open VisiQuick</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {patientImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setImageModal({ index: idx })}
                      className="group rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all bg-black/20"
                    >
                      <div className="aspect-square relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/patients/${patientId}/images/${img.id}/file`}
                          alt={img.fileName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] text-white/40 truncate">{img.fileName}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/20">
                            {img.imageType === 'XRAY' ? 'Rontgen' : img.imageType === 'INTRAORAL' ? 'Intraoraal' : img.imageType === 'EXTRAORAL' ? 'Extraoraal' : 'Overig'}
                          </span>
                          <span className="text-[9px] text-white/30">
                            {new Date(img.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Full-size image modal */}
              {imageModal !== null && patientImages[imageModal.index] && (
                <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center" onClick={() => setImageModal(null)}>
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePatientImage(patientImages[imageModal.index].id); }}
                      className="p-2 glass rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setImageModal(null)}
                      className="p-2 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {imageModal.index > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setImageModal({ index: imageModal.index - 1 }); }}
                      className="absolute left-4 p-3 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}
                  {imageModal.index < patientImages.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setImageModal({ index: imageModal.index + 1 }); }}
                      className="absolute right-4 p-3 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                  <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/patients/${patientId}/images/${patientImages[imageModal.index].id}/file`}
                      alt={patientImages[imageModal.index].fileName}
                      className="max-w-full max-h-[80vh] object-contain rounded-xl"
                    />
                    <div className="mt-3 text-center">
                      <p className="text-sm text-white/70">{patientImages[imageModal.index].fileName}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {new Date(patientImages[imageModal.index].createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {patientImages[imageModal.index].notes && ` — ${patientImages[imageModal.index].notes}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Medical History Side Panel */}
      <MedicalHistoryPanel
        patientId={patientId}
        isOpen={showMedicalHistory}
        onClose={() => setShowMedicalHistory(false)}
      />
    </div>
  );
}
