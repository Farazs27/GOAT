'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Clock,
  User,
  X,
  Check,
  AlertCircle,
  Phone,
  ExternalLink,
  FileText,
  Stethoscope,
  History,
  Euro,
  Search,
  Trash2,
  Mail,
  Receipt,
  Maximize2,
  Minimize2,
  ArrowRight,
  Image as ImageIcon,
  AlertTriangle,
  Pill,
  Upload,
  ZoomIn,
  ChevronRight as NavRight,
} from 'lucide-react';

const Periodontogram = dynamic(() => import('@/components/Periodontogram'), { ssr: false });

interface PatientImage {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  imageType: string;
  notes: string | null;
  createdAt: string;
}

interface DeclarationLine {
  nzaCodeId?: string;
  code: string;
  description: string;
  toothNumber: string;
  unitPrice: string;
  quantity: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  patientNumber: string;
  medicalAlerts?: string[];
  medications?: string[];
}

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  appointmentType: string;
  status: string;
  room?: string;
  notes?: string;
  patientNotes?: string;
  patient: Patient;
  practitioner: Practitioner;
}

interface TreatmentPlan {
  id: string;
  title: string;
  status: string;
  totalEstimate: string | number | null;
  insuranceEstimate: string | number | null;
  patientEstimate: string | number | null;
  createdAt: string;
  treatments: {
    id: string;
    description: string;
    status: string;
    totalPrice: string | number | null;
    toothId: string | null;
    nzaCode: { code: string; description: string } | null;
    tooth: { toothNumber: number } | null;
  }[];
}

const planStatusLabels: Record<string, string> = {
  DRAFT: 'Concept', PROPOSED: 'Voorgesteld', ACCEPTED: 'Geaccepteerd',
  IN_PROGRESS: 'Bezig', COMPLETED: 'Afgerond', CANCELLED: 'Geannuleerd',
};

const planStatusColors: Record<string, string> = {
  DRAFT: 'bg-white/5 text-white/40 border-white/10',
  PROPOSED: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  ACCEPTED: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  CANCELLED: 'bg-white/5 text-white/30 border-white/10',
};

const treatmentStatusColors: Record<string, string> = {
  PLANNED: 'bg-white/5 text-white/40 border-white/10',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  CANCELLED: 'bg-white/5 text-white/30 border-white/10',
};

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
  HYGIENE: 'Mondhygiëne',
};

const typeColors: Record<string, string> = {
  CHECKUP: 'from-blue-400 to-blue-600',
  TREATMENT: 'from-purple-400 to-purple-600',
  EMERGENCY: 'from-red-400 to-red-600',
  CONSULTATION: 'from-amber-400 to-amber-600',
  HYGIENE: 'from-emerald-400 to-emerald-600',
};

