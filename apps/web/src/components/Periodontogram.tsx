'use client';

import { useState, useEffect, useMemo } from 'react';

interface PeriodontogramProps {
  patientId: string;
  appointmentId?: string;
}

interface ChartData {
  upper: {
    buccal: Record<string, [number, number, number]>;
    palatal: Record<string, [number, number, number]>;
  };
  lower: {
    buccal: Record<string, [number, number, number]>;
    lingual: Record<string, [number, number, number]>;
  };
}

const sections = [
  { key: 'upper.buccal', label: 'Boven Buccaal', teeth: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28] },
  { key: 'upper.palatal', label: 'Boven Palataal', teeth: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28] },
  { key: 'lower.buccal', label: 'Onder Buccaal', teeth: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38] },
  { key: 'lower.lingual', label: 'Onder Linguaal', teeth: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38] },
];

// Static color classes — never use dynamic Tailwind interpolation
const depthColors = {
  empty: {
    bg: 'bg-white/5',
    text: 'text-white/20',
    border: 'border-white/10',
  },
  healthy: {
    bg: 'bg-green-500/15',
    text: 'text-green-300',
    border: 'border-green-500/30',
  },
  moderate: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  severe: {
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    border: 'border-red-500/30',
  },
};

const getDepthCategory = (value: number | undefined) => {
  if (!value || value === 0) return 'empty';
  if (value <= 3) return 'healthy';
  if (value <= 5) return 'moderate';
  return 'severe';
};

const getColorClasses = (value: number | undefined) => {
  return depthColors[getDepthCategory(value)];
};

// SVG bar color for mini chart
const getBarColor = (value: number): string => {
  if (value <= 3) return '#22c55e';
  if (value <= 5) return '#f59e0b';
  return '#ef4444';
};

