'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, Search, Plus, Trash2, Check, CheckCircle2, Loader2, Calendar, ClipboardList, Send, Sparkles, Bot } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

// Dynamic import for 3D tooth chart (no SSR)
const DentalArch3D = dynamic(
  () => import('@/components/odontogram/three/dental-arch-3d').then(mod => ({ default: mod.default })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#DCC3A5] border-t-transparent" /></div> }
);

// ─── Types ──────────────────────────────────────────────────────────────────

interface NzaCode {
  id: string;
  code: string;
  descriptionNl: string;
  maxTariff: string;
  points?: string;
  toelichting?: string;
  requiresTooth: boolean;
}

interface NzaSubcategory {
  name: string;
  codes: NzaCode[];
}

interface NzaCategory {
  code: string;
  name: string;
  subcategories: NzaSubcategory[];
}

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  specialization?: string;
}

interface TreatmentEntry {
  id: string; // temp ID for UI
  diagnosis: string;
  description: string;
  toothNumbers: number[];
  nzaCodeId: string | null;
  nzaCode: string;
  nzaDescription: string;
  unitPrice: number;
  performedById: string;
  performerName: string;
  notes: string;
  followUp: string;
}

interface CreatedPlan {
  id: string;
  title: string;
  totalEstimate: string | null;
}

interface TreatmentSuggestion {
  id: string;
  nzaCode: string;
  nzaCodeId: string;
  description: string;
  toothNumbers: number[];
  unitPrice: number;
  quantity: number;
  reasoning: string;
  confidence: 'high' | 'medium';
  isCompanion: boolean;
  corrected: boolean;
  corrections: string[];
  added?: boolean;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  suggestions?: TreatmentSuggestion[];
}

interface Props {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSaved: () => void;
}

// ─── Category Definitions ───────────────────────────────────────────────────

const TREATMENT_CATEGORIES = [
  { id: 'restauratief', label: 'Restauratief', keywords: ['restaur', 'vulling', 'filling', 'kroon', 'crown', 'brug', 'bridge', 'inlay', 'onlay'] },
  { id: 'cosmetisch', label: 'Cosmetisch', keywords: ['cosmet', 'esthet', 'bleach', 'bleken', 'veneer', 'facet'] },
  { id: 'implantologie', label: 'Implantologie', keywords: ['implant', 'implanto'] },
  { id: 'parodontologie', label: 'Parodontologie', keywords: ['parodont', 'perio', 'pocket', 'scaling'] },
  { id: 'endodontologie', label: 'Endodontologie', keywords: ['endodont', 'wortel', 'root', 'canal', 'pulp'] },
  { id: 'gebitsreiniging', label: 'Gebitsreiniging', keywords: ['reinig', 'hygien', 'tandsteen', 'scaling', 'polish', 'profylax'] },
  { id: 'controle', label: 'Controle', keywords: ['controle', 'consult', 'onderzoek', 'examin', 'check'] },
  { id: 'multidisciplinair', label: 'Multidisciplinair', keywords: ['multi', 'interdiscip', 'overleg', 'verwij'] },
  { id: 'kindertandheelkunde', label: 'Kindertandheelkunde', keywords: ['kinder', 'pediatr', 'melk', 'primair'] },
  { id: 'prothetiek', label: 'Prothetiek', keywords: ['prothet', 'prothese', 'denture', 'gebit', 'frame'] },
  { id: 'chirurgie', label: 'Chirurgie', keywords: ['chirurg', 'extract', 'operatie', 'surgical', 'heelkund'] },
] as const;

