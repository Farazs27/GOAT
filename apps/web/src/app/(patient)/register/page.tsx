'use client';

import { useState } from 'react';
import Link from 'next/link';


const STEPS = [
  'Persoonlijk',
  'Contact',
  'Verzekering',
  'Medisch',
  'Bevestiging',
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
      <div className="min-h-screen patient-gradient-bg flex items-center justify-center px-4 relative overflow-hidden">
        <Orbs />
        <div className="w-full max-w-lg relative z-10 text-center">
          <div className="patient-glass-card rounded-3xl p-10">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-white/95 mb-2">
              Welkom bij {success.practiceName}!
            </h1>
            <p className="text-lg text-white/60 mb-8">
              Uw registratie is succesvol afgerond.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <p className="text-sm text-white/50 mb-2">Uw patiëntnummer</p>
              <p className="text-2xl font-mono font-bold text-teal-400 tracking-wider">
                {success.patientNumber}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
              <p className="text-base text-white/80 mb-1 font-medium">Hoe kunt u inloggen?</p>
              <p className="text-base text-white/50">
                U kunt inloggen met uw e-mailadres en de laatste 4 cijfers van uw BSN.
              </p>
            </div>

            <Link
              href="/patient-login"
              className="inline-block w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold text-lg shadow-lg shadow-teal-500/20 transition-all duration-300 text-center"
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
    <div className="min-h-screen patient-gradient-bg flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <Orbs />
      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/20 mx-auto mb-4">
            <span className="text-xl font-bold text-white">DF</span>
          </div>
          <h1 className="text-2xl font-bold text-white/95 mb-1">Patiënt registratie</h1>
          <p className="text-base text-white/50">Meld u aan bij DentFlow</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8 px-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    i < step
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                      : i === step
                        ? 'bg-teal-500/20 border-2 border-teal-400 text-teal-400'
                        : 'bg-white/5 border border-white/10 text-white/30'
                  }`}
                >
                  {i < step ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs mt-1.5 whitespace-nowrap ${i <= step ? 'text-white/70' : 'text-white/30'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 mx-1 mb-5 transition-all duration-300 ${
                    i < step ? 'bg-teal-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-base text-center">
            {error}
          </div>
        )}

        {/* Card */}
        <div className="patient-glass-card rounded-3xl p-8">
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
                <label className="block text-sm font-medium text-white/70 mb-3">Geslacht</label>
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
                          ? 'bg-teal-500/20 border-2 border-teal-500 text-teal-400 shadow-lg shadow-teal-500/10'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">BSN *</label>
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
                  className="w-full px-5 min-h-[56px] rounded-2xl bg-white/5 border border-white/10 text-white/90 text-lg placeholder:text-white/30 outline-none focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/10 transition-all tracking-[0.3em] text-center font-mono"
                />
                {form.bsn.length > 0 && form.bsn.length !== 9 && (
                  <p className="text-sm text-amber-400/70 mt-2">BSN moet 9 cijfers bevatten ({form.bsn.length}/9)</p>
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
                <label className="block text-sm font-medium text-white/70 mb-2">Zorgverzekeraar</label>
                <select
                  value={form.insuranceCompany}
                  onChange={(e) => update('insuranceCompany', e.target.value)}
                  className="w-full px-5 min-h-[56px] rounded-2xl bg-white/5 border border-white/10 text-white/90 text-lg outline-none focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/10 transition-all appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="" className="bg-gray-900">Selecteer verzekeraar...</option>
                  {DUTCH_INSURERS.map((ins) => (
                    <option key={ins} value={ins} className="bg-gray-900">{ins}</option>
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
              <StepTitle title="Medische gegevens" subtitle="Optioneel — u kunt dit ook later invullen" />

              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Medische waarschuwingen
                </label>
                <div className="flex flex-wrap gap-2">
                  {MEDICAL_ALERT_OPTIONS.map((alert) => (
                    <button
                      key={alert}
                      type="button"
                      onClick={() => toggleAlert(alert)}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        form.medicalAlerts.includes(alert)
                          ? 'bg-teal-500/20 border border-teal-500 text-teal-400'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {alert}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Medicijnen</label>
                <textarea
                  value={form.medications}
                  onChange={(e) => update('medications', e.target.value)}
                  placeholder="Typ uw medicijnen, gescheiden door komma's"
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-base placeholder:text-white/30 outline-none focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/10 transition-all resize-none"
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

              <label className="flex items-start gap-4 cursor-pointer p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
                <input
                  type="checkbox"
                  checked={form.gdprConsent}
                  onChange={(e) => update('gdprConsent', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-400/20 accent-teal-500"
                />
                <span className="text-base text-white/70 leading-relaxed">
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
              className="flex items-center gap-2 py-4 px-8 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-lg font-medium hover:bg-white/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Vorige
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => { setStep(step + 1); setError(''); }}
              disabled={!canProceed()}
              className="flex items-center gap-2 py-4 px-8 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-lg font-semibold shadow-lg shadow-teal-500/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Volgende
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2 py-4 px-8 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-lg font-semibold shadow-lg shadow-teal-500/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Heeft u al een account? Inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function Orbs() {
  return (
    <>
      <div className="fixed top-20 left-10 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl pointer-events-none patient-float-slow" />
      <div className="fixed bottom-20 right-10 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl pointer-events-none patient-float-medium" />
      <div className="fixed top-1/2 left-1/3 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none patient-float-fast" />
      <div className="fixed bottom-1/3 left-1/4 w-72 h-72 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none patient-float-medium" />
    </>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-semibold text-white/90">{title}</h2>
      <p className="text-base text-white/50">{subtitle}</p>
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
      <label className="block text-sm font-medium text-white/70 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 min-h-[56px] rounded-2xl bg-white/5 border border-white/10 text-white/90 text-lg placeholder:text-white/30 outline-none focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/10 transition-all"
      />
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-base text-white/50">{label}</span>
      <span className="text-base text-white/90 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
