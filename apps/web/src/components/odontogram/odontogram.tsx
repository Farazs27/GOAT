'use client';

import { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import './odontogram.css';

// ======= Types =======
interface ToothSurface {
  id: string;
  surface: string;
  condition: string;
  material: string | null;
  recordedAt: string;
}

interface ToothData {
  id: string;
  toothNumber: number;
  status: string;
  isPrimary: boolean;
  notes: string | null;
  surfaces: ToothSurface[];
}

// ======= Tooth State (from react-odontogram) =======
interface ToothState {
  Cavities: { center: number; top: number; bottom: number; left: number; right: number };
  Extract: number;
  Crown: number;
  Filter: number;
  Fracture: number;
}

type ToothAction =
  | { type: 'crown'; value: number }
  | { type: 'extract'; value: number }
  | { type: 'filter'; value: number }
  | { type: 'fracture'; value: number }
  | { type: 'carie'; value: number; zone: string }
  | { type: 'clear' };

const initialToothState: ToothState = {
  Cavities: { center: 0, top: 0, bottom: 0, left: 0, right: 0 },
  Extract: 0,
  Crown: 0,
  Filter: 0,
  Fracture: 0,
};

function setCavities(prevState: ToothState, zone: string, value: number) {
  const cavities = { ...prevState.Cavities };
  if (zone === 'all') {
    return { center: value, top: value, bottom: value, left: value, right: value };
  }
  (cavities as any)[zone] = value;
  return cavities;
}

function toothReducer(state: ToothState, action: ToothAction): ToothState {
  switch (action.type) {
    case 'crown': return { ...state, Crown: action.value };
    case 'extract': return { ...state, Extract: action.value };
    case 'filter': return { ...state, Filter: action.value };
    case 'fracture': return { ...state, Fracture: action.value };
    case 'carie': return { ...state, Cavities: setCavities(state, action.zone, action.value) };
    case 'clear': return initialToothState;
    default: return state;
  }
}

// ======= Context Menu Component =======
interface MenuProps {
  x: number;
  y: number;
  zone: string;
  onAction: (action: ToothAction) => void;
  onClose: () => void;
}

function ToothContextMenu({ x, y, zone, onAction, onClose }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const menuItems = [
    { label: 'Gedaan', submenu: [
      { label: 'Caviteit', action: () => onAction({ type: 'carie', zone, value: 1 }) },
      { label: 'Alle caviteiten', action: () => onAction({ type: 'carie', zone: 'all', value: 1 }) },
      { label: 'Afwezig', action: () => onAction({ type: 'extract', value: 1 }) },
      { label: 'Kroon', action: () => onAction({ type: 'crown', value: 1 }) },
    ]},
    { label: 'Te doen', submenu: [
      { label: 'Caviteit', action: () => onAction({ type: 'carie', zone, value: 2 }) },
      { label: 'Alle caviteiten', action: () => onAction({ type: 'carie', zone: 'all', value: 2 }) },
      { label: 'Afwezig', action: () => onAction({ type: 'extract', value: 2 }) },
      { label: 'Kroon', action: () => onAction({ type: 'crown', value: 2 }) },
      { label: 'Uitgefilterd', action: () => onAction({ type: 'filter', value: 2 }) },
      { label: 'Fractuur', action: () => onAction({ type: 'fracture', value: 2 }) },
    ]},
    { label: 'Wissen', action: () => onAction({ type: 'clear' }) },
  ];

  const [openSub, setOpenSub] = useState<string | null>(null);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 glass-card rounded-xl py-1 min-w-[160px] shadow-2xl"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item) => (
        <div key={item.label} className="relative">
          {item.submenu ? (
            <div
              className="px-4 py-2 text-sm text-white/80 hover:bg-white/10 cursor-pointer flex justify-between items-center"
              onMouseEnter={() => setOpenSub(item.label)}
              onMouseLeave={() => setOpenSub(null)}
            >
              {item.label} <span className="text-white/30 ml-2">›</span>
              {openSub === item.label && (
                <div className="absolute left-full top-0 ml-1 glass-card rounded-xl py-1 min-w-[150px] shadow-2xl">
                  {item.submenu.map((sub) => (
                    <div
                      key={sub.label}
                      className="px-4 py-2 text-sm text-white/80 hover:bg-white/10 cursor-pointer"
                      onClick={() => { sub.action(); onClose(); }}
                    >
                      {sub.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <hr className="border-white/10 my-1" />
              <div
                className="px-4 py-2 text-sm text-white/80 hover:bg-white/10 cursor-pointer"
                onClick={() => { item.action!(); onClose(); }}
              >
                {item.label}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ======= Tooth Component (from react-odontogram) =======
interface ToothProps {
  number: number;
  positionX: number;
  positionY: number;
  onChange: (id: number, state: ToothState) => void;
}

function Tooth({ number, positionX, positionY, onChange }: ToothProps) {
  const [toothState, dispatch] = useReducer(toothReducer, initialToothState);
  const [menu, setMenu] = useState<{ x: number; y: number; zone: string } | null>(null);
  const firstUpdate = useRef(true);

  useEffect(() => {
    if (firstUpdate.current) { firstUpdate.current = false; return; }
    onChange(number, toothState);
  }, [toothState, onChange, number]);

  const getClassNamesByZone = (zone: string) => {
    const val = (toothState.Cavities as any)[zone];
    if (val === 1) return 'done';
    if (val === 2) return 'to-do';
    return '';
  };

  const handleContextMenu = (e: React.MouseEvent, zone: string) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, zone });
  };

  const drawToothActions = () => {
    if (toothState.Extract > 0) {
      return (
        <g stroke={toothState.Extract === 1 ? 'red' : 'blue'}>
          <line x1="0" y1="0" x2="20" y2="20" strokeWidth="2" />
          <line x1="0" y1="20" x2="20" y2="0" strokeWidth="2" />
        </g>
      );
    }
    if (toothState.Fracture > 0) {
      return (
        <g stroke={toothState.Fracture === 1 ? 'red' : 'blue'}>
          <line x1="0" y1="10" x2="20" y2="10" strokeWidth="2" />
        </g>
      );
    }
    if (toothState.Filter > 0) {
      return (
        <g stroke={toothState.Filter === 1 ? 'red' : 'blue'}>
          <line x1="0" y1="20" x2="20" y2="0" strokeWidth="2" />
        </g>
      );
    }
    if (toothState.Crown > 0) {
      return (
        <circle cx="10" cy="10" r="10" fill="none"
          stroke={toothState.Crown === 1 ? 'red' : 'blue'} strokeWidth="2" />
      );
    }
    return null;
  };

  const translate = `translate(${positionX},${positionY})`;

  return (
    <>
      <svg className="tooth">
        <g transform={translate}>
          <polygon points="0,0 20,0 15,5 5,5"
            onContextMenu={(e) => handleContextMenu(e, 'top')}
            className={getClassNamesByZone('top')} />
          <polygon points="5,15 15,15 20,20 0,20"
            onContextMenu={(e) => handleContextMenu(e, 'bottom')}
            className={getClassNamesByZone('bottom')} />
          <polygon points="15,5 20,0 20,20 15,15"
            onContextMenu={(e) => handleContextMenu(e, 'left')}
            className={getClassNamesByZone('left')} />
          <polygon points="0,0 5,5 5,15 0,20"
            onContextMenu={(e) => handleContextMenu(e, 'right')}
            className={getClassNamesByZone('right')} />
          <polygon points="5,5 15,5 15,15 5,15"
            onContextMenu={(e) => handleContextMenu(e, 'center')}
            className={getClassNamesByZone('center')} />
          {drawToothActions()}
          <text x="6" y="30" stroke="rgba(255,255,255,0.6)" fill="rgba(255,255,255,0.6)"
            strokeWidth="0.1" className="tooth-number">
            {number}
          </text>
        </g>
      </svg>
      {menu && (
        <ToothContextMenu
          x={menu.x} y={menu.y} zone={menu.zone}
          onAction={(action) => dispatch(action)}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}

// ======= Teeth Row (from react-odontogram) =======
function getArray(start: number, end: number): number[] {
  if (start > end) {
    const list: number[] = [];
    for (let i = start; i >= end; i--) list.push(i);
    return list;
  }
  const list: number[] = [];
  for (let i = start; i <= end; i++) list.push(i);
  return list;
}

interface TeethProps {
  start: number;
  end: number;
  x: number;
  y: number;
  handleChange: (id: number, state: ToothState) => void;
}

function Teeth({ start, end, x, y, handleChange }: TeethProps) {
  const tooths = getArray(start, end);
  return (
    <g transform="scale(1.4)">
      {tooths.map((i) => (
        <Tooth key={i} onChange={handleChange} number={i}
          positionY={y} positionX={Math.abs((i - start) * 25) + x} />
      ))}
    </g>
  );
}

// ======= Main Odontogram (from react-odontogram) =======
interface OdontogramProps {
  patientId: string;
}

export default function Odontogram({ patientId }: OdontogramProps) {
  const odontogramState = useRef<Record<number, ToothState>>({});

  const handleToothUpdate = useCallback((id: number, toothState: ToothState) => {
    odontogramState.current[id] = toothState;
  }, []);

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">
          Gebitsoverzicht (FDI-notatie)
        </h3>

        <div className="odontogram-container">
          <svg version="1.1" height="100%" width="100%">
            {/* Adult upper */}
            <Teeth start={18} end={11} x={0} y={0} handleChange={handleToothUpdate} />
            <Teeth start={21} end={28} x={210} y={0} handleChange={handleToothUpdate} />

            {/* Primary upper */}
            <Teeth start={55} end={51} x={75} y={40} handleChange={handleToothUpdate} />
            <Teeth start={61} end={65} x={210} y={40} handleChange={handleToothUpdate} />

            {/* Primary lower */}
            <Teeth start={85} end={81} x={75} y={80} handleChange={handleToothUpdate} />
            <Teeth start={71} end={75} x={210} y={80} handleChange={handleToothUpdate} />

            {/* Adult lower */}
            <Teeth start={48} end={41} x={0} y={120} handleChange={handleToothUpdate} />
            <Teeth start={31} end={38} x={210} y={120} handleChange={handleToothUpdate} />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded bg-white border border-white/30" />
            <span className="text-xs text-white/50">Gezond</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: 'red' }} />
            <span className="text-xs text-white/50">Gedaan</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: 'blue' }} />
            <span className="text-xs text-white/50">Te doen</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-white/50">Rechtermuisknop op vlak voor opties</span>
          </div>
        </div>
      </div>
    </div>
  );
}
