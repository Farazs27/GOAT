'use client';

import React from 'react';
import type { PerioToothData } from '@/../../packages/shared-types/src/odontogram';

interface IndicatorRowsProps {
  teeth: number[];
  perioData: Record<string, PerioToothData>;
  side: 'buccal' | 'palatal';
}

const TOOTH_WIDTH = 42;

interface DotRowProps {
  teeth: number[];
  perioData: Record<string, PerioToothData>;
  side: 'buccal' | 'palatal';
  field: 'bleeding' | 'plaque' | 'pus';
  activeColor: string;
  inactiveColor: string;
  activeBorder: string;
  label: string;
}

function DotRow({ teeth, perioData, side, field, activeColor, inactiveColor, activeBorder, label }: DotRowProps) {
  return (
    <div className="flex items-center group">
      <span className="w-20 text-[9px] font-semibold text-slate-600 text-right pr-3 shrink-0 uppercase tracking-wider group-hover:text-slate-400 transition-colors">
        {label}
      </span>
      <div className="flex">
        {teeth.map((fdi) => {
          const data = perioData[String(fdi)];
          const values = data?.[side]?.[field] ?? [false, false, false];
          return (
            <div
              key={fdi}
              className="flex items-center justify-center gap-[3px]"
              style={{ width: TOOTH_WIDTH }}
            >
              {values.map((val: boolean, i: number) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full border transition-all duration-150 hover:scale-125 cursor-default ${
                    val
                      ? `${activeColor} ${activeBorder} shadow-sm`
                      : `${inactiveColor} border-slate-700/50 hover:border-slate-500`
                  }`}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IndicatorRows({ teeth, perioData, side }: IndicatorRowsProps) {
  return (
    <div className="flex flex-col gap-[3px] py-1">
      <DotRow
        teeth={teeth}
        perioData={perioData}
        side={side}
        field="plaque"
        activeColor="bg-blue-500"
        activeBorder="border-blue-400"
        inactiveColor="bg-transparent"
        label="TANDPLAK"
      />
      <DotRow
        teeth={teeth}
        perioData={perioData}
        side={side}
        field="bleeding"
        activeColor="bg-red-500"
        activeBorder="border-red-400"
        inactiveColor="bg-transparent"
        label="BLOEDING"
      />
      <DotRow
        teeth={teeth}
        perioData={perioData}
        side={side}
        field="pus"
        activeColor="bg-yellow-500"
        activeBorder="border-yellow-400"
        inactiveColor="bg-transparent"
        label="PUS"
      />
    </div>
  );
}
