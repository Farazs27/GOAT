'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, Save, ChevronLeft, ChevronRight, Send, ClipboardCheck, AlertCircle } from 'lucide-react';

interface AnamnesisData {
  // Section 1: Algemene gezondheid
  onderBehandeling: boolean | null;
  onderBehandelingToelichting: string;
  gebruiktMedicijnen: boolean | null;
  medicijnenToelichting: string;
  allergisch: boolean | null;
  allergischToelichting: string;
  rookt: boolean | null;
  rooktAantal: string;
  alcohol: boolean | null;
  alcoholFrequentie: string;
  zwanger: boolean | null;

  // Section 2: Medische voorgeschiedenis
  medischeCondities: string[];
  medischeConditiesOverig: string;

  // Section 3: Tandheelkundige voorgeschiedenis
  laatsteTandartsbezoek: string;
  heeftKlachten: boolean | null;
  klachtenToelichting: string;
  tandvleesBloeding: boolean | null;
  tandenKnarsen: boolean | null;
  eerdereVerdoving: boolean | null;
  problemenVerdoving: boolean | null;
  problemenVerdovingToelichting: string;

  // Section 4: Overig
  overigeOpmerkingen: string;
}

const defaultData: AnamnesisData = {
  onderBehandeling: null,
  onderBehandelingToelichting: '',
  gebruiktMedicijnen: null,
  medicijnenToelichting: '',
  allergisch: null,
  allergischToelichting: '',
  rookt: null,
  rooktAantal: '',
  alcohol: null,
  alcoholFrequentie: '',
  zwanger: null,
  medischeCondities: [],
  medischeConditiesOverig: '',
  laatsteTandartsbezoek: '',
  heeftKlachten: null,
  klachtenToelichting: '',
  tandvleesBloeding: null,
  tandenKnarsen: null,
  eerdereVerdoving: null,
  problemenVerdoving: null,
  problemenVerdovingToelichting: '',
  overigeOpmerkingen: '',
};

const medischeConditieOpties = [
  { id: 'hart_vaatziekten', label: 'Hart- en vaatziekten' },
  { id: 'hoge_bloeddruk', label: 'Hoge bloeddruk' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'astma_copd', label: 'Astma / COPD' },
  { id: 'epilepsie', label: 'Epilepsie' },
  { id: 'bloedingsneigingen', label: 'Bloedingsneigingen' },
  { id: 'hepatitis', label: 'Hepatitis B/C' },
  { id: 'hiv', label: 'HIV' },
  { id: 'reuma', label: 'Reuma' },
  { id: 'schildklier', label: 'Schildklieraandoening' },
  { id: 'maagklachten', label: 'Maagklachten' },
  { id: 'kunstgewrichten', label: 'Kunstgewrichten / kunstkleppen' },
  { id: 'bestraling', label: 'Bestraling hoofd/hals' },
  { id: 'overig', label: 'Overig' },
];

const stepLabels = ['Algemeen', 'Voorgeschiedenis', 'Tandheelkundig', 'Overig', 'Overzicht'];

const stepTitles = [
  'Algemene gezondheid',
  'Medische voorgeschiedenis',
  'Tandheelkundige voorgeschiedenis',
  'Overige opmerkingen',
  'Controleren & Versturen',
];

function YesNoToggle({
  value,
  onChange,
  label,
}: {
  value: boolean | null;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-white/90 text-base font-medium">{label}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 ${
            value === true
              ? 'bg-[#e8945a] text-white shadow-lg shadow-[#e8945a]/30'
              : 'bg-white/[0.05] text-white/50 border border-white/[0.1] hover:bg-white/[0.08]'
          }`}
        >
          Ja
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 ${
            value === false
              ? 'bg-white/[0.12] text-white shadow-lg border border-white/[0.15]'
              : 'bg-white/[0.05] text-white/50 border border-white/[0.1] hover:bg-white/[0.08]'
          }`}
        >
          Nee
        </button>
      </div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls =
    'w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-5 py-4 text-base text-white/90 placeholder-white/30 outline-none focus:border-[#e8945a]/50 focus:ring-1 focus:ring-[#e8945a]/30 transition-all';
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={cls + ' resize-none'}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cls}
    />
  );
}

