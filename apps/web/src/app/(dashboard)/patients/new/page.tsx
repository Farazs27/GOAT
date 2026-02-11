"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Check,
  Save,
  Heart,
  Smile,
  Stethoscope,
  Pill,
  AlertTriangle,
  Activity,
  Shield,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Signature,
  AlertCircle,
  Calendar,
  Camera,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";
import CameraCapture from "@/components/CameraCapture";

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

  // Overig
  overigeOpmerkingen: string;
}

interface ConsentForm {
  id: string;
  title: string;
  content: string;
  signed: boolean;
  signatureData: string | null;
}

interface PatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  bsn: string;
  gender: string;
  insuranceCompany: string;
  insuranceNumber: string;
  addressStreet: string;
  addressCity: string;
  addressPostal: string;
}

const defaultAnamnesis: AnamnesisData = {
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

  overigeOpmerkingen: "",
};

const defaultConsentForms: ConsentForm[] = [
  {
    id: "privacy",
    title: "Privacyverklaring & Gegevensverwerking",
    content: `Ik geef toestemming aan Tandartspraktijk Amsterdam om mijn persoonsgegevens en medische gegevens te verwerken in het kader van mijn behandeling. Deze gegevens worden vertrouwelijk behandeld conform de AVG (Algemene Verordening Gegevensbescherming) en de Wet op de geneeskundige behandelingsovereenkomst (WGBO).`,
    signed: false,
    signatureData: null,
  },
  {
    id: "behandeling",
    title: "Algemene Behandelovereenkomst",
    content: `Ik verklaar dat ik op eigen initiatief tandheelkundige behandeling zoek bij Tandartspraktijk Amsterdam. Ik zal naar waarheid alle relevante medische informatie verstrekken en de instructies van de behandelaar opvolgen.`,
    signed: false,
    signatureData: null,
  },
  {
    id: "fotografie",
    title: "Fotografie & Röntgen",
    content: `Ik geef toestemming voor het maken van intra-orale foto's, röntgenfoto's en andere beeldvormende diagnostiek indien dit noodzakelijk is voor de behandeling. Deze beelden worden in mijn patiëntendossier opgeslagen.`,
    signed: false,
    signatureData: null,
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

const steps = [
  { id: "personal", label: "Persoonsgegevens", icon: User },
  { id: "photos", label: "Foto's", icon: Camera },
  { id: "anamnesis", label: "Anamnese", icon: Stethoscope },
  { id: "consent", label: "Toestemmingen", icon: FileText },
  { id: "review", label: "Controle", icon: Check },
];

// =============================================================================
// UI COMPONENTS
// =============================================================================

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = ((current + 1) / total) * 100;
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--text-secondary)] font-medium">
          Stap {current + 1} van {total}
        </span>
        <span className="text-[var(--accent)] font-semibold">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-[var(--bg-card)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-out"
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
        <p className="text-[var(--text-primary)] text-base font-medium">
          {label}
        </p>
        {description && (
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-4 rounded-xl text-base font-semibold transition-all duration-300 ${
            value === true
              ? "bg-[var(--accent)] text-white shadow-lg"
              : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]"
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
          className={`flex-1 py-4 rounded-xl text-base font-semibold transition-all duration-300 ${
            value === false
              ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-color)]"
              : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]"
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
      {label && (
        <p className="text-[var(--text-primary)] text-base font-medium">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              value === opt.value
                ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
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
        <p className="text-[var(--text-primary)] text-base font-medium">
          {label}
        </p>
        {description && (
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`p-4 rounded-xl text-left transition-all duration-300 ${
                isSelected
                  ? "bg-[var(--accent)]/10 border-2 border-[var(--accent)]/50"
                  : "bg-[var(--bg-card)] border-2 border-transparent hover:bg-[var(--bg-card-hover)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {Icon && (
                      <Icon
                        className={`w-4 h-4 ${isSelected ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
                      />
                    )}
                    <span
                      className={`font-medium text-sm ${isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}
                    >
                      {opt.label}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
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
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
  description?: string;
  min?: number;
  max?: number;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[var(--text-primary)] text-base font-medium">
          {label}
        </p>
        {description && (
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {description}
          </p>
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
            className="w-full h-2 bg-[var(--bg-card)] rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, var(--bg-card) ${percentage}%, var(--bg-card) 100%)`,
            }}
          />
          <div
            className="absolute -top-8 transform -translate-x-1/2 bg-[var(--accent)] text-white text-sm font-bold px-2 py-1 rounded-lg"
            style={{ left: `${percentage}%` }}
          >
            {value}
          </div>
        </div>
        <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

function SignaturePad({
  onSave,
  onClear,
}: {
  onSave: (data: string) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    onSave(data);
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-card)]">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full touch-none cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="flex-1 py-2 px-4 bg-[var(--bg-card)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors text-sm"
        >
          Wissen
        </button>
        <button
          type="button"
          onClick={save}
          className="flex-1 py-2 px-4 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-colors text-sm"
        >
          Opslaan
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NewPatientIntakePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [patientData, setPatientData] = useState<PatientData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    bsn: "",
    gender: "",
    insuranceCompany: "",
    insuranceNumber: "",
    addressStreet: "",
    addressCity: "",
    addressPostal: "",
  });

  const [anamnesisData, setAnamnesisData] =
    useState<AnamnesisData>(defaultAnamnesis);
  const [consentForms, setConsentForms] =
    useState<ConsentForm[]>(defaultConsentForms);
  const [activeConsentIndex, setActiveConsentIndex] = useState<number | null>(
    null,
  );
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);

  const updatePatient = (field: keyof PatientData, value: string) => {
    setPatientData((prev) => ({ ...prev, [field]: value }));
  };

  const updateAnamnesis = (partial: Partial<AnamnesisData>) => {
    setAnamnesisData((prev) => ({ ...prev, ...partial }));
  };

  const signConsent = (index: number, signatureData: string) => {
    setConsentForms((prev) =>
      prev.map((form, i) =>
        i === index ? { ...form, signed: true, signatureData } : form,
      ),
    );
    setActiveConsentIndex(null);
  };

  const clearConsentSignature = (index: number) => {
    setConsentForms((prev) =>
      prev.map((form, i) =>
        i === index ? { ...form, signed: false, signatureData: null } : form,
      ),
    );
  };

  const handlePhotoCapture = (imageData: string) => {
    setCapturedPhotos((prev) => [...prev, imageData]);
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0: // Personal
        if (
          !patientData.firstName ||
          !patientData.lastName ||
          !patientData.dateOfBirth
        ) {
          setError("Vul tenminste voornaam, achternaam en geboortedatum in");
          return false;
        }
        break;
      case 2: // Consent
        const unsignedForms = consentForms.filter((f) => !f.signed);
        if (unsignedForms.length > 0) {
          setError(
            `Er zijn nog ${unsignedForms.length} formulier(en) niet ondertekend`,
          );
          return false;
        }
        break;
    }
    setError("");
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError("");

    try {
      // Create patient
      const patientRes = await authFetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          ...patientData,
          dateOfBirth: patientData.dateOfBirth
            ? new Date(patientData.dateOfBirth).toISOString()
            : undefined,
          email: patientData.email || undefined,
          phone: patientData.phone || undefined,
          bsn: patientData.bsn || undefined,
          gender: patientData.gender || undefined,
          insuranceCompany: patientData.insuranceCompany || undefined,
          insuranceNumber: patientData.insuranceNumber || undefined,
          addressStreet: patientData.addressStreet || undefined,
          addressCity: patientData.addressCity || undefined,
          addressPostal: patientData.addressPostal || undefined,
        }),
      });

      if (!patientRes.ok) {
        const data = await patientRes.json();
        throw new Error(data.message || "Fout bij aanmaken patiënt");
      }

      const patient = await patientRes.json();

      // Create anamnesis
      await authFetch("/api/anamnesis", {
        method: "POST",
        body: JSON.stringify({
          patientId: patient.id,
          data: anamnesisData,
          completed: true,
        }),
      });

      // Create consent forms
      for (const form of consentForms) {
        await authFetch("/api/consent-forms", {
          method: "POST",
          body: JSON.stringify({
            patientId: patient.id,
            consentType: form.id,
            title: form.title,
            description: form.content,
            signatureData: form.signatureData,
            signedByName: `${patientData.firstName} ${patientData.lastName}`,
            status: "SIGNED",
          }),
        });
      }

      // Upload captured photos
      for (let i = 0; i < capturedPhotos.length; i++) {
        const photo = capturedPhotos[i];
        // Convert base64 to blob
        const response = await fetch(photo);
        const blob = await response.blob();
        const file = new File([blob], `patient-photo-${i + 1}.jpg`, {
          type: "image/jpeg",
        });

        const formData = new FormData();
        formData.append("patientId", patient.id);
        formData.append("imageType", "PROFILE");
        formData.append("file", file);
        formData.append("notes", i === 0 ? "Hoofdfoto" : `Foto ${i + 1}`);

        await authFetch("/api/patient-images", {
          method: "POST",
          body: formData,
        });
      }

      router.push(`/patients/${patient.id}`);
    } catch (err: any) {
      setError(err.message || "Fout bij het opslaan");
    } finally {
      setLoading(false);
    }
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <button className="p-2 glass rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">
            Nieuwe Patiënt Intake
          </h2>
          <p className="text-white/50">
            Voeg een nieuwe patiënt toe met anamnese en toestemmingen
          </p>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar current={currentStep} total={steps.length} />

      {/* Steps Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <button
              key={step.id}
              onClick={() => index <= currentStep && setCurrentStep(index)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all flex-shrink-0 ${
                isActive
                  ? "bg-[var(--accent)]/20 border border-[var(--accent)]/40"
                  : isCompleted
                    ? "bg-[var(--bg-card)] border border-[var(--border-color)]"
                    : "bg-transparent opacity-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : isCompleted
                      ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "bg-[var(--bg-card)] text-[var(--text-tertiary)]"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? "text-[var(--accent)]"
                    : isCompleted
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]"
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="glass-card rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="space-y-6">
        {/* STEP 1: Personal Information */}
        {currentStep === 0 && (
          <div className="space-y-6">
            {/* Personal Info */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Persoonsgegevens
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Basis informatie van de patiënt
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Voornaam *
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    value={patientData.firstName}
                    onChange={(e) => updatePatient("firstName", e.target.value)}
                    placeholder="Voornaam"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Achternaam *
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    value={patientData.lastName}
                    onChange={(e) => updatePatient("lastName", e.target.value)}
                    placeholder="Achternaam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Geboortedatum *
                  </label>
                  <input
                    type="date"
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    value={patientData.dateOfBirth}
                    onChange={(e) =>
                      updatePatient("dateOfBirth", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Geslacht
                  </label>
                  <select
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    value={patientData.gender}
                    onChange={(e) => updatePatient("gender", e.target.value)}
                  >
                    <option value="">Selecteer...</option>
                    <option value="man">Man</option>
                    <option value="vrouw">Vrouw</option>
                    <option value="anders">Anders</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                  BSN
                </label>
                <input
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="123456789"
                  value={patientData.bsn}
                  onChange={(e) => updatePatient("bsn", e.target.value)}
                  maxLength={9}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Contactgegevens
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Hoe kunnen we de patiënt bereiken?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="email@voorbeeld.nl"
                    value={patientData.email}
                    onChange={(e) => updatePatient("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Telefoon
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="+31 6 12345678"
                    value={patientData.phone}
                    onChange={(e) => updatePatient("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Adres
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Woonadres van de patiënt
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                  Straat + huisnummer
                </label>
                <input
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="Dorpsstraat 123"
                  value={patientData.addressStreet}
                  onChange={(e) =>
                    updatePatient("addressStreet", e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Postcode
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="1234 AB"
                    value={patientData.addressPostal}
                    onChange={(e) =>
                      updatePatient("addressPostal", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Woonplaats
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Amsterdam"
                    value={patientData.addressCity}
                    onChange={(e) =>
                      updatePatient("addressCity", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Verzekering
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Zorgverzekeringsgegevens
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Verzekeraar
                  </label>
                  <select
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    value={patientData.insuranceCompany}
                    onChange={(e) =>
                      updatePatient("insuranceCompany", e.target.value)
                    }
                  >
                    <option value="">Selecteer...</option>
                    {[
                      "VGZ",
                      "CZ",
                      "Menzis",
                      "Zilveren Kruis",
                      "ONVZ",
                      "DSW",
                      "FBTO",
                      "Interpolis",
                      "Ditzo",
                      "Anders",
                    ].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Polisnummer
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Polisnummer"
                    value={patientData.insuranceNumber}
                    onChange={(e) =>
                      updatePatient("insuranceNumber", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Photos */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Patiënt Foto's
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Maak foto's van de patiënt voor het dossier
                  </p>
                </div>
              </div>

              {/* Camera capture button */}
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="w-full py-6 px-6 bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all duration-300 flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-[var(--accent)]" />
                </div>
                <span className="text-base font-medium">
                  Foto maken met iPad
                </span>
                <span className="text-sm text-[var(--text-tertiary)]">
                  of upload een bestaande foto
                </span>
              </button>

              {/* Display captured photos */}
              {capturedPhotos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-base font-medium text-[var(--text-primary)]">
                    Gemaakte foto's ({capturedPhotos.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {capturedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)]">
                          <img
                            src={photo}
                            alt={`Patiënt foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-lg">
                          {index === 0 ? "Hoofdfoto" : `Foto ${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info text */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-400">
                  <strong>Tip:</strong> De eerste foto wordt gebruikt als
                  profielfoto in het patiëntenportaal. U kunt meerdere foto's
                  maken voor het complete patiëntendossier.
                </p>
              </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
              <CameraCapture
                onCapture={handlePhotoCapture}
                onClose={() => setShowCamera(false)}
              />
            )}
          </div>
        )}

        {/* STEP 3: Anamnesis - Algemene Gezondheid */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Algemene Gezondheid */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Algemene Gezondheid
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Medische voorgeschiedenis en algemene gezondheid
                  </p>
                </div>
              </div>

              <SegmentedControl
                label="Hoe zou u uw algemene gezondheid beschrijven?"
                value={anamnesisData.algemeneGezondheid}
                onChange={(v) => updateAnamnesis({ algemeneGezondheid: v })}
                options={[
                  { value: "uitstekend", label: "Uitstekend" },
                  { value: "goed", label: "Goed" },
                  { value: "matig", label: "Matig" },
                  { value: "slecht", label: "Slecht" },
                ]}
              />

              <YesNoToggle
                label="Wordt u regelmatig gecontroleerd door een arts?"
                value={anamnesisData.regelmatigeControles}
                onChange={(v) => updateAnamnesis({ regelmatigeControles: v })}
              />

              {anamnesisData.regelmatigeControles && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Waarvoor?
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Bijv. diabetes, hartcontrole"
                    value={anamnesisData.laatsteControle}
                    onChange={(e) =>
                      updateAnamnesis({ laatsteControle: e.target.value })
                    }
                  />
                </div>
              )}

              <YesNoToggle
                label="Bent u de afgelopen 12 maanden opgenomen in het ziekenhuis?"
                value={anamnesisData.ziekenhuisopname}
                onChange={(v) => updateAnamnesis({ ziekenhuisopname: v })}
              />

              {anamnesisData.ziekenhuisopname && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Waarom was u opgenomen?
                  </label>
                  <textarea
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none resize-none"
                    rows={3}
                    placeholder="Beschrijf de reden van opname"
                    value={anamnesisData.ziekenhuisOpnameDetails}
                    onChange={(e) =>
                      updateAnamnesis({
                        ziekenhuisOpnameDetails: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <YesNoToggle
                label="Bent u zwanger of zou u zwanger kunnen zijn?"
                value={anamnesisData.zwanger}
                onChange={(v) => updateAnamnesis({ zwanger: v })}
              />

              {anamnesisData.zwanger && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Hoeveel weken zwanger?
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Bijv. 12 weken"
                    value={anamnesisData.zwangerTermijn}
                    onChange={(e) =>
                      updateAnamnesis({ zwangerTermijn: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            {/* Mondgezondheid */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Smile className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Mondgezondheid
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Huidige mond- en gebitssituatie
                  </p>
                </div>
              </div>

              <YesNoToggle
                label="Heeft u last van bloedend tandvlees bij het poetsen?"
                description="Dit kan een teken zijn van ontstoken tandvlees"
                value={anamnesisData.tandvleesBloeding}
                onChange={(v) => updateAnamnesis({ tandvleesBloeding: v })}
              />

              {anamnesisData.tandvleesBloeding && (
                <SegmentedControl
                  label="Hoe vaak bloedt uw tandvlees?"
                  value={anamnesisData.tandvleesBloedingFrequentie}
                  onChange={(v) =>
                    updateAnamnesis({ tandvleesBloedingFrequentie: v })
                  }
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
                value={anamnesisData.mondPijn}
                onChange={(v) => updateAnamnesis({ mondPijn: v })}
              />

              {anamnesisData.mondPijn && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Waar heeft u pijn?
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Bijv. linker onderkaak, kies linksboven"
                    value={anamnesisData.mondPijnLocatie}
                    onChange={(e) =>
                      updateAnamnesis({ mondPijnLocatie: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Laatste tandartsbezoek
                  </label>
                  <input
                    type="date"
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    value={anamnesisData.laatsteTandartsbezoek}
                    onChange={(e) =>
                      updateAnamnesis({ laatsteTandartsbezoek: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Reden van bezoek
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Bijv. controle, pijn"
                    value={anamnesisData.redenLaatsteBezoek}
                    onChange={(e) =>
                      updateAnamnesis({ redenLaatsteBezoek: e.target.value })
                    }
                  />
                </div>
              </div>

              <RangeSlider
                label="Hoe tevreden bent u over uw gebit?"
                description="1 = Helemaal niet tevreden, 10 = Zeer tevreden"
                value={anamnesisData.tevredenheidGebijt}
                onChange={(v) => updateAnamnesis({ tevredenheidGebijt: v })}
                min={1}
                max={10}
              />
            </div>

            {/* Medische Voorgeschiedenis */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Medische Voorgeschiedenis
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Belangrijke medische aandoeningen
                  </p>
                </div>
              </div>

              <MultiSelectCards
                label="Heeft u of heeft u gehad een van de volgende aandoeningen?"
                description="Selecteer alle aandoeningen die van toepassing zijn"
                selected={anamnesisData.medischeCondities}
                onChange={(vals) =>
                  updateAnamnesis({ medischeCondities: vals })
                }
                options={medischeConditieOpties}
              />

              {anamnesisData.medischeCondities.includes("overig") && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Overige aandoeningen
                  </label>
                  <textarea
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none resize-none"
                    rows={3}
                    placeholder="Beschrijf overige aandoeningen"
                    value={anamnesisData.medischeConditiesOverig}
                    onChange={(e) =>
                      updateAnamnesis({
                        medischeConditiesOverig: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <YesNoToggle
                label="Gebruikt u medicijnen?"
                description="Inclusief zelfzorgmedicatie en supplementen"
                value={anamnesisData.gebruiktMedicijnen}
                onChange={(v) => updateAnamnesis({ gebruiktMedicijnen: v })}
              />

              {anamnesisData.gebruiktMedicijnen && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Welke medicijnen?
                  </label>
                  <textarea
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none resize-none"
                    rows={3}
                    placeholder="Noem de namen van de medicijnen"
                    value={anamnesisData.medicijnenLijst}
                    onChange={(e) =>
                      updateAnamnesis({ medicijnenLijst: e.target.value })
                    }
                  />
                </div>
              )}

              <YesNoToggle
                label="Bent u overgevoelig of allergisch voor bepaalde medicatie?"
                value={anamnesisData.medicatieOvergevoelig}
                onChange={(v) => updateAnamnesis({ medicatieOvergevoelig: v })}
              />

              {anamnesisData.medicatieOvergevoelig && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Welke medicatie?
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Bijv. penicilline"
                    value={anamnesisData.medicatieOvergevoeligDetails}
                    onChange={(e) =>
                      updateAnamnesis({
                        medicatieOvergevoeligDetails: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Allergieën */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Allergieën
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Overgevoeligheden voor behandeling
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <YesNoToggle
                  label="Allergie voor latex?"
                  description="Handschoenen in de praktijk"
                  value={anamnesisData.allergischLatex}
                  onChange={(v) => updateAnamnesis({ allergischLatex: v })}
                />
                <YesNoToggle
                  label="Allergie voor chloorhexidine?"
                  description="Mondspoeling"
                  value={anamnesisData.allergischChloorhexidine}
                  onChange={(v) =>
                    updateAnamnesis({ allergischChloorhexidine: v })
                  }
                />
              </div>

              <YesNoToggle
                label="Allergie voor verdovingsmiddelen?"
                value={anamnesisData.allergischAnestheticum}
                onChange={(v) => updateAnamnesis({ allergischAnestheticum: v })}
              />

              {anamnesisData.allergischAnestheticum && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Welk verdovingsmiddel?
                  </label>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Bijv. Novocaïne, Articaïne"
                    value={anamnesisData.allergischAnestheticumDetails}
                    onChange={(e) =>
                      updateAnamnesis({
                        allergischAnestheticumDetails: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Leefstijl */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Leefstijl
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Gewoonten die invloed hebben op mondgezondheid
                  </p>
                </div>
              </div>

              <YesNoToggle
                label="Rookt u?"
                value={anamnesisData.rookt}
                onChange={(v) => updateAnamnesis({ rookt: v })}
              />

              {anamnesisData.rookt && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-[var(--accent)]/30">
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                      Hoeveel per dag?
                    </label>
                    <input
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                      placeholder="Bijv. 10 sigaretten"
                      value={anamnesisData.rooktAantal}
                      onChange={(e) =>
                        updateAnamnesis({ rooktAantal: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                      Hoelang rookt u al?
                    </label>
                    <input
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none"
                      placeholder="Bijv. 15 jaar"
                      value={anamnesisData.rooktJaren}
                      onChange={(e) =>
                        updateAnamnesis({ rooktJaren: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              <SegmentedControl
                label="Hoe vaak poetst u uw tanden?"
                value={anamnesisData.mondhygieneFrequentie}
                onChange={(v) => updateAnamnesis({ mondhygieneFrequentie: v })}
                options={[
                  { value: "3x_of_meer", label: "3x of vaker per dag" },
                  { value: "2x", label: "2x per dag" },
                  { value: "1x", label: "1x per dag" },
                  { value: "minder", label: "Minder dan 1x per dag" },
                ]}
              />
            </div>

            {/* Tandartsangst */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Tandheelkundige Angst
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Angst en gevoeligheid
                  </p>
                </div>
              </div>

              <RangeSlider
                label="Hoe bang bent u voor de tandarts?"
                description="1 = Helemaal niet bang, 10 = Extreem bang"
                value={anamnesisData.tandartsAngst}
                onChange={(v) => updateAnamnesis({ tandartsAngst: v })}
                min={1}
                max={10}
              />

              <YesNoToggle
                label="Heeft u eerder een traumatische ervaring gehad bij de tandarts?"
                value={anamnesisData.vorigeTraumatischeErvaring}
                onChange={(v) =>
                  updateAnamnesis({ vorigeTraumatischeErvaring: v })
                }
              />

              {anamnesisData.vorigeTraumatischeErvaring && (
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                    Kunt u dit toelichten?
                  </label>
                  <textarea
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none resize-none"
                    rows={3}
                    placeholder="Beschrijf wat er is gebeurd"
                    value={anamnesisData.vorigeTraumatischeErvaringDetails}
                    onChange={(e) =>
                      updateAnamnesis({
                        vorigeTraumatischeErvaringDetails: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Overige opmerkingen */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Overige Opmerkingen
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Aanvullende informatie
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-tertiary)] mb-1 block">
                  Heeft u nog opmerkingen of vragen?
                </label>
                <textarea
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  rows={4}
                  placeholder="Vul hier aanvullende informatie in..."
                  value={anamnesisData.overigeOpmerkingen}
                  onChange={(e) =>
                    updateAnamnesis({ overigeOpmerkingen: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Consent Forms */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Toestemmingsformulieren
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    De patiënt moet deze formulieren lezen en ondertekenen
                  </p>
                </div>
              </div>
            </div>

            {consentForms.map((form, index) => (
              <div
                key={form.id}
                className={`glass-card rounded-2xl p-6 transition-all ${
                  form.signed ? "border-green-500/30 bg-green-500/5" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        form.signed
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[var(--bg-card)] text-[var(--text-tertiary)]"
                      }`}
                    >
                      {form.signed ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)]">
                        {form.title}
                      </h4>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        {form.signed ? "Ondertekend ✓" : "Nog niet ondertekend"}
                      </p>
                    </div>
                  </div>
                  {form.signed && (
                    <button
                      onClick={() => clearConsentSignature(index)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Opnieuw
                    </button>
                  )}
                </div>

                <div className="bg-[var(--bg-primary)] rounded-xl p-4 mb-4 max-h-40 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed">
                  {form.content}
                </div>

                {!form.signed && activeConsentIndex !== index && (
                  <button
                    onClick={() => setActiveConsentIndex(index)}
                    className="w-full py-3 bg-[var(--accent)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Signature className="w-4 h-4" />
                    Ondertekenen
                  </button>
                )}

                {activeConsentIndex === index && !form.signed && (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Vraag de patiënt om hieronder te ondertekenen:
                    </p>
                    <SignaturePad
                      onSave={(data) => signConsent(index, data)}
                      onClear={() => {}}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 5: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Controleer de gegevens
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Controleer alle informatie voordat u de patiënt opslaat
                  </p>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {/* Personal Summary */}
                <div className="bg-[var(--bg-primary)] rounded-xl p-4">
                  <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--accent)]" />
                    Persoonsgegevens
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[var(--text-tertiary)]">Naam:</span>
                      <p className="text-[var(--text-primary)]">
                        {patientData.firstName} {patientData.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-tertiary)]">
                        Geboortedatum:
                      </span>
                      <p className="text-[var(--text-primary)]">
                        {patientData.dateOfBirth
                          ? new Date(
                              patientData.dateOfBirth,
                            ).toLocaleDateString("nl-NL")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-tertiary)]">
                        Telefoon:
                      </span>
                      <p className="text-[var(--text-primary)]">
                        {patientData.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-tertiary)]">
                        E-mail:
                      </span>
                      <p className="text-[var(--text-primary)]">
                        {patientData.email || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Anamnesis Summary */}
                <div className="bg-[var(--bg-primary)] rounded-xl p-4">
                  <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[var(--accent)]" />
                    Anamnese
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">
                        Algemene gezondheid:
                      </span>
                      <span className="text-[var(--text-primary)] capitalize">
                        {anamnesisData.algemeneGezondheid || "Niet ingevuld"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">
                        Medische condities:
                      </span>
                      <span className="text-[var(--text-primary)]">
                        {anamnesisData.medischeCondities.length > 0
                          ? `${anamnesisData.medischeCondities.length} geselecteerd`
                          : "Geen"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">
                        Tandartsangst:
                      </span>
                      <span className="text-[var(--text-primary)]">
                        {anamnesisData.tandartsAngst}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">
                        Roker:
                      </span>
                      <span className="text-[var(--text-primary)]">
                        {anamnesisData.rookt === null
                          ? "Niet ingevuld"
                          : anamnesisData.rookt
                            ? "Ja"
                            : "Nee"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photos Summary */}
                <div className="bg-[var(--bg-primary)] rounded-xl p-4">
                  <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[var(--accent)]" />
                    Patiënt Foto's
                  </h4>
                  {capturedPhotos.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {capturedPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)]"
                        >
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Geen foto's gemaakt
                    </p>
                  )}
                </div>

                {/* Consent Summary */}
                <div className="bg-[var(--bg-primary)] rounded-xl p-4">
                  <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                    Toestemmingen
                  </h4>
                  <div className="space-y-2">
                    {consentForms.map((form) => (
                      <div
                        key={form.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[var(--text-secondary)]">
                          {form.title}
                        </span>
                        {form.signed ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ondertekend
                          </span>
                        ) : (
                          <span className="text-red-400">Niet ondertekend</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-6 border-t border-[var(--border-color)]">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-card)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Vorige
          </button>
        )}

        <div className="flex-1" />

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            Volgende
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Patiënt Opslaan
          </button>
        )}
      </div>
    </div>
  );
}
