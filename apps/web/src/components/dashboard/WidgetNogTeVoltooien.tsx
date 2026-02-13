'use client';

import { ClipboardList } from 'lucide-react';

interface Props {
  count: number;
  overdueCount?: number;
  onClick?: () => void;
}

export function WidgetNogTeVoltooien({ count, overdueCount, onClick }: Props) {
  return (
    <div
      className="glass-card rounded-2xl p-4 h-full transition-all duration-200 hover:scale-[1.02] hover:border-white/[0.12] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(220,195,165,0.06)' }}
            >
              <ClipboardList className="w-4 h-4" style={{ color: '#DCC3A5' }} />
            </div>
          </div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: 'rgba(234,216,192,0.5)' }}
          >
            Nog te voltooien
          </p>
          <p
            className="text-2xl font-semibold"
            style={{
              color: 'rgba(245,230,211,0.95)',
              letterSpacing: '-0.02em',
            }}
          >
            {count}
          </p>
          {overdueCount && overdueCount > 0 ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold mt-1"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
            >
              {overdueCount} achterstallig
            </span>
          ) : null}
          <p
            className="text-xs mt-1"
            style={{ color: 'rgba(234,216,192,0.35)' }}
          >
            taken vandaag
          </p>
        </div>
      </div>
    </div>
  );
}
