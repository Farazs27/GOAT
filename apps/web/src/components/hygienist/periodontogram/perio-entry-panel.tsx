'use client';

import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import PerioKeypad from './perio-keypad';

// FDI tooth order for sequential entry
const BUCCAL_ORDER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
                      48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const LINGUAL_ORDER = [...BUCCAL_ORDER];

const SITE_LABELS = ['Mesiaal', 'Midden', 'Distaal'] as const;

export interface PerioSiteData {
  toothNumber: number;
  surface: 'buccal' | 'lingual';
  sitePosition: 'mesial' | 'mid' | 'distal';
  probingDepth: number;
  gingivalMargin: number;
  bleeding: boolean;
  plaque: boolean;
  suppuration: boolean;
  mobility?: number;
  furcationGrade?: number;
  isImplant?: boolean;
  toothNote?: string;
  keratinizedWidth?: number;
}

interface EntryState {
  phase: 'buccal' | 'lingual';
  currentToothIndex: number;
  currentSiteIndex: number; // 0=mesial, 1=mid, 2=distal
  awaitingBOP: boolean;
  presentTeeth: number[];
  sites: Record<string, PerioSiteData>; // key: `${toothNumber}-${surface}-${sitePosition}`
  undoStack: PerioAction[];
  redoStack: PerioAction[];
  completed: boolean;
}

type PerioAction =
  | { type: 'SET_DEPTH'; key: string; depth: number; prevDepth: number }
  | { type: 'SET_BOP'; key: string; bop: boolean; prevBop: boolean }
  | { type: 'SET_PLAQUE'; key: string; plaque: boolean; prevPlaque: boolean };

