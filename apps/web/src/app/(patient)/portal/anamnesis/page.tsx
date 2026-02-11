"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  Save,
  ChevronLeft,
  ChevronRight,
  Send,
  ClipboardCheck,
  AlertCircle,
  Heart,
  Smile,
  Pill,
  AlertTriangle,
  Activity,
  Moon,
  FileText,
  Upload,
  X,
  Sparkles,
  Shield,
  Stethoscope,
  Wine,
  Cigarette,
  Baby,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface AnamnesisData {
  // Algemene Gezondheid
  algemeneGezondheid: string;
  regelmatigeControles: boolean | null;
  laatsteControle: string;
  ziekenhuisopname: boolean | null;
  ziekenhuisOpnameDetails: string;
  zwanger: boolean | null;
  zwangerTermijn: string;

  // Mondgezondheid
  tandvleesBloeding: boolean | null;
  tandvleesBloedingFrequentie: string;
  mondPijn: boolean | null;
  mondPijnLocatie: string;
  drogeMond: boolean | null;
  tandenKnarsen: boolean | null;
  laatsteTandartsbezoek: string;
  redenLaatsteBezoek: string;
  tevredenheidGebijt: number;

  // Medische Voorgeschiedenis
  medischeCondities: string[];
  medischeConditiesOverig: string;
  hartAandoening: boolean | null;
  hartAandoeningDetails: string;
  diabetes: boolean | null;
  diabetesType: string;
  bloedingsstoornis: boolean | null;
  bloedingsstoornisDetails: string;

  // Medicijngebruik
  gebruiktMedicijnen: boolean | null;
  medicijnenLijst: string;
  bloedverdunners: boolean | null;
  bloedverdunnersType: string;
  osteoporoseMedicatie: boolean | null;
  medicatieOvergevoelig: boolean | null;
  medicatieOvergevoeligDetails: string;

  // Allergieën
  allergischMedicijnen: boolean | null;
  allergischMedicijnenDetails: string;
  allergischLatex: boolean | null;
  allergischChloorhexidine: boolean | null;
  allergischAnestheticum: boolean | null;
  allergischAnestheticumDetails: string;
  allergischVoedsel: boolean | null;
  allergischVoedselDetails: string;
  allergischOverig: boolean | null;
  allergischOverigDetails: string;

  // Leefstijl
  rookt: boolean | null;
  rooktAantal: string;
  rooktJaren: string;
  alcohol: boolean | null;
  alcoholFrequentie: string;
  drugs: boolean | null;
  drugsDetails: string;
  voedingspatroon: string;
  suikerConsumptie: string;
  mondhygiene: string;
  mondhygieneFrequentie: string;

  // Tandheelkundige Angst
  tandartsAngst: number;
  vorigeTraumatischeErvaring: boolean | null;
  vorigeTraumatischeErvaringDetails: string;
  verdovingAngst: boolean | null;
  eerdereVerdoving: boolean | null;
  problemenVerdoving: boolean | null;
  problemenVerdovingDetails: string;
  kalmeringNodig: boolean | null;
  kalmeringVoorkeur: string;

  // Bestanden
  medischeDocumenten: string[];

  // Overig
  overigeOpmerkingen: string;
}

const defaultData: AnamnesisData = {
  algemeneGezondheid: "",
  regelmatigeControles: null,
  laatsteControle: "",
  ziekenhuisopname: null,
  ziekenhuisOpnameDetails: "",
  zwanger: null,
  zwangerTermijn: "",

  tandvleesBloeding: null,
  tandvleesBloedingFrequentie: "",
  mondPijn: null,
  mondPijnLocatie: "",
  drogeMond: null,
  tandenKnarsen: null,
  laatsteTandartsbezoek: "",
  redenLaatsteBezoek: "",
  tevredenheidGebijt: 5,

  medischeCondities: [],
  medischeConditiesOverig: "",
  hartAandoening: null,
  hartAandoeningDetails: "",
  diabetes: null,
  diabetesType: "",
  bloedingsstoornis: null,
  bloedingsstoornisDetails: "",

  gebruiktMedicijnen: null,
  medicijnenLijst: "",
  bloedverdunners: null,
  bloedverdunnersType: "",
  osteoporoseMedicatie: null,
  medicatieOvergevoelig: null,
  medicatieOvergevoeligDetails: "",

  allergischMedicijnen: null,
  allergischMedicijnenDetails: "",
  allergischLatex: null,
  allergischChloorhexidine: null,
  allergischAnestheticum: null,
  allergischAnestheticumDetails: "",
  allergischVoedsel: null,
  allergischVoedselDetails: "",
  allergischOverig: null,
  allergischOverigDetails: "",

  rookt: null,
  rooktAantal: "",
  rooktJaren: "",
  alcohol: null,
  alcoholFrequentie: "",
  drugs: null,
  drugsDetails: "",
  voedingspatroon: "",
  suikerConsumptie: "",
  mondhygiene: "",
  mondhygieneFrequentie: "",

  tandartsAngst: 1,
  vorigeTraumatischeErvaring: null,
  vorigeTraumatischeErvaringDetails: "",
  verdovingAngst: null,
  eerdereVerdoving: null,
  problemenVerdoving: null,
  problemenVerdovingDetails: "",
  kalmeringNodig: null,
  kalmeringVoorkeur: "",

  medischeDocumenten: [],
  overigeOpmerkingen: "",
};

// =============================================================================
// CATEGORY CONFIGURATION
// =============================================================================

const categories = [
  {
    id: "algemeen",
    label: "Algemene Gezondheid",
    icon: Heart,
    description: "Uw algemene gezondheidstoestand",
  },
  {
    id: "mondgezondheid",
    label: "Mondgezondheid",
    icon: Smile,
    description: "Klachten en conditie van uw mond",
  },
  {
    id: "medisch",
    label: "Medische Voorgeschiedenis",
    icon: Stethoscope,
    description: "Belangrijke medische aandoeningen",
  },
  {
    id: "medicatie",
    label: "Medicijngebruik",
    icon: Pill,
    description: "Medicijnen die u gebruikt",
  },
  {
    id: "allergieen",
    label: "Allergieën",
    icon: AlertTriangle,
    description: "Overgevoeligheden en allergieën",
  },
  {
    id: "leefstijl",
    label: "Leefstijl",
    icon: Activity,
    description: "Roken, alcohol en voeding",
  },
  {
    id: "angst",
    label: "Tandheelkundige Angst",
    icon: Shield,
    description: "Angst en gevoeligheden",
  },
  {
    id: "overzicht",
    label: "Controle & Versturen",
    icon: ClipboardCheck,
    description: "Bekijk en bevestig uw antwoorden",
  },
];

