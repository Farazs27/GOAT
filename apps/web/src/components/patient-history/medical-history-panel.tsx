'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  AlertTriangle,
  Pill,
  ChevronDown,
  ChevronRight,
  FileText,
  Stethoscope,
  Image as ImageIcon,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

// ── Types ──────────────────────────────────────────────────────

interface PatientHistoryData {
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
    medicalAlerts: string[];
    medications: string[];
    dateOfBirth: string;
    insuranceCompany: string | null;
  };
  treatments: {
    id: string;
    description: string;
    status: string;
    performedAt: string | null;
    createdAt: string;
    nzaCode: { code: string; descriptionNl: string } | null;
    tooth: { toothNumber: number } | null;
    performer: { firstName: string; lastName: string };
  }[];
  clinicalNotes: {
    id: string;
    noteType: string;
    content: string;
    createdAt: string;
    author: { firstName: string; lastName: string };
  }[];
  images: {
    id: string;
    fileName: string;
    imageType: string;
    notes: string | null;
    createdAt: string;
  }[];
  prescriptions: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    status: string;
    prescribedAt: string;
    prescriber: { firstName: string; lastName: string };
  }[];
  anamnesis: { data: Record<string, unknown>; completedAt: string | null } | null;
  periodontalChart: { chartData: Record<string, unknown>; createdAt: string } | null;
}

interface MedicalHistoryPanelProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusColorMap: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  PLANNED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const noteTypeBadge: Record<string, string> = {
  PROGRESS: 'bg-blue-500/20 text-blue-300',
  SOAP: 'bg-purple-500/20 text-purple-300',
  REFERRAL: 'bg-amber-500/20 text-amber-300',
  CONSENT: 'bg-emerald-500/20 text-emerald-300',
};

const prescriptionStatusMap: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-300',
  COMPLETED: 'bg-gray-500/20 text-gray-300',
  DISCONTINUED: 'bg-red-500/20 text-red-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
};

// ── Collapsible Section ────────────────────────────────────────