type ReducerAction =
  | { type: 'DIGIT'; digit: number }
  | { type: 'BOP'; value: boolean }
  | { type: 'PLAQUE'; value: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_SITES'; sites: PerioSiteData[] };

function getSiteKey(tooth: number, surface: string, position: string) {
  return `${tooth}-${surface}-${position}`;
}

const SITE_POSITIONS = ['mesial', 'mid', 'distal'] as const;

function advanceToNext(state: EntryState): Partial<EntryState> {
  const order = state.phase === 'buccal' ? BUCCAL_ORDER : LINGUAL_ORDER;
  const present = state.presentTeeth;
  const presentInOrder = order.filter((t) => present.includes(t));

  let nextSite = state.currentSiteIndex + 1;
  let nextTooth = state.currentToothIndex;

  if (nextSite > 2) {
    nextSite = 0;
    // Find next present tooth
    const currentFdi = presentInOrder[nextTooth];
    const currentOrderIdx = order.indexOf(currentFdi);
    let found = false;
    for (let i = currentOrderIdx + 1; i < order.length; i++) {
      if (present.includes(order[i])) {
        nextTooth = presentInOrder.indexOf(order[i]);
        found = true;
        break;
      }
    }
    if (!found) {
      // End of this phase
      if (state.phase === 'buccal') {
        // Switch to lingual
        const firstLingual = LINGUAL_ORDER.find((t) => present.includes(t));
        if (firstLingual) {
          const lingualPresent = LINGUAL_ORDER.filter((t) => present.includes(t));
          return {
            phase: 'lingual',
            currentToothIndex: 0,
            currentSiteIndex: 0,
            awaitingBOP: false,
            presentTeeth: present, // keep same presentTeeth, just the order reference changes
          };
        }
      }
      return { completed: true };
    }
  }

  return {
    currentToothIndex: nextTooth,
    currentSiteIndex: nextSite,
    awaitingBOP: false,
  };
}

function entryReducer(state: EntryState, action: ReducerAction): EntryState {
  const order = state.phase === 'buccal' ? BUCCAL_ORDER : LINGUAL_ORDER;
  const presentInOrder = order.filter((t) => state.presentTeeth.includes(t));

  if (state.completed && action.type !== 'UNDO' && action.type !== 'LOAD_SITES') {
    return state;
  }

  switch (action.type) {
    case 'DIGIT': {
      if (state.awaitingBOP) return state;
      const tooth = presentInOrder[state.currentToothIndex];
      if (!tooth) return state;
      const position = SITE_POSITIONS[state.currentSiteIndex];
      const key = getSiteKey(tooth, state.phase, position);
      const existing = state.sites[key];
      const prevDepth = existing?.probingDepth ?? 0;

      const newSite: PerioSiteData = {
        ...(existing || {
          toothNumber: tooth,
          surface: state.phase,
          sitePosition: position,
          gingivalMargin: 0,
          bleeding: false,
          plaque: false,
          suppuration: false,
        }),
        toothNumber: tooth,
        surface: state.phase,
        sitePosition: position,
        probingDepth: action.digit,
      };

      const undoAction: PerioAction = { type: 'SET_DEPTH', key, depth: action.digit, prevDepth };

      return {
        ...state,
        sites: { ...state.sites, [key]: newSite },
        awaitingBOP: true,
        undoStack: [...state.undoStack, undoAction],
        redoStack: [],
      };
    }

    case 'BOP': {
      if (!state.awaitingBOP) return state;
      const tooth = presentInOrder[state.currentToothIndex];
      if (!tooth) return state;
      const position = SITE_POSITIONS[state.currentSiteIndex];
      const key = getSiteKey(tooth, state.phase, position);
      const existing = state.sites[key];
      if (!existing) return state;
      const prevBop = existing.bleeding;

      const newSite = { ...existing, bleeding: action.value };
      const undoAction: PerioAction = { type: 'SET_BOP', key, bop: action.value, prevBop };
      const advanced = advanceToNext(state);

      return {
        ...state,
        ...advanced,
        sites: { ...state.sites, [key]: newSite },
        undoStack: [...state.undoStack, undoAction],
        redoStack: [],
      };
    }

    case 'PLAQUE': {
      const tooth = presentInOrder[state.currentToothIndex];
      if (!tooth) return state;
      const position = SITE_POSITIONS[state.currentSiteIndex];
      const key = getSiteKey(tooth, state.phase, position);
      const existing = state.sites[key];
      if (!existing) return state;
      const prevPlaque = existing.plaque;

      const newSite = { ...existing, plaque: action.value };
      const undoAction: PerioAction = { type: 'SET_PLAQUE', key, plaque: action.value, prevPlaque };

      return {
        ...state,
        sites: { ...state.sites, [key]: newSite },
        undoStack: [...state.undoStack, undoAction],
        redoStack: [],
      };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const lastAction = state.undoStack[state.undoStack.length - 1];
      const newUndo = state.undoStack.slice(0, -1);
      const existing = state.sites[lastAction.key];
      if (!existing) return state;

      let newSite = { ...existing };
      if (lastAction.type === 'SET_DEPTH') {
        newSite.probingDepth = lastAction.prevDepth;
      } else if (lastAction.type === 'SET_BOP') {
        newSite.bleeding = lastAction.prevBop;
        // Go back to awaiting BOP for this site
        const parts = lastAction.key.split('-');
        const tooth = parseInt(parts[0]);
        const surface = parts[1] as 'buccal' | 'lingual';
        const pos = parts[2];
        const pOrder = surface === 'buccal' ? BUCCAL_ORDER : LINGUAL_ORDER;
        const pPresent = pOrder.filter((t) => state.presentTeeth.includes(t));
        const toothIdx = pPresent.indexOf(tooth);
        const siteIdx = SITE_POSITIONS.indexOf(pos as typeof SITE_POSITIONS[number]);

        return {
          ...state,
          sites: { ...state.sites, [lastAction.key]: newSite },
          undoStack: newUndo,
          redoStack: [...state.redoStack, lastAction],
          phase: surface,
          currentToothIndex: toothIdx >= 0 ? toothIdx : state.currentToothIndex,
          currentSiteIndex: siteIdx >= 0 ? siteIdx : state.currentSiteIndex,
          awaitingBOP: true,
          completed: false,
        };
      } else if (lastAction.type === 'SET_PLAQUE') {
        newSite.plaque = lastAction.prevPlaque;
      }

      return {
        ...state,
        sites: { ...state.sites, [lastAction.key]: newSite },
        undoStack: newUndo,
        redoStack: [...state.redoStack, lastAction],
        completed: false,
      };
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const redoAction = state.redoStack[state.redoStack.length - 1];
      const newRedo = state.redoStack.slice(0, -1);
      const existing = state.sites[redoAction.key];
      if (!existing) return state;

      let newSite = { ...existing };
      if (redoAction.type === 'SET_DEPTH') {
        newSite.probingDepth = redoAction.depth;
      } else if (redoAction.type === 'SET_BOP') {
        newSite.bleeding = redoAction.bop;
      } else if (redoAction.type === 'SET_PLAQUE') {
        newSite.plaque = redoAction.plaque;
      }

      return {
        ...state,
        sites: { ...state.sites, [redoAction.key]: newSite },
        undoStack: [...state.undoStack, redoAction],
        redoStack: newRedo,
      };
    }

    case 'LOAD_SITES': {
      const loaded: Record<string, PerioSiteData> = {};
      for (const site of action.sites) {
        const key = getSiteKey(site.toothNumber, site.surface, site.sitePosition);
        loaded[key] = site;
      }
      return {
        ...state,
        sites: loaded,
        undoStack: [],
        redoStack: [],
      };
    }

    default:
      return state;
  }
}

interface PerioEntryPanelProps {
  presentTeeth: number[];
  sessionId: string | null;
  onSitesChange: (sites: PerioSiteData[]) => void;
  initialSites?: PerioSiteData[];
}

export default function PerioEntryPanel({ presentTeeth, sessionId, onSitesChange, initialSites }: PerioEntryPanelProps) {
  const [state, dispatch] = useReducer(entryReducer, {
    phase: 'buccal',
    currentToothIndex: 0,
    currentSiteIndex: 0,
    awaitingBOP: false,
    presentTeeth,
    sites: {},
    undoStack: [],
    redoStack: [],
    completed: false,
  });

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  // Load initial sites
  useEffect(() => {
    if (initialSites && initialSites.length > 0) {
      dispatch({ type: 'LOAD_SITES', sites: initialSites });
    }
  }, [initialSites]);

  // Notify parent of changes
  const sitesArray = React.useMemo(() => Object.values(state.sites), [state.sites]);

  useEffect(() => {
    onSitesChange(sitesArray);
  }, [sitesArray, onSitesChange]);

  // Auto-save with debounce
  useEffect(() => {
    if (!sessionId || sitesArray.length === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`/api/hygienist/perio-sessions/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ sites: sitesArray }),
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [sitesArray, sessionId]);

  // Keyboard support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        dispatch({ type: 'DIGIT', digit: parseInt(e.key) });
      } else if (e.key === 'b' || e.key === 'B') {
        dispatch({ type: 'BOP', value: true });
      } else if (e.key === ' ') {
        e.preventDefault();
        dispatch({ type: 'BOP', value: false });
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Current position info
  const order = state.phase === 'buccal' ? BUCCAL_ORDER : LINGUAL_ORDER;
  const presentInOrder = order.filter((t) => presentTeeth.includes(t));
  const currentTooth = presentInOrder[state.currentToothIndex];
  const currentPosition = SITE_POSITIONS[state.currentSiteIndex];
  const totalTeeth = presentInOrder.length;

  // Progress calculation
  const totalSites = presentTeeth.length * 6; // 3 buccal + 3 lingual
  const filledSites = Object.keys(state.sites).length;
  const progressPct = totalSites > 0 ? Math.round((filledSites / totalSites) * 100) : 0;

  // Current tooth depths for display
  const currentToothDepths = SITE_POSITIONS.map((pos) => {
    const key = getSiteKey(currentTooth, state.phase, pos);
    return state.sites[key]?.probingDepth ?? null;
  });

  const currentToothBOP = SITE_POSITIONS.map((pos) => {
    const key = getSiteKey(currentTooth, state.phase, pos);
    return state.sites[key]?.bleeding ?? false;
  });

  const currentPlaque = SITE_POSITIONS.map((pos) => {
    const key = getSiteKey(currentTooth, state.phase, pos);
    return state.sites[key]?.plaque ?? false;
  });

  const DEPTH_COLOR_CLASSES: Record<string, string> = {
    green: 'text-emerald-400 bg-emerald-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
    orange: 'text-orange-400 bg-orange-500/20',
    red: 'text-red-400 bg-red-500/20',
  };

  function getDepthColor(d: number | null): string {
    if (d === null) return '';
    if (d <= 3) return DEPTH_COLOR_CLASSES['green'];
    if (d <= 5) return DEPTH_COLOR_CLASSES['yellow'];
    if (d === 6) return DEPTH_COLOR_CLASSES['orange'];
    return DEPTH_COLOR_CLASSES['red'];
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-2xl border border-slate-700/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Invoer</h3>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-xs text-amber-400 animate-pulse">Opslaan...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-400">Opgeslagen</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Tand {state.currentToothIndex + 1} van {totalTeeth} -- {state.phase === 'buccal' ? 'Buccaal' : 'Linguaal'}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {state.completed ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">Voltooid</div>
            <p className="text-sm text-slate-400">Alle metingen zijn ingevoerd</p>
          </div>
        </div>
      ) : (
        <>
          {/* Current tooth display */}
          <div className="text-center mb-4">
            <div className="text-4xl font-black text-white mb-1">{currentTooth}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              {state.phase === 'buccal' ? 'Buccaal' : 'Linguaal'} - {SITE_LABELS[state.currentSiteIndex]}
            </div>
          </div>

          {/* Awaiting BOP indicator */}
          {state.awaitingBOP && (
            <div className="text-center mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <span className="text-xs font-semibold text-red-300">
                Bloeding? Druk B (ja) of Spatie (nee)
              </span>
            </div>
          )}

          {/* Current tooth sites display */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {SITE_LABELS.map((label, i) => {
              const depth = currentToothDepths[i];
              const isActive = i === state.currentSiteIndex;
              const bop = currentToothBOP[i];

              return (
                <div
                  key={label}
                  className={`text-center p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-slate-700/40 bg-slate-800/40'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
                  <div className={`text-2xl font-black ${depth !== null ? getDepthColor(depth) : 'text-slate-600'}`}>
                    {depth !== null ? depth : '-'}
                  </div>
                  {bop && (
                    <div className="mt-1 flex justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-[10px] text-slate-600 text-center mb-2">
            0-9 diepte | B bloeding | Spatie geen bloeding | Ctrl+Z ongedaan
          </div>

          {/* Keypad for touch devices */}
          <PerioKeypad
            onDigit={(n) => dispatch({ type: 'DIGIT', digit: n })}
            onBOP={(v) => dispatch({ type: 'BOP', value: v })}
            onPlaque={(v) => dispatch({ type: 'PLAQUE', value: v })}
            onUndo={() => dispatch({ type: 'UNDO' })}
            awaitingBOP={state.awaitingBOP}
            bopValue={currentToothBOP[state.currentSiteIndex]}
            plaqueValue={currentPlaque[state.currentSiteIndex]}
          />
        </>
      )}
    </div>
  );
}
