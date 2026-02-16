'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileDown, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import TreatmentHistoryDropdown from './treatment-history-dropdown';

const TreatmentPlanOverlay = dynamic(() => import('./treatment-plan-overlay'), { ssr: false });

interface NzaCode {
  id: string;
  code: string;
  descriptionNl: string;
  maxTariff: string;
  requiresTooth: boolean;
}

interface Treatment {
  id: string;
  description: string;
  status: string;
  quantity: number;
  unitPrice: string | null;
  totalPrice: string | null;
  nzaCode: NzaCode | null;
  tooth: { toothNumber: number } | null;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  totalEstimate: string | null;
  createdAt: string;
  treatments: Treatment[];
  creator: { firstName: string; lastName: string };
}

interface TreatmentPlanBuilderProps {
  patientId: string;
  patientName?: string;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Concept', PROPOSED: 'Voorgesteld', ACCEPTED: 'Geaccepteerd',
  IN_PROGRESS: 'In behandeling', COMPLETED: 'Afgerond', CANCELLED: 'Geannuleerd',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-300 border-gray-500/20',
  PROPOSED: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  ACCEPTED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  COMPLETED: 'bg-green-500/20 text-green-300 border-green-500/20',
  CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/20',
};

export default function TreatmentPlanBuilder({ patientId, patientName }: TreatmentPlanBuilderProps) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [addingToPlanId, setAddingToPlanId] = useState<string | null>(null);
  const [nzaSearch, setNzaSearch] = useState('');
  const [nzaResults, setNzaResults] = useState<NzaCode[]>([]);
  const [selectedNza, setSelectedNza] = useState<NzaCode | null>(null);
  const [treatmentDescription, setTreatmentDescription] = useState('');
  const [downloadingQuote, setDownloadingQuote] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch(`/api/treatment-plans?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) setPlans(await response.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [patientId, token]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const searchNzaCodes = async (search: string) => {
    setNzaSearch(search);
    if (search.length < 1) { setNzaResults([]); return; }
    try {
      const response = await fetch(`/api/nza-codes?search=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) setNzaResults(await response.json());
    } catch (err) { console.error(err); }
  };

  const createPlan = async () => {
    if (!newPlanTitle) return;
    try {
      await fetch('/api/treatment-plans', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, title: newPlanTitle, description: newPlanDescription || undefined }),
      });
      setNewPlanTitle(''); setNewPlanDescription(''); setShowCreatePlan(false);
      fetchPlans();
    } catch (err) { console.error(err); }
  };

  const addTreatment = async (planId: string) => {
    if (!treatmentDescription) return;
    try {
      await fetch(`/api/treatment-plans/${planId}/treatments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: treatmentDescription, nzaCodeId: selectedNza?.id }),
      });
      setAddingToPlanId(null); setTreatmentDescription(''); setSelectedNza(null); setNzaSearch(''); setNzaResults([]);
      fetchPlans();
    } catch (err) { console.error(err); }
  };

  const updatePlanStatus = async (planId: string, status: string) => {
    try {
      await fetch(`/api/treatment-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchPlans();
    } catch (err) { console.error(err); }
  };

  const handleDownloadQuote = async (planId: string) => {
    setDownloadingQuote(planId);
    try {
      const res = await fetch(`/api/treatment-plans/${planId}/quote-pdf`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Quote PDF download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offerte-${planId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Quote PDF download failed', e);
    } finally {
      setDownloadingQuote(null);
    }
  };

  const getStatusActions = (current: string): { status: string; label: string; style: 'primary' | 'secondary' | 'danger' }[] => {
    const actions: Record<string, { status: string; label: string; style: 'primary' | 'secondary' | 'danger' }[]> = {
      DRAFT: [
        { status: 'PROPOSED', label: 'Voorstellen', style: 'primary' },
        { status: 'CANCELLED', label: 'Annuleren', style: 'danger' },
      ],
      PROPOSED: [
        { status: 'ACCEPTED', label: 'Goedkeuren', style: 'primary' },
        { status: 'DRAFT', label: 'Terug naar concept', style: 'secondary' },
        { status: 'CANCELLED', label: 'Annuleren', style: 'danger' },
      ],
      ACCEPTED: [
        { status: 'IN_PROGRESS', label: 'Start behandeling', style: 'primary' },
        { status: 'CANCELLED', label: 'Annuleren', style: 'danger' },
      ],
      IN_PROGRESS: [
        { status: 'COMPLETED', label: 'Afronden', style: 'primary' },
        { status: 'CANCELLED', label: 'Annuleren', style: 'danger' },
      ],
    };
    return actions[current] || [];
  };

  const actionButtonStyles = {
    primary: 'bg-blue-500/80 hover:bg-blue-500 text-white',
    secondary: 'bg-white/[0.06] hover:bg-white/10 text-white/60 border border-white/10',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/20',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Behandelplannen</h3>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-blue-500/20"
          onClick={() => setShowOverlay(true)}
        >
          <Plus className="h-4 w-4" />
          Nieuw behandelplan
        </button>
      </div>

      {showCreatePlan && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-medium text-white/80">Nieuw behandelplan</h4>
          <div>
            <p className="text-xs text-white/40 mb-1">Titel</p>
            <input className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none"
              placeholder="bijv. Restauratief behandelplan" value={newPlanTitle} onChange={(e) => setNewPlanTitle(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Omschrijving (optioneel)</p>
            <textarea className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none min-h-[60px] resize-none"
              placeholder="Toelichting..." value={newPlanDescription} onChange={(e) => setNewPlanDescription(e.target.value)} />
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition-colors"
              onClick={createPlan}>Aanmaken</button>
            <button className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setShowCreatePlan(false)}>Annuleren</button>
          </div>
        </div>
      )}

      {plans.length === 0 && !showCreatePlan && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-white/40 text-sm">Geen behandelplannen gevonden</p>
        </div>
      )}

      {plans.map((plan) => {
        return (
          <div key={plan.id} className="glass-card rounded-2xl overflow-hidden">
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white/90">{plan.title}</h4>
                  {plan.description && <p className="text-sm text-white/40 mt-1">{plan.description}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs border ${statusColors[plan.status]}`}>
                    {statusLabels[plan.status]}
                  </span>
                  {plan.totalEstimate && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/20">
                      &euro;{Number(plan.totalEstimate).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Treatments table */}
            {plan.treatments.length > 0 && (
              <div className="mx-5 mb-3 rounded-xl overflow-hidden border border-white/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left p-3 text-xs text-white/40 uppercase tracking-wider font-medium">Behandeling</th>
                      <th className="text-left p-3 text-xs text-white/40 uppercase tracking-wider font-medium">Code</th>
                      <th className="text-left p-3 text-xs text-white/40 uppercase tracking-wider font-medium">Tand</th>
                      <th className="text-right p-3 text-xs text-white/40 uppercase tracking-wider font-medium">Tarief</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.treatments.map((t) => (
                      <tr key={t.id} className="border-t border-white/5">
                        <td className="p-3 text-white/70">
                          <div>{t.description}</div>
                          {(t.tooth || t.nzaCode) && (
                            <TreatmentHistoryDropdown
                              patientId={patientId}
                              toothNumber={t.tooth?.toothNumber}
                              nzaCode={t.nzaCode?.code}
                              currentTreatmentId={t.id}
                              token={token}
                            />
                          )}
                        </td>
                        <td className="p-3"><span className="font-mono text-blue-300">{t.nzaCode?.code || '-'}</span></td>
                        <td className="p-3 text-white/50">{t.tooth?.toothNumber || '-'}</td>
                        <td className="p-3 text-right text-emerald-300">
                          {t.totalPrice ? `€${Number(t.totalPrice).toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add treatment */}
            <div className="px-5 pb-4">
              {addingToPlanId === plan.id ? (
                <div className="glass-light rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-white/40 mb-1">NZa-code zoeken</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
                      <input className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
                        placeholder="Zoek op code of omschrijving..." value={nzaSearch} onChange={(e) => searchNzaCodes(e.target.value)} />
                    </div>
                    {nzaResults.length > 0 && !selectedNza && (
                      <div className="glass rounded-xl mt-2 max-h-40 overflow-y-auto">
                        {nzaResults.map((nza) => (
                          <button key={nza.id}
                            className="w-full text-left px-4 py-2.5 hover:bg-white/10 text-sm border-b border-white/5 last:border-0 transition-colors"
                            onClick={() => { setSelectedNza(nza); setTreatmentDescription(nza.descriptionNl); setNzaSearch(nza.code); setNzaResults([]); }}
                          >
                            <span className="font-mono text-blue-300 font-medium">{nza.code}</span>
                            <span className="text-white/50"> — {nza.descriptionNl}</span>
                            <span className="float-right text-emerald-300">&euro;{Number(nza.maxTariff).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedNza && (
                      <div className="flex items-center mt-2 gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs border border-blue-500/20">{selectedNza.code}</span>
                        <span className="text-sm text-white/60">{selectedNza.descriptionNl}</span>
                        <span className="text-sm text-emerald-300">&euro;{Number(selectedNza.maxTariff).toFixed(2)}</span>
                        <button className="text-xs text-red-400 hover:text-red-300 underline"
                          onClick={() => { setSelectedNza(null); setNzaSearch(''); }}>Wissen</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Omschrijving</p>
                    <input className="w-full glass-input rounded-xl px-4 py-2 text-sm outline-none"
                      value={treatmentDescription} onChange={(e) => setTreatmentDescription(e.target.value)} placeholder="Behandelomschrijving" />
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-xs font-medium text-white transition-colors"
                      onClick={() => addTreatment(plan.id)}>Toevoegen</button>
                    <button className="px-3 py-1.5 glass rounded-xl text-xs text-white/50 hover:bg-white/10 transition-colors"
                      onClick={() => { setAddingToPlanId(null); setSelectedNza(null); setNzaSearch(''); setTreatmentDescription(''); }}>Annuleren</button>
                  </div>
                </div>
              ) : (
                plan.status !== 'COMPLETED' && plan.status !== 'CANCELLED' && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    onClick={() => setAddingToPlanId(plan.id)}>
                    <Plus className="h-3 w-3" />
                    Behandeling toevoegen
                  </button>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-white/30">
                {plan.creator.firstName} {plan.creator.lastName} &middot; {new Date(plan.createdAt).toLocaleDateString('nl-NL')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadQuote(plan.id)}
                  disabled={downloadingQuote === plan.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
                >
                  {downloadingQuote === plan.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5" />
                  )}
                  Offerte
                </button>
                {getStatusActions(plan.status).map(action => (
                  <button
                    key={action.status}
                    className={`px-2 py-1 rounded-xl text-xs font-medium transition-colors ${actionButtonStyles[action.style]}`}
                    onClick={() => updatePlanStatus(plan.id, action.status)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      {showOverlay && (
        <TreatmentPlanOverlay
          patientId={patientId}
          patientName={patientName || 'Patiënt'}
          onClose={() => setShowOverlay(false)}
          onSaved={() => { fetchPlans(); }}
        />
      )}
    </div>
  );
}
