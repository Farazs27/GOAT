'use client';

import { useState, useEffect } from 'react';

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

const getColorClass = (value: number | undefined) => {
  if (!value || value === 0) return 'bg-white/5 text-white/20';
  if (value >= 1 && value <= 3) return 'bg-emerald-500/20 text-emerald-300';
  if (value >= 4 && value <= 5) return 'bg-amber-500/20 text-amber-300';
  return 'bg-red-500/20 text-red-300';
};

export default function Periodontogram({ patientId, appointmentId }: PeriodontogramProps) {
  const [chartData, setChartData] = useState<ChartData>({
    upper: {
      buccal: {},
      palatal: {},
    },
    lower: {
      buccal: {},
      lingual: {},
    },
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
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.chartData) {
            setChartData(data.chartData);
          }
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
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointmentId,
            chartData,
          }),
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
      // Only handle digit keys
      if (!/^[0-9]$/.test(e.key)) return;

      e.preventDefault();

      const value = parseInt(e.key, 10);
      const section = sections[activeSection];
      const tooth = section.teeth[activeTooth];

      // Update chart data
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

      // Advance to next position
      let newSection = activeSection;
      let newTooth = activeTooth;
      let newPoint = activePoint + 1;

      if (newPoint > 2) {
        newPoint = 0;
        newTooth++;

        if (newTooth >= section.teeth.length) {
          newTooth = 0;
          newSection++;

          // Auto-save when all sections complete
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
    setChartData({
      upper: {
        buccal: {},
        palatal: {},
      },
      lower: {
        buccal: {},
        lingual: {},
      },
    });
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

  if (loading) {
    return (
      <div className="glass-light rounded-xl p-8 flex items-center justify-center">
        <p className="text-white/50">Laden...</p>
      </div>
    );
  }

  const progress = ((activeSection * 100) + (activeTooth / sections[activeSection].teeth.length * 100)) / sections.length;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="glass-light rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white/90 mb-1">Parodontogram</h2>
            <p className="text-white/50 text-sm">
              Sectie {activeSection + 1}/4 - {sections[activeSection].label}
            </p>
          </div>
          <div className="flex gap-3">
            {saved && (
              <span className="text-emerald-300 text-sm self-center">Opgeslagen</span>
            )}
            <button
              onClick={resetChart}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/90 rounded-lg transition-colors text-sm"
            >
              Reset
            </button>
            <button
              onClick={saveData}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm"
            >
              Opslaan
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/5 rounded-full h-2">
          <div
            className="bg-blue-500/50 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Chart sections */}
      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div
            key={section.key}
            className={`glass-light rounded-xl p-6 transition-all ${
              activeSection === sectionIndex ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            <h3 className="text-white/90 font-medium mb-4">{section.label}</h3>

            <div className="overflow-x-auto">
              <div className="inline-flex flex-col gap-2 min-w-max">
                {/* Tooth numbers */}
                <div className="flex gap-1">
                  {section.teeth.map((tooth) => (
                    <div key={tooth} className="w-[68px] text-center">
                      <span className="text-white/50 text-sm font-medium">{tooth}</span>
                    </div>
                  ))}
                </div>

                {/* Measurement points */}
                <div className="flex gap-1">
                  {section.teeth.map((tooth, toothIndex) => (
                    <div key={tooth} className="flex gap-1">
                      {[0, 1, 2].map((point) => {
                        const value = getValue(section.key, tooth, point);
                        const active = isActive(sectionIndex, toothIndex, point);

                        return (
                          <div
                            key={point}
                            className={`w-5 h-6 flex items-center justify-center text-xs font-medium rounded transition-all ${
                              active
                                ? 'ring-2 ring-blue-400 bg-blue-500/20'
                                : getColorClass(value)
                            }`}
                          >
                            {value || ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Point labels */}
                <div className="flex gap-1">
                  {section.teeth.map((tooth) => (
                    <div key={tooth} className="flex gap-1">
                      <div className="w-5 text-center text-white/30 text-[10px]">M</div>
                      <div className="w-5 text-center text-white/30 text-[10px]">M</div>
                      <div className="w-5 text-center text-white/30 text-[10px]">D</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="glass-light rounded-xl p-4">
        <p className="text-white/50 text-sm text-center">
          Gebruik de cijfertoetsen (0-9) om metingen in te voeren. De cursor vordert automatisch.
        </p>
      </div>
    </div>
  );
}
