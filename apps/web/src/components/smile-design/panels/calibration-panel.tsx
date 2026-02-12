'use client';

import { useDsdStore } from '@/lib/smile-design/store';
import { Crosshair, RotateCcw } from 'lucide-react';

export function CalibrationPanel() {
  const calibration = useDsdStore((s) => s.calibration);
  const canvasMode = useDsdStore((s) => s.canvasMode);
  const setCanvasMode = useDsdStore((s) => s.setCanvasMode);
  const setCalibration = useDsdStore((s) => s.setCalibration);

  const isCalibrating = canvasMode === 'calibration';

  return (
    <div>
      <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">Kalibratie</h2>

      <p className="text-xs text-[var(--text-secondary)] mb-4">
        Kalibreer de afbeelding door twee punten te selecteren waarvan de werkelijke afstand bekend is
        (bijv. de breedte van een centrale snijtand).
      </p>

      <button
        onClick={() => setCanvasMode(isCalibrating ? 'pan' : 'calibration')}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isCalibrating
            ? 'bg-[var(--accent-primary)] text-white'
            : 'glass-input hover:bg-white/[0.06]'
        }`}
      >
        <Crosshair className="w-4 h-4" />
        {isCalibrating ? 'Klik twee punten op de foto...' : 'Kalibratie starten'}
      </button>

      {calibration && (
        <div className="mt-4 space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-300">Gekalibreerd</span>
              <button
                onClick={() => setCanvasMode('calibration')}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Opnieuw
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Referentieafstand</span>
                <span className="font-mono text-[var(--text-primary)]">{calibration.knownDistanceMm.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Schaal</span>
                <span className="font-mono text-[var(--text-primary)]">{calibration.mmPerPixel.toFixed(4)} mm/px</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-[var(--text-tertiary)]">
        <p className="font-medium mb-1">Instructies:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Klik op &quot;Kalibratie starten&quot;</li>
          <li>Klik het eerste punt op de foto</li>
          <li>Klik het tweede punt</li>
          <li>Voer de bekende afstand in (mm)</li>
        </ol>
      </div>
    </div>
  );
}
