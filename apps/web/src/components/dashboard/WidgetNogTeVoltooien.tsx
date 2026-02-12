'use client';

import { ClipboardList } from 'lucide-react';

interface Props {
  count: number;
}

export function WidgetNogTeVoltooien({ count }: Props) {
  return (
    <div className="glass-card rounded-2xl p-4 h-full">
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
          <p
            className="text-xs mt-1"
            style={{ color: 'rgba(234,216,192,0.35)' }}
          >
            openstaande behandelplannen
          </p>
        </div>
      </div>
    </div>
  );
}
