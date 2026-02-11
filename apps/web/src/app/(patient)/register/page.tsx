'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Check, User, Phone, Shield, HeartPulse, ClipboardCheck } from 'lucide-react';

const STEPS = [
  { label: 'Persoonlijk', icon: User },
  { label: 'Contact', icon: Phone },
  { label: 'Verzekering', icon: Shield },
  { label: 'Medisch', icon: HeartPulse },
  { label: 'Bevestiging', icon: ClipboardCheck },
];

const DUTCH_INSURERS = [
  'Zilveren Kruis',
  'CZ',
  'Menzis',
  'VGZ',
  'ONVZ',
  'DSW',
  'Zorg en Zekerheid',
  'Ditzo',
  'National Academic',
  'FBTO',
  'Interpolis',
  'Anders',
];

const MEDICAL_ALERT_OPTIONS = [
  'Allergie voor latex',
  'Allergie voor penicilline',
  'Allergie voor verdovingsmiddelen',
  'Bloedverdunners',
  'Diabetes',
  'Hartaandoening',
  'Hoge bloeddruk',
  'Epilepsie',
  'Astma',
  'Zwangerschap',
  'Kunstgewricht / prothese',
  'Bisfosfonauten gebruik',
];

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bsn: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressPostal: string;
  addressCity: string;
  insuranceCompany: string;
  insuranceNumber: string;
  medicalAlerts: string[];
  medications: string;
  gdprConsent: boolean;
}