const medischeConditieOpties = [
  { id: "hart_vaatziekten", label: "Hart- en vaatziekten", icon: Heart },
  { id: "hoge_bloeddruk", label: "Hoge bloeddruk", icon: Activity },
  { id: "diabetes", label: "Diabetes", icon: Activity },
  { id: "astma_copd", label: "Astma / COPD", icon: Activity },
  { id: "epilepsie", label: "Epilepsie", icon: Activity },
  {
    id: "bloedingsneigingen",
    label: "Bloedingsneigingen",
    icon: AlertTriangle,
  },
  { id: "hepatitis", label: "Hepatitis B/C", icon: AlertTriangle },
  { id: "hiv", label: "HIV", icon: AlertTriangle },
  { id: "reuma", label: "Reuma", icon: Activity },
  { id: "schildklier", label: "Schildklieraandoening", icon: Activity },
  { id: "maagklachten", label: "Maag-/darmklachten", icon: Activity },
  { id: "kunstgewrichten", label: "Kunstgewrichten/kleppen", icon: Activity },
  { id: "bestraling", label: "Bestraling hoofd/hals", icon: AlertTriangle },
  { id: "nierziekte", label: "Nierziekte", icon: Activity },
  { id: "longembolie", label: "Longembolie/DVT", icon: AlertTriangle },
  { id: "botaandoening", label: "Botaandoening (osteoporose)", icon: Activity },
  { id: "overig", label: "Overige aandoeningen", icon: FileText },
];

