'use client';

import React from 'react';
import { ZoomOut, Maximize2, ZoomIn } from 'lucide-react';

export interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const ZOOM_LEVELS = [0.75, 1.0, 1.25] as const;

const ICONS = [
  { level: 0.75, Icon: ZoomOut, label: 'Verkleinen' },
  { level: 1.0, Icon: Maximize2, label: 'Standaard' },
  { level: 1.25, Icon: ZoomIn, label: 'Vergroten' },
] as const;

export default function ZoomControls({ zoom, onZoomChange }: ZoomControlsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      {ICONS.map(({ level, Icon, label }) => {
        const isActive = Math.abs(zoom - level) < 0.01;
        return (
          <button
            key={level}
            type="button"
            title={label}
            onClick={() => onZoomChange(level)}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
