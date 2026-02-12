'use client';

import { useDsdStore } from '@/lib/smile-design/store';
import {
  Hand, Target, Crosshair, ZoomIn, ZoomOut, RotateCcw,
  Eye, EyeOff, Layers,
} from 'lucide-react';
import type { CanvasMode } from '@/lib/smile-design/types';

export function CanvasToolbar() {
  const canvasMode = useDsdStore((s) => s.canvasMode);
  const zoom = useDsdStore((s) => s.zoom);
  const layers = useDsdStore((s) => s.layers);
  const setCanvasMode = useDsdStore((s) => s.setCanvasMode);
  const setZoom = useDsdStore((s) => s.setZoom);
  const setPanOffset = useDsdStore((s) => s.setPanOffset);
  const toggleLayer = useDsdStore((s) => s.toggleLayer);

  const modeButtons: Array<{ mode: CanvasMode; icon: typeof Hand; label: string }> = [
    { mode: 'pan', icon: Hand, label: 'Verschuiven' },
    { mode: 'landmark', icon: Target, label: 'Landmarks' },
    { mode: 'calibration', icon: Crosshair, label: 'Kalibratie' },
  ];

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1.5 rounded-2xl glass-light border border-white/[0.08]">
      {/* Mode buttons */}
      {modeButtons.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setCanvasMode(mode)}
          className={`p-2 rounded-xl transition-all ${
            canvasMode === mode
              ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-px h-5 bg-white/[0.08] mx-1" />

      {/* Zoom controls */}
      <button
        onClick={() => setZoom(zoom / 1.2)}
        className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-all"
        title="Uitzoomen"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-xs text-[var(--text-secondary)] w-10 text-center font-mono">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => setZoom(zoom * 1.2)}
        className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-all"
        title="Inzoomen"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
        className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-all"
        title="Reset"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-white/[0.08] mx-1" />

      {/* Layer toggles */}
      <button
        onClick={() => toggleLayer('landmarks')}
        className={`p-2 rounded-xl transition-all ${
          layers.landmarks ? 'text-blue-400' : 'text-[var(--text-tertiary)]'
        } hover:bg-white/[0.06]`}
        title="Landmarks"
      >
        <Target className="w-4 h-4" />
      </button>
      <button
        onClick={() => toggleLayer('derivedLines')}
        className={`p-2 rounded-xl transition-all ${
          layers.derivedLines ? 'text-cyan-400' : 'text-[var(--text-tertiary)]'
        } hover:bg-white/[0.06]`}
        title="Afgeleide lijnen"
      >
        <Layers className="w-4 h-4" />
      </button>
      <button
        onClick={() => toggleLayer('measurements')}
        className={`p-2 rounded-xl transition-all ${
          layers.measurements ? 'text-green-400' : 'text-[var(--text-tertiary)]'
        } hover:bg-white/[0.06]`}
        title="Metingen"
      >
        {layers.measurements ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  );
}
