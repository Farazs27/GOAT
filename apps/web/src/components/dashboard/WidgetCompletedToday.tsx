'use client';

import { Activity } from 'lucide-react';

interface Props {
  completed: number;
  total: number;
  onClick?: () => void;
}

export function WidgetCompletedToday({ completed, total, onClick }: Props) {
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
              style={{ backgroundColor: 'rgba(234,216,192,0.06)' }}
            >
              <Activity className="w-4 h-4" style={{ color: '#EAD8C0' }} />
            </div>
          </div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: 'rgba(234,216,192,0.5)' }}
          >
            Afgerond vandaag
          </p>
          <p
            className="text-2xl font-semibold"
            style={{
              color: 'rgba(245,230,211,0.95)',
              letterSpacing: '-0.02em',
            }}
          >
            {completed}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'rgba(234,216,192,0.35)' }}
          >
            van {total} afspraken
          </p>
        </div>
      </div>
    </div>
  );
}
