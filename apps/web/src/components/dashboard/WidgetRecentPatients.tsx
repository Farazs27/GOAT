'use client';
import Link from 'next/link';
import { Users } from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  createdAt: string;
}

const avatarColors = [
  'from-[#DCC3A5] to-[#C4A882]',
  'from-[#EAD8C0] to-[#D4C0A5]',
  'from-[#F5E6D3] to-[#E5D6C3]',
  'from-[#D4C0A5] to-[#BCA883]',
  'from-[#E5D6C3] to-[#D0B89A]',
  'from-[#C4A882] to-[#B39570]',
];

interface Props {
  patients: Patient[];
  onPatientClick?: (patient: Patient) => void;
}

function getDaysAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Vandaag';
  if (diffDays === 1) return 'Gisteren';
  return `${diffDays} dagen geleden`;
}

export function WidgetRecentPatients({ patients, onPatientClick }: Props) {
  return (
    <div className="glass-card rounded-2xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[rgba(245,230,211,0.95)]">Recente patiënten</h2>
        <Link
          href="/patients"
          className="text-sm text-[#EAD8C0] hover:text-[#F5E6D3] transition-colors"
        >
          Bekijk alles →
        </Link>
      </div>

      {patients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-[rgba(234,216,192,0.2)]" />
          </div>
          <p className="text-[rgba(234,216,192,0.4)] text-sm">Geen patiënten</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1 overflow-y-auto">
          {patients.map((patient, index) => {
            const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;
            const colorClass = avatarColors[index % avatarColors.length];

            return (
              <button
                key={patient.id}
                onClick={() => onPatientClick?.(patient)}
                className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xs font-semibold text-[#0E0C0A]">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgba(245,230,211,0.95)] truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-[rgba(234,216,192,0.4)]">
                    {getDaysAgo(patient.createdAt)} • #{patient.patientNumber}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
