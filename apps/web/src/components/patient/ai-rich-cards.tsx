'use client';

import { useState, useCallback, useEffect } from 'react';
import { Calendar, ClipboardList, Receipt, Image as ImageIcon, Clock, X } from 'lucide-react';
import NextImage from 'next/image';

// --- Types ---

interface AppointmentCardData {
  type: 'appointment';
  appointmentType: string;
  practitionerName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface TreatmentPlanCardData {
  type: 'treatment_plan';
  name: string;
  status: string;
  treatments: Array<{
    description: string;
    toothNumber?: number;
    nzaCode?: string;
  }>;
  completedCount: number;
  totalCount: number;
}

interface InvoiceCardData {
  type: 'invoice';
  invoiceNumber: string;
  date: string;
  total: number;
  status: string;
}

interface XrayThumbnailCardData {
  type: 'xray';
  imageUrl: string;
  description?: string;
  date?: string;
}

interface SlotPickerCardData {
  type: 'slot_picker';
  slots: Array<{ date: string; startTime: string; endTime: string }>;
}

interface BookingConfirmationCardData {
  type: 'booking_confirmation';
  appointmentType: string;
  practitionerName: string;
  date: string;
  startTime: string;
  endTime: string;
}

type RichCardData =
  | AppointmentCardData
  | TreatmentPlanCardData
  | InvoiceCardData
  | XrayThumbnailCardData
  | SlotPickerCardData
  | BookingConfirmationCardData;

interface RichCardsProps {
  cards: RichCardData[];
  onAction?: (action: string, payload?: unknown) => void;
}

// --- Status labels ---

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING_APPROVAL: { label: 'In afwachting', className: 'bg-yellow-500/20 text-yellow-300' },
  CONFIRMED: { label: 'Bevestigd', className: 'bg-green-500/20 text-green-300' },
  COMPLETED: { label: 'Voltooid', className: 'bg-blue-500/20 text-blue-300' },
  CANCELLED: { label: 'Geannuleerd', className: 'bg-red-500/20 text-red-300' },
  DRAFT: { label: 'Concept', className: 'bg-gray-500/20 text-gray-300' },
  APPROVED: { label: 'Goedgekeurd', className: 'bg-green-500/20 text-green-300' },
  ACTIVE: { label: 'Actief', className: 'bg-blue-500/20 text-blue-300' },
  PAID: { label: 'Betaald', className: 'bg-green-500/20 text-green-300' },
  SENT: { label: 'Verstuurd', className: 'bg-yellow-500/20 text-yellow-300' },
  OVERDUE: { label: 'Verlopen', className: 'bg-red-500/20 text-red-300' },
};

const TYPE_LABELS: Record<string, string> = {
  CHECKUP: 'Controle',
  TREATMENT: 'Behandeling',
  HYGIENE: 'Mondhygiëne',
  EMERGENCY: 'Spoed',
  CONSULTATION: 'Consult',
};

function formatDateDutch(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABELS[status] ?? { label: status, className: 'bg-gray-500/20 text-gray-300' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  );
}

// --- Card Components ---

