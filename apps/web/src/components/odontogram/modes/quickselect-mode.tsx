'use client';

import { useState, useCallback } from 'react';

interface QuickselectModeProps {
  teeth: Array<{ toothNumber: number; status: string }>;
  surfaces: Array<{ toothNumber: number; surface: string; condition: string; material?: string | null }>;
  onBatchApply: (data: {
    treatmentType: string;
    toothNumbers: number[];
    condition: string;
  }) => void;
}

const TREATMENT_TYPES = [
  { id: 'CARIES', label: 'Cariës', bgClass: 'bg-red-100', textClass: 'text-red-700', borderClass: 'border-red-300', activeBg: 'bg-red-500', activeText: 'text-white' },
  { id: 'FILLING', label: 'Vulling', bgClass: 'bg-blue-100', textClass: 'text-blue-700', borderClass: 'border-blue-300', activeBg: 'bg-blue-500', activeText: 'text-white' },
  { id: 'CROWN', label: 'Kroon', bgClass: 'bg-amber-100', textClass: 'text-amber-700', borderClass: 'border-amber-300', activeBg: 'bg-amber-500', activeText: 'text-white' },
  { id: 'ENDO', label: 'Endo', bgClass: 'bg-orange-100', textClass: 'text-orange-700', borderClass: 'border-orange-300', activeBg: 'bg-orange-500', activeText: 'text-white' },
  { id: 'EXTRACTION', label: 'Extractie', bgClass: 'bg-gray-100', textClass: 'text-gray-700', borderClass: 'border-gray-300', activeBg: 'bg-gray-500', activeText: 'text-white' },
  { id: 'IMPLANT', label: 'Implantaat', bgClass: 'bg-purple-100', textClass: 'text-purple-700', borderClass: 'border-purple-300', activeBg: 'bg-purple-500', activeText: 'text-white' },
];

const TOOTH_CONDITION_CLASSES: Record<string, string> = {
  CARIES: 'bg-red-500 text-white border-red-600',
  FILLING: 'bg-blue-500 text-white border-blue-600',
  CROWN: 'bg-amber-500 text-white border-amber-600',
  ENDO: 'bg-orange-500 text-white border-orange-600',
  EXTRACTION: 'bg-gray-500 text-white border-gray-600',
  IMPLANT: 'bg-purple-500 text-white border-purple-600',
};

const TOOTH_ROWS = [
  [18, 17, 16, 15, 14, 13, 12, 11],
  [21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41],
  [31, 32, 33, 34, 35, 36, 37, 38],
];

const ROW_LABELS = ['Rechtsboven', 'Linksboven', 'Rechtsonder', 'Linksonder'];

export default function QuickselectMode({ teeth, surfaces, onBatchApply }: QuickselectModeProps) {
  const [activeTreatment, setActiveTreatment] = useState<string>('CARIES');
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set());

  const toggleTooth = useCallback((toothNumber: number) => {
    setSelectedTeeth((prev) => {
      const next = new Set(prev);
      if (next.has(toothNumber)) {
        next.delete(toothNumber);
      } else {
        next.add(toothNumber);
      }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    if (selectedTeeth.size === 0) return;
    onBatchApply({
      treatmentType: activeTreatment,
      toothNumbers: Array.from(selectedTeeth).sort((a, b) => a - b),
      condition: activeTreatment,
    });
    setSelectedTeeth(new Set());
  }, [activeTreatment, selectedTeeth, onBatchApply]);

  const handleClear = useCallback(() => {
    setSelectedTeeth(new Set());
  }, []);

  const activeConfig = TREATMENT_TYPES.find((t) => t.id === activeTreatment)!;

  return (
    <div className="flex flex-col gap-4">
      {/* Treatment type toolbar */}
      <div className="flex flex-wrap gap-2">
        {TREATMENT_TYPES.map((type) => {
          const isActive = activeTreatment === type.id;
          return (
            <button
              key={type.id}
              onClick={() => {
                setActiveTreatment(type.id);
                setSelectedTeeth(new Set());
              }}
              className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                isActive
                  ? `${type.activeBg} ${type.activeText} border-transparent shadow-md`
                  : `${type.bgClass} ${type.textClass} ${type.borderClass} hover:opacity-80`
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Tooth grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          {TOOTH_ROWS.map((row, rowIndex) => (
            <div key={rowIndex}>
              <p className="text-xs text-gray-400 mb-1 font-medium">{ROW_LABELS[rowIndex]}</p>
              <div className="flex gap-1.5">
                {row.map((toothNumber) => {
                  const isSelected = selectedTeeth.has(toothNumber);
                  const existingCondition = teeth.find(
                    (t) => t.toothNumber === toothNumber && t.status !== 'HEALTHY'
                  )?.status;

                  let className =
                    'w-10 h-10 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ';

                  if (isSelected) {
                    className += TOOTH_CONDITION_CLASSES[activeTreatment] + ' ring-2 ring-offset-1 ring-gray-900';
                  } else if (existingCondition && TOOTH_CONDITION_CLASSES[existingCondition]) {
                    className += TOOTH_CONDITION_CLASSES[existingCondition] + ' opacity-60';
                  } else {
                    className += 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
                  }

                  return (
                    <button
                      key={toothNumber}
                      onClick={() => toggleTooth(toothNumber)}
                      className={className}
                    >
                      {toothNumber}
                    </button>
                  );
                })}
              </div>
              {rowIndex === 1 && (
                <div className="border-b border-dashed border-gray-300 my-3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{selectedTeeth.size}</span>{' '}
          {selectedTeeth.size === 1 ? 'tand' : 'tanden'} geselecteerd
          {selectedTeeth.size > 0 && (
            <span className={`ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium ${activeConfig.activeBg} ${activeConfig.activeText}`}>
              {activeConfig.label}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            disabled={selectedTeeth.size === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Wissen
          </button>
          <button
            onClick={handleApply}
            disabled={selectedTeeth.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Toepassen
          </button>
        </div>
      </div>
    </div>
  );
}