const typeBadgeColors: Record<string, string> = {
  CHECKUP: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  TREATMENT: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
  EMERGENCY: 'bg-red-500/20 text-red-300 border-red-500/20',
  CONSULTATION: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  HYGIENE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
};

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Gepland',
  CONFIRMED: 'Bevestigd',
  CHECKED_IN: 'Ingecheckt',
  IN_PROGRESS: 'Bezig',
  COMPLETED: 'Afgerond',
  NO_SHOW: 'Niet verschenen',
  CANCELLED: 'Geannuleerd',
};

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-white/5 text-white/40 border-white/10',
  CONFIRMED: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  CHECKED_IN: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  NO_SHOW: 'bg-red-500/20 text-red-300 border-red-500/20',
  CANCELLED: 'bg-white/5 text-white/30 border-white/10',
};

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDutchDate(date: Date): string {
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Record<string, Appointment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [panelTab, setPanelTab] = useState<'afspraken' | 'behandelingen' | 'declaratie' | 'paro' | 'rontgen'>('afspraken');
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [notesSections, setNotesSections] = useState({ bevindingen: '', behandelplan: '', uitlegAfspraken: '', algemeen: '' });
  const [activeNoteTab, setActiveNoteTab] = useState<'bevindingen' | 'behandelplan' | 'uitlegAfspraken' | 'algemeen'>('bevindingen');
  const [notesSaved, setNotesSaved] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [declarationLines, setDeclarationLines] = useState<DeclarationLine[]>([]);
  const [allNzaCodes, setAllNzaCodes] = useState<any[]>([]);
  const [nzaSearchResults, setNzaSearchResults] = useState<any[]>([]);
  const [activeNzaLine, setActiveNzaLine] = useState<number | null>(null);
  const [invoiceCreated, setInvoiceCreated] = useState<string | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageModal, setImageModal] = useState<{ index: number } | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    practitionerId: '',
    startTime: '09:00',
    durationMinutes: 30,
    appointmentType: 'CHECKUP',
    room: '',
    notes: '',
  });

  const getWeekDays = (date: Date): Date[] => {
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      return dd;
    });
  };

  const fetchAppointments = async (date: Date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?date=${formatDate(date)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (res.ok) setAppointments(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchWeekAppointments = async (date: Date) => {
    setLoading(true);
    const days = getWeekDays(date);
    const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
    try {
      const results = await Promise.all(
        days.map(d => fetch(`/api/appointments?date=${formatDate(d)}`, { headers }).then(r => r.ok ? r.json() : []))
      );
      const map: Record<string, Appointment[]> = {};
      days.forEach((d, i) => { map[formatDate(d)] = results[i]; });
      setWeekAppointments(map);
    } catch {}
    setLoading(false);
  };

  const searchPatients = async (query: string) => {
    if (query.length < 2) { setPatients([]); return; }
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}&limit=5`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.data || []);
      }
    } catch {}
  };

  // Load all NZa codes once
  useEffect(() => {
    const loadNzaCodes = async () => {
      try {
        const res = await fetch('/api/nza-codes?limit=500', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        if (res.ok) setAllNzaCodes(await res.json());
      } catch {}
    };
    loadNzaCodes();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') fetchAppointments(selectedDate);
    else fetchWeekAppointments(selectedDate);
  }, [selectedDate, viewMode]);

  const navigateDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (viewMode === 'week' ? delta * 7 : delta));
    setSelectedDate(d);
  };

  const goToToday = () => setSelectedDate(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(selectedDate);
    const [h, m] = formData.startTime.split(':').map(Number);
    startDate.setHours(h, m, 0, 0);
    const endDate = new Date(startDate.getTime() + formData.durationMinutes * 60000);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          practitionerId: formData.practitionerId || '870c9965-8b5c-4501-a82b-7cce3bc5324e',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          durationMinutes: formData.durationMinutes,
          appointmentType: formData.appointmentType,
          room: formData.room || undefined,
          notes: formData.notes || undefined,
        }),
      });
      if (res.ok) {
        fetchAppointments(selectedDate);
        setShowForm(false);
        resetForm();
      }
    } catch {}
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedAppointment(updated);
      }
      fetchAppointments(selectedDate);
    } catch {}
  };

  useEffect(() => {
    if (selectedAppointment) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedAppointment]);

  const openPanel = async (a: Appointment) => {
    setSelectedAppointment(a);
    setPanelTab('afspraken');
    setPanelLoading(true);
    // Parse structured notes
    let parsed = { bevindingen: '', behandelplan: '', uitlegAfspraken: '', algemeen: '' };
    if (a.notes) {
      try {
        const j = JSON.parse(a.notes);
        if (j.bevindingen !== undefined) parsed = { ...parsed, ...j };
        else parsed.algemeen = a.notes;
      } catch { parsed.algemeen = a.notes; }
    }
    setNotesSections(parsed);
    setActiveNoteTab('bevindingen');
    setDeclarationLines([]);
    setInvoiceCreated(null);
    setSplitView(false);
    const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
    try {
      const [appts, plans, imgs] = await Promise.all([
        fetch(`/api/appointments?patientId=${a.patient.id}`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`/api/treatment-plans?patientId=${a.patient.id}`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`/api/patients/${a.patient.id}/images`, { headers }).then(r => r.ok ? r.json() : []),
      ]);
      setPatientAppointments(appts);
      setTreatmentPlans(plans);
      setPatientImages(imgs);
    } catch {}
    setPanelLoading(false);
  };

  const closePanel = () => {
    setSelectedAppointment(null);
    setPatientAppointments([]);
    setTreatmentPlans([]);
    setExpandedPlan(null);
    setDeclarationLines([]);
    setInvoiceCreated(null);
    setNotesSaved(false);
    setSplitView(false);
    setNotesExpanded(false);
    setPatientImages([]);
    setImageModal(null);
  };

  const saveNotes = async (sections?: typeof notesSections) => {
    if (!selectedAppointment) return;
    const data = sections || notesSections;
    try {
      await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ notes: JSON.stringify(data) }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {}
  };

  const searchNzaCodes = (query: string) => {
    if (!query) { setNzaSearchResults(allNzaCodes); return; }
    const q = query.toLowerCase();
    setNzaSearchResults(allNzaCodes.filter((nza: any) =>
      nza.code.toLowerCase().includes(q) ||
      (nza.descriptionNl || '').toLowerCase().includes(q)
    ));
  };

  const selectNzaForLine = (lineIndex: number, nza: any) => {
    const updated = [...declarationLines];
    updated[lineIndex] = { ...updated[lineIndex], nzaCodeId: nza.id, code: nza.code, description: nza.descriptionNl, unitPrice: String(nza.maxTariff) };
    setDeclarationLines(updated);
    setActiveNzaLine(null);
    setNzaSearchResults([]);
  };

  const addDeclarationLine = () => {
    setDeclarationLines([...declarationLines, { code: '', description: '', toothNumber: '', unitPrice: '', quantity: '1' }]);
  };

  const updateDeclarationLine = (i: number, field: string, value: string) => {
    const updated = [...declarationLines];
    (updated[i] as any)[field] = value;
    setDeclarationLines(updated);
  };

  const removeDeclarationLine = (i: number) => setDeclarationLines(declarationLines.filter((_, idx) => idx !== i));

  const syncPlanToDeclaration = (plan: TreatmentPlan) => {
    const lines: DeclarationLine[] = plan.treatments
      .filter(t => t.status !== 'CANCELLED')
      .map(t => ({
        nzaCodeId: undefined,
        code: t.nzaCode?.code || '',
        description: t.description || t.nzaCode?.description || '',
        toothNumber: t.tooth ? String(t.tooth.toothNumber) : '',
        unitPrice: t.totalPrice ? String(Number(t.totalPrice)) : '',
        quantity: '1',
      }));
    setDeclarationLines(lines);
    setPanelTab('declaratie');
    setSplitView(true);
  };

  const declarationTotal = declarationLines.reduce((sum, l) => sum + (parseFloat(l.unitPrice) || 0) * (parseInt(l.quantity) || 1), 0);

  const createInvoice = async (isDraft: boolean) => {
    if (!selectedAppointment || declarationLines.length === 0) return;
    const validLines = declarationLines.filter(l => l.description && l.unitPrice);
    if (validLines.length === 0) return;
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({
          patientId: selectedAppointment.patient.id,
          notes: isDraft ? 'Offerte' : undefined,
          lines: validLines.map(l => ({
            nzaCodeId: l.nzaCodeId || undefined,
            nzaCode: l.code || undefined,
            description: l.description,
            unitPrice: parseFloat(l.unitPrice),
            quantity: parseInt(l.quantity) || 1,
            toothNumber: l.toothNumber ? parseInt(l.toothNumber) : undefined,
          })),
        }),
      });
      if (res.ok) {
        const inv = await res.json();
        setInvoiceCreated(inv.invoiceNumber);
        if (!isDraft) {
          // Set to SENT
          await fetch(`/api/invoices/${inv.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
            body: JSON.stringify({ status: 'SENT' }),
          });
        }
      }
    } catch {}
  };

  const fetchPatientImages = async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/images`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (res.ok) setPatientImages(await res.json());
    } catch {}
  };

  const uploadImage = async (file: File, imageType: string = 'XRAY') => {
    if (!selectedAppointment) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', imageType);
      const res = await fetch(`/api/patients/${selectedAppointment.patient.id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: formData,
      });
      if (res.ok) fetchPatientImages(selectedAppointment.patient.id);
    } catch {}
    setImageUploading(false);
  };

  const deleteImage = async (imageId: string) => {
    if (!selectedAppointment) return;
    try {
      await fetch(`/api/patients/${selectedAppointment.patient.id}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      fetchPatientImages(selectedAppointment.patient.id);
      setImageModal(null);
    } catch {}
  };

  const resetForm = () => {
    setFormData({
      patientId: '', patientName: '', practitionerId: '',
      startTime: '09:00', durationMinutes: 30, appointmentType: 'CHECKUP',
      room: '', notes: '',
    });
    setPatientSearch('');
    setPatients([]);
  };

  const selectPatient = (p: Patient) => {
    setFormData({ ...formData, patientId: p.id, patientName: `${p.firstName} ${p.lastName}` });
    setPatientSearch(`${p.firstName} ${p.lastName}`);
    setPatients([]);
  };

  // Group appointments by time for the timeline
  const timeSlots = useMemo(() => {
    const slots: Record<string, Appointment[]> = {};
    appointments.forEach(a => {
      const t = new Date(a.startTime);
      const key = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
      if (!slots[key]) slots[key] = [];
      slots[key].push(a);
    });
    return slots;
  }, [appointments]);

  const isToday = formatDate(selectedDate) === formatDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Agenda</h2>
          <p className="text-white/50">
            {viewMode === 'day' ? formatDutchDate(selectedDate) : (() => {
              const days = getWeekDays(selectedDate);
              return `Week ${days[0].getDate()} - ${days[6].getDate()} ${['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'][days[6].getMonth()]} ${days[6].getFullYear()}`;
            })()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex glass rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('day')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'day' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
              Dag
            </button>
            <button onClick={() => setViewMode('week')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'week' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
              Week
            </button>
          </div>
          <button onClick={goToToday}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isToday ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' : 'glass text-white/60 hover:text-white hover:bg-white/10'}`}>
            Vandaag
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" /> Nieuwe afspraak
          </button>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigateDay(-1)}
          className="p-2 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-white/40" />
          <input type="date" value={formatDate(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="glass-input rounded-xl px-4 py-2 text-sm outline-none" />
        </div>
        <button onClick={() => navigateDay(1)}
          className="p-2 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="ml-auto flex items-center gap-2 text-sm text-white/40">
          <span className="font-medium text-white/90">
            {viewMode === 'day' ? appointments.length : Object.values(weekAppointments).reduce((s, a) => s + a.length, 0)}
          </span> afspraken
        </div>
      </div>

      {/* New appointment form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Nieuwe afspraak</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }}
              className="p-1 text-white/40 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <p className="text-xs text-white/40 mb-1">Patiënt *</p>
                <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                  placeholder="Zoek patiënt..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); searchPatients(e.target.value); }}
                  required={!formData.patientId} />
                {formData.patientId && (
                  <div className="absolute right-3 top-8">
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                )}
                {patients.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full glass-card rounded-xl overflow-hidden">
                    {patients.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => selectPatient(p)}
                        className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors">
                        {p.firstName} {p.lastName}
                        <span className="text-white/30 ml-2">{p.patientNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Type *</p>
                <select className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formData.appointmentType}
                  onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}>
                  <option value="CHECKUP">Controle</option>
                  <option value="TREATMENT">Behandeling</option>
                  <option value="HYGIENE">Mondhygiëne</option>
                  <option value="CONSULTATION">Consult</option>
                  <option value="EMERGENCY">Spoed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Tijd *</p>
                <input type="time" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Duur (min) *</p>
                <select className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Kamer</p>
                <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="bv. Kamer 1"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })} />
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Notities</p>
              <textarea className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none resize-none" rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={!formData.patientId}
                className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50">
                Inplannen
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
        </div>
      ) : viewMode === 'week' ? (
        /* Week view */
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/10">
            {getWeekDays(selectedDate).map((day, i) => {
              const dayStr = formatDate(day);
              const dayAppts = weekAppointments[dayStr] || [];
              const isDayToday = dayStr === formatDate(new Date());
              const shortDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
              return (
                <div key={i} className={`text-center py-3 border-r border-white/5 last:border-r-0 ${isDayToday ? 'bg-blue-500/10' : ''}`}>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{shortDays[i]}</p>
                  <p className={`text-lg font-bold ${isDayToday ? 'text-blue-300' : 'text-white/80'}`}>{day.getDate()}</p>
                  <p className="text-[10px] text-white/30">{dayAppts.length} afspr.</p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[400px]">
            {getWeekDays(selectedDate).map((day, i) => {
              const dayStr = formatDate(day);
              const dayAppts = weekAppointments[dayStr] || [];
              const isDayToday = dayStr === formatDate(new Date());
              return (
                <div key={i} className={`border-r border-white/5 last:border-r-0 p-1.5 space-y-1 ${isDayToday ? 'bg-blue-500/5' : ''}`}>
                  {dayAppts.length === 0 ? (
                    <div className="flex items-center justify-center h-20">
                      <span className="text-[10px] text-white/15">—</span>
                    </div>
                  ) : (
                    dayAppts.map(a => (
                      <button key={a.id} onClick={() => openPanel(a)}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-all"
                        style={{ backgroundColor: `rgba(${a.appointmentType === 'EMERGENCY' ? '239,68,68' : a.appointmentType === 'TREATMENT' ? '168,85,247' : a.appointmentType === 'HYGIENE' ? '34,197,94' : a.appointmentType === 'CONSULTATION' ? '245,158,11' : '96,165,250'}, 0.15)` }}>
                        <p className="text-[10px] font-mono text-white/50">
                          {new Date(a.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs font-medium text-white/80 truncate">
                          {a.patient.firstName} {a.patient.lastName[0]}.
                        </p>
                        <p className="text-[9px] text-white/35 truncate">{typeLabels[a.appointmentType]}</p>
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40">Geen afspraken voor deze dag</p>
          <p className="text-sm text-white/30 mt-1">Klik op &quot;Nieuwe afspraak&quot; om te beginnen</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {hours.map(hour => {
              const hourStr = `${String(hour).padStart(2, '0')}`;
              const slotsThisHour = Object.entries(timeSlots).filter(([key]) => key.startsWith(hourStr));
              const hasAppointments = slotsThisHour.length > 0;

              return (
                <div key={hour} className="flex min-h-[60px]">
                  {/* Time label */}
                  <div className="w-20 flex-shrink-0 p-3 text-right border-r border-white/5">
                    <span className={`text-sm font-mono ${hasAppointments ? 'text-white/60' : 'text-white/20'}`}>
                      {hourStr}:00
                    </span>
                  </div>
                  {/* Appointments */}
                  <div className="flex-1 p-2">
                    {slotsThisHour.length > 0 ? (
                      <div className="space-y-2">
                        {slotsThisHour.flatMap(([, apps]) => apps).map(a => (
                          <button key={a.id} onClick={() => openPanel(a)}
                            className="w-full text-left p-3 glass-light rounded-xl hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[a.appointmentType] || 'from-gray-400 to-gray-600'} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                <span className="text-[10px] font-bold text-white">
                                  {a.patient.firstName[0]}{a.patient.lastName[0]}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-white/90">
                                    {a.patient.firstName} {a.patient.lastName}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${statusColors[a.status]}`}>
                                    {statusLabels[a.status]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(a.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                    {' - '}
                                    {new Date(a.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${typeBadgeColors[a.appointmentType]}`}>
                                    {typeLabels[a.appointmentType]}
                                  </span>
                                  {a.room && <span>Kamer {a.room}</span>}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-out appointment detail panel */}
      {selectedAppointment && (
        <>
          <div className="fixed inset-0 z-50 glass-sidebar flex flex-col">
            {/* Panel header */}
            <div className="p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button onClick={closePanel}
                    className="p-1.5 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="text-lg font-semibold text-white">Afspraak details</h3>
                </div>
                <button onClick={closePanel}
                  className="p-1.5 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Patient + appointment info bar */}
              <div className="flex items-center gap-6 flex-wrap">
                {/* Patient */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[selectedAppointment.appointmentType]} flex items-center justify-center shadow-lg`}>
                    <span className="text-xs font-bold text-white">
                      {selectedAppointment.patient.firstName[0]}{selectedAppointment.patient.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span>{selectedAppointment.patient.patientNumber}</span>
                      {selectedAppointment.patient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedAppointment.patient.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/patients/${selectedAppointment.patient.id}`}
                    className="p-1.5 glass rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Patiënt openen">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-white/10" />

                {/* Appointment info chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 glass-light rounded-lg px-2.5 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-xs text-white/90">
                      {new Date(selectedAppointment.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(selectedAppointment.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-white/30">({selectedAppointment.durationMinutes}m)</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs border ${typeBadgeColors[selectedAppointment.appointmentType]}`}>
                    {typeLabels[selectedAppointment.appointmentType]}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs border ${statusColors[selectedAppointment.status]}`}>
                    {statusLabels[selectedAppointment.status]}
                  </span>
                  {selectedAppointment.room && (
                    <span className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-white/50 border border-white/10">
                      {selectedAppointment.room}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-white/10" />

                {/* Status actions */}
                <div className="flex items-center gap-2">
                  {selectedAppointment.status === 'SCHEDULED' && (
                    <>
                      <button onClick={() => updateStatus(selectedAppointment.id, 'CONFIRMED')}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors">
                        Bevestigen
                      </button>
                      <button onClick={() => updateStatus(selectedAppointment.id, 'CANCELLED')}
                        className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
                        Annuleren
                      </button>
                    </>
                  )}
                  {selectedAppointment.status === 'CONFIRMED' && (
                    <button onClick={() => updateStatus(selectedAppointment.id, 'CHECKED_IN')}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/30 transition-colors">
                      Inchecken
                    </button>
                  )}
                  {selectedAppointment.status === 'CHECKED_IN' && (
                    <button onClick={() => updateStatus(selectedAppointment.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-medium hover:bg-cyan-500/30 transition-colors">
                      Start behandeling
                    </button>
                  )}
                  {selectedAppointment.status === 'IN_PROGRESS' && (
                    <button onClick={() => updateStatus(selectedAppointment.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                      Afronden
                    </button>
                  )}
                  {['SCHEDULED', 'CONFIRMED'].includes(selectedAppointment.status) && (
                    <button onClick={() => updateStatus(selectedAppointment.id, 'NO_SHOW')}
                      className="px-3 py-1.5 bg-white/5 text-white/40 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
                      Niet verschenen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Medical alerts banner */}
            {((selectedAppointment.patient.medicalAlerts?.length ?? 0) > 0 || (selectedAppointment.patient.medications?.length ?? 0) > 0) && (
              <div className="mx-4 mt-2 flex gap-2 flex-wrap">
                {(selectedAppointment.patient.medicalAlerts?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-500/15 border border-red-500/30 rounded-xl text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-red-300 font-medium">Medische waarschuwingen:</span>
                    <span className="text-red-200">{selectedAppointment.patient.medicalAlerts!.join(', ')}</span>
                  </div>
                )}
                {(selectedAppointment.patient.medications?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs">
                    <Pill className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-amber-300 font-medium">Medicatie:</span>
                    <span className="text-amber-200">{selectedAppointment.patient.medications!.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-white/10 flex-shrink-0">
              <button onClick={() => { setPanelTab('afspraken'); setSplitView(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  panelTab === 'afspraken'
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/40 hover:text-white/60'
                }`}>
                <History className="h-4 w-4" />
                Afspraken ({patientAppointments.length})
              </button>
              <button onClick={() => { setPanelTab('behandelingen'); setSplitView(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  panelTab === 'behandelingen'
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/40 hover:text-white/60'
                }`}>
                <Stethoscope className="h-4 w-4" />
                Behandelingen
              </button>
              <button onClick={() => { setPanelTab('declaratie'); setSplitView(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  panelTab === 'declaratie'
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/40 hover:text-white/60'
                }`}>
                <Euro className="h-4 w-4" />
                Declaratie
              </button>
              <button onClick={() => { setPanelTab('paro'); setSplitView(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  panelTab === 'paro'
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/40 hover:text-white/60'
                }`}>
                <AlertCircle className="h-4 w-4" />
                Paro
              </button>
              <button onClick={() => { setPanelTab('rontgen'); setSplitView(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  panelTab === 'rontgen'
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/40 hover:text-white/60'
                }`}>
                <ImageIcon className="h-4 w-4" />
                Röntgen
              </button>
              <button onClick={() => { setNotesExpanded(true); }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  notesExpanded
                    ? 'text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/40 hover:text-white/60'
                }`}>
                <FileText className="h-4 w-4" />
                Notities
              </button>
            </div>

            {/* Notes expanded full-screen overlay */}
            {notesExpanded && (
              <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'linear-gradient(135deg, #1a1d2e, #16213e, #1a1a2e, #2d1b3d)' }}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold text-white">Klinische notities</h3>
                  <div className="flex items-center gap-2">
                    {notesSaved && <span className="text-xs text-emerald-400">Opgeslagen</span>}
                    <button onClick={() => setNotesExpanded(false)}
                      className="p-1.5 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                      <Minimize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-6 grid grid-cols-2 gap-4 min-h-0">
                  {([
                    ['bevindingen', 'Bevindingen', 'Klinische bevindingen van de tandarts...'],
                    ['behandelplan', 'Behandelplan', 'Behandelplan en vervolgstappen...'],
                    ['uitlegAfspraken', 'Uitleg & Afspraken', 'Uitleg aan patiënt en gemaakte afspraken...'],
                    ['algemeen', 'Algemeen', 'Algemene notities...'],
                  ] as const).map(([key, label, placeholder]) => (
                    <div key={key} className="glass-light rounded-2xl flex flex-col overflow-hidden min-h-0">
                      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">{label}</span>
                        {notesSections[key] && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                      </div>
                      <textarea
                        value={notesSections[key]}
                        onChange={(e) => setNotesSections({ ...notesSections, [key]: e.target.value })}
                        onBlur={() => saveNotes()}
                        placeholder={placeholder}
                        className="flex-1 w-full bg-transparent p-4 text-sm text-white/80 outline-none resize-none placeholder:text-white/20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main scrollable content */}
            <div className={`flex-1 overflow-y-auto overscroll-contain ${splitView ? 'flex' : ''}`}>
              {/* Main tab content */}
              <div className={`${splitView ? 'flex-1 overflow-y-auto border-r border-white/10' : ''} p-4`}>
              {panelLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
                </div>
              ) : panelTab === 'afspraken' ? (
                /* Past appointments tab */
                <div className="space-y-2">
                  {patientAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-white/15" />
                      <p className="text-sm text-white/30">Geen afspraken gevonden</p>
                    </div>
                  ) : (
                    patientAppointments.map(pa => {
                      const isCurrent = pa.id === selectedAppointment.id;
                      const date = new Date(pa.startTime);
                      return (
                        <div key={pa.id}
                          className={`p-3 rounded-xl transition-all ${
                            isCurrent
                              ? 'glass-card border border-blue-500/30 shadow-lg shadow-blue-500/10'
                              : 'glass-light hover:bg-white/5'
                          }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[pa.appointmentType] || 'from-gray-400 to-gray-600'} flex items-center justify-center flex-shrink-0 ${isCurrent ? 'shadow-lg' : ''}`}>
                              <span className="text-[9px] font-bold text-white">
                                {typeLabels[pa.appointmentType]?.[0] || '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white/70">
                                  {date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/20">
                                    Huidig
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-white/40">
                                  {date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {new Date(pa.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] border ${typeBadgeColors[pa.appointmentType]}`}>
                                  {typeLabels[pa.appointmentType]}
                                </span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] border flex-shrink-0 ${statusColors[pa.status]}`}>
                              {statusLabels[pa.status]}
                            </span>
                          </div>
                          {pa.notes && (
                            <p className="text-[11px] text-white/30 mt-2 pl-11 line-clamp-1">{pa.notes}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : panelTab === 'behandelingen' ? (
                /* Treatment plans tab */
                <div className="space-y-3">
                  {treatmentPlans.length === 0 ? (
                    <div className="text-center py-8">
                      <Stethoscope className="h-8 w-8 mx-auto mb-2 text-white/15" />
                      <p className="text-sm text-white/30">Geen behandelplannen gevonden</p>
                    </div>
                  ) : (
                    treatmentPlans.map(plan => {
                      const isExpanded = expandedPlan === plan.id;
                      const total = plan.totalEstimate ? Number(plan.totalEstimate) : 0;
                      return (
                        <div key={plan.id} className="glass-light rounded-xl overflow-hidden">
                          <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                            className="w-full text-left p-3 hover:bg-white/5 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                                  <FileText className="h-3.5 w-3.5 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white/90">{plan.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] border ${planStatusColors[plan.status]}`}>
                                      {planStatusLabels[plan.status] || plan.status}
                                    </span>
                                    <span className="text-[10px] text-white/30">
                                      {new Date(plan.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {total > 0 && (
                                  <span className="text-sm font-medium text-white/60">
                                    €{total.toFixed(2)}
                                  </span>
                                )}
                                <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </button>

                          {isExpanded && plan.treatments && plan.treatments.length > 0 && (
                            <div className="border-t border-white/5 px-3 pb-3">
                              <div className="space-y-1.5 mt-2">
                                {plan.treatments.map(t => (
                                  <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        {t.nzaCode && (
                                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-white/40 flex-shrink-0">
                                            {t.nzaCode.code}
                                          </span>
                                        )}
                                        <span className="text-xs text-white/70 truncate">
                                          {t.description || t.nzaCode?.description || '—'}
                                        </span>
                                      </div>
                                      {t.tooth && (
                                        <p className="text-[10px] text-white/30 mt-0.5">Element {t.tooth.toothNumber}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] border ${treatmentStatusColors[t.status]}`}>
                                        {t.status === 'PLANNED' ? 'Gepland' : t.status === 'COMPLETED' ? 'Klaar' : t.status === 'IN_PROGRESS' ? 'Bezig' : 'Geann.'}
                                      </span>
                                      {t.totalPrice && (
                                        <span className="text-[11px] text-white/40 w-16 text-right">
                                          €{Number(t.totalPrice).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {/* Plan totals */}
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                                <span className="text-[10px] text-white/30 uppercase tracking-wider">Totaal</span>
                                <div className="flex items-center gap-4 text-xs">
                                  {plan.insuranceEstimate && Number(plan.insuranceEstimate) > 0 && (
                                    <span className="text-white/30">
                                      Verz: €{Number(plan.insuranceEstimate).toFixed(2)}
                                    </span>
                                  )}
                                  {plan.patientEstimate && Number(plan.patientEstimate) > 0 && (
                                    <span className="text-white/30">
                                      Eigen: €{Number(plan.patientEstimate).toFixed(2)}
                                    </span>
                                  )}
                                  <span className="font-medium text-white/70">
                                    €{total.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              {/* Declare button */}
                              <button onClick={() => syncPlanToDeclaration(plan)}
                                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-xs font-medium transition-colors">
                                <ArrowRight className="h-3.5 w-3.5" />
                                Declareren / Offerte
                              </button>
                            </div>
                          )}

                          {isExpanded && (!plan.treatments || plan.treatments.length === 0) && (
                            <div className="border-t border-white/5 p-3">
                              <p className="text-xs text-white/30 text-center">Geen behandelingen in dit plan</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : panelTab === 'declaratie' ? (
                /* Declaratie tab */
                <div className="space-y-4">
                  {invoiceCreated ? (
                    <div className="glass-light rounded-xl p-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                        <Check className="h-6 w-6 text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-white/90">Factuur aangemaakt</p>
                      <p className="text-lg font-bold text-emerald-400 mt-1">{invoiceCreated}</p>
                      <p className="text-xs text-white/40 mt-2">Bekijk in Facturatie overzicht</p>
                      <button onClick={() => setInvoiceCreated(null)}
                        className="mt-3 px-3 py-1.5 glass rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        Nieuwe declaratie
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Verrichtingen</p>
                        <button onClick={addDeclarationLine}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          + Regel toevoegen
                        </button>
                      </div>

                      {declarationLines.length === 0 ? (
                        <div className="text-center py-8">
                          <Receipt className="h-8 w-8 mx-auto mb-2 text-white/15" />
                          <p className="text-sm text-white/30">Nog geen verrichtingen</p>
                          <button onClick={addDeclarationLine}
                            className="mt-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors">
                            Verrichting toevoegen
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {declarationLines.map((line, i) => (
                            <div key={i} className="glass-light rounded-xl p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                {/* NZa code search */}
                                <div className="relative w-24 flex-shrink-0">
                                  <input
                                    placeholder="Code"
                                    value={line.code}
                                    onChange={(e) => {
                                      updateDeclarationLine(i, 'code', e.target.value);
                                      setActiveNzaLine(i);
                                      searchNzaCodes(e.target.value);
                                    }}
                                    onFocus={() => { setActiveNzaLine(i); searchNzaCodes(line.code); }}
                                    onBlur={() => setTimeout(() => setActiveNzaLine(null), 200)}
                                    className="w-full bg-white/5 rounded-lg px-2.5 py-1.5 text-xs font-mono text-blue-300 outline-none border border-white/10 focus:border-blue-500/30"
                                  />
                                  {activeNzaLine === i && nzaSearchResults.length > 0 && (
                                    <div className="absolute z-50 mt-1 left-0 w-80 rounded-xl border border-white/10 max-h-64 overflow-y-auto shadow-2xl" style={{ background: '#1e2235' }}>
                                      {nzaSearchResults.map((nza: any) => (
                                        <button key={nza.id}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => selectNzaForLine(i, nza)}
                                          className="w-full text-left px-3 py-1.5 hover:bg-blue-500/20 transition-colors flex items-center justify-between gap-2 border-b border-white/5 last:border-0">
                                          <span className="font-mono text-[11px] text-blue-300 font-medium w-10 flex-shrink-0">{nza.code}</span>
                                          <span className="text-[11px] text-white/60 truncate flex-1">{nza.descriptionNl}</span>
                                          <span className="text-[10px] text-white/30 flex-shrink-0">€{Number(nza.maxTariff).toFixed(2)}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* Description */}
                                <input
                                  placeholder="Omschrijving"
                                  value={line.description}
                                  onChange={(e) => updateDeclarationLine(i, 'description', e.target.value)}
                                  className="flex-1 bg-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white/70 outline-none border border-white/10 focus:border-blue-500/30"
                                />
                                <button onClick={() => removeDeclarationLine(i)}
                                  className="p-1.5 text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 pl-0">
                                <div className="w-16">
                                  <input
                                    placeholder="Elem."
                                    value={line.toothNumber}
                                    onChange={(e) => updateDeclarationLine(i, 'toothNumber', e.target.value)}
                                    className="w-full bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50 outline-none border border-white/10"
                                  />
                                </div>
                                <div className="w-12">
                                  <input
                                    placeholder="Qty"
                                    value={line.quantity}
                                    onChange={(e) => updateDeclarationLine(i, 'quantity', e.target.value)}
                                    className="w-full bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50 outline-none border border-white/10 text-center"
                                  />
                                </div>
                                <div className="w-20">
                                  <input
                                    placeholder="Prijs"
                                    value={line.unitPrice}
                                    onChange={(e) => updateDeclarationLine(i, 'unitPrice', e.target.value)}
                                    className="w-full bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50 outline-none border border-white/10 text-right"
                                  />
                                </div>
                                <span className="text-xs text-white/40 w-20 text-right">
                                  €{((parseFloat(line.unitPrice) || 0) * (parseInt(line.quantity) || 1)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Running total */}
                      {declarationLines.length > 0 && (
                        <div className="glass-light rounded-xl p-3 flex items-center justify-between">
                          <span className="text-xs text-white/40 uppercase tracking-wider">Totaal</span>
                          <span className="text-lg font-bold text-white/90">
                            €{declarationTotal.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      {declarationLines.length > 0 && (
                        <div className="space-y-2">
                          <button onClick={() => createInvoice(false)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all">
                            <Receipt className="h-4 w-4" />
                            Factuur aanmaken
                          </button>
                          <div className="flex gap-2">
                            <button onClick={() => createInvoice(true)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 glass rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all">
                              <FileText className="h-3.5 w-3.5" />
                              Offerte maken
                            </button>
                            <button disabled
                              title="Binnenkort beschikbaar"
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 glass rounded-xl text-xs text-white/20 cursor-not-allowed">
                              <Mail className="h-3.5 w-3.5" />
                              E-mail versturen
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : panelTab === 'paro' ? (
                /* Periodontogram tab */
                <div>
                  {selectedAppointment && (
                    <Periodontogram
                      patientId={selectedAppointment.patient.id}
                      appointmentId={selectedAppointment.id}
                    />
                  )}
                </div>
              ) : panelTab === 'rontgen' ? (
                /* Rontgen / X-ray tab */
                <div className="space-y-4">
                  {/* Actions bar */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        if (selectedAppointment) {
                          window.open(`visiquick://patient/${selectedAppointment.patient.id}`, '_self');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Openen in VisiQuick
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {imageUploading ? 'Uploaden...' : 'Afbeelding uploaden'}
                      <input
                        type="file"
                        accept="image/*,.dcm,.dicom"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {/* Image grid */}
                  {patientImages.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 text-white/15" />
                      <p className="text-sm text-white/30">Geen röntgenfoto&apos;s gevonden</p>
                      <p className="text-xs text-white/20 mt-1">Upload een afbeelding of open VisiQuick</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {patientImages.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setImageModal({ index: idx })}
                          className="group rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all bg-black/20"
                        >
                          <div className="aspect-square relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/patients/${selectedAppointment?.patient.id}/images/${img.id}/file`}
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
                                {img.imageType === 'XRAY' ? 'Röntgen' : img.imageType === 'INTRAORAL' ? 'Intraoraal' : img.imageType === 'EXTRAORAL' ? 'Extraoraal' : 'Overig'}
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
                          onClick={(e) => { e.stopPropagation(); deleteImage(patientImages[imageModal.index].id); }}
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
                      {/* Prev */}
                      {imageModal.index > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setImageModal({ index: imageModal.index - 1 }); }}
                          className="absolute left-4 p-3 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                      )}
                      {/* Next */}
                      {imageModal.index < patientImages.length - 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setImageModal({ index: imageModal.index + 1 }); }}
                          className="absolute right-4 p-3 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"
                        >
                          <NavRight className="h-6 w-6" />
                        </button>
                      )}
                      {/* Image */}
                      <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/patients/${selectedAppointment?.patient.id}/images/${patientImages[imageModal.index].id}/file`}
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
              ) : null}
              </div>

              {/* Split view: Declaratie right panel */}
              {splitView && (
                <div className="w-[420px] flex-shrink-0 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Declaratie</p>
                    <div className="flex items-center gap-2">
                      <button onClick={addDeclarationLine}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        + Regel
                      </button>
                      <button onClick={() => setSplitView(false)}
                        className="p-1 text-white/30 hover:text-white/60 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {declarationLines.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-8 w-8 mx-auto mb-2 text-white/15" />
                      <p className="text-sm text-white/30">Geen verrichtingen</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {declarationLines.map((line, i) => (
                        <div key={i} className="glass-light rounded-xl p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="relative w-20 flex-shrink-0">
                              <input placeholder="Code" value={line.code}
                                onChange={(e) => { updateDeclarationLine(i, 'code', e.target.value); setActiveNzaLine(i); searchNzaCodes(e.target.value); }}
                                onFocus={() => { setActiveNzaLine(i); searchNzaCodes(line.code); }}
                                onBlur={() => setTimeout(() => setActiveNzaLine(null), 200)}
                                className="w-full bg-white/5 rounded-lg px-2 py-1.5 text-xs font-mono text-blue-300 outline-none border border-white/10 focus:border-blue-500/30" />
                              {activeNzaLine === i && nzaSearchResults.length > 0 && (
                                <div className="absolute z-50 mt-1 left-0 w-80 rounded-xl border border-white/10 max-h-64 overflow-y-auto shadow-2xl" style={{ background: '#1e2235' }}>
                                  {nzaSearchResults.map((nza: any) => (
                                    <button key={nza.id} onMouseDown={(e) => e.preventDefault()} onClick={() => selectNzaForLine(i, nza)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-blue-500/20 transition-colors flex items-center justify-between gap-2 border-b border-white/5 last:border-0">
                                      <span className="font-mono text-[11px] text-blue-300 font-medium w-10 flex-shrink-0">{nza.code}</span>
                                      <span className="text-[11px] text-white/60 truncate flex-1">{nza.descriptionNl}</span>
                                      <span className="text-[10px] text-white/30 flex-shrink-0">€{Number(nza.maxTariff).toFixed(2)}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <input placeholder="Omschrijving" value={line.description}
                              onChange={(e) => updateDeclarationLine(i, 'description', e.target.value)}
                              className="flex-1 bg-white/5 rounded-lg px-2 py-1.5 text-xs text-white/70 outline-none border border-white/10 focus:border-blue-500/30" />
                            <button onClick={() => removeDeclarationLine(i)}
                              className="p-1.5 text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input placeholder="Elem." value={line.toothNumber}
                              onChange={(e) => updateDeclarationLine(i, 'toothNumber', e.target.value)}
                              className="w-14 bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50 outline-none border border-white/10" />
                            <input placeholder="Qty" value={line.quantity}
                              onChange={(e) => updateDeclarationLine(i, 'quantity', e.target.value)}
                              className="w-10 bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50 outline-none border border-white/10 text-center" />
                            <input placeholder="Prijs" value={line.unitPrice}
                              onChange={(e) => updateDeclarationLine(i, 'unitPrice', e.target.value)}
                              className="w-16 bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50 outline-none border border-white/10 text-right" />
                            <span className="text-xs text-white/40 flex-1 text-right">
                              €{((parseFloat(line.unitPrice) || 0) * (parseInt(line.quantity) || 1)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {declarationLines.length > 0 && (
                    <>
                      <div className="glass-light rounded-xl p-3 flex items-center justify-between">
                        <span className="text-xs text-white/40 uppercase tracking-wider">Totaal</span>
                        <span className="text-lg font-bold text-white/90">€{declarationTotal.toFixed(2)}</span>
                      </div>
                      <div className="space-y-2">
                        <button onClick={() => createInvoice(false)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all">
                          <Receipt className="h-4 w-4" />
                          Factuur aanmaken
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => createInvoice(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 glass rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all">
                            <FileText className="h-3.5 w-3.5" />
                            Offerte maken
                          </button>
                          <button disabled title="Binnenkort beschikbaar"
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 glass rounded-xl text-xs text-white/20 cursor-not-allowed">
                            <Mail className="h-3.5 w-3.5" />
                            E-mail
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {invoiceCreated && (
                    <div className="glass-light rounded-xl p-4 text-center">
                      <Check className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-white/90">Factuur {invoiceCreated}</p>
                      <button onClick={() => setInvoiceCreated(null)}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300">Nieuwe declaratie</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
