'use client';

import React from 'react';

interface ToothSVGProps {
  toothNumber: number;
  isSelected?: boolean;
  isMissing?: boolean;
  width?: number;
  height?: number;
}

export default function ToothSVG({ toothNumber, isSelected = false, isMissing = false, width = 60, height = 80 }: ToothSVGProps) {
  const quadrant = Math.floor(toothNumber / 10);
  const isUpper = quadrant === 1 || quadrant === 2;
  const digit = toothNumber % 10;
  const isMolar = digit >= 6;
  const isPremolar = digit === 4 || digit === 5;
  const isCanine = digit === 3;

  const fill = isSelected ? '#3b82f6' : '#64748b';
  const opacity = isSelected ? 0.7 : 0.4;

  if (isMissing) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 80">
        <rect x={10} y={10} width={40} height={60} rx={6} fill="none" stroke="#475569" strokeWidth={1} strokeDasharray="4 3" opacity={0.3} />
        <line x1={15} y1={15} x2={45} y2={65} stroke="#475569" strokeWidth={1} opacity={0.2} />
        <line x1={45} y1={15} x2={15} y2={65} stroke="#475569" strokeWidth={1} opacity={0.2} />
      </svg>
    );
  }

  if (isMolar) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 80">
        {isUpper ? (
          <>
            <rect x={8} y={2} width={44} height={30} rx={8} fill={fill} opacity={opacity} />
            <path d="M18 32 L15 72 Q15 76 19 76" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
            <path d="M30 32 L30 74" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
            <path d="M42 32 L45 72 Q45 76 41 76" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
          </>
        ) : (
          <>
            <path d="M18 4 L15 42" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
            <path d="M42 4 L45 42" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
            <rect x={8} y={46} width={44} height={30} rx={8} fill={fill} opacity={opacity} />
          </>
        )}
      </svg>
    );
  }

  if (isPremolar) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 80">
        {isUpper ? (
          <>
            <rect x={12} y={2} width={36} height={26} rx={7} fill={fill} opacity={opacity} />
            <path d="M22 28 L19 72 Q19 76 23 76" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
            <path d="M38 28 L41 72 Q41 76 37 76" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
          </>
        ) : (
          <>
            <path d="M30 4 L30 48" stroke={fill} strokeWidth={3} fill="none" opacity={opacity} />
            <rect x={12} y={50} width={36} height={26} rx={7} fill={fill} opacity={opacity} />
          </>
        )}
      </svg>
    );
  }

  if (isCanine) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 80">
        {isUpper ? (
          <>
            <path d="M15 28 Q15 2 30 2 Q45 2 45 28 Z" fill={fill} opacity={opacity} />
            <path d="M30 28 L30 76" stroke={fill} strokeWidth={3} fill="none" opacity={opacity} />
          </>
        ) : (
          <>
            <path d="M30 4 L30 48" stroke={fill} strokeWidth={3} fill="none" opacity={opacity} />
            <path d="M15 48 Q15 78 30 78 Q45 78 45 48 Z" fill={fill} opacity={opacity} />
          </>
        )}
      </svg>
    );
  }

  // Incisor
  return (
    <svg width={width} height={height} viewBox="0 0 60 80">
      {isUpper ? (
        <>
          <rect x={16} y={2} width={28} height={26} rx={6} fill={fill} opacity={opacity} />
          <path d="M30 28 L30 76" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
        </>
      ) : (
        <>
          <path d="M30 4 L30 48" stroke={fill} strokeWidth={2.5} fill="none" opacity={opacity} />
          <rect x={16} y={50} width={28} height={26} rx={6} fill={fill} opacity={opacity} />
        </>
      )}
    </svg>
  );
}
