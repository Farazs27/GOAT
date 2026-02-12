'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Settings2 } from 'lucide-react';

export interface WidgetConfig {
  id: string;
  visible: boolean;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: [
    { id: 'appointments-today', visible: true },
    { id: 'nog-te-voltooien', visible: true },
    { id: 'completed-today', visible: true },
    { id: 'behandelplannen', visible: true },
    { id: 'in-progress-banner', visible: true },
    { id: 'agenda-today', visible: true },
    { id: 'recent-patients', visible: true },
    { id: 'without-followup', visible: true },
  ],
};

const WIDGET_LABELS: Record<string, string> = {
  'appointments-today': 'Afspraken vandaag',
  'nog-te-voltooien': 'Nog te voltooien',
  'completed-today': 'Afgerond vandaag',
  'behandelplannen': 'Behandelplannen',
  'in-progress-banner': 'Nu in behandeling',
  'agenda-today': 'Agenda vandaag',
  'recent-patients': 'Recente patiënten',
  'without-followup': 'Zonder vervolgafspraak',
};

const WIDGET_SIZES: Record<string, string> = {
  'appointments-today': 'col-span-1',
  'nog-te-voltooien': 'col-span-1',
  'completed-today': 'col-span-1',
  'behandelplannen': 'col-span-1',
  'in-progress-banner': 'col-span-1 md:col-span-2 xl:col-span-4',
  'agenda-today': 'col-span-1 md:col-span-2 xl:col-span-2',
  'recent-patients': 'col-span-1 md:col-span-2 xl:col-span-2',
  'without-followup': 'col-span-1 md:col-span-2 xl:col-span-2',
};

interface SortableWidgetProps {
  id: string;
  isEditing: boolean;
  isVisible: boolean;
  onToggleVisibility: (id: string) => void;
  children: React.ReactNode;
}

function SortableWidget({ id, isEditing, isVisible, onToggleVisibility, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isVisible ? 1 : 0.4,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${WIDGET_SIZES[id] || 'col-span-1'} relative ${!isVisible && !isEditing ? 'hidden' : ''}`}
    >
      {isEditing && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <button
            onClick={() => onToggleVisibility(id)}
            className="p-2 rounded-2xl backdrop-blur-xl border border-white/[0.08] text-[rgba(234,216,192,0.5)] hover:text-[#EAD8C0] hover:border-white/[0.12] transition-all duration-300"
            style={{ background: 'rgba(14, 12, 10, 0.6)' }}
            title={isVisible ? 'Verbergen' : 'Tonen'}
          >
            {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <div
            {...attributes}
            {...listeners}
            className="p-2 rounded-2xl backdrop-blur-xl border border-white/[0.08] text-[rgba(234,216,192,0.5)] hover:text-[#EAD8C0] hover:border-white/[0.12] transition-all duration-300 cursor-grab active:cursor-grabbing"
            style={{ background: 'rgba(14, 12, 10, 0.6)' }}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>
      )}
      {isEditing && (
        <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-[rgba(245,230,211,0.12)] pointer-events-none z-[5]" />
      )}
      {children}
    </div>
  );
}

interface DashboardGridProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  widgetRenderers: Record<string, React.ReactNode>;
}

export function DashboardGrid({ layout, onLayoutChange, widgetRenderers }: DashboardGridProps) {
  const [isEditing, setIsEditing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = layout.widgets.findIndex((w) => w.id === active.id);
        const newIndex = layout.widgets.findIndex((w) => w.id === over.id);
        const newWidgets = arrayMove(layout.widgets, oldIndex, newIndex);
        onLayoutChange({ widgets: newWidgets });
      }
    },
    [layout, onLayoutChange],
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      const newWidgets = layout.widgets.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w,
      );
      onLayoutChange({ widgets: newWidgets });
    },
    [layout, onLayoutChange],
  );

  const widgetIds = layout.widgets.map((w) => w.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'rgba(245,230,211,0.95)' }}>
            Welkom terug
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(234,216,192,0.4)' }}>
            Overzicht van uw praktijk vandaag
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
            isEditing
              ? 'btn-liquid-primary'
              : 'btn-liquid-secondary'
          }`}
        >
          <Settings2 className="h-4 w-4" />
          {isEditing ? 'Opslaan' : 'Aanpassen'}
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 glass-light rounded-2xl flex items-center gap-3 text-xs" style={{ color: 'rgba(234,216,192,0.4)' }}>
          <GripVertical className="h-4 w-4" style={{ color: 'rgba(234,216,192,0.3)' }} />
          Sleep widgets om de volgorde te wijzigen. Klik op het oog-icoon om widgets te verbergen of tonen.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <div className="grid gap-3.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            {layout.widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                id={widget.id}
                isEditing={isEditing}
                isVisible={widget.visible}
                onToggleVisibility={toggleVisibility}
              >
                {widgetRenderers[widget.id] || (
                  <div className="glass-card rounded-3xl p-6 h-full flex items-center justify-center">
                    <p className="text-xs" style={{ color: 'rgba(234,216,192,0.25)' }}>{WIDGET_LABELS[widget.id] || widget.id}</p>
                  </div>
                )}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