export default function AnamnesisPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AnamnesisData>(defaultData);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('patient_token') : null;

  // Load existing anamnesis
  useEffect(() => {
    if (!token) return;
    fetch(`/api/patient-portal/anamnesis`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result && result.id) {
          setExistingId(result.id);
          setData({ ...defaultData, ...(result.data as AnamnesisData) });
          if (result.completedAt) {
            setAlreadyCompleted(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const update = (partial: Partial<AnamnesisData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  };

  // Auto-save draft
  const saveDraft = useCallback(async () => {
    if (!token || submitted || alreadyCompleted) return;
    setSaving(true);
    try {
      if (existingId) {
        await fetch(`/api/patient-portal/anamnesis/${existingId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, completed: false }),
        });
      } else {
        const res = await fetch(`/api/patient-portal/anamnesis`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, completed: false }),
        });
        const result = await res.json();
        if (result.id) setExistingId(result.id);
      }
      setSaved(true);
    } catch {
      // silent
    }
    setSaving(false);
  }, [token, data, existingId, submitted, alreadyCompleted]);

  // Save on step change
  useEffect(() => {
    if (!loading && step > 0) saveDraft();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitAnamnesis = async () => {
    if (!token) return;
    setSaving(true);
    try {
      if (existingId) {
        await fetch(`/api/patient-portal/anamnesis/${existingId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, completed: true }),
        });
      } else {
        await fetch(`/api/patient-portal/anamnesis`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, completed: true }),
        });
      }
      setSubmitted(true);
    } catch {
      // silent
    }
    setSaving(false);
  };

  const toggleConditie = (id: string) => {
    setData((prev) => ({
      ...prev,
      medischeCondities: prev.medischeCondities.includes(id)
        ? prev.medischeCondities.filter((c) => c !== id)
        : [...prev.medischeCondities, id],
    }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white/20 border-t-[#e8945a] rounded-full animate-spin" />
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-[#e8945a]/20 border border-[#e8945a]/30 flex items-center justify-center">
          <Check className="w-12 h-12 text-[#e8945a]" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold text-white/95">Anamnese Verstuurd</h1>
        <p className="text-lg text-white/50 max-w-md">
          Uw medische vragenlijst is succesvol verstuurd. Uw tandarts kan deze nu inzien.
        </p>
        <a
          href="/portal"
          className="mt-4 bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white rounded-2xl py-4 px-8 text-lg font-semibold transition-all shadow-lg shadow-[#e8945a]/20"
        >
          Terug naar Welkom
        </a>
      </div>
    );
  }

  // Already completed view
  if (alreadyCompleted && step === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white/95 mb-2">Anamnese</h1>
          <p className="text-lg text-white/50">Uw medische vragenlijst is reeds ingevuld.</p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e8945a]/15 flex items-center justify-center border border-[#e8945a]/20">
              <Check className="w-7 h-7 text-[#e8945a]" />
            </div>
            <div>
              <p className="text-white/90 text-lg font-semibold">U heeft de anamnese al ingevuld</p>
              <p className="text-sm text-white/40 mt-0.5">U kunt een nieuwe versie invullen als uw situatie is veranderd.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setAlreadyCompleted(false);
              setExistingId(null);
              setData(defaultData);
            }}
            className="bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white rounded-2xl py-4 px-8 text-lg font-semibold transition-all shadow-lg shadow-[#e8945a]/20"
          >
            Nieuwe Anamnese Invullen
          </button>
        </div>

        {/* Show current data read-only */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8">
          <h2 className="text-xl font-semibold text-white/90 mb-6">Huidige Anamnese</h2>
          <AnamnesisReadonly data={data} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white/95 mb-2">Anamnese</h1>
        <p className="text-base text-white/50">Medische vragenlijst — stap {step + 1} van {stepLabels.length}</p>
      </div>

      {/* Progress steps */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <button
                onClick={() => setStep(i)}
                className="flex flex-col items-center w-full group"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < step
                      ? 'bg-[#e8945a] text-white shadow-lg shadow-[#e8945a]/30'
                      : i === step
                      ? 'bg-transparent border-2 border-[#e8945a] text-[#e8945a]'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white/30'
                  }`}
                >
                  {i < step ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-medium transition-colors hidden sm:block ${
                    i <= step ? 'text-[#e8945a]' : 'text-white/30'
                  }`}
                >
                  {label}
                </span>
              </button>
              {i < stepLabels.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-300 ${
                    i < step ? 'bg-[#e8945a]' : 'bg-white/[0.08]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Save indicator */}
        <div className="flex justify-end h-5">
          {saving && (
            <span className="text-xs text-white/30 flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 animate-pulse" />
              Opslaan...
            </span>
          )}
          {saved && !saving && (
            <span className="text-xs text-[#e8945a]/70 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Opgeslagen
            </span>
          )}
        </div>
      </div>

      {/* Step title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#e8945a]/15 flex items-center justify-center border border-[#e8945a]/20">
          <ClipboardCheck className="w-5 h-5 text-[#e8945a]" />
        </div>
        <h2 className="text-xl font-semibold text-white/90">{stepTitles[step]}</h2>
      </div>

      {/* Step content */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 lg:p-8 space-y-8">
        {step === 0 && (
          <>
            <YesNoToggle
              label="Bent u onder behandeling van een arts?"
              value={data.onderBehandeling}
              onChange={(v) => update({ onderBehandeling: v })}
            />
            {data.onderBehandeling && (
              <TextInput
                value={data.onderBehandelingToelichting}
                onChange={(v) => update({ onderBehandelingToelichting: v })}
                placeholder="Toelichting (waarvoor?)"
              />
            )}

            <YesNoToggle
              label="Gebruikt u medicijnen?"
              value={data.gebruiktMedicijnen}
              onChange={(v) => update({ gebruiktMedicijnen: v })}
            />
            {data.gebruiktMedicijnen && (
              <TextInput
                value={data.medicijnenToelichting}
                onChange={(v) => update({ medicijnenToelichting: v })}
                placeholder="Welke medicijnen?"
              />
            )}

            <YesNoToggle
              label="Bent u allergisch voor medicijnen of materialen?"
              value={data.allergisch}
              onChange={(v) => update({ allergisch: v })}
            />
            {data.allergisch && (
              <TextInput
                value={data.allergischToelichting}
                onChange={(v) => update({ allergischToelichting: v })}
                placeholder="Waarvoor bent u allergisch?"
              />
            )}

            <YesNoToggle
              label="Rookt u?"
              value={data.rookt}
              onChange={(v) => update({ rookt: v })}
            />
            {data.rookt && (
              <TextInput
                value={data.rooktAantal}
                onChange={(v) => update({ rooktAantal: v })}
                placeholder="Hoeveel per dag?"
              />
            )}

            <YesNoToggle
              label="Drinkt u alcohol?"
              value={data.alcohol}
              onChange={(v) => update({ alcohol: v })}
            />
            {data.alcohol && (
              <TextInput
                value={data.alcoholFrequentie}
                onChange={(v) => update({ alcoholFrequentie: v })}
                placeholder="Hoe vaak?"
              />
            )}

            <YesNoToggle
              label="Bent u zwanger of zou u zwanger kunnen zijn?"
              value={data.zwanger}
              onChange={(v) => update({ zwanger: v })}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-1">
              <p className="text-white/90 text-base font-medium">
                Heeft u of heeft u gehad een van de volgende aandoeningen?
              </p>
              <p className="text-white/40 text-sm">Tik op de aandoeningen die van toepassing zijn</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {medischeConditieOpties.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleConditie(opt.id)}
                  className={`py-4 px-4 rounded-2xl text-left text-sm font-medium transition-all duration-200 ${
                    data.medischeCondities.includes(opt.id)
                      ? 'bg-[#e8945a]/15 text-[#e8945a] border-2 border-[#e8945a]/40 shadow-lg shadow-[#e8945a]/10'
                      : 'bg-white/[0.04] text-white/60 border-2 border-transparent hover:bg-white/[0.08] hover:text-white/80'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
                        data.medischeCondities.includes(opt.id)
                          ? 'bg-[#e8945a] text-white'
                          : 'bg-white/[0.08] border border-white/[0.15]'
                      }`}
                    >
                      {data.medischeCondities.includes(opt.id) && (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      )}
                    </span>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
            {data.medischeCondities.includes('overig') && (
              <TextInput
                value={data.medischeConditiesOverig}
                onChange={(v) => update({ medischeConditiesOverig: v })}
                placeholder="Beschrijf de overige aandoening(en)"
              />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-3">
              <p className="text-white/90 text-base font-medium">Wanneer was uw laatste tandartsbezoek?</p>
              <input
                type="date"
                value={data.laatsteTandartsbezoek}
                onChange={(e) => update({ laatsteTandartsbezoek: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-5 py-4 text-base text-white/90 outline-none focus:border-[#e8945a]/50 focus:ring-1 focus:ring-[#e8945a]/30 transition-all [color-scheme:dark]"
              />
            </div>

            <YesNoToggle
              label="Heeft u op dit moment klachten?"
              value={data.heeftKlachten}
              onChange={(v) => update({ heeftKlachten: v })}
            />
            {data.heeftKlachten && (
              <TextInput
                value={data.klachtenToelichting}
                onChange={(v) => update({ klachtenToelichting: v })}
                placeholder="Beschrijf uw klachten"
              />
            )}

            <YesNoToggle
              label="Heeft u last van tandvleesbloeding?"
              value={data.tandvleesBloeding}
              onChange={(v) => update({ tandvleesBloeding: v })}
            />

            <YesNoToggle
              label="Knarst of perst u op uw tanden?"
              value={data.tandenKnarsen}
              onChange={(v) => update({ tandenKnarsen: v })}
            />

            <YesNoToggle
              label="Heeft u eerder een verdoving gehad bij de tandarts?"
              value={data.eerdereVerdoving}
              onChange={(v) => update({ eerdereVerdoving: v })}
            />

            <YesNoToggle
              label="Heeft u ooit problemen gehad met verdoving?"
              value={data.problemenVerdoving}
              onChange={(v) => update({ problemenVerdoving: v })}
            />
            {data.problemenVerdoving && (
              <TextInput
                value={data.problemenVerdovingToelichting}
                onChange={(v) => update({ problemenVerdovingToelichting: v })}
                placeholder="Welke problemen?"
              />
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-3">
              <p className="text-white/90 text-base font-medium">Overige opmerkingen</p>
              <p className="text-white/40 text-sm">Heeft u nog iets dat u wilt melden aan uw tandarts?</p>
              <TextInput
                value={data.overigeOpmerkingen}
                onChange={(v) => update({ overigeOpmerkingen: v })}
                placeholder="Typ hier uw opmerkingen..."
                multiline
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-[#e8945a]" />
              <p className="text-white/50 text-sm">Controleer uw antwoorden voordat u verstuurt</p>
            </div>
            <AnamnesisReadonly data={data} />
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between gap-4">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 py-4 px-6 rounded-2xl text-base font-semibold bg-white/[0.04] border border-white/[0.1] text-white/70 hover:bg-white/[0.08] transition-all backdrop-blur-xl"
          >
            <ChevronLeft className="w-5 h-5" />
            Vorige
          </button>
        ) : (
          <div />
        )}

        {step < stepLabels.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white rounded-2xl py-4 px-8 text-base font-semibold transition-all shadow-lg shadow-[#e8945a]/20"
          >
            Volgende
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={submitAnamnesis}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white rounded-2xl py-4 px-10 text-lg font-semibold transition-all shadow-lg shadow-[#e8945a]/20 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            {saving ? 'Versturen...' : 'Versturen'}
          </button>
        )}
      </div>
    </div>
  );
}

// Read-only display of anamnesis data
function AnamnesisReadonly({ data }: { data: AnamnesisData }) {
  const yesNo = (val: boolean | null) =>
    val === null ? 'Niet ingevuld' : val ? 'Ja' : 'Nee';

  const conditieLabel = (id: string) =>
    medischeConditieOpties.find((o) => o.id === id)?.label || id;

  return (
    <div className="space-y-6 text-base">
      {/* Section 1 */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-base font-semibold text-[#e8945a] mb-4">Algemene gezondheid</h3>
        <div className="space-y-1">
          <ReviewRow label="Onder behandeling arts" value={yesNo(data.onderBehandeling)} detail={data.onderBehandelingToelichting} />
          <ReviewRow label="Medicijnen" value={yesNo(data.gebruiktMedicijnen)} detail={data.medicijnenToelichting} />
          <ReviewRow label="Allergieen" value={yesNo(data.allergisch)} detail={data.allergischToelichting} />
          <ReviewRow label="Roken" value={yesNo(data.rookt)} detail={data.rookt ? `${data.rooktAantal} per dag` : ''} />
          <ReviewRow label="Alcohol" value={yesNo(data.alcohol)} detail={data.alcoholFrequentie} />
          <ReviewRow label="Zwanger" value={yesNo(data.zwanger)} />
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-base font-semibold text-[#e8945a] mb-4">Medische voorgeschiedenis</h3>
        {data.medischeCondities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.medischeCondities.map((id) => (
              <span key={id} className="px-3 py-1.5 rounded-xl bg-[#e8945a]/10 text-[#e8945a] text-sm border border-[#e8945a]/20">
                {conditieLabel(id)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-sm">Geen aandoeningen aangevinkt</p>
        )}
        {data.medischeConditiesOverig && (
          <p className="text-white/60 mt-2 text-sm">Overig: {data.medischeConditiesOverig}</p>
        )}
      </div>

      {/* Section 3 */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-base font-semibold text-[#e8945a] mb-4">Tandheelkundige voorgeschiedenis</h3>
        <div className="space-y-1">
          <ReviewRow label="Laatste tandartsbezoek" value={data.laatsteTandartsbezoek || 'Niet ingevuld'} />
          <ReviewRow label="Klachten" value={yesNo(data.heeftKlachten)} detail={data.klachtenToelichting} />
          <ReviewRow label="Tandvleesbloeding" value={yesNo(data.tandvleesBloeding)} />
          <ReviewRow label="Tanden knarsen" value={yesNo(data.tandenKnarsen)} />
          <ReviewRow label="Eerdere verdoving" value={yesNo(data.eerdereVerdoving)} />
          <ReviewRow label="Problemen verdoving" value={yesNo(data.problemenVerdoving)} detail={data.problemenVerdovingToelichting} />
        </div>
      </div>

      {/* Section 4 */}
      {data.overigeOpmerkingen && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-base font-semibold text-[#e8945a] mb-4">Overige opmerkingen</h3>
          <p className="text-white/70 text-sm">{data.overigeOpmerkingen}</p>
        </div>
      )}
    </div>
  );
}

function ReviewRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2.5 border-b border-white/[0.05] last:border-b-0">
      <span className="text-white/40 text-sm sm:w-52 flex-shrink-0">{label}</span>
      <span className="text-white/80 text-sm font-medium">{value}</span>
      {detail && <span className="text-white/50 text-xs ml-2">({detail})</span>}
    </div>
  );
}
