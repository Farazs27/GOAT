'use client';

import { useState } from 'react';
import { Pill, Check, Download } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

async function downloadPrescriptionPdf(id: string) {
  try {
    const res = await authFetch(`/api/prescriptions/${id}/pdf`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recept-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // PDF download failed silently
  }
}

const COMMON_PRESCRIPTIONS = [
  { name: 'Amoxicilline', genericName: 'Amoxicilline', dosage: '500mg', frequency: '3x per dag', duration: '7 dagen', quantity: 21, route: 'oraal', instructions: 'Innemen met water, verdelen over de dag' },
  { name: 'Augmentin', genericName: 'Amoxicilline/Clavulaanzuur', dosage: '625mg', frequency: '3x per dag', duration: '7 dagen', quantity: 21, route: 'oraal', instructions: 'Innemen bij de maaltijd' },
  { name: 'Metronidazol', genericName: 'Metronidazol', dosage: '500mg', frequency: '3x per dag', duration: '7 dagen', quantity: 21, route: 'oraal', instructions: 'Geen alcohol tijdens gebruik' },
  { name: 'Clindamycine', genericName: 'Clindamycine', dosage: '300mg', frequency: '4x per dag', duration: '7 dagen', quantity: 28, route: 'oraal', instructions: 'Bij penicilline-allergie' },
  { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', dosage: '400mg', frequency: '3x per dag', duration: '5 dagen', quantity: 15, route: 'oraal', instructions: 'Innemen na de maaltijd' },
  { name: 'Ibuprofen 600mg', genericName: 'Ibuprofen', dosage: '600mg', frequency: '3x per dag', duration: '5 dagen', quantity: 15, route: 'oraal', instructions: 'Innemen na de maaltijd' },
  { name: 'Paracetamol', genericName: 'Paracetamol', dosage: '1000mg', frequency: '4x per dag', duration: '5 dagen', quantity: 20, route: 'oraal', instructions: 'Max 4000mg per dag' },
  { name: 'Chloorhexidine', genericName: 'Chloorhexidine digluconaat', dosage: '0.12%', frequency: '2x per dag', duration: '14 dagen', quantity: 1, route: 'spoeling', instructions: '30 seconden spoelen, niet doorslikken' },
];

interface PrescriptionFormProps {
  patientId: string;
  appointmentId?: string;
  onPrescriptionCreated: () => void;
}

export default function PrescriptionForm({ patientId, appointmentId, onPrescriptionCreated }: PrescriptionFormProps) {
  const [medicationName, setMedicationName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState('');
  const [route, setRoute] = useState('oraal');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function prefill(p: typeof COMMON_PRESCRIPTIONS[0]) {
    setMedicationName(p.name);
    setGenericName(p.genericName);
    setDosage(p.dosage);
    setFrequency(p.frequency);
    setDuration(p.duration);
    setQuantity(String(p.quantity));
    setRoute(p.route);
    setInstructions(p.instructions);
  }

  function resetForm() {
    setMedicationName('');
    setGenericName('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setQuantity('');
    setRoute('oraal');
    setInstructions('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicationName || !dosage || !frequency) return;

    setSubmitting(true);
    try {
      const res = await authFetch('/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          appointmentId,
          medicationName,
          genericName: genericName || undefined,
          dosage,
          frequency,
          duration: duration || undefined,
          quantity: quantity ? parseInt(quantity) : undefined,
          route,
          instructions: instructions || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        onPrescriptionCreated();
        // Auto-download PDF
        if (data?.data?.id) {
          downloadPrescriptionPdf(data.data.id);
        }
        setTimeout(() => {
          setSuccess(false);
          resetForm();
        }, 2000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick-select common prescriptions */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Veelgebruikt</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_PRESCRIPTIONS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => prefill(p)}
              className="px-2.5 py-1.5 text-xs rounded-lg glass-light text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Medicatienaam *</label>
            <input
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 text-sm glass-light rounded-lg text-white placeholder-white/20 border border-white/10 focus:border-blue-500/50 focus:outline-none"
              placeholder="Bijv. Amoxicilline"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Generieke naam</label>
            <input
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm glass-light rounded-lg text-white placeholder-white/20 border border-white/10 focus:border-blue-500/50 focus:outline-none"
              placeholder="Optioneel"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Dosering *</label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 text-sm glass-light rounded-lg text-white placeholder-white/20 border border-white/10 focus:border-blue-500/50 focus:outline-none"
              placeholder="500mg"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Frequentie *</label>
            <input
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 text-sm glass-light rounded-lg text-white placeholder-white/20 border border-white/10 focus:border-blue-500/50 focus:outline-none"
              placeholder="3x per dag"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Duur</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm glass-light rounded-lg text-white placeholder-white/20 border border-white/10 focus:border-blue-500/50 focus:outline-none"
              placeholder="7 dagen"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Aantal</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm glass-light rounded-lg text-white placeholder-white/20 border border-white/10 focus:border-blue-500/50 focus:outline-none"
              placeholder="21"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Toedieningsweg</label>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm glass-light rounded-lg text-white border border-white/10 focus:border-blue-500/50 focus:outline-none bg-transparent"
            >
              <option value="oraal" className="bg-gray-900">Oraal</option>
              <option value="topicaal" className="bg-gray-900">Topicaal</option>
              <option value="spoeling" className="bg-gray-900">Spoeling</option>
            </select>
          </div>
          <div className="col-span-1" />
        </div>

        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Instructies</label>
          <input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-sm glass-light rounded-lg text-white placeholder-white/20 border border-white/10 focus:border-blue-500/50 focus:outline-none"
            placeholder="Bijv. Innemen na de maaltijd"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !medicationName || !dosage || !frequency}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/80 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
        >
          {success ? (
            <>
              <Check className="h-4 w-4" />
              Recept aangemaakt
            </>
          ) : (
            <>
              <Pill className="h-4 w-4" />
              {submitting ? 'Opslaan...' : 'Recept aanmaken'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
