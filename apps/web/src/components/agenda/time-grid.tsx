'use client';

import { ReactNode, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';

function DroppableSlot({ id, hour, minute, children }: { id: string; hour: number; minute: number; children?: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { hour, minute },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[30px] transition-colors duration-150 ${isOver ? 'bg-blue-500/10 ring-1 ring-blue-400/30 rounded-lg' : ''}`}
    >
      {children}
    </div>
  );
}

interface TimeGridProps {
  startHour?: number;
  endHour?: number;
  children?: ReactNode;
  /** Render content for a specific hour row */
  renderHourContent?: (hour: number, hourStr: string) => ReactNode;
  onSlotClick?: (hour: number, minute: number) => void;
  className?: string;
  droppable?: boolean;
}

export function TimeGrid({
  startHour = 8,
  endHour = 19,
  children,
  renderHourContent,
  onSlotClick,
  className,
  droppable = false,
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
          const content = renderHourContent?.(hour, hourStr);

          const contentArea = droppable ? (
            <div className="flex-1">
              <DroppableSlot id={`slot-${hourStr}-00`} hour={hour} minute={0}>
                <div className="p-2">{content}</div>
              </DroppableSlot>
              <DroppableSlot id={`slot-${hourStr}-30`} hour={hour} minute={30}>
                <div className="p-1 border-t border-white/[0.03]" />
              </DroppableSlot>
            </div>
          ) : (
            <div className="flex-1 p-2">{content}</div>
          );

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
              {contentArea}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}