const CATEGORY_IMAGES: Record<string, string> = {
  restauratief: '/images/treatments/restauratief.png',
  implantologie: '/images/treatments/implantologie.png',
  endodontologie: '/images/treatments/endodontologie.png',
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TreatmentPlanOverlay({ patientId, patientName, onClose, onSaved }: Props) {
  // Data
  const [nzaCategories, setNzaCategories] = useState<NzaCategory[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Right panel
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [codeSearch, setCodeSearch] = useState('');

  // Middle panel - teeth
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);

  // Left panel - form
  const [diagnosis, setDiagnosis] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNza, setSelectedNza] = useState<NzaCode | null>(null);
  const [unitPrice, setUnitPrice] = useState('');
  const [performedById, setPerformedById] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [bookingType, setBookingType] = useState('CHECKUP');
  const [bookingNotes, setBookingNotes] = useState('');

  // AI Chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Queue
  const [queue, setQueue] = useState<TreatmentEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [createdPlans, setCreatedPlans] = useState<CreatedPlan[]>([]);

  // Load data
  useEffect(() => {
    Promise.all([
      authFetch('/api/nza-codes?grouped=true&all=true').then(r => r.ok ? r.json() : { categories: [] }),
      authFetch('/api/users?role=DENTIST&isActive=true&limit=50').then(r => r.ok ? r.json() : { data: [] }),
      authFetch('/api/users?role=HYGIENIST&isActive=true&limit=50').then(r => r.ok ? r.json() : { data: [] }),
    ]).then(([nzaData, dentists, hygienists]) => {
      setNzaCategories(nzaData.categories || []);
      const allPractitioners = [...(dentists.data || []), ...(hygienists.data || [])];
      setPractitioners(allPractitioners);
      // Get current user from token
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(payload.userId || payload.id || '');
          setPerformedById(payload.userId || payload.id || '');
        }
      } catch { /* ignore */ }
    }).finally(() => setLoadingData(false));
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ─── Category → NZA mapping ───────────────────────────────────────────────

  const getCategoryNzaCodes = useCallback((categoryId: string): NzaCode[] => {
    const category = TREATMENT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return [];

    const codes: NzaCode[] = [];
    for (const cat of nzaCategories) {
      for (const sub of cat.subcategories) {
        for (const code of sub.codes) {
          const text = `${cat.name} ${sub.name} ${code.descriptionNl} ${code.code}`.toLowerCase();
          if (category.keywords.some(kw => text.includes(kw))) {
            codes.push(code);
          }
        }
      }
    }
    // Also match by NZA category name
    for (const cat of nzaCategories) {
      const catNameLower = cat.name.toLowerCase();
      if (category.keywords.some(kw => catNameLower.includes(kw))) {
        for (const sub of cat.subcategories) {
          for (const code of sub.codes) {
            if (!codes.find(c => c.id === code.id)) {
              codes.push(code);
            }
          }
        }
      }
    }
    return codes;
  }, [nzaCategories]);

  const filteredCodes = useMemo(() => {
    if (!selectedCategory) return [];
    const codes = getCategoryNzaCodes(selectedCategory);
    if (!codeSearch) return codes;
    const q = codeSearch.toLowerCase();
    return codes.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.descriptionNl.toLowerCase().includes(q)
    );
  }, [selectedCategory, codeSearch, getCategoryNzaCodes]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToothSelect = useCallback((toothNumber: number) => {
    setSelectedTeeth(prev =>
      prev.includes(toothNumber)
        ? prev.filter(t => t !== toothNumber)
        : [...prev, toothNumber].sort((a, b) => a - b)
    );
  }, []);

  const handleCodeSelect = (code: NzaCode) => {
    // Directly add to queue for quick multi-treatment entry
    const performer = practitioners.find(p => p.id === performedById);
    const entry: TreatmentEntry = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      diagnosis,
      description: code.descriptionNl,
      toothNumbers: [...selectedTeeth],
      nzaCodeId: code.id,
      nzaCode: code.code,
      nzaDescription: code.descriptionNl,
      unitPrice: Number(code.maxTariff) || 0,
      performedById,
      performerName: performer ? `${performer.firstName} ${performer.lastName}` : '',
      notes: '',
      followUp: '',
    };
    setQueue(prev => [...prev, entry]);
  };

  const handleAddToQueue = () => {
    if (!description.trim()) return;
    const performer = practitioners.find(p => p.id === performedById);
    const entry: TreatmentEntry = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      diagnosis,
      description: description.trim(),
      toothNumbers: [...selectedTeeth],
      nzaCodeId: selectedNza?.id || null,
      nzaCode: selectedNza?.code || '',
      nzaDescription: selectedNza?.descriptionNl || '',
      unitPrice: parseFloat(unitPrice) || 0,
      performedById,
      performerName: performer ? `${performer.firstName} ${performer.lastName}` : '',
      notes,
      followUp,
    };
    setQueue(prev => [...prev, entry]);
    // Reset form
    setDiagnosis('');
    setDescription('');
    setSelectedNza(null);
    setUnitPrice('');
    setNotes('');
    setFollowUp('');
    setSelectedTeeth([]);
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = async () => {
    if (queue.length === 0) return;
    setSaving(true);
    const created: CreatedPlan[] = [];

    try {
      for (const entry of queue) {
        // 1. Create treatment plan
        const planRes = await authFetch('/api/treatment-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            title: entry.description,
            description: entry.diagnosis || null,
          }),
        });
        if (!planRes.ok) continue;
        const plan = await planRes.json();

        // 2. Create treatment(s) — one per tooth or a single one if no teeth
        const toothCount = Math.max(entry.toothNumbers.length, 1);
        const combinedNotes = [entry.notes, entry.followUp ? `Follow-up: ${entry.followUp}` : ''].filter(Boolean).join('\n\n') || null;

        await authFetch(`/api/treatment-plans/${plan.id}/treatments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: `${entry.description}${entry.toothNumbers.length > 0 ? ` (elementen: ${entry.toothNumbers.join(', ')})` : ''}`,
            nzaCodeId: entry.nzaCodeId,
            quantity: toothCount,
            notes: combinedNotes,
          }),
        });

        created.push({
          id: plan.id,
          title: plan.title,
          totalEstimate: plan.totalEstimate,
        });
      }

      // Create follow-up appointment if booked
      if (bookingDate) {
        const startTime = new Date(`${bookingDate}T${bookingTime}`);
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 min default
        await authFetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            practitionerId: performedById || currentUserId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            appointmentType: bookingType,
            notes: bookingNotes || `Follow-up: ${queue.map(e => e.description).join(', ')}`,
          }),
        }).catch(err => console.error('Failed to create follow-up appointment', err));
      }

      setCreatedPlans(created);
      setShowSummary(true);
    } catch (err) {
      console.error('Failed to save treatments', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const history = chatMessages.slice(-6).map(m => ({
        role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
        content: m.text,
        suggestions: m.suggestions,
      }));
      const res = await authFetch('/api/ai/treatment-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history,
          context: { selectedTeeth, performerId: performedById },
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: data.response || 'Geen antwoord ontvangen.',
        suggestions: data.suggestions || [],
      }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Er is een fout opgetreden. Probeer het opnieuw.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddFromAI = (messageIndex: number, suggestion: TreatmentSuggestion) => {
    // Find the NZA code in loaded categories to get full data
    let nzaCodeObj: NzaCode | null = null;
    for (const cat of nzaCategories) {
      for (const sub of cat.subcategories) {
        const found = sub.codes.find(c => c.code === suggestion.nzaCode);
        if (found) { nzaCodeObj = found; break; }
      }
      if (nzaCodeObj) break;
    }

    // Get the companion suggestions for this group
    const msg = chatMessages[messageIndex];
    const mainSuggestions = msg?.suggestions?.filter(s => !s.isCompanion && s.id === suggestion.id) || [suggestion];
    const companionSuggestions = msg?.suggestions?.filter(s => s.isCompanion && !s.added) || [];
    const allToAdd = [...mainSuggestions, ...companionSuggestions];

    const newEntries: TreatmentEntry[] = allToAdd.map(s => {
      const performer = practitioners.find(p => p.id === performedById);
      return {
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        diagnosis: '',
        description: s.description,
        toothNumbers: s.toothNumbers,
        nzaCodeId: s.nzaCodeId || nzaCodeObj?.id || null,
        nzaCode: s.nzaCode,
        nzaDescription: s.description,
        unitPrice: s.unitPrice,
        performedById,
        performerName: performer ? `${performer.firstName} ${performer.lastName}` : '',
        notes: s.reasoning,
        followUp: '',
      };
    });

    setQueue(prev => [...prev, ...newEntries]);

    // Select teeth in 3D chart
    if (suggestion.toothNumbers.length > 0) {
      setSelectedTeeth(prev => {
        const merged = new Set([...prev, ...suggestion.toothNumbers]);
        return Array.from(merged).sort((a, b) => a - b);
      });
    }

    // Mark suggestion as added
    setChatMessages(prev => prev.map((msg, i) => {
      if (i !== messageIndex || !msg.suggestions) return msg;
      return {
        ...msg,
        suggestions: msg.suggestions.map(s =>
          (s.id === suggestion.id || (s.isCompanion && !s.added))
            ? { ...s, added: true }
            : s
        ),
      };
    }));
  };

  const handleAddAllFromAI = (messageIndex: number) => {
    const msg = chatMessages[messageIndex];
    if (!msg?.suggestions) return;
    const mainSuggestions = msg.suggestions.filter(s => !s.isCompanion && !s.added);
    for (const s of mainSuggestions) {
      handleAddFromAI(messageIndex, s);
    }
  };

  const handleDismissSuggestion = (messageIndex: number, suggestionId: string) => {
    setChatMessages(prev => prev.map((msg, i) => {
      if (i !== messageIndex || !msg.suggestions) return msg;
      return {
        ...msg,
        suggestions: msg.suggestions.filter(s => s.id !== suggestionId),
      };
    }));
  };

  const totalPrice = queue.reduce((sum, e) => sum + (e.unitPrice * Math.max(e.toothNumbers.length, 1)), 0);

  // ─── Portal wrapper ──────────────────────────────────────────────────────
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  // ─── Summary View ─────────────────────────────────────────────────────────

  if (showSummary) {
    const content = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(14,12,10,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="w-full max-w-lg p-8 rounded-3xl border border-white/[0.08]" style={{ background: 'rgba(30,26,22,0.95)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'rgba(245,230,211,0.95)' }}>Behandelplannen opgeslagen</h2>
              <p className="text-sm" style={{ color: 'rgba(234,216,192,0.4)' }}>{createdPlans.length} plan(nen) aangemaakt</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {createdPlans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-sm" style={{ color: 'rgba(245,230,211,0.85)' }}>{plan.title}</span>
                {plan.totalEstimate && (
                  <span className="text-sm font-medium" style={{ color: '#DCC3A5' }}>
                    &euro;{Number(plan.totalEstimate).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => { onSaved(); onClose(); }}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: '#DCC3A5', color: '#1a1410' }}
          >
            Sluiten
          </button>
        </div>
      </div>
    );
    return portalTarget ? createPortal(content, portalTarget) : content;
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loadingData) {
    const content = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(14,12,10,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#DCC3A5] border-t-transparent" />
      </div>
    );
    return portalTarget ? createPortal(content, portalTarget) : content;
  }

  // ─── Main Overlay ─────────────────────────────────────────────────────────

  const content = (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: 'rgba(14,12,10,0.95)', backdropFilter: 'blur(40px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'rgba(245,230,211,0.95)' }}>Nieuw behandelplan</h1>
          <p className="text-sm" style={{ color: 'rgba(234,216,192,0.4)' }}>{patientName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
          style={{ color: 'rgba(234,216,192,0.4)' }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 3-Panel Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — Form */}
        <div className="w-[280px] border-r border-white/[0.08] overflow-y-auto p-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(234,216,192,0.5)' }}>
            Behandeling
          </h3>

          <div className="space-y-3">
            {/* Diagnose */}
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: 'rgba(234,216,192,0.35)' }}>Diagnose</label>
              <textarea
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="Diagnose en bevindingen..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 outline-none transition-all resize-none min-h-[60px]"
                style={{ color: 'rgba(245,230,211,0.9)' }}
              />
            </div>

            {/* Beschrijving */}
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: 'rgba(234,216,192,0.35)' }}>Beschrijving</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Behandeling omschrijving..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 outline-none transition-all resize-none min-h-[60px]"
                style={{ color: 'rgba(245,230,211,0.9)' }}
              />
            </div>

            {/* NZA code badge */}
            {selectedNza && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/20">
                  {selectedNza.code}
                </span>
                <span className="text-[11px] truncate" style={{ color: 'rgba(234,216,192,0.5)' }}>
                  {selectedNza.descriptionNl}
                </span>
                <button onClick={() => { setSelectedNza(null); setDescription(''); setUnitPrice(''); }} className="ml-auto p-1 rounded hover:bg-white/5">
                  <X className="h-3 w-3" style={{ color: 'rgba(234,216,192,0.3)' }} />
                </button>
              </div>
            )}

            {/* Prijs */}
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: 'rgba(234,216,192,0.35)' }}>Prijs (&euro;)</label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 outline-none transition-all"
                style={{ color: 'rgba(245,230,211,0.9)' }}
              />
            </div>

            {/* Behandelaar */}
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: 'rgba(234,216,192,0.35)' }}>Behandelaar</label>
              <select
                value={performedById}
                onChange={e => setPerformedById(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] focus:border-[#DCC3A5]/40 outline-none transition-all"
                style={{ color: 'rgba(245,230,211,0.9)' }}
              >
                <option value="">Selecteer behandelaar</option>
                {practitioners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} {p.specialization ? `(${p.specialization})` : `(${p.role})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected teeth */}
            {selectedTeeth.length > 0 && (
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: 'rgba(234,216,192,0.35)' }}>Elementen</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTeeth.map(t => (
                    <button
                      key={t}
                      onClick={() => handleToothSelect(t)}
                      className="px-2 py-1 rounded-lg text-[11px] font-mono border border-blue-500/30 bg-blue-500/15 text-blue-300 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notities */}
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: 'rgba(234,216,192,0.35)' }}>Notities</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Aanvullende notities..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 outline-none transition-all resize-none min-h-[50px]"
                style={{ color: 'rgba(245,230,211,0.9)' }}
              />
            </div>

            {/* Follow-up */}
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: 'rgba(234,216,192,0.35)' }}>Follow-up</label>
              <textarea
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                placeholder="Vervolgafspraken en instructies..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 outline-none transition-all resize-none min-h-[50px]"
                style={{ color: 'rgba(245,230,211,0.9)' }}
              />
            </div>

            {/* Book follow-up appointment */}
            <button
              type="button"
              onClick={() => setShowBooking(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-medium border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] transition-all"
              style={{ color: 'rgba(234,216,192,0.7)' }}
            >
              <Calendar className="h-3.5 w-3.5" />
              Vervolgafspraak inplannen
            </button>

            {/* Add button */}
            <button
              onClick={handleAddToQueue}
              disabled={!description.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{ background: '#DCC3A5', color: '#1a1410' }}
            >
              <Plus className="h-4 w-4" />
              Toevoegen aan lijst
            </button>
          </div>
        </div>

        {/* MIDDLE PANEL — Gebitstatus */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <DentalArch3D
              teeth={[]}
              surfaces={[]}
              selectedTooth={null}
              onToothSelect={handleToothSelect}
              pendingRestoration={null}
            />
            {/* Multi-select overlay: highlight selected teeth via blue ring indicators */}
            {selectedTeeth.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-2xl" style={{ background: 'rgba(14,12,10,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(234,216,192,0.6)' }}>
                  {selectedTeeth.length} element{selectedTeeth.length !== 1 ? 'en' : ''} geselecteerd
                </span>
              </div>
            )}
          </div>

          {/* Tooth chips below chart */}
          {selectedTeeth.length > 0 && (
            <div className="px-4 py-2 border-t border-white/[0.06] flex flex-wrap gap-1.5 flex-shrink-0">
              {selectedTeeth.map(t => (
                <button
                  key={t}
                  onClick={() => handleToothSelect(t)}
                  className="px-2 py-0.5 rounded text-[10px] font-mono border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-red-500/15 hover:text-red-300 transition-all"
                >
                  {t} ✕
                </button>
              ))}
            </div>
          )}

          {/* AI Chat Bar */}
          <div className="border-t border-white/[0.06] flex-shrink-0" style={{ background: 'rgba(18,15,12,0.95)' }}>
            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <div className="max-h-[320px] overflow-y-auto px-4 py-2.5 space-y-2">
                {chatMessages.map((msg, i) => {
                  // AI message with suggestions: render preview cards
                  if (msg.role === 'ai' && msg.suggestions && msg.suggestions.length > 0) {
                    const nonCompanionSuggestions = msg.suggestions.filter(s => !s.isCompanion);
                    return (
                      <div key={i} className="flex gap-2 justify-start">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(220,195,165,0.12)' }}>
                          <Bot className="h-3 w-3" style={{ color: '#DCC3A5' }} />
                        </div>
                        <div className="max-w-[90%] space-y-2">
                          {/* Text response */}
                          {msg.text && (
                            <div className="px-3 py-1.5 rounded-2xl rounded-bl-md border border-white/[0.06] text-[12px] leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(245,230,211,0.85)' }}>
                              {msg.text}
                            </div>
                          )}
                          {/* Suggestion cards */}
                          {nonCompanionSuggestions.map(s => {
                            const companionsForThis = msg.suggestions!.filter(c => c.isCompanion);
                            return (
                              <div key={s.id} className="rounded-xl border border-white/[0.08] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                {/* Header with confidence dot, code, price */}
                                <div className="px-3 py-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${s.confidence === 'high' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">{s.nzaCode}</span>
                                    <span className="text-[12px]" style={{ color: 'rgba(245,230,211,0.85)' }}>{s.description}</span>
                                  </div>
                                  <span className="text-[12px] font-semibold" style={{ color: '#DCC3A5' }}>&euro;{s.unitPrice.toFixed(2)}</span>
                                </div>
                                {/* Tooth numbers if any */}
                                {s.toothNumbers.length > 0 && (
                                  <div className="px-3 pb-1">
                                    <span className="text-[10px]" style={{ color: 'rgba(234,216,192,0.5)' }}>Element {s.toothNumbers.join(', ')}</span>
                                  </div>
                                )}
                                {/* Companion codes */}
                                {companionsForThis.length > 0 && (
                                  <div className="px-3 pb-1 flex flex-wrap gap-1">
                                    {companionsForThis.map(c => (
                                      <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]" style={{ color: 'rgba(234,216,192,0.5)' }}>
                                        + {c.nzaCode} {c.description} &euro;{c.unitPrice.toFixed(2)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* Reasoning */}
                                <div className="px-3 pb-1.5">
                                  <span className="text-[10px] italic" style={{ color: 'rgba(234,216,192,0.35)' }}>&quot;{s.reasoning}&quot;</span>
                                </div>
                                {/* Corrections if any */}
                                {s.corrected && s.corrections.length > 0 && (
                                  <div className="px-3 pb-1.5">
                                    {s.corrections.map((c, ci) => (
                                      <span key={ci} className="text-[10px] block text-amber-400/70">&#9888; {c}</span>
                                    ))}
                                  </div>
                                )}
                                {/* Buttons */}
                                {!s.added ? (
                                  <div className="px-3 py-2 flex gap-2 border-t border-white/[0.06]">
                                    <button onClick={() => handleAddFromAI(i, s)} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all" style={{ background: '#DCC3A5', color: '#1a1410' }}>
                                      &#10003; Toevoegen
                                    </button>
                                    <button onClick={() => handleDismissSuggestion(i, s.id)} className="px-3 py-1.5 rounded-lg text-[11px] border border-white/[0.1] hover:bg-white/[0.05] transition-all" style={{ color: 'rgba(234,216,192,0.5)' }}>
                                      &#10005;
                                    </button>
                                  </div>
                                ) : (
                                  <div className="px-3 py-2 border-t border-white/[0.06] text-center">
                                    <span className="text-[11px] text-emerald-400/70">&#10003; Toegevoegd</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {/* Add all button */}
                          {nonCompanionSuggestions.filter(s => !s.added).length > 1 && (
                            <button onClick={() => handleAddAllFromAI(i)} className="w-full py-1.5 rounded-lg text-[11px] font-medium border border-[#DCC3A5]/30 hover:bg-[#DCC3A5]/10 transition-all" style={{ color: '#DCC3A5' }}>
                              Alles toevoegen ({nonCompanionSuggestions.filter(s => !s.added).length} behandelingen)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // User message or AI message without suggestions: keep existing rendering
                  return (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'ai' && (
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(220,195,165,0.12)' }}>
                          <Bot className="h-3 w-3" style={{ color: '#DCC3A5' }} />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-[12px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'rounded-br-md'
                            : 'rounded-bl-md border border-white/[0.06]'
                        }`}
                        style={{
                          background: msg.role === 'user' ? 'rgba(220,195,165,0.15)' : 'rgba(255,255,255,0.03)',
                          color: 'rgba(245,230,211,0.85)',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220,195,165,0.12)' }}>
                      <Bot className="h-3 w-3" style={{ color: '#DCC3A5' }} />
                    </div>
                    <div className="px-3 py-1.5 rounded-2xl rounded-bl-md border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DCC3A5]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DCC3A5]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DCC3A5]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Input bar */}
            <div className="px-4 py-3 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220,195,165,0.08)' }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: 'rgba(220,195,165,0.5)' }} />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                  placeholder="Stel een vraag aan AI..."
                  className="w-full px-3.5 py-2 pr-10 rounded-2xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 outline-none transition-all"
                  style={{ color: 'rgba(245,230,211,0.9)' }}
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim() || chatLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all disabled:opacity-20 hover:bg-white/[0.08]"
                  style={{ color: '#DCC3A5' }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Categories / Sub-treatments */}
        <div className="w-[340px] border-l border-white/[0.08] overflow-y-auto flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          {selectedCategory ? (
            // Sub-treatment view
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
                <button
                  onClick={() => { setSelectedCategory(null); setCodeSearch(''); }}
                  className="flex items-center gap-2 text-sm mb-2 hover:opacity-80 transition-opacity"
                  style={{ color: '#DCC3A5' }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Terug naar categorieën
                </button>
                <h3 className="text-sm font-semibold" style={{ color: 'rgba(245,230,211,0.95)' }}>
                  {TREATMENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </h3>
                {/* Search */}
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'rgba(234,216,192,0.3)' }} />
                  <input
                    type="text"
                    value={codeSearch}
                    onChange={e => setCodeSearch(e.target.value)}
                    placeholder="Zoek behandeling of code..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 focus:border-[#DCC3A5]/40 outline-none transition-all"
                    style={{ color: 'rgba(245,230,211,0.9)' }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {filteredCodes.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: 'rgba(234,216,192,0.3)' }}>
                    Geen behandelingen gevonden
                  </p>
                ) : (
                  filteredCodes.map(code => (
                    <button
                      key={code.id}
                      onClick={() => handleCodeSelect(code)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                        selectedNza?.id === code.id
                          ? 'border-[#DCC3A5]/40 bg-[#DCC3A5]/10'
                          : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06]" style={{ color: 'rgba(234,216,192,0.6)' }}>
                          {code.code}
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: '#DCC3A5' }}>
                          &euro;{Number(code.maxTariff).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[12px] leading-tight" style={{ color: 'rgba(245,230,211,0.75)' }}>
                        {code.descriptionNl}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Category grid
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(234,216,192,0.5)' }}>
                Categorieën
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {TREATMENT_CATEGORIES.map(cat => {
                  const img = CATEGORY_IMAGES[cat.id];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="h-[100px] relative overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-2xl hover:bg-white/[0.09] hover:border-white/[0.18] hover:scale-[1.02] transition-all duration-300 group"
                    >
                      {img ? (
                        <>
                          <img
                            src={img}
                            alt={cat.label}
                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                          <span className="absolute bottom-2.5 left-0 right-0 text-[11px] font-semibold text-center text-white drop-shadow-lg px-2 leading-tight">
                            {cat.label}
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] mb-1.5 group-hover:border-white/[0.15] transition-all" />
                          <span className="text-[11px] font-medium text-center px-2 leading-tight" style={{ color: 'rgba(245,230,211,0.8)' }}>
                            {cat.label}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ background: 'rgba(14,12,10,0.7)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl border border-white/[0.1]" style={{ background: 'rgba(26,22,18,0.97)', backdropFilter: 'blur(40px)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,195,165,0.1)' }}>
                  <Calendar className="h-5 w-5" style={{ color: '#DCC3A5' }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'rgba(245,230,211,0.95)' }}>Vervolgafspraak</h3>
                  <p className="text-[12px]" style={{ color: 'rgba(234,216,192,0.4)' }}>{patientName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBooking(false)}
                className="p-2 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
                style={{ color: 'rgba(234,216,192,0.4)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: 'rgba(234,216,192,0.4)' }}>Datum</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] outline-none focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 transition-all"
                    style={{ color: 'rgba(245,230,211,0.9)', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: 'rgba(234,216,192,0.4)' }}>Tijd</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] outline-none focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 transition-all"
                    style={{ color: 'rgba(245,230,211,0.9)', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: 'rgba(234,216,192,0.4)' }}>Type afspraak</label>
                <select
                  value={bookingType}
                  onChange={e => setBookingType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] outline-none focus:border-[#DCC3A5]/40 transition-all"
                  style={{ color: 'rgba(245,230,211,0.9)' }}
                >
                  <option value="CHECKUP">Controle</option>
                  <option value="TREATMENT">Behandeling</option>
                  <option value="CONSULTATION">Consult</option>
                  <option value="HYGIENE">Mondhygiëne</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: 'rgba(234,216,192,0.4)' }}>Notitie (optioneel)</label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={e => setBookingNotes(e.target.value)}
                  placeholder="Bijv. controle na behandeling..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-white/[0.1] bg-white/[0.05] placeholder-white/20 outline-none focus:border-[#DCC3A5]/40 focus:ring-1 focus:ring-[#DCC3A5]/20 transition-all"
                  style={{ color: 'rgba(245,230,211,0.9)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBooking(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/[0.1] hover:bg-white/[0.05] transition-all"
                style={{ color: 'rgba(234,216,192,0.6)' }}
              >
                Annuleren
              </button>
              <button
                onClick={() => setShowBooking(false)}
                disabled={!bookingDate}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
                style={{ background: '#DCC3A5', color: '#1a1410' }}
              >
                Bevestigen
              </button>
            </div>

            {bookingDate && (
              <p className="text-center text-[11px] mt-3" style={{ color: 'rgba(180,200,180,0.6)' }}>
                Afspraak wordt aangemaakt bij opslaan van het behandelplan
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom Queue Bar */}
      <div className="border-t-2 border-white/[0.1] flex-shrink-0" style={{ background: 'rgba(20,17,14,0.98)', backdropFilter: 'blur(20px)', boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>
        {queue.length === 0 ? (
          <div className="px-6 py-5 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(220,195,165,0.08)' }}>
              <ClipboardList className="h-4 w-4" style={{ color: 'rgba(220,195,165,0.4)' }} />
            </div>
            <p className="text-sm" style={{ color: 'rgba(234,216,192,0.45)' }}>
              Voeg behandelingen toe via het formulier links
            </p>
          </div>
        ) : (
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(234,216,192,0.5)' }}>
                {queue.length} behandeling{queue.length !== 1 ? 'en' : ''} in lijst
              </span>
              <span className="text-sm font-semibold" style={{ color: '#DCC3A5' }}>
                Totaal: &euro;{totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {queue.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  {entry.nzaCode && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
                      {entry.nzaCode}
                    </span>
                  )}
                  <span className="text-[12px] max-w-[150px] truncate" style={{ color: 'rgba(245,230,211,0.8)' }}>
                    {entry.description}
                  </span>
                  {entry.toothNumbers.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06]" style={{ color: 'rgba(234,216,192,0.5)' }}>
                      {entry.toothNumbers.join(', ')}
                    </span>
                  )}
                  <span className="text-[11px] font-medium" style={{ color: '#DCC3A5' }}>
                    &euro;{(entry.unitPrice * Math.max(entry.toothNumbers.length, 1)).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemoveFromQueue(entry.id)}
                    className="p-1 rounded hover:bg-red-500/15 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-red-400/60" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: '#DCC3A5', color: '#1a1410' }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
  return portalTarget ? createPortal(content, portalTarget) : content;
}