function AppointmentCard({ data }: { data: AppointmentCardData }) {
  return (
    <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-[#e8945a]" />
        <span className="text-sm font-medium text-white/80">Afspraak</span>
        <StatusBadge status={data.status} />
      </div>
      <div className="space-y-1 text-sm text-white/70">
        <p><span className="text-white/50">Type:</span> {TYPE_LABELS[data.appointmentType] ?? data.appointmentType}</p>
        <p><span className="text-white/50">Behandelaar:</span> {data.practitionerName}</p>
        <p><span className="text-white/50">Datum:</span> {formatDateDutch(data.date)}</p>
        <p><span className="text-white/50">Tijd:</span> {data.startTime} - {data.endTime}</p>
      </div>
    </div>
  );
}

function TreatmentPlanCard({ data }: { data: TreatmentPlanCardData }) {
  const progress = data.totalCount > 0 ? (data.completedCount / data.totalCount) * 100 : 0;
  return (
    <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-4 h-4 text-[#e8945a]" />
        <span className="text-sm font-medium text-white/80">Behandelplan</span>
        <StatusBadge status={data.status} />
      </div>
      <p className="text-sm font-medium text-white/90 mb-2">{data.name}</p>
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>Voortgang</span>
          <span>{data.completedCount}/{data.totalCount}</span>
        </div>
        <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#e8945a] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {data.treatments.length > 0 && (
        <ul className="space-y-1 text-xs text-white/60">
          {data.treatments.slice(0, 5).map((t, i) => (
            <li key={i} className="flex gap-2">
              {t.toothNumber && <span className="text-white/40">#{t.toothNumber}</span>}
              <span>{t.description}</span>
              {t.nzaCode && <span className="text-white/30 ml-auto">{t.nzaCode}</span>}
            </li>
          ))}
          {data.treatments.length > 5 && (
            <li className="text-white/40">+{data.treatments.length - 5} meer...</li>
          )}
        </ul>
      )}
    </div>
  );
}

function InvoiceCard({ data }: { data: InvoiceCardData }) {
  return (
    <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="w-4 h-4 text-[#e8945a]" />
        <span className="text-sm font-medium text-white/80">Factuur</span>
        <StatusBadge status={data.status} />
      </div>
      <div className="space-y-1 text-sm text-white/70">
        <p><span className="text-white/50">Nummer:</span> {data.invoiceNumber}</p>
        <p><span className="text-white/50">Datum:</span> {formatDateDutch(data.date)}</p>
        <p className="text-lg font-semibold text-white/90">
          &euro;{data.total.toFixed(2).replace('.', ',')}
        </p>
      </div>
    </div>
  );
}

function XrayThumbnailCard({ data }: { data: XrayThumbnailCardData }) {
  const [enlarged, setEnlarged] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEnlarged(false);
    },
    []
  );

  useEffect(() => {
    if (enlarged) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enlarged, handleKeyDown]);

  return (
    <>
      <div
        className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-4 mt-2 cursor-pointer hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300"
        onClick={() => setEnlarged(true)}
      >
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-[#e8945a]" />
          <span className="text-sm font-medium text-white/80">Röntgenfoto</span>
        </div>
        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black/30">
          <NextImage
            src={data.imageUrl}
            alt={data.description ?? 'Röntgenfoto'}
            fill
            className="object-cover"
            sizes="300px"
          />
        </div>
        {data.description && (
          <p className="text-xs text-white/50 mt-2">{data.description}</p>
        )}
        {data.date && (
          <p className="text-xs text-white/40">{formatDateDutch(data.date)}</p>
        )}
      </div>

      {/* Enlarged modal */}
      {enlarged && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center"
          onClick={() => setEnlarged(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            onClick={() => setEnlarged(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full m-4">
            <NextImage
              src={data.imageUrl}
              alt={data.description ?? 'Röntgenfoto'}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}

function SlotPickerCard({
  data,
  onAction,
}: {
  data: SlotPickerCardData;
  onAction?: (action: string, payload?: unknown) => void;
}) {
  return (
    <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#e8945a]" />
        <span className="text-sm font-medium text-white/80">Beschikbare tijdsloten</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => onAction?.('select_slot', { index: i + 1, slot })}
            className="bg-white/[0.05] border border-white/[0.12] rounded-2xl px-3 py-2 text-sm text-white/80 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300"
          >
            <span className="block text-xs text-white/50">{formatDateDutch(slot.date)}</span>
            <span className="font-medium">{slot.startTime}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export function RichCards({ cards, onAction }: RichCardsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="space-y-2">
      {cards.map((card, i) => {
        switch (card.type) {
          case 'appointment':
            return <AppointmentCard key={i} data={card} />;
          case 'treatment_plan':
            return <TreatmentPlanCard key={i} data={card} />;
          case 'invoice':
            return <InvoiceCard key={i} data={card} />;
          case 'xray':
            return <XrayThumbnailCard key={i} data={card} />;
          case 'slot_picker':
            return <SlotPickerCard key={i} data={card} onAction={onAction} />;
          case 'booking_confirmation':
            // Handled by BookingConfirmationCard separately
            return null;
          default:
            return null;
        }
      })}
    </div>
  );
}

export type { RichCardData, RichCardsProps };