export default function PatientRegisterPage() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    patientNumber: string;
    practiceName: string;
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bsn: '',
    email: '',
    phone: '',
    addressStreet: '',
    addressPostal: '',
    addressCity: '',
    insuranceCompany: '',
    insuranceNumber: '',
    medicalAlerts: [],
    medications: '',
    gdprConsent: false,
  });

  const update = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAlert = (alert: string) => {
    setForm((prev) => ({
      ...prev,
      medicalAlerts: prev.medicalAlerts.includes(alert)
        ? prev.medicalAlerts.filter((a) => a !== alert)
        : [...prev.medicalAlerts, alert],
    }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!(
          form.firstName.trim() &&
          form.lastName.trim() &&
          form.dateOfBirth &&
          /^\d{9}$/.test(form.bsn)
        );
      case 1:
        return !!form.email.trim();
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return form.gdprConsent;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender || undefined,
        bsn: form.bsn,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        addressStreet: form.addressStreet.trim() || undefined,
        addressCity: form.addressCity.trim() || undefined,
        addressPostal: form.addressPostal.trim() || undefined,
        insuranceCompany: form.insuranceCompany || undefined,
        insuranceNumber: form.insuranceNumber.trim() || undefined,
        medicalAlerts: form.medicalAlerts.length > 0 ? form.medicalAlerts : undefined,
        medications: form.medications.trim()
          ? form.medications.split(',').map((m) => m.trim()).filter(Boolean)
          : undefined,
        gdprConsent: true,
      };

      const res = await fetch(`/api/patient-portal/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registratie mislukt');
      }

      const data = await res.json();
      setSuccess({
        patientNumber: data.patient.patientNumber,
        practiceName: data.practiceName,
      });
    } catch (err: any) {
      setError(err.message || 'Er is iets misgegaan');
    } finally {
      setLoading(false);
    }
  };

  // --- Success Screen ---
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-[#e8945a]/[0.03] via-transparent to-[#e8945a]/[0.02] pointer-events-none" />
        <div className="w-full max-w-lg relative z-10 text-center">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-10 shadow-2xl">
            {/* Animated checkmark */}
            <div className="w-20 h-20 bg-gradient-to-br from-[#e8945a] to-[#d4864a] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#e8945a]/30 animate-bounce">
              <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>

            <h1 className="text-3xl font-bold text-white/95 mb-2 tracking-tight">
              Welkom bij {success.practiceName}!
            </h1>
            <p className="text-lg text-white/50 mb-8">
              Uw registratie is succesvol afgerond.
            </p>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6">
              <p className="text-sm text-white/40 mb-2">Uw pati&euml;ntnummer</p>
              <p className="text-3xl font-mono font-bold text-[#e8945a] tracking-wider">
                {success.patientNumber}
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-8 text-left">
              <p className="text-base text-white/80 mb-1 font-medium">Hoe kunt u inloggen?</p>
              <p className="text-sm text-white/45">
                U kunt inloggen met uw e-mailadres en de laatste 4 cijfers van uw BSN.
              </p>
            </div>

            <Link
              href="/patient-login"
              className="inline-block w-full py-4 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4864a] hover:from-[#f0a06a] hover:to-[#e0926a] text-white font-semibold text-lg shadow-lg shadow-[#e8945a]/20 transition-all duration-300 text-center"
            >
              Ga naar inloggen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Registration Form ---
  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-[#e8945a]/[0.03] via-transparent to-[#e8945a]/[0.02] pointer-events-none" />
      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#e8945a] to-[#d4864a] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#e8945a]/20 mx-auto mb-4">
            <span className="text-xl font-bold text-white">DF</span>
          </div>
          <h1 className="text-2xl font-bold text-white/95 mb-1 tracking-tight">Pati&euml;nt registratie</h1>
          <p className="text-base text-white/45">Meld u aan bij DentFlow</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8 px-4">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    i < step
                      ? 'bg-[#e8945a] text-white shadow-lg shadow-[#e8945a]/30'
                      : i === step
                        ? 'bg-[#e8945a]/15 border-2 border-[#e8945a] text-[#e8945a]'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/25'
                  }`}
                >
                  {i < step ? (
                    <Check className="w-5 h-5" strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs mt-1.5 whitespace-nowrap ${i <= step ? 'text-white/60' : 'text-white/25'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 mx-1 mb-5 transition-all duration-300 rounded-full ${
                    i < step ? 'bg-[#e8945a]' : 'bg-white/[0.08]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center flex items-center justify-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
          {/* Step 0: Personal */}
          {step === 0 && (
            <div className="space-y-6">
              <StepTitle title="Persoonlijke gegevens" subtitle="Vul uw basisgegevens in" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldInput
                  label="Voornaam *"
                  value={form.firstName}
                  onChange={(v) => update('firstName', v)}
                  placeholder="Jan"
                />
                <FieldInput
                  label="Achternaam *"
                  value={form.lastName}
                  onChange={(v) => update('lastName', v)}
                  placeholder="de Vries"
                />
              </div>

              <FieldInput
                label="Geboortedatum *"
                type="date"
                value={form.dateOfBirth}
                onChange={(v) => update('dateOfBirth', v)}
              />

              <div>
                <label className="block text-sm font-medium text-white/60 mb-3">Geslacht</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'M', label: 'Man' },
                    { value: 'V', label: 'Vrouw' },
                    { value: 'X', label: 'Anders' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update('gender', form.gender === opt.value ? '' : opt.value)}
                      className={`py-4 rounded-2xl text-base font-medium transition-all duration-200 ${
                        form.gender === opt.value
                          ? 'bg-[#e8945a]/15 border-2 border-[#e8945a] text-[#e8945a] shadow-lg shadow-[#e8945a]/10'
                          : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.07]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">BSN *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.bsn}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    update('bsn', val);
                  }}
                  placeholder="123456789"
                  maxLength={9}
                  className="w-full px-5 min-h-[56px] rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/90 text-lg placeholder:text-white/25 outline-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/10 transition-all tracking-[0.3em] text-center font-mono"
                />
                {form.bsn.length > 0 && form.bsn.length !== 9 && (
                  <p className="text-sm text-[#e8945a]/70 mt-2">BSN moet 9 cijfers bevatten ({form.bsn.length}/9)</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Contact */}
          {step === 1 && (
            <div className="space-y-6">
              <StepTitle title="Contactgegevens" subtitle="Hoe kunnen wij u bereiken?" />

              <FieldInput
                label="E-mailadres *"
                type="email"
                value={form.email}
                onChange={(v) => update('email', v)}
                placeholder="uw@email.nl"
              />
              <FieldInput
                label="Telefoonnummer"
                type="tel"
                value={form.phone}
                onChange={(v) => update('phone', v)}
                placeholder="06 12345678"
              />
              <FieldInput
                label="Straat + huisnummer"
                value={form.addressStreet}
                onChange={(v) => update('addressStreet', v)}
                placeholder="Hoofdstraat 1"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldInput
                  label="Postcode"
                  value={form.addressPostal}
                  onChange={(v) => update('addressPostal', v)}
                  placeholder="1234 AB"
                />
                <FieldInput
                  label="Plaats"
                  value={form.addressCity}
                  onChange={(v) => update('addressCity', v)}
                  placeholder="Amsterdam"
                />
              </div>
            </div>
          )}

          {/* Step 2: Insurance */}
          {step === 2 && (
            <div className="space-y-6">
              <StepTitle title="Verzekering" subtitle="Uw zorgverzekeringsgegevens" />

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Zorgverzekeraar</label>
                <select
                  value={form.insuranceCompany}
                  onChange={(e) => update('insuranceCompany', e.target.value)}
                  className="w-full px-5 min-h-[56px] rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/90 text-lg outline-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/10 transition-all appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="" className="bg-[#141416]">Selecteer verzekeraar...</option>
                  {DUTCH_INSURERS.map((ins) => (
                    <option key={ins} value={ins} className="bg-[#141416]">{ins}</option>
                  ))}
                </select>
              </div>

              <FieldInput
                label="Polisnummer"
                value={form.insuranceNumber}
                onChange={(v) => update('insuranceNumber', v)}
                placeholder="Uw polisnummer"
              />
            </div>
          )}

          {/* Step 3: Medical */}
          {step === 3 && (
            <div className="space-y-6">
              <StepTitle title="Medische gegevens" subtitle="Optioneel -- u kunt dit ook later invullen" />

              <div>
                <label className="block text-sm font-medium text-white/60 mb-3">
                  Medische waarschuwingen
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MEDICAL_ALERT_OPTIONS.map((alert) => (
                    <button
                      key={alert}
                      type="button"
                      onClick={() => toggleAlert(alert)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                        form.medicalAlerts.includes(alert)
                          ? 'bg-[#e8945a]/15 border border-[#e8945a] text-[#e8945a]'
                          : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.07]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          form.medicalAlerts.includes(alert)
                            ? 'border-[#e8945a] bg-[#e8945a]'
                            : 'border-white/20'
                        }`}>
                          {form.medicalAlerts.includes(alert) && (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          )}
                        </span>
                        {alert}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Medicijnen</label>
                <textarea
                  value={form.medications}
                  onChange={(e) => update('medications', e.target.value)}
                  placeholder="Typ uw medicijnen, gescheiden door komma's"
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/90 text-base placeholder:text-white/25 outline-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/10 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-6">
              <StepTitle title="Bevestiging" subtitle="Controleer uw gegevens" />

              <div className="space-y-4">
                <ReviewSection title="Persoonlijk">
                  <ReviewRow label="Naam" value={`${form.firstName} ${form.lastName}`} />
                  <ReviewRow label="Geboortedatum" value={form.dateOfBirth ? new Date(form.dateOfBirth).toLocaleDateString('nl-NL') : '-'} />
                  <ReviewRow label="Geslacht" value={form.gender === 'M' ? 'Man' : form.gender === 'V' ? 'Vrouw' : form.gender === 'X' ? 'Anders' : '-'} />
                  <ReviewRow label="BSN" value={`*****${form.bsn.slice(-4)}`} />
                </ReviewSection>

                <ReviewSection title="Contact">
                  <ReviewRow label="E-mail" value={form.email} />
                  <ReviewRow label="Telefoon" value={form.phone || '-'} />
                  <ReviewRow label="Adres" value={[form.addressStreet, form.addressPostal, form.addressCity].filter(Boolean).join(', ') || '-'} />
                </ReviewSection>

                <ReviewSection title="Verzekering">
                  <ReviewRow label="Verzekeraar" value={form.insuranceCompany || '-'} />
                  <ReviewRow label="Polisnummer" value={form.insuranceNumber || '-'} />
                </ReviewSection>

                {(form.medicalAlerts.length > 0 || form.medications) && (
                  <ReviewSection title="Medisch">
                    {form.medicalAlerts.length > 0 && (
                      <ReviewRow label="Waarschuwingen" value={form.medicalAlerts.join(', ')} />
                    )}
                    {form.medications && <ReviewRow label="Medicijnen" value={form.medications} />}
                  </ReviewSection>
                )}
              </div>

              <label className="flex items-start gap-4 cursor-pointer p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors">
                <input
                  type="checkbox"
                  checked={form.gdprConsent}
                  onChange={(e) => update('gdprConsent', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 accent-[#e8945a]"
                />
                <span className="text-base text-white/60 leading-relaxed">
                  Ik geef toestemming voor het verwerken van mijn persoonsgegevens en medische gegevens conform de AVG.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-4">
          {step > 0 ? (
            <button
              onClick={() => { setStep(step - 1); setError(''); }}
              className="flex items-center gap-2 py-4 px-8 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-lg font-medium hover:bg-white/[0.07] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Vorige
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => { setStep(step + 1); setError(''); }}
              disabled={!canProceed()}
              className="flex items-center gap-2 py-4 px-8 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4864a] hover:from-[#f0a06a] hover:to-[#e0926a] text-white text-lg font-semibold shadow-lg shadow-[#e8945a]/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Volgende
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2 py-4 px-8 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4864a] hover:from-[#f0a06a] hover:to-[#e0926a] text-white text-lg font-semibold shadow-lg shadow-[#e8945a]/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Bezig...
                </span>
              ) : (
                'Registreren'
              )}
            </button>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center mt-8">
          <Link
            href="/patient-login"
            className="text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            Heeft u al een account? Inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-semibold text-white/90">{title}</h2>
      <p className="text-base text-white/45">{subtitle}</p>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 min-h-[56px] rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/90 text-lg placeholder:text-white/25 outline-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/10 transition-all"
      />
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-[#e8945a]/60 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-base text-white/40">{label}</span>
      <span className="text-base text-white/85 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