// =============================================================================
// UI COMPONENTS
// =============================================================================

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/60 font-medium">
          Stap {current + 1} van {total}
        </span>
        <span className="text-[#e8945a] font-semibold">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#e8945a] to-[#f0a06a] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
  label,
  description,
}: {
  value: boolean | null;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-white/90 text-base font-medium">{label}</p>
        {description && (
          <p className="text-white/40 text-sm mt-1">{description}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-4 rounded-2xl text-base font-semibold transition-all duration-300 ${
            value === true
              ? "bg-gradient-to-r from-[#e8945a] to-[#d4783e] text-white shadow-lg shadow-[#e8945a]/30 scale-[1.02]"
              : "bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15]"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {value === true && <Check className="w-4 h-4" />}
            Ja
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-4 rounded-2xl text-base font-semibold transition-all duration-300 ${
            value === false
              ? "bg-white/[0.12] text-white border-2 border-white/20 shadow-lg"
              : "bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15]"
          }`}
        >
          Nee
        </button>
      </div>
    </div>
  );
}

function SegmentedControl({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <div className="space-y-3">
      {label && <p className="text-white/90 text-base font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              value === opt.value
                ? "bg-[#e8945a]/20 text-[#e8945a] border border-[#e8945a]/40 shadow-lg shadow-[#e8945a]/10"
                : "bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FloatingLabelInput({
  value,
  onChange,
  label,
  placeholder,
  type = "text",
  multiline = false,
  rows = 3,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const isActive = isFocused || hasValue;

  const baseClasses =
    "w-full bg-white/[0.03] border rounded-2xl px-5 text-base text-white/90 placeholder-transparent outline-none transition-all duration-300";
  const stateClasses = isFocused
    ? "border-[#e8945a]/50 shadow-[0_0_20px_rgba(232,148,90,0.15)]"
    : "border-white/[0.08] hover:border-white/[0.12]";
  const sizeClasses = multiline ? "pt-6 pb-4 resize-none" : "h-14 pt-5 pb-2";

  if (multiline) {
    return (
      <div className="relative">
        <label
          className={`absolute left-5 transition-all duration-300 pointer-events-none ${
            isActive
              ? "top-2 text-xs text-[#e8945a] font-medium"
              : "top-4 text-base text-white/40"
          }`}
        >
          {label}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={rows}
          className={`${baseClasses} ${stateClasses} ${sizeClasses}`}
          placeholder={placeholder || label}
        />
      </div>
    );
  }

  if (type === "date") {
    return (
      <div className="relative">
        <label
          className={`absolute left-5 transition-all duration-300 pointer-events-none ${
            isActive
              ? "top-1.5 text-xs text-[#e8945a] font-medium"
              : "top-4 text-base text-white/40"
          }`}
        >
          {label}
        </label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`${baseClasses} ${stateClasses} ${sizeClasses} [color-scheme:dark]`}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <label
        className={`absolute left-5 transition-all duration-300 pointer-events-none ${
          isActive
            ? "top-1.5 text-xs text-[#e8945a] font-medium"
            : "top-4 text-base text-white/40"
        }`}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`${baseClasses} ${stateClasses} ${sizeClasses}`}
        placeholder={placeholder || label}
      />
    </div>
  );
}

function RangeSlider({
  value,
  onChange,
  label,
  description,
  min = 1,
  max = 10,
  labels,
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
  description?: string;
  min?: number;
  max?: number;
  labels?: { [key: number]: string };
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-white/90 text-base font-medium">{label}</p>
        {description && (
          <p className="text-white/40 text-sm mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-3">
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-white/[0.08] rounded-full appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #e8945a 0%, #f0a06a ${percentage}%, rgba(255,255,255,0.08) ${percentage}%, rgba(255,255,255,0.08) 100%)`,
            }}
          />
          <div
            className="absolute -top-8 transform -translate-x-1/2 bg-[#e8945a] text-white text-sm font-bold px-3 py-1 rounded-xl shadow-lg shadow-[#e8945a]/30 transition-all duration-150"
            style={{ left: `${percentage}%` }}
          >
            {value}
          </div>
        </div>
        {labels && (
          <div className="flex justify-between text-xs text-white/40">
            {Object.entries(labels).map(([key, labelText]) => (
              <span
                key={key}
                className={
                  Number(key) === value ? "text-[#e8945a] font-medium" : ""
                }
              >
                {labelText}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckboxCard({
  checked,
  onChange,
  label,
  icon: Icon,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
        checked
          ? "bg-[#e8945a]/10 border-2 border-[#e8945a]/50 shadow-lg shadow-[#e8945a]/10"
          : "bg-white/[0.04] border-2 border-transparent hover:bg-white/[0.08] hover:border-white/[0.08]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
            checked
              ? "bg-[#e8945a] text-white"
              : "bg-white/[0.08] border border-white/[0.15]"
          }`}
        >
          {checked && <Check className="w-4 h-4" strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={`w-4 h-4 ${checked ? "text-[#e8945a]" : "text-white/40"}`}
              />
            )}
            <span
              className={`font-medium ${checked ? "text-[#e8945a]" : "text-white/80"}`}
            >
              {label}
            </span>
          </div>
          {description && (
            <p className="text-white/40 text-sm mt-1">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}

function MultiSelectCards({
  selected,
  onChange,
  options,
  label,
  description,
}: {
  selected: string[];
  onChange: (vals: string[]) => void;
  options: {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  label: string;
  description?: string;
}) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-white/90 text-base font-medium">{label}</p>
        {description && (
          <p className="text-white/40 text-sm mt-1">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => (
          <CheckboxCard
            key={opt.id}
            checked={selected.includes(opt.id)}
            onChange={() => toggle(opt.id)}
            label={opt.label}
            icon={opt.icon}
          />
        ))}
      </div>
    </div>
  );
}

function FileUpload({
  files,
  onChange,
  label,
  description,
}: {
  files: string[];
  onChange: (files: string[]) => void;
  label: string;
  description?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).map((file) => file.name);
    onChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-white/90 text-base font-medium">{label}</p>
        {description && (
          <p className="text-white/40 text-sm mt-1">{description}</p>
        )}
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/[0.15] rounded-2xl p-8 text-center cursor-pointer hover:border-[#e8945a]/40 hover:bg-[#e8945a]/5 transition-all duration-300 group"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] flex items-center justify-center group-hover:bg-[#e8945a]/10 transition-colors">
          <Upload className="w-8 h-8 text-white/40 group-hover:text-[#e8945a] transition-colors" />
        </div>
        <p className="text-white/70 font-medium">
          Klik om bestanden te uploaden
        </p>
        <p className="text-white/40 text-sm mt-1">PDF, JPG, PNG (max. 10MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white/[0.04] rounded-xl border border-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e8945a]/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#e8945a]" />
                </div>
                <span className="text-white/80 text-sm font-medium truncate max-w-[200px]">
                  {file}
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-2 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  children,
  title,
  icon: Icon,
  description,
}: {
  children: React.ReactNode;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 lg:p-8 space-y-6 hover:border-white/[0.12] transition-all duration-300">
      {(title || Icon) && (
        <div className="flex items-start gap-4 pb-4 border-b border-white/[0.06]">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-[#e8945a]/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-[#e8945a]" />
            </div>
          )}
          <div>
            {title && (
              <h3 className="text-xl font-semibold text-white/90">{title}</h3>
            )}
            {description && (
              <p className="text-white/40 text-sm mt-1">{description}</p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AnamnesisPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AnamnesisData>(defaultData);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("patient_token")
      : null;

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
          const loadedData = {
            ...defaultData,
            ...(result.data as Partial<AnamnesisData>),
          };
          setData(loadedData);
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
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data, completed: false }),
        });
      } else {
        const res = await fetch(`/api/patient-portal/anamnesis`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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

  // Auto-save on data change (debounced)
  useEffect(() => {
    if (loading || submitted || alreadyCompleted) return;
    const timer = setTimeout(() => {
      saveDraft();
    }, 2000);
    return () => clearTimeout(timer);
  }, [data, loading, submitted, alreadyCompleted, saveDraft]);

  const submitAnamnesis = async () => {
    if (!token) return;
    setSaving(true);
    try {
      if (existingId) {
        await fetch(`/api/patient-portal/anamnesis/${existingId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data, completed: true }),
        });
      } else {
        await fetch(`/api/patient-portal/anamnesis`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data, completed: true }),
        });
      }
      setSubmitted(true);
    } catch {
      // silent
    }
    setSaving(false);
  };

  const goToStep = (newStep: number) => {
    if (newStep >= 0 && newStep < categories.length) {
      setStep(newStep);
      setShowCategoryMenu(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-white/10 border-t-[#e8945a] rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Laden...</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-[#e8945a]/20 blur-3xl rounded-full" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#e8945a]/30 to-[#d4783e]/20 border border-[#e8945a]/30 flex items-center justify-center shadow-2xl shadow-[#e8945a]/20">
            <Check className="w-14 h-14 text-[#e8945a]" strokeWidth={2} />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white/95">
            Anamnese Verstuurd
          </h1>
          <p className="text-lg text-white/50 max-w-md">
            Uw medische vragenlijst is succesvol verstuurd. Uw tandarts kan deze
            nu inzien.
          </p>
        </div>
        <a
          href="/portal"
          className="mt-6 bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white rounded-2xl py-4 px-10 text-lg font-semibold transition-all shadow-xl shadow-[#e8945a]/20 hover:shadow-[#e8945a]/30 hover:scale-[1.02]"
        >
          Terug naar Welkom
        </a>
      </div>
    );
  }

  // Already completed view
  if (alreadyCompleted && step === 0 && !showCategoryMenu) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold text-white/95 mb-2">Anamnese</h1>
          <p className="text-lg text-white/50">
            Uw medische vragenlijst is reeds ingevuld.
          </p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#e8945a]/15 flex items-center justify-center border border-[#e8945a]/20">
              <Check className="w-8 h-8 text-[#e8945a]" />
            </div>
            <div>
              <p className="text-white/90 text-xl font-semibold">
                U heeft de anamnese al ingevuld
              </p>
              <p className="text-white/40 mt-1">
                U kunt een nieuwe versie invullen als uw situatie is veranderd.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setAlreadyCompleted(false);
                setExistingId(null);
                setData(defaultData);
              }}
              className="bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white rounded-2xl py-4 px-8 text-base font-semibold transition-all shadow-lg shadow-[#e8945a]/20"
            >
              Nieuwe Anamnese Invullen
            </button>
            <button
              onClick={() => setShowCategoryMenu(true)}
              className="py-4 px-8 rounded-2xl text-base font-semibold bg-white/[0.04] border border-white/[0.1] text-white/70 hover:bg-white/[0.08] transition-all"
            >
              Huidige Gegevens Bekijken
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CurrentIcon = categories[step].icon;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white/95">Anamnese</h1>
        <p className="text-white/50">
          Medische vragenlijst voor uw tandartsbehandeling
        </p>
      </div>

      {/* Progress Bar */}
      <ProgressBar current={step} total={categories.length} />

      {/* Category Steps */}
      <div className="relative">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const isActive = i === step;
            const isCompleted = i < step;

            return (
              <button
                key={cat.id}
                onClick={() => goToStep(i)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 flex-shrink-0 ${
                  isActive
                    ? "bg-[#e8945a]/15 border border-[#e8945a]/30"
                    : isCompleted
                      ? "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06]"
                      : "bg-transparent border border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isActive
                      ? "bg-[#e8945a] text-white"
                      : isCompleted
                        ? "bg-[#e8945a]/20 text-[#e8945a]"
                        : "bg-white/[0.08] text-white/40"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`hidden sm:block text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? "text-[#e8945a]"
                      : isCompleted
                        ? "text-white/70"
                        : "text-white/40"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Indicator */}
      <div className="flex justify-end h-6">
        {saving && (
          <span className="text-sm text-white/40 flex items-center gap-2 bg-white/[0.04] px-4 py-1.5 rounded-full">
            <Save className="w-4 h-4 animate-pulse" />
            Opslaan...
          </span>
        )}
        {saved && !saving && (
          <span className="text-sm text-[#e8945a] flex items-center gap-2 bg-[#e8945a]/10 px-4 py-1.5 rounded-full border border-[#e8945a]/20">
            <Check className="w-4 h-4" />
            Opgeslagen
          </span>
        )}
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {step === 0 && (
          <>
            <SectionCard
              title="Algemene Gezondheid"
              icon={Heart}
              description="Vertel ons meer over uw algemene gezondheid"
            >
              <SegmentedControl
                label="Hoe zou u uw algemene gezondheid beschrijven?"
                value={data.algemeneGezondheid}
                onChange={(v) => update({ algemeneGezondheid: v })}
                options={[
                  { value: "uitstekend", label: "Uitstekend" },
                  { value: "goed", label: "Goed" },
                  { value: "matig", label: "Matig" },
                  { value: "slecht", label: "Slecht" },
                ]}
              />

              <YesNoToggle
                label="Wordt u regelmatig gecontroleerd door een arts?"
                value={data.regelmatigeControles}
                onChange={(v) => update({ regelmatigeControles: v })}
              />

              {data.regelmatigeControles && (
                <FloatingLabelInput
                  label="Waarvoor?"
                  value={data.laatsteControle}
                  onChange={(v) => update({ laatsteControle: v })}
                  placeholder="Bijv. diabetes, hartcontrole"
                />
              )}

              <YesNoToggle
                label="Bent u de afgelopen 12 maanden opgenomen in het ziekenhuis?"
                value={data.ziekenhuisopname}
                onChange={(v) => update({ ziekenhuisopname: v })}
              />

              {data.ziekenhuisopname && (
                <FloatingLabelInput
                  label="Waarom was u opgenomen?"
                  value={data.ziekenhuisOpnameDetails}
                  onChange={(v) => update({ ziekenhuisOpnameDetails: v })}
                  multiline
                  rows={3}
                />
              )}

              <YesNoToggle
                label="Bent u zwanger of zou u zwanger kunnen zijn?"
                value={data.zwanger}
                onChange={(v) => update({ zwanger: v })}
              />

              {data.zwanger && (
                <FloatingLabelInput
                  label="Hoeveel weken zwanger?"
                  value={data.zwangerTermijn}
                  onChange={(v) => update({ zwangerTermijn: v })}
                  placeholder="Bijv. 12 weken"
                />
              )}
            </SectionCard>
          </>
        )}

        {step === 1 && (
          <>
            <SectionCard
              title="Mondgezondheid"
              icon={Smile}
              description="Hoe is de conditie van uw mond en gebit?"
            >
              <YesNoToggle
                label="Heeft u last van bloedend tandvlees bij het poetsen?"
                description="Dit kan een teken zijn van ontstoken tandvlees"
                value={data.tandvleesBloeding}
                onChange={(v) => update({ tandvleesBloeding: v })}
              />

              {data.tandvleesBloeding && (
                <SegmentedControl
                  label="Hoe vaak bloedt uw tandvlees?"
                  value={data.tandvleesBloedingFrequentie}
                  onChange={(v) => update({ tandvleesBloedingFrequentie: v })}
                  options={[
                    { value: "dagelijks", label: "Dagelijks" },
                    { value: "wekelijks", label: "Wekelijks" },
                    { value: "soms", label: "Soms" },
                    { value: "zelden", label: "Zelden" },
                  ]}
                />
              )}

              <YesNoToggle
                label="Heeft u pijnklachten in uw mond of kaak?"
                value={data.mondPijn}
                onChange={(v) => update({ mondPijn: v })}
              />

              {data.mondPijn && (
                <FloatingLabelInput
                  label="Waar heeft u pijn?"
                  value={data.mondPijnLocatie}
                  onChange={(v) => update({ mondPijnLocatie: v })}
                  placeholder="Bijv. linker onderkaak, kies linksboven"
                  multiline
                  rows={2}
                />
              )}

              <YesNoToggle
                label="Heeft u last van een droge mond?"
                value={data.drogeMond}
                onChange={(v) => update({ drogeMond: v })}
              />

              <YesNoToggle
                label="Knarst of perst u op uw tanden (ook 's nachts)?"
                value={data.tandenKnarsen}
                onChange={(v) => update({ tandenKnarsen: v })}
              />

              <FloatingLabelInput
                label="Wanneer was uw laatste tandartsbezoek?"
                value={data.laatsteTandartsbezoek}
                onChange={(v) => update({ laatsteTandartsbezoek: v })}
                type="date"
              />

              <FloatingLabelInput
                label="Wat was de reden van uw laatste bezoek?"
                value={data.redenLaatsteBezoek}
                onChange={(v) => update({ redenLaatsteBezoek: v })}
                placeholder="Bijv. controle, pijnklacht, schoonmaken"
              />

              <RangeSlider
                label="Hoe tevreden bent u over uw gebit?"
                description="1 = Helemaal niet tevreden, 10 = Zeer tevreden"
                value={data.tevredenheidGebijt}
                onChange={(v) => update({ tevredenheidGebijt: v })}
                min={1}
                max={10}
                labels={{ 1: "Niet tevreden", 10: "Zeer tevreden" }}
              />
            </SectionCard>
          </>
        )}

        {step === 2 && (
          <>
            <SectionCard
              title="Medische Voorgeschiedenis"
              icon={Stethoscope}
              description="Belangrijke medische aandoeningen die van invloed kunnen zijn op uw behandeling"
            >
              <MultiSelectCards
                label="Heeft u of heeft u gehad een van de volgende aandoeningen?"
                description="Selecteer alle aandoeningen die van toepassing zijn"
                selected={data.medischeCondities}
                onChange={(vals) => update({ medischeCondities: vals })}
                options={medischeConditieOpties}
              />

              {data.medischeCondities.includes("overig") && (
                <FloatingLabelInput
                  label="Beschrijf de overige aandoening(en)"
                  value={data.medischeConditiesOverig}
                  onChange={(v) => update({ medischeConditiesOverig: v })}
                  multiline
                  rows={3}
                />
              )}

              <YesNoToggle
                label="Heeft u een hartafwijking of hartziekte?"
                value={data.hartAandoening}
                onChange={(v) => update({ hartAandoening: v })}
              />

              {data.hartAandoening && (
                <FloatingLabelInput
                  label="Welke hartaandoening?"
                  value={data.hartAandoeningDetails}
                  onChange={(v) => update({ hartAandoeningDetails: v })}
                  placeholder="Bijv. hartruis, pacemaker, hartinfarct"
                />
              )}

              <YesNoToggle
                label="Heeft u diabetes (suikerziekte)?"
                value={data.diabetes}
                onChange={(v) => update({ diabetes: v })}
              />

              {data.diabetes && (
                <SegmentedControl
                  label="Welk type diabetes?"
                  value={data.diabetesType}
                  onChange={(v) => update({ diabetesType: v })}
                  options={[
                    { value: "type1", label: "Type 1" },
                    { value: "type2", label: "Type 2" },
                    { value: "zwangerschap", label: "Zwangerschapsdiabetes" },
                    { value: "onbekend", label: "Onbekend" },
                  ]}
                />
              )}

              <YesNoToggle
                label="Heeft u een bloedingsstoornis of gebruikt u bloedverdunners?"
                value={data.bloedingsstoornis}
                onChange={(v) => update({ bloedingsstoornis: v })}
              />

              {data.bloedingsstoornis && (
                <FloatingLabelInput
                  label="Welke stoornis of medicatie?"
                  value={data.bloedingsstoornisDetails}
                  onChange={(v) => update({ bloedingsstoornisDetails: v })}
                  placeholder="Bijv. hemofilie, Marcumar, Sintrom"
                />
              )}
            </SectionCard>
          </>
        )}

        {step === 3 && (
          <>
            <SectionCard
              title="Medicijngebruik"
              icon={Pill}
              description="Medicijnen die u momenteel gebruikt"
            >
              <YesNoToggle
                label="Gebruikt u medicijnen?"
                description="Inclusief zelfzorgmedicatie, vitamines en supplementen"
                value={data.gebruiktMedicijnen}
                onChange={(v) => update({ gebruiktMedicijnen: v })}
              />

              {data.gebruiktMedicijnen && (
                <FloatingLabelInput
                  label="Welke medicijnen gebruikt u?"
                  value={data.medicijnenLijst}
                  onChange={(v) => update({ medicijnenLijst: v })}
                  placeholder="Noem de namen van de medicijnen"
                  multiline
                  rows={4}
                />
              )}

              <YesNoToggle
                label="Gebruikt u bloedverdunners?"
                value={data.bloedverdunners}
                onChange={(v) => update({ bloedverdunners: v })}
              />

              {data.bloedverdunners && (
                <FloatingLabelInput
                  label="Welke bloedverdunners?"
                  value={data.bloedverdunnersType}
                  onChange={(v) => update({ bloedverdunnersType: v })}
                  placeholder="Bijv. Acenocoumarol, Apixaban, Rivaroxaban"
                />
              )}

              <YesNoToggle
                label="Gebruikt u medicijnen tegen osteoporose (botontkalking)?"
                description="Zoals Fosamax, Actonel, Bonvivainjecties"
                value={data.osteoporoseMedicatie}
                onChange={(v) => update({ osteoporoseMedicatie: v })}
              />

              <YesNoToggle
                label="Bent u overgevoelig geweest voor medicatie?"
                value={data.medicatieOvergevoelig}
                onChange={(v) => update({ medicatieOvergevoelig: v })}
              />

              {data.medicatieOvergevoelig && (
                <FloatingLabelInput
                  label="Welke medicatie gaf een reactie?"
                  value={data.medicatieOvergevoeligDetails}
                  onChange={(v) => update({ medicatieOvergevoeligDetails: v })}
                  placeholder="Beschrijf de medicatie en de reactie"
                  multiline
                  rows={3}
                />
              )}
            </SectionCard>
          </>
        )}

        {step === 4 && (
          <>
            <SectionCard
              title="Allergieën"
              icon={AlertTriangle}
              description="Overgevoeligheden die belangrijk zijn voor uw behandeling"
            >
              <YesNoToggle
                label="Bent u allergisch voor medicijnen?"
                value={data.allergischMedicijnen}
                onChange={(v) => update({ allergischMedicijnen: v })}
              />

              {data.allergischMedicijnen && (
                <FloatingLabelInput
                  label="Waarvoor bent u allergisch?"
                  value={data.allergischMedicijnenDetails}
                  onChange={(v) => update({ allergischMedicijnenDetails: v })}
                  placeholder="Bijv. penicilline, ibuprofen, codeïne"
                />
              )}

              <YesNoToggle
                label="Bent u allergisch voor latex?"
                description="Handschoenen en andere materialen in de praktijk"
                value={data.allergischLatex}
                onChange={(v) => update({ allergischLatex: v })}
              />

              <YesNoToggle
                label="Bent u allergisch voor chloorhexidine?"
                description="Mondspoeling die soms wordt gebruikt"
                value={data.allergischChloorhexidine}
                onChange={(v) => update({ allergischChloorhexidine: v })}
              />

              <YesNoToggle
                label="Bent u allergisch voor verdovingsmiddelen?"
                description="Lokale verdoving bij de tandarts"
                value={data.allergischAnestheticum}
                onChange={(v) => update({ allergischAnestheticum: v })}
              />

              {data.allergischAnestheticum && (
                <FloatingLabelInput
                  label="Welk verdovingsmiddel?"
                  value={data.allergischAnestheticumDetails}
                  onChange={(v) => update({ allergischAnestheticumDetails: v })}
                  placeholder="Bijv. Novocaïne, Xylocaïne, Articaïne"
                />
              )}

              <YesNoToggle
                label="Heeft u voedselallergieën?"
                value={data.allergischVoedsel}
                onChange={(v) => update({ allergischVoedsel: v })}
              />

              {data.allergischVoedsel && (
                <FloatingLabelInput
                  label="Waarvoor?"
                  value={data.allergischVoedselDetails}
                  onChange={(v) => update({ allergischVoedselDetails: v })}
                  placeholder="Bijv. noten, gluten, lactose"
                />
              )}

              <YesNoToggle
                label="Heeft u andere allergieën?"
                value={data.allergischOverig}
                onChange={(v) => update({ allergischOverig: v })}
              />

              {data.allergischOverig && (
                <FloatingLabelInput
                  label="Welke allergieën?"
                  value={data.allergischOverigDetails}
                  onChange={(v) => update({ allergischOverigDetails: v })}
                  placeholder="Beschrijf uw overige allergieën"
                />
              )}
            </SectionCard>
          </>
        )}

        {step === 5 && (
          <>
            <SectionCard
              title="Leefstijl"
              icon={Activity}
              description="Uw dagelijkse gewoonten die van invloed zijn op uw mondgezondheid"
            >
              <YesNoToggle
                label="Rookt u?"
                value={data.rookt}
                onChange={(v) => update({ rookt: v })}
              />

              {data.rookt && (
                <div className="space-y-4 pl-4 border-l-2 border-[#e8945a]/30">
                  <FloatingLabelInput
                    label="Hoeveel sigaretten per dag?"
                    value={data.rooktAantal}
                    onChange={(v) => update({ rooktAantal: v })}
                    placeholder="Bijv. 10 sigaretten"
                  />
                  <FloatingLabelInput
                    label="Hoelang rookt u al?"
                    value={data.rooktJaren}
                    onChange={(v) => update({ rooktJaren: v })}
                    placeholder="Bijv. 15 jaar"
                  />
                </div>
              )}

              <YesNoToggle
                label="Drinkt u alcohol?"
                value={data.alcohol}
                onChange={(v) => update({ alcohol: v })}
              />

              {data.alcohol && (
                <SegmentedControl
                  label="Hoe vaak drinkt u alcohol?"
                  value={data.alcoholFrequentie}
                  onChange={(v) => update({ alcoholFrequentie: v })}
                  options={[
                    { value: "dagelijks", label: "Dagelijks" },
                    { value: "wekelijks", label: "Wekelijks" },
                    { value: "maandelijks", label: "Maandelijks" },
                    { value: "zelden", label: "Zelden" },
                  ]}
                />
              )}

              <YesNoToggle
                label="Gebruikt u drugs?"
                description="Inclusief cannabis, cocaïne, ecstasy, etc."
                value={data.drugs}
                onChange={(v) => update({ drugs: v })}
              />

              {data.drugs && (
                <FloatingLabelInput
                  label="Welke drugs gebruikt u en hoe vaak?"
                  value={data.drugsDetails}
                  onChange={(v) => update({ drugsDetails: v })}
                  placeholder="Beschrijf uw drugsgebruik"
                  multiline
                  rows={3}
                />
              )}

              <SegmentedControl
                label="Hoe zou u uw voedingspatroon omschrijven?"
                value={data.voedingspatroon}
                onChange={(v) => update({ voedingspatroon: v })}
                options={[
                  { value: "gezond", label: "Gezond" },
                  { value: "gemiddeld", label: "Gemiddeld" },
                  { value: "ongezond", label: "Ongezond" },
                  { value: "vegetarisch", label: "Vegetarisch" },
                  { value: "veganistisch", label: "Veganistisch" },
                ]}
              />

              <SegmentedControl
                label="Hoe vaak consumeert u suikerhoudende producten?"
                value={data.suikerConsumptie}
                onChange={(v) => update({ suikerConsumptie: v })}
                options={[
                  {
                    value: "meerdere_keren_dag",
                    label: "Meerdere keren per dag",
                  },
                  { value: "dagelijks", label: "Dagelijks 1x" },
                  { value: "wekelijks", label: "Wekelijks" },
                  { value: "zelden", label: "Zelden/nooit" },
                ]}
              />

              <SegmentedControl
                label="Hoe vaak poetst u uw tanden?"
                value={data.mondhygieneFrequentie}
                onChange={(v) => update({ mondhygieneFrequentie: v })}
                options={[
                  { value: "3x_of_meer", label: "3x of vaker per dag" },
                  { value: "2x", label: "2x per dag" },
                  { value: "1x", label: "1x per dag" },
                  { value: "minder", label: "Minder dan 1x per dag" },
                ]}
              />

              <SegmentedControl
                label="Gebruikt u extra mondverzorgingsproducten?"
                value={data.mondhygiene}
                onChange={(v) => update({ mondhygiene: v })}
                options={[
                  { value: "flosdraad", label: "Flosdraad" },
                  { value: "tandenstokers", label: "Tandenstokers" },
                  { value: "mondspoeling", label: "Mondspoeling" },
                  { value: "tongreiniger", label: "Tongreiniger" },
                  { value: "geen", label: "Geen extra producten" },
                ]}
              />
            </SectionCard>
          </>
        )}

        {step === 6 && (
          <>
            <SectionCard
              title="Tandheelkundige Angst"
              icon={Shield}
              description="Uw gevoelens over tandartsbezoek"
            >
              <RangeSlider
                label="Hoe beoordeelt u uw angst voor de tandarts?"
                description="1 = Geen angst, 10 = Extreme angst"
                value={data.tandartsAngst}
                onChange={(v) => update({ tandartsAngst: v })}
                min={1}
                max={10}
                labels={{
                  1: "Geen angst",
                  5: "Matige angst",
                  10: "Extreme angst",
                }}
              />

              <YesNoToggle
                label="Heeft u eerder een traumatische ervaring gehad bij de tandarts?"
                value={data.vorigeTraumatischeErvaring}
                onChange={(v) => update({ vorigeTraumatischeErvaring: v })}
              />

              {data.vorigeTraumatischeErvaring && (
                <FloatingLabelInput
                  label="Kunt u dit toelichten?"
                  value={data.vorigeTraumatischeErvaringDetails}
                  onChange={(v) =>
                    update({ vorigeTraumatischeErvaringDetails: v })
                  }
                  placeholder="Beschrijf wat er is gebeurd (alleen als u dat wilt delen)"
                  multiline
                  rows={4}
                />
              )}

              <YesNoToggle
                label="Heeft u angst voor verdoving?"
                value={data.verdovingAngst}
                onChange={(v) => update({ verdovingAngst: v })}
              />

              <YesNoToggle
                label="Heeft u eerder een verdoving gehad bij de tandarts?"
                value={data.eerdereVerdoving}
                onChange={(v) => update({ eerdereVerdoving: v })}
              />

              {data.eerdereVerdoving && (
                <YesNoToggle
                  label="Heeft u ooit problemen gehad met verdoving?"
                  value={data.problemenVerdoving}
                  onChange={(v) => update({ problemenVerdoving: v })}
                />
              )}

              {data.problemenVerdoving && (
                <FloatingLabelInput
                  label="Welke problemen heeft u ervaren?"
                  value={data.problemenVerdovingDetails}
                  onChange={(v) => update({ problemenVerdovingDetails: v })}
                  placeholder="Bijv. duizeligheid, hartkloppingen, niet verdovend"
                  multiline
                  rows={3}
                />
              )}

              <YesNoToggle
                label="Zou u eventueel kalmering willen bij behandelingen?"
                description="Bijvoorbeeld lachgas of tabletten"
                value={data.kalmeringNodig}
                onChange={(v) => update({ kalmeringNodig: v })}
              />

              {data.kalmeringNodig && (
                <SegmentedControl
                  label="Welke vorm van kalmering heeft u voorkeur?"
                  value={data.kalmeringVoorkeur}
                  onChange={(v) => update({ kalmeringVoorkeur: v })}
                  options={[
                    { value: "lachgas", label: "Lachgas" },
                    { value: "tablet", label: "Kalmerende tablet" },
                    { value: "iv_sedatie", label: "IV-sedatie (via ader)" },
                    { value: "geen_voorkeur", label: "Geen voorkeur" },
                  ]}
                />
              )}
            </SectionCard>
          </>
        )}

        {step === 7 && (
          <>
            <SectionCard title="Medische Documenten" icon={FileText}>
              <FileUpload
                label="Upload medische documenten (optioneel)"
                description="Denk aan medicatieoverzicht, verwijsbrief, of röntgenfoto's"
                files={data.medischeDocumenten}
                onChange={(files) => update({ medischeDocumenten: files })}
              />
            </SectionCard>

            <SectionCard title="Overige Opmerkingen" icon={Sparkles}>
              <FloatingLabelInput
                label="Heeft u nog iets dat u wilt melden aan uw tandarts?"
                value={data.overigeOpmerkingen}
                onChange={(v) => update({ overigeOpmerkingen: v })}
                multiline
                rows={5}
              />
            </SectionCard>

            <SectionCard title="Samenvatting" icon={ClipboardCheck}>
              <div className="flex items-center gap-3 mb-4 p-4 bg-[#e8945a]/10 rounded-2xl border border-[#e8945a]/20">
                <AlertCircle className="w-6 h-6 text-[#e8945a] flex-shrink-0" />
                <p className="text-white/70 text-sm">
                  Controleer uw antwoorden voordat u verstuurt. U kunt teruggaan
                  om wijzigingen aan te brengen.
                </p>
              </div>
              <AnamnesisSummary data={data} />
            </SectionCard>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        {step > 0 ? (
          <button
            onClick={() => goToStep(step - 1)}
            className="flex items-center gap-2 py-4 px-6 rounded-2xl text-base font-semibold bg-white/[0.04] border border-white/[0.1] text-white/70 hover:bg-white/[0.08] transition-all backdrop-blur-xl"
          >
            <ChevronLeft className="w-5 h-5" />
            Vorige
          </button>
        ) : (
          <div />
        )}

        {step < categories.length - 1 ? (
          <button
            onClick={() => goToStep(step + 1)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white rounded-2xl py-4 px-8 text-base font-semibold transition-all shadow-lg shadow-[#e8945a]/20 hover:shadow-[#e8945a]/30 hover:scale-[1.02]"
          >
            Volgende
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={submitAnamnesis}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white rounded-2xl py-4 px-10 text-lg font-semibold transition-all shadow-xl shadow-[#e8945a]/20 hover:shadow-[#e8945a]/30 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
            {saving ? "Versturen..." : "Anamnese Versturen"}
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUMMARY COMPONENT
// =============================================================================

function AnamnesisSummary({ data }: { data: AnamnesisData }) {
  const yesNo = (val: boolean | null) =>
    val === null ? "-" : val ? "Ja" : "Nee";
  const conditieLabel = (id: string) =>
    medischeConditieOpties.find((o) => o.id === id)?.label || id;

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
      <h4 className="text-[#e8945a] font-semibold mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#e8945a]" />
        {title}
      </h4>
      {children}
    </div>
  );

  const Row = ({
    label,
    value,
    detail,
  }: {
    label: string;
    value: string;
    detail?: string;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2 border-b border-white/[0.04] last:border-b-0">
      <span className="text-white/40 text-sm sm:w-48 flex-shrink-0">
        {label}
      </span>
      <span className="text-white/80 text-sm font-medium">{value}</span>
      {detail && <span className="text-white/50 text-xs ml-2">({detail})</span>}
    </div>
  );

  return (
    <div className="space-y-4 text-sm max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      <Section title="Algemene Gezondheid">
        <Row label="Gezondheid" value={data.algemeneGezondheid || "-"} />
        <Row
          label="Regelmatige controles"
          value={yesNo(data.regelmatigeControles)}
        />
        {data.regelmatigeControles && (
          <Row label="Details" value={data.laatsteControle || "-"} />
        )}
        <Row
          label="Ziekenhuisopname (12m)"
          value={yesNo(data.ziekenhuisopname)}
        />
        {data.ziekenhuisopname && (
          <Row label="Details" value={data.ziekenhuisOpnameDetails || "-"} />
        )}
        <Row label="Zwanger" value={yesNo(data.zwanger)} />
        {data.zwanger && (
          <Row label="Termijn" value={data.zwangerTermijn || "-"} />
        )}
      </Section>

      <Section title="Mondgezondheid">
        <Row label="Tandvleesbloeding" value={yesNo(data.tandvleesBloeding)} />
        {data.tandvleesBloeding && (
          <Row label="Frequentie" value={data.tandvleesBloedingFrequentie} />
        )}
        <Row label="Mondpijn" value={yesNo(data.mondPijn)} />
        {data.mondPijn && (
          <Row label="Locatie" value={data.mondPijnLocatie || "-"} />
        )}
        <Row label="Droge mond" value={yesNo(data.drogeMond)} />
        <Row label="Tandenknarsen" value={yesNo(data.tandenKnarsen)} />
        <Row
          label="Laatste tandartsbezoek"
          value={data.laatsteTandartsbezoek || "-"}
          detail={data.redenLaatsteBezoek}
        />
        <Row
          label="Tevredenheid gebit"
          value={`${data.tevredenheidGebijt}/10`}
        />
      </Section>

      <Section title="Medische Voorgeschiedenis">
        {data.medischeCondities.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.medischeCondities.map((id) => (
              <span
                key={id}
                className="px-3 py-1.5 rounded-xl bg-[#e8945a]/10 text-[#e8945a] text-sm border border-[#e8945a]/20"
              >
                {conditieLabel(id)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-white/40 mb-3">Geen aandoeningen geselecteerd</p>
        )}
        {data.medischeCondities.includes("overig") && (
          <Row label="Overige" value={data.medischeConditiesOverig || "-"} />
        )}
        <Row label="Hartaandoening" value={yesNo(data.hartAandoening)} />
        {data.hartAandoening && (
          <Row label="Details" value={data.hartAandoeningDetails || "-"} />
        )}
        <Row label="Diabetes" value={yesNo(data.diabetes)} />
        {data.diabetes && <Row label="Type" value={data.diabetesType} />}
        <Row label="Bloedingsstoornis" value={yesNo(data.bloedingsstoornis)} />
        {data.bloedingsstoornis && (
          <Row label="Details" value={data.bloedingsstoornisDetails || "-"} />
        )}
      </Section>

      <Section title="Medicatie">
        <Row label="Medicijngebruik" value={yesNo(data.gebruiktMedicijnen)} />
        {data.gebruiktMedicijnen && (
          <Row label="Medicijnen" value={data.medicijnenLijst || "-"} />
        )}
        <Row label="Bloedverdunners" value={yesNo(data.bloedverdunners)} />
        {data.bloedverdunners && (
          <Row label="Type" value={data.bloedverdunnersType || "-"} />
        )}
        <Row
          label="Osteoporose medicatie"
          value={yesNo(data.osteoporoseMedicatie)}
        />
        <Row
          label="Medicatieovergevoelig"
          value={yesNo(data.medicatieOvergevoelig)}
        />
        {data.medicatieOvergevoelig && (
          <Row
            label="Details"
            value={data.medicatieOvergevoeligDetails || "-"}
          />
        )}
      </Section>

      <Section title="Allergieën">
        <Row label="Medicijnen" value={yesNo(data.allergischMedicijnen)} />
        {data.allergischMedicijnen && (
          <Row
            label="Details"
            value={data.allergischMedicijnenDetails || "-"}
          />
        )}
        <Row label="Latex" value={yesNo(data.allergischLatex)} />
        <Row
          label="Chloorhexidine"
          value={yesNo(data.allergischChloorhexidine)}
        />
        <Row
          label="Verdovingsmiddelen"
          value={yesNo(data.allergischAnestheticum)}
        />
        {data.allergischAnestheticum && (
          <Row
            label="Details"
            value={data.allergischAnestheticumDetails || "-"}
          />
        )}
        <Row label="Voedsel" value={yesNo(data.allergischVoedsel)} />
        {data.allergischVoedsel && (
          <Row label="Details" value={data.allergischVoedselDetails || "-"} />
        )}
        <Row label="Overig" value={yesNo(data.allergischOverig)} />
        {data.allergischOverig && (
          <Row label="Details" value={data.allergischOverigDetails || "-"} />
        )}
      </Section>

      <Section title="Leefstijl">
        <Row label="Roken" value={yesNo(data.rookt)} />
        {data.rookt && (
          <>
            <Row label="Aantal/dag" value={data.rooktAantal || "-"} />
            <Row label="Jaren" value={data.rooktJaren || "-"} />
          </>
        )}
        <Row label="Alcohol" value={yesNo(data.alcohol)} />
        {data.alcohol && (
          <Row label="Frequentie" value={data.alcoholFrequentie} />
        )}
        <Row label="Drugs" value={yesNo(data.drugs)} />
        {data.drugs && <Row label="Details" value={data.drugsDetails || "-"} />}
        <Row label="Voedingspatroon" value={data.voedingspatroon || "-"} />
        <Row label="Suikerconsumptie" value={data.suikerConsumptie || "-"} />
        <Row
          label="Mondhygiene frequentie"
          value={data.mondhygieneFrequentie || "-"}
        />
        <Row label="Extra producten" value={data.mondhygiene || "-"} />
      </Section>

      <Section title="Tandheelkundige Angst">
        <Row label="Angstniveau" value={`${data.tandartsAngst}/10`} />
        <Row
          label="Traumatische ervaring"
          value={yesNo(data.vorigeTraumatischeErvaring)}
        />
        {data.vorigeTraumatischeErvaring && (
          <Row
            label="Details"
            value={data.vorigeTraumatischeErvaringDetails || "-"}
          />
        )}
        <Row label="Angst voor verdoving" value={yesNo(data.verdovingAngst)} />
        <Row label="Eerdere verdoving" value={yesNo(data.eerdereVerdoving)} />
        {data.eerdereVerdoving && (
          <Row
            label="Problemen verdoving"
            value={yesNo(data.problemenVerdoving)}
          />
        )}
        {data.problemenVerdoving && (
          <Row label="Details" value={data.problemenVerdovingDetails || "-"} />
        )}
        <Row label="Kalmering nodig" value={yesNo(data.kalmeringNodig)} />
        {data.kalmeringNodig && (
          <Row label="Voorkeur" value={data.kalmeringVoorkeur || "-"} />
        )}
      </Section>

      {data.overigeOpmerkingen && (
        <Section title="Overige Opmerkingen">
          <p className="text-white/70 whitespace-pre-wrap">
            {data.overigeOpmerkingen}
          </p>
        </Section>
      )}

      {data.medischeDocumenten.length > 0 && (
        <Section title="Documenten">
          <div className="flex flex-wrap gap-2">
            {data.medischeDocumenten.map((doc, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-white/70 text-sm border border-white/[0.1] flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-[#e8945a]" />
                {doc}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