function Section({
  title,
  icon,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white/50">{icon}</span>
        <span className="text-sm font-medium text-white/90 flex-1">{title}</span>
        {count !== undefined && (
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
        {open ? (
          <ChevronDown className="h-4 w-4 text-white/30" />
        ) : (
          <ChevronRight className="h-4 w-4 text-white/30" />
        )}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

// ── Periodontal summary helper ─────────────────────────────────

function PeriodontalSummary({ chartData }: { chartData: Record<string, unknown> }) {
  // chartData structure varies; try to extract pocket depths
  let gte4 = 0;
  let gte6 = 0;
  let total = 0;

  try {
    const data = chartData as Record<string, Record<string, number[]>>;
    for (const toothKey of Object.keys(data)) {
      const tooth = data[toothKey];
      if (!tooth) continue;
      const pockets = tooth.pocketDepths || tooth.pocket_depths;
      if (Array.isArray(pockets)) {
        for (const depth of pockets) {
          if (typeof depth === 'number' && depth > 0) {
            total++;
            if (depth >= 6) gte6++;
            else if (depth >= 4) gte4++;
          }
        }
      }
    }
  } catch {
    // ignore parse errors
  }

  if (total === 0) {
    return <p className="text-xs text-white/40">Geen pocketdieptes beschikbaar.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500/40 inline-block" />
          <span className="text-white/70">{gte4} locaties ≥4mm</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/40 inline-block" />
          <span className="text-white/70">{gte6} locaties ≥6mm</span>
        </div>
      </div>
      <p className="text-[10px] text-white/30">{total} meetpunten totaal</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function MedicalHistoryPanel({
  patientId,
  isOpen,
  onClose,
}: MedicalHistoryPanelProps) {
  const [data, setData] = useState<PatientHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/patients/${patientId}/history`);
      if (!res.ok) throw new Error('Fout bij ophalen dossier');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchHistory();
    }
  }, [isOpen, patientId, fetchHistory]);

  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group treatments by date
  const treatmentsByDate = data?.treatments.reduce(
    (acc, t) => {
      const dateKey = formatDate(t.performedAt || t.createdAt);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(t);
      return acc;
    },
    {} as Record<string, PatientHistoryData['treatments']>
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg z-[70] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full glass-card border-l border-white/10 flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-card, rgba(15,23,42,0.95))' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div>
              <h2 className="text-base font-semibold text-white">
                {data?.patient
                  ? `${data.patient.firstName} ${data.patient.lastName}`
                  : 'Medisch Dossier'}
              </h2>
              {data?.patient && (
                <p className="text-xs text-white/40 mt-0.5">
                  {data.patient.patientNumber}
                  {data.patient.dateOfBirth &&
                    ` \u00b7 ${formatDate(data.patient.dateOfBirth)}`}
                  {data.patient.insuranceCompany &&
                    ` \u00b7 ${data.patient.insuranceCompany}`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {error && (
              <div className="m-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            {data && !loading && (
              <>
                {/* Alerts */}
                {(data.patient.medicalAlerts.length > 0 ||
                  data.patient.medications.length > 0) && (
                  <div className="px-5 py-3 bg-red-500/5 border-b border-red-500/10">
                    {data.patient.medicalAlerts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                        {data.patient.medicalAlerts.map((alert, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-xs bg-red-500/20 text-red-300 border border-red-500/30"
                          >
                            {alert}
                          </span>
                        ))}
                      </div>
                    )}
                    {data.patient.medications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <Pill className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        {data.patient.medications.map((med, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          >
                            {med}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sections */}

                {/* Anamnese */}
                <Section
                  title="Anamnese"
                  icon={<ClipboardList className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  {data.anamnesis ? (
                    <div className="space-y-2">
                      {data.anamnesis.completedAt && (
                        <p className="text-[10px] text-white/30">
                          Ingevuld op {formatDateTime(data.anamnesis.completedAt)}
                        </p>
                      )}
                      <div className="space-y-1.5">
                        {Object.entries(
                          data.anamnesis.data as Record<string, unknown>
                        ).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between text-xs py-1 border-b border-white/5"
                          >
                            <span className="text-white/50 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                            </span>
                            <span className="text-white/80 text-right max-w-[60%]">
                              {typeof value === 'boolean'
                                ? value
                                  ? 'Ja'
                                  : 'Nee'
                                : String(value ?? '-')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">Geen anamnese beschikbaar.</p>
                  )}
                </Section>

                {/* Medicatie & Recepten */}
                <Section
                  title="Medicatie & Recepten"
                  icon={<Pill className="h-4 w-4" />}
                  count={data.prescriptions.length}
                >
                  {data.prescriptions.length > 0 ? (
                    <div className="space-y-2">
                      {data.prescriptions.map((rx) => (
                        <div
                          key={rx.id}
                          className="p-2.5 rounded-lg bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white/90">
                              {rx.medicationName}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${prescriptionStatusMap[rx.status] || 'bg-gray-500/20 text-gray-300'}`}
                            >
                              {rx.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50">
                            {rx.dosage} &middot; {rx.frequency}
                          </p>
                          <p className="text-[10px] text-white/30 mt-1">
                            {rx.prescriber.firstName} {rx.prescriber.lastName} &middot;{' '}
                            {formatDate(rx.prescribedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">Geen recepten gevonden.</p>
                  )}
                </Section>

                {/* Behandelhistorie */}
                <Section
                  title="Behandelhistorie"
                  icon={<Stethoscope className="h-4 w-4" />}
                  count={data.treatments.length}
                  defaultOpen={true}
                >
                  {treatmentsByDate && Object.keys(treatmentsByDate).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(treatmentsByDate).map(([date, items]) => (
                        <div key={date}>
                          <p className="text-[10px] text-white/30 font-medium mb-1.5">
                            {date}
                          </p>
                          <div className="space-y-1.5 pl-3 border-l-2 border-white/10">
                            {items.map((t) => (
                              <div
                                key={t.id}
                                className="p-2 rounded-lg bg-white/5 border border-white/5"
                              >
                                <div className="flex items-center gap-2 mb-0.5">
                                  {t.nzaCode && (
                                    <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                      {t.nzaCode.code}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColorMap[t.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}
                                  >
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
                  ) : (
                    <p className="text-xs text-white/40">
                      Geen behandelingen gevonden.
                    </p>
                  )}
                </Section>

                {/* Klinische Notities */}
                <Section
                  title="Klinische Notities"
                  icon={<FileText className="h-4 w-4" />}
                  count={data.clinicalNotes.length}
                >
                  {data.clinicalNotes.length > 0 ? (
                    <div className="space-y-2">
                      {data.clinicalNotes.map((note) => {
                        const isExpanded = expandedNotes.has(note.id);
                        const isLong = note.content.length > 150;
                        return (
                          <div
                            key={note.id}
                            className="p-2.5 rounded-lg bg-white/5 border border-white/5"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${noteTypeBadge[note.noteType] || 'bg-gray-500/20 text-gray-300'}`}
                              >
                                {note.noteType}
                              </span>
                              <span className="text-[10px] text-white/30">
                                {formatDateTime(note.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-white/70 whitespace-pre-wrap">
                              {isLong && !isExpanded
                                ? note.content.slice(0, 150) + '...'
                                : note.content}
                            </p>
                            {isLong && (
                              <button
                                onClick={() => toggleNote(note.id)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 mt-1"
                              >
                                {isExpanded ? 'Minder tonen' : 'Meer tonen'}
                              </button>
                            )}
                            <p className="text-[10px] text-white/30 mt-1">
                              {note.author.firstName} {note.author.lastName}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">Geen notities gevonden.</p>
                  )}
                </Section>

                {/* Rontgenfoto's */}
                <Section
                  title="R\u00f6ntgenfoto's"
                  icon={<ImageIcon className="h-4 w-4" />}
                  count={data.images.length}
                >
                  {data.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {data.images.map((img) => (
                        <div
                          key={img.id}
                          className="p-2.5 rounded-lg bg-white/5 border border-white/5"
                        >
                          <div className="w-full h-16 rounded bg-white/5 flex items-center justify-center mb-2">
                            <ImageIcon className="h-6 w-6 text-white/20" />
                          </div>
                          <p className="text-[10px] text-white/70 truncate">
                            {img.fileName}
                          </p>
                          <p className="text-[10px] text-white/30">
                            {formatDate(img.createdAt)}
                          </p>
                          {img.notes && (
                            <p className="text-[10px] text-white/40 truncate mt-0.5">
                              {img.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">
                      Geen r\u00f6ntgenfoto&apos;s gevonden.
                    </p>
                  )}
                </Section>

                {/* Parodontale Status */}
                <Section
                  title="Parodontale Status"
                  icon={<Activity className="h-4 w-4" />}
                >
                  {data.periodontalChart ? (
                    <div>
                      <p className="text-[10px] text-white/30 mb-2">
                        Laatste meting: {formatDate(data.periodontalChart.createdAt)}
                      </p>
                      <PeriodontalSummary
                        chartData={
                          data.periodontalChart.chartData as Record<string, unknown>
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">
                      Geen parodontale status beschikbaar.
                    </p>
                  )}
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
