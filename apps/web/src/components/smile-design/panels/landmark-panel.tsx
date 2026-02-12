'use client';

import { useDsdStore } from '@/lib/smile-design/store';
import {
  FACIAL_LANDMARKS, DENTAL_LANDMARKS, LANDMARK_LABELS, LANDMARK_COLORS,
  isFacialLandmark,
} from '@/lib/smile-design/types';
import type { LandmarkType } from '@/lib/smile-design/types';
import { Target, Trash2, Check, Wand2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { autoDetectLandmarks, type DetectMode } from '@/lib/smile-design/engine/auto-detect';

export function LandmarkPanel() {
  const landmarks = useDsdStore((s) => s.landmarks);
  const activeLandmarkType = useDsdStore((s) => s.activeLandmarkType);
  const selectedLandmark = useDsdStore((s) => s.selectedLandmark);
  const canvasMode = useDsdStore((s) => s.canvasMode);
  const imageUrl = useDsdStore((s) => s.imageUrl);
  const setActiveLandmarkType = useDsdStore((s) => s.setActiveLandmarkType);
  const setSelectedLandmark = useDsdStore((s) => s.setSelectedLandmark);
  const setCanvasMode = useDsdStore((s) => s.setCanvasMode);
  const removeLandmark = useDsdStore((s) => s.removeLandmark);
  const setAllLandmarks = useDsdStore((s) => s.setAllLandmarks);

  const [detecting, setDetecting] = useState(false);
  const [detectMode, setDetectMode] = useState<DetectMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAutoDetect = async (mode: DetectMode) => {
    if (!imageUrl) return;
    setDetecting(true);
    setDetectMode(mode);
    setError(null);
    try {
      const points = await autoDetectLandmarks(imageUrl, mode);
      // For partial modes, merge with existing landmarks of the other type
      if (mode === 'both') {
        setAllLandmarks(points);
      } else {
        const keep = landmarks.filter((lm) =>
          mode === 'facial' ? !isFacialLandmark(lm.type) : isFacialLandmark(lm.type)
        );
        setAllLandmarks([...keep, ...points]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detectie mislukt');
    } finally {
      setDetecting(false);
      setDetectMode(null);
    }
  };

  const placedTypes = new Set(landmarks.map((l) => l.type));

  const handleActivate = (type: LandmarkType) => {
    if (activeLandmarkType === type) {
      setActiveLandmarkType(null);
      setCanvasMode('pan');
    } else {
      setActiveLandmarkType(type);
      setCanvasMode('landmark');
    }
  };

  const renderGroup = (title: string, types: readonly LandmarkType[], color: string) => (
    <div className="mb-5">
      <h3 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1">
        {types.map((type) => {
          const isPlaced = placedTypes.has(type);
          const isActive = activeLandmarkType === type && canvasMode === 'landmark';
          const isSelected = selectedLandmark === type;

          return (
            <div
              key={type}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-sm transition-all cursor-pointer ${
                isSelected ? 'bg-white/[0.08] border border-white/[0.12]' : 'hover:bg-white/[0.04]'
              }`}
              onClick={() => setSelectedLandmark(isSelected ? null : type)}
            >
              {/* Status indicator */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isPlaced ? color : 'transparent', border: isPlaced ? 'none' : `1.5px solid ${color}40` }}
              />

              <span className={`flex-1 truncate ${isPlaced ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                {LANDMARK_LABELS[type]}
              </span>

              {/* Place / Active button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleActivate(type); }}
                className={`p-1 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                    : 'hover:bg-white/[0.06] text-[var(--text-tertiary)]'
                }`}
                title={isActive ? 'Stoppen met plaatsen' : 'Plaatsen'}
              >
                {isActive ? <Check className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
              </button>

              {/* Remove button */}
              {isPlaced && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeLandmark(type); }}
                  className="p-1 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[var(--text-primary)]">Landmarks</h2>
        <span className="text-xs text-[var(--text-tertiary)]">
          {landmarks.length} / {FACIAL_LANDMARKS.length + DENTAL_LANDMARKS.length}
        </span>
      </div>

      {/* Auto-detect buttons */}
      <div className="flex gap-1.5 mb-4">
        {([
          { mode: 'both' as DetectMode, label: 'Alles' },
          { mode: 'facial' as DetectMode, label: 'Faciaal' },
          { mode: 'dental' as DetectMode, label: 'Dentaal' },
        ]).map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => handleAutoDetect(mode)}
            disabled={detecting || !imageUrl}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-[10px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {detecting && detectMode === mode ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3" />
            )}
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 px-2.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {renderGroup('Faciaal', FACIAL_LANDMARKS, LANDMARK_COLORS.facial)}
      {renderGroup('Dentaal', DENTAL_LANDMARKS, LANDMARK_COLORS.dental)}
    </div>
  );
}
