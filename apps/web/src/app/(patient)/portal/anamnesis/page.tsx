'use client';

import { useState, useEffect, useCallback } from 'react';


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

const stepTitles = [
  'Algemene gezondheid',
  'Medische voorgeschiedenis',
  'Tandheelkundige voorgeschiedenis',
  'Overig',
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
      <p className="text-white/90 text-lg font-medium">{label}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 ${
            value === true
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          Ja
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 ${
            value === false
              ? 'bg-white/15 text-white shadow-lg shadow-white/5 border border-white/20'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
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
    'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white/90 placeholder-white/30 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all';
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white/20 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center animate-bounce">
          <svg className="w-12 h-12 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white/95">Anamnese Verstuurd</h1>
        <p className="text-lg text-white/50 max-w-md">
          Uw medische vragenlijst is succesvol verstuurd. Uw tandarts kan deze nu inzien.
        </p>
        <a
          href="/portal"
          className="mt-4 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl py-4 px-8 text-lg font-semibold transition-all"
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
        <div className="patient-glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-white/90 font-semibold">Ingevuld</p>
              <p className="text-sm text-white/40">U kunt een nieuwe versie invullen als uw situatie is veranderd.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setAlreadyCompleted(false);
              setExistingId(null);
              setData(defaultData);
            }}
            className="bg-teal-500 hover:bg-teal-400 text-white rounded-2xl py-4 px-8 text-lg font-semibold transition-all"
          >
            Nieuwe Anamnese Invullen
          </button>
        </div>

        {/* Show current data read-only */}
        <div className="patient-glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white/90 mb-4">Huidige Anamnese</h2>
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
        <p className="text-lg text-white/50">Medische vragenlijst — stap {step + 1} van {stepTitles.length}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {stepTitles.map((title, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-teal-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-teal-400 font-medium">{stepTitles[step]}</span>
          {saving && <span className="text-sm text-white/30">Opslaan...</span>}
        </div>
      </div>

      {/* Step content */}
      <div className="patient-glass-card rounded-2xl p-6 lg:p-8 space-y-8 transition-all">
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
            <p className="text-white/90 text-lg font-medium">
              Heeft u of heeft u gehad een van de volgende aandoeningen?
            </p>
            <p className="text-white/40 text-base">Tik op de aandoeningen die van toepassing zijn</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {medischeConditieOpties.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleConditie(opt.id)}
                  className={`py-4 px-5 rounded-2xl text-left text-lg font-medium transition-all duration-200 ${
                    data.medischeCondities.includes(opt.id)
                      ? 'bg-teal-500/20 text-teal-300 border-2 border-teal-500/40 shadow-lg shadow-teal-500/10'
                      : 'bg-white/5 text-white/60 border-2 border-transparent hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
                        data.medischeCondities.includes(opt.id)
                          ? 'bg-teal-500 text-white'
                          : 'bg-white/10 border border-white/20'
                      }`}
                    >
                      {data.medischeCondities.includes(opt.id) && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
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
              <p className="text-white/90 text-lg font-medium">Wanneer was uw laatste tandartsbezoek?</p>
              <input
                type="date"
                value={data.laatsteTandartsbezoek}
                onChange={(e) => update({ laatsteTandartsbezoek: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white/90 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all [color-scheme:dark]"
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
              <p className="text-white/90 text-lg font-medium">Overige opmerkingen</p>
              <p className="text-white/40">Heeft u nog iets dat u wilt melden aan uw tandarts?</p>
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
            <h2 className="text-xl font-semibold text-white/90">Controleer uw antwoorden</h2>
            <AnamnesisReadonly data={data} />
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between gap-4">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="py-4 px-8 rounded-2xl text-lg font-semibold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
          >
            Vorige
          </button>
        ) : (
          <div />
        )}

        {step < stepTitles.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="bg-teal-500 hover:bg-teal-400 text-white rounded-2xl py-4 px-8 text-lg font-semibold transition-all shadow-lg shadow-teal-500/20"
          >
            Volgende
          </button>
        ) : (
          <button
            onClick={submitAnamnesis}
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-400 text-white rounded-2xl py-4 px-8 text-lg font-semibold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
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
      <div>
        <h3 className="text-lg font-semibold text-teal-400 mb-3">Algemene gezondheid</h3>
        <div className="space-y-2">
          <ReviewRow label="Onder behandeling arts" value={yesNo(data.onderBehandeling)} detail={data.onderBehandelingToelichting} />
          <ReviewRow label="Medicijnen" value={yesNo(data.gebruiktMedicijnen)} detail={data.medicijnenToelichting} />
          <ReviewRow label="Allergieen" value={yesNo(data.allergisch)} detail={data.allergischToelichting} />
          <ReviewRow label="Roken" value={yesNo(data.rookt)} detail={data.rookt ? `${data.rooktAantal} per dag` : ''} />
          <ReviewRow label="Alcohol" value={yesNo(data.alcohol)} detail={data.alcoholFrequentie} />
          <ReviewRow label="Zwanger" value={yesNo(data.zwanger)} />
        </div>
      </div>

      {/* Section 2 */}
      <div>
        <h3 className="text-lg font-semibold text-teal-400 mb-3">Medische voorgeschiedenis</h3>
        {data.medischeCondities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.medischeCondities.map((id) => (
              <span key={id} className="px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-300 text-sm border border-teal-500/20">
                {conditieLabel(id)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-white/40">Geen aandoeningen aangevinkt</p>
        )}
        {data.medischeConditiesOverig && (
          <p className="text-white/60 mt-2">Overig: {data.medischeConditiesOverig}</p>
        )}
      </div>

      {/* Section 3 */}
      <div>
        <h3 className="text-lg font-semibold text-teal-400 mb-3">Tandheelkundige voorgeschiedenis</h3>
        <div className="space-y-2">
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
        <div>
          <h3 className="text-lg font-semibold text-teal-400 mb-3">Overige opmerkingen</h3>
          <p className="text-white/70">{data.overigeOpmerkingen}</p>
        </div>
      )}
    </div>
  );
}

function ReviewRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2 border-b border-white/5">
      <span className="text-white/40 sm:w-56 flex-shrink-0">{label}</span>
      <span className="text-white/80 font-medium">{value}</span>
      {detail && <span className="text-white/50 text-sm ml-2">({detail})</span>}
    </div>
  );
}