export default function Periodontogram({ patientId, appointmentId }: PeriodontogramProps) {
  const [chartData, setChartData] = useState<ChartData>({
    upper: { buccal: {}, palatal: {} },
    lower: { buccal: {}, lingual: {} },
  });
  const [activeSection, setActiveSection] = useState(0);
  const [activeTooth, setActiveTooth] = useState(0);
  const [activePoint, setActivePoint] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `/api/patients/${patientId}/odontogram/periodontal`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.chartData) setChartData(data.chartData);
        }
      } catch (error) {
        console.error('Failed to load periodontal chart:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  // Save data
  const saveData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `/api/patients/${patientId}/odontogram/periodontal`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ appointmentId, chartData }),
        }
      );
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save periodontal chart:', error);
    }
  };

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!/^[0-9]$/.test(e.key)) return;
      e.preventDefault();

      const value = parseInt(e.key, 10);
      const section = sections[activeSection];
      const tooth = section.teeth[activeTooth];

      setChartData((prev) => {
        const newData = { ...prev };
        const [area, surface] = section.key.split('.') as [keyof ChartData, string];
        if (!(newData[area] as any)[surface]) {
          (newData[area] as any)[surface] = {} as any;
        }
        const currentValues = (newData[area] as any)[surface][tooth.toString()] || [0, 0, 0];
        const newValues: [number, number, number] = [...currentValues] as [number, number, number];
        newValues[activePoint] = value;
        ((newData[area] as any)[surface] as Record<string, [number, number, number]>)[tooth.toString()] = newValues;
        return newData;
      });

      let newSection = activeSection;
      let newTooth = activeTooth;
      let newPoint = activePoint + 1;

      if (newPoint > 2) {
        newPoint = 0;
        newTooth++;
        if (newTooth >= section.teeth.length) {
          newTooth = 0;
          newSection++;
          if (newSection >= sections.length) {
            saveData();
            newSection = sections.length - 1;
            newTooth = section.teeth.length - 1;
            newPoint = 2;
            return;
          }
        }
      }

      setActivePoint(newPoint);
      setActiveTooth(newTooth);
      setActiveSection(newSection);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, activeTooth, activePoint, chartData, patientId, appointmentId]);

  const resetChart = () => {
    setChartData({ upper: { buccal: {}, palatal: {} }, lower: { buccal: {}, lingual: {} } });
    setActiveSection(0);
    setActiveTooth(0);
    setActivePoint(0);
  };

  const getValue = (sectionKey: string, tooth: number, point: number): number | undefined => {
    const [area, surface] = sectionKey.split('.') as [keyof ChartData, string];
    const values = (chartData[area] as any)?.[surface]?.[tooth.toString()];
    return values?.[point];
  };

  const isActive = (sectionIndex: number, toothIndex: number, pointIndex: number): boolean => {
    return activeSection === sectionIndex && activeTooth === toothIndex && activePoint === pointIndex;
  };

  // Compute summary stats
  const stats = useMemo(() => {
    let totalMeasured = 0;
    let totalDepth = 0;
    let countValues = 0;
    let teethWith4Plus = new Set<string>();
    let teethWith6Plus = new Set<string>();

    for (const section of sections) {
      const [area, surface] = section.key.split('.') as [keyof ChartData, string];
      const sectionData = (chartData[area] as any)?.[surface] || {};

      for (const toothStr of Object.keys(sectionData)) {
        const values = sectionData[toothStr] as [number, number, number];
        if (!values) continue;

        const hasValue = values.some((v: number) => v > 0);
        if (hasValue) {
          totalMeasured++;
          for (const v of values) {
            if (v > 0) {
              totalDepth += v;
              countValues++;
              if (v >= 4) teethWith4Plus.add(`${section.key}-${toothStr}`);
              if (v >= 6) teethWith6Plus.add(`${section.key}-${toothStr}`);
            }
          }
        }
      }
    }

    return {
      totalMeasured,
      avgDepth: countValues > 0 ? (totalDepth / countValues).toFixed(1) : '0.0',
      teethWith4Plus: teethWith4Plus.size,
      teethWith6Plus: teethWith6Plus.size,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="glass-light rounded-xl p-8 flex items-center justify-center">
        <p className="text-white/50">Laden...</p>
      </div>
    );
  }

  const progress = ((activeSection * 100) + (activeTooth / sections[activeSection].teeth.length * 100)) / sections.length;

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="glass-card rounded-xl p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white/90">{stats.totalMeasured}</p>
            <p className="text-xs text-white/50 mt-1">Gemeten punten</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white/90">{stats.avgDepth} mm</p>
            <p className="text-xs text-white/50 mt-1">Gem. diepte</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-300">{stats.teethWith4Plus}</p>
            <p className="text-xs text-white/50 mt-1">&ge; 4 mm</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-300">{stats.teethWith6Plus}</p>
            <p className="text-xs text-white/50 mt-1">&ge; 6 mm</p>
          </div>
        </div>
      </div>

      {/* Header with progress */}
      <div className="glass-light rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white/90 mb-1">Parodontogram</h2>
            <p className="text-white/50 text-sm">
              Sectie {activeSection + 1}/4 &mdash; {sections[activeSection].label}
            </p>
          </div>
          <div className="flex gap-3">
            {saved && (
              <span className="text-emerald-300 text-sm self-center animate-pulse">Opgeslagen</span>
            )}
            <button
              onClick={resetChart}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/90 rounded-lg transition-colors text-sm"
            >
              Reset
            </button>
            <button
              onClick={saveData}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm font-medium"
            >
              Opslaan
            </button>
          </div>
        </div>

        {/* Section navigation tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-lg">
          {sections.map((section, idx) => (
            <button
              key={section.key}
              onClick={() => {
                setActiveSection(idx);
                setActiveTooth(0);
                setActivePoint(0);
              }}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                activeSection === idx
                  ? 'bg-blue-500/20 text-blue-300 shadow-sm'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/5 rounded-full h-2">
          <div
            className="bg-blue-500/50 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Chart sections */}
      <div className="space-y-5">
        {sections.map((section, sectionIndex) => (
          <div
            key={section.key}
            className={`glass-light rounded-xl p-5 transition-all duration-300 ${
              activeSection === sectionIndex
                ? 'ring-2 ring-blue-400/60 shadow-lg shadow-blue-500/5'
                : 'opacity-60'
            }`}
            onClick={() => {
              if (activeSection !== sectionIndex) {
                setActiveSection(sectionIndex);
                setActiveTooth(0);
                setActivePoint(0);
              }
            }}
          >
            <h3 className="text-white/90 font-semibold text-sm mb-4 tracking-wide uppercase">
              {section.label}
            </h3>

            <div className="overflow-x-auto pb-2">
              <div className="inline-flex flex-col gap-2 min-w-max">
                {/* Tooth numbers */}
                <div className="flex gap-1.5">
                  {section.teeth.map((tooth) => (
                    <div key={tooth} className="w-[78px] text-center">
                      <span className="text-white/60 text-xs font-bold">{tooth}</span>
                    </div>
                  ))}
                </div>

                {/* Measurement points — larger tap targets */}
                <div className="flex gap-1.5">
                  {section.teeth.map((tooth, toothIndex) => (
                    <div key={tooth} className="flex gap-0.5">
                      {[0, 1, 2].map((point) => {
                        const value = getValue(section.key, tooth, point);
                        const active = isActive(sectionIndex, toothIndex, point);
                        const colors = getColorClasses(value);

                        return (
                          <button
                            key={point}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSection(sectionIndex);
                              setActiveTooth(toothIndex);
                              setActivePoint(point);
                            }}
                            className={`w-[25px] h-8 flex items-center justify-center text-xs font-bold rounded-md border transition-all duration-150 cursor-pointer ${
                              active
                                ? 'ring-2 ring-blue-400 bg-blue-500/25 border-blue-400/50 text-blue-200 scale-110 shadow-lg shadow-blue-500/20'
                                : `${colors.bg} ${colors.text} ${colors.border} hover:brightness-125`
                            }`}
                          >
                            {value || ''}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Point labels */}
                <div className="flex gap-1.5">
                  {section.teeth.map((tooth) => (
                    <div key={tooth} className="flex gap-0.5">
                      <div className="w-[25px] text-center text-white/25 text-[9px] font-medium">M</div>
                      <div className="w-[25px] text-center text-white/25 text-[9px] font-medium">B</div>
                      <div className="w-[25px] text-center text-white/25 text-[9px] font-medium">D</div>
                    </div>
                  ))}
                </div>

                {/* Mini SVG depth visualization */}
                <div className="flex gap-1.5 mt-2">
                  {section.teeth.map((tooth) => {
                    const values = [0, 1, 2].map((p) => getValue(section.key, tooth, p) || 0);
                    const maxBarHeight = 28;
                    const maxDepth = 10;

                    return (
                      <div key={tooth} className="w-[78px] flex justify-center">
                        <svg width="60" height={maxBarHeight + 2} className="overflow-visible">
                          {values.map((v, i) => {
                            const barHeight = v > 0 ? Math.max(3, (v / maxDepth) * maxBarHeight) : 0;
                            const barWidth = 16;
                            const x = i * 20 + 2;
                            const y = maxBarHeight - barHeight;

                            return v > 0 ? (
                              <rect
                                key={i}
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                rx={2}
                                fill={getBarColor(v)}
                                opacity={0.7}
                              />
                            ) : null;
                          })}
                          {/* Threshold line at 4mm */}
                          <line
                            x1="0"
                            y1={maxBarHeight - (4 / maxDepth) * maxBarHeight}
                            x2="62"
                            y2={maxBarHeight - (4 / maxDepth) * maxBarHeight}
                            stroke="#f59e0b"
                            strokeWidth="0.5"
                            strokeDasharray="2,2"
                            opacity="0.4"
                          />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend + instructions */}
      <div className="glass-light rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-center gap-6 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500/40 border border-green-500/50" />
            <span className="text-white/50 text-xs">1-3 mm (gezond)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-500/40 border border-amber-500/50" />
            <span className="text-white/50 text-xs">4-5 mm (matig)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500/40 border border-red-500/50" />
            <span className="text-white/50 text-xs">6+ mm (ernstig)</span>
          </div>
        </div>
        <p className="text-white/40 text-xs text-center">
          Gebruik de cijfertoetsen (0-9) om metingen in te voeren. De cursor vordert automatisch. Klik op een cel om de positie te wijzigen.
        </p>
      </div>
    </div>
  );
}
