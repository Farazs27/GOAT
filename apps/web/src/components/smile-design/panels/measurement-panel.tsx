'use client';

import { useDsdStore } from '@/lib/smile-design/store';

export function MeasurementPanel() {
  const measurements = useDsdStore((s) => s.measurements);
  const calibration = useDsdStore((s) => s.calibration);

  if (!measurements) {
    return (
      <div className="text-sm text-[var(--text-tertiary)] text-center py-8">
        Plaats landmarks om metingen te berekenen
      </div>
    );
  }

  const items: Array<{ label: string; value: string | null; unit: string }> = [
    {
      label: 'Middellijn deviatie',
      value: measurements.midlineDeviationMm?.toFixed(1) ?? null,
      unit: 'mm',
    },
    {
      label: 'Middellijn hoek',
      value: measurements.midlineDeviationDeg?.toFixed(1) ?? null,
      unit: '°',
    },
    {
      label: 'Incisaal vlak hoek',
      value: measurements.incisalPlaneAngleDeg?.toFixed(1) ?? null,
      unit: '°',
    },
    {
      label: 'Breedte 11:21',
      value: measurements.widthRatios.r11_12?.toFixed(2) ?? null,
      unit: '',
    },
    {
      label: 'Centrale dominantie',
      value: measurements.centralDominance !== null ? `${(measurements.centralDominance * 100).toFixed(0)}%` : null,
      unit: '',
    },
    {
      label: 'RED proportie',
      value: measurements.redProportion !== null ? `${(measurements.redProportion * 100).toFixed(0)}%` : null,
      unit: '',
    },
    {
      label: 'Gouden snede afwijking',
      value: measurements.goldenProportionDeviation !== null
        ? `${measurements.goldenProportionDeviation > 0 ? '+' : ''}${(measurements.goldenProportionDeviation * 100).toFixed(1)}%`
        : null,
      unit: '',
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">Metingen</h2>

      {!calibration && (
        <div className="mb-4 px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 break-words">
          Kalibratie vereist voor mm-metingen
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white/[0.03]"
          >
            <span className="text-[11px] text-[var(--text-secondary)] truncate">{item.label}</span>
            <span className="text-xs font-mono text-[var(--text-primary)] flex-shrink-0">
              {item.value !== null ? `${item.value}${item.unit}` : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Proportion indicators */}
      {measurements.redProportion !== null && (
        <div className="mt-4">
          <h3 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Proportie analyse
          </h3>
          <ProportionBar label="RED" value={measurements.redProportion} target={0.70} range={[0.60, 0.80]} />
          <ProportionBar label="Gouden snede" value={measurements.redProportion} target={0.618} range={[0.55, 0.68]} />
        </div>
      )}
    </div>
  );
}

function ProportionBar({ label, value, target, range }: {
  label: string; value: number; target: number; range: [number, number];
}) {
  const min = range[0];
  const max = range[1];
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const targetPct = ((target - min) / (max - min)) * 100;
  const inRange = value >= range[0] && value <= range[1];

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[var(--text-tertiary)]">{label}</span>
        <span className={inRange ? 'text-green-400' : 'text-amber-400'}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/30"
          style={{ left: `${targetPct}%` }}
        />
        {/* Value */}
        <div
          className={`absolute top-0 bottom-0 w-2 rounded-full ${inRange ? 'bg-green-500' : 'bg-amber-500'}`}
          style={{ left: `${Math.max(0, pct - 1)}%` }}
        />
      </div>
    </div>
  );
}
