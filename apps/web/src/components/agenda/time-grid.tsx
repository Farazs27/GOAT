'use client';

import { ReactNode, useMemo } from 'react';

interface TimeGridProps {
  startHour?: number;
  endHour?: number;
  children?: ReactNode;
  /** Render content for a specific hour row */
  renderHourContent?: (hour: number, hourStr: string) => ReactNode;
  onSlotClick?: (hour: number, minute: number) => void;
  className?: string;
}

export function TimeGrid({
  startHour = 8,
  endHour = 19,
  children,
  renderHourContent,
  onSlotClick,
  className,
}: TimeGridProps) {
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour),
    [startHour, endHour]
  );

  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className || ''}`}>
      <div className="divide-y divide-white/5">
        {hours.map(hour => {
          const hourStr = String(hour).padStart(2, '0');
          const hasContent = renderHourContent !== undefined;
          const content = renderHourContent?.(hour, hourStr);

          return (
            <div
              key={hour}
              className="flex min-h-[60px]"
              onClick={onSlotClick ? () => onSlotClick(hour, 0) : undefined}
              style={onSlotClick ? { cursor: 'pointer' } : undefined}
            >
              {/* Time label */}
              <div className="w-20 flex-shrink-0 p-3 text-right border-r border-white/5">
                <span className={`text-sm font-mono ${content ? 'text-white/60' : 'text-white/20'}`}>
                  {hourStr}:00
                </span>
              </div>
              {/* Content area */}
              <div className="flex-1 p-2">
                {content}
              </div>
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}
