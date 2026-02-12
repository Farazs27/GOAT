'use client';
import Link from 'next/link';
import { UserX, CheckCircle2 } from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  firstVisitDate: string;
  firstVisitType: string;
}

const typeLabels: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
  HYGIENE: 'Mondhygiëne',
};

interface Props {
  patients: Patient[];
}

export function WidgetWithoutFollowup({ patients }: Props) {
  return (
    <div className="glass-card rounded-2xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-[rgba(234,216,192,0.4)]" />
          <h2 className="text-sm font-semibold text-[rgba(245,230,211,0.95)]">Zonder vervolgafspraak</h2>
        </div>
        {patients.length > 0 && (
          <span className="px-2 py-1 rounded-lg bg-[rgba(245,230,211,0.06)] text-[#EAD8C0] text-xs font-medium border border-[rgba(245,230,211,0.12)]">
            {patients.length}
          </span>
        )}
      </div>

      {patients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 rounded-xl bg-[rgba(180,200,180,0.06)] flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-[rgba(180,200,180,0.7)]" />
          </div>
          <p className="text-[rgba(234,216,192,0.4)] text-sm text-center">
            Alle patiënten hebben een vervolgafspraak
          </p>
        </div>
      ) : (
        <div className="space-y-1 flex-1 overflow-y-auto">
          {patients.map((patient) => {
            const visitDate = new Date(patient.firstVisitDate);
            const formattedDate = visitDate.toLocaleDateString('nl-NL', {
              day: '2-digit',
              month: '2-digit',
            });

            return (
              <Link
                key={patient.id}
                href={`/patients/${patient.id}`}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgba(245,230,211,0.95)] truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-[rgba(234,216,192,0.4)]">
                    Eerste bezoek: {formattedDate} • {typeLabels[patient.firstVisitType] || patient.firstVisitType}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
