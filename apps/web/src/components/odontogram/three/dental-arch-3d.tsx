'use client';

import React, { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getModelPath, shouldMirrorModel } from './model-paths';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DentalArch3DProps {
  teeth: Array<{ toothNumber: number; status: string; notes?: string | null }>;
  surfaces: Array<{ toothNumber: number; surface: string; condition: string; material?: string | null }>;
  selectedTooth: number | null;
  onToothSelect: (toothNumber: number) => void;
}

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const STATUS_TINTS: Record<string, string> = {
  CROWN: '#f59e0b',
  IMPLANT: '#8b5cf6',
  ENDO: '#f97316',
};

const CONDITION_COLORS: Record<string, string> = {
  CARIES: '#ef4444',
  FILLING: '#9333ea',
  CROWN: '#f59e0b',
  ENDO: '#f97316',
  IMPLANT: '#8b5cf6',
};

// ---------------------------------------------------------------------------
// Flat row layout — teeth in a horizontal line like the reference
// ---------------------------------------------------------------------------

const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const TOOTH_SPACING = 1.3;
const ROW_GAP = 4.0;

function getRowPosition(fdi: number): [number, number, number] {
  const isUpper = Math.floor(fdi / 10) <= 2;
  const row = isUpper ? UPPER_ROW : LOWER_ROW;
  const idx = row.indexOf(fdi);
  if (idx === -1) return [0, 0, 0];

  const x = (idx - 7.5) * TOOTH_SPACING;
  const y = isUpper ? ROW_GAP / 2 : -ROW_GAP / 2;

  return [x, y, 0];
}

// ---------------------------------------------------------------------------
// Single tooth in the row
// ---------------------------------------------------------------------------

function RowTooth({
  fdi,
  status,
  isSelected,
  dominantCondition,
  onClick,
}: {
  fdi: number;
  status: string;
  isSelected: boolean;
  dominantCondition?: string;
  onClick: () => void;
}) {
  const modelPath = getModelPath(fdi);
  const [hovered, setHovered] = useState(false);

  if (!modelPath || status === 'MISSING') {
    const pos = getRowPosition(fdi);
    return (
      <group position={pos}>
        <mesh onClick={onClick}>
          <capsuleGeometry args={[0.15, 0.6, 4, 8]} />
          <meshBasicMaterial color="#6b7280" wireframe transparent opacity={0.15} />
        </mesh>
      </group>
    );
  }

  return (
    <RowToothModel
      fdi={fdi}
      modelPath={modelPath}
      status={status}
      isSelected={isSelected}
      hovered={hovered}
      dominantCondition={dominantCondition}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    />
  );
}

function RowToothModel({
  fdi,
  modelPath,
  status,
  isSelected,
  hovered,
  dominantCondition,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  fdi: number;
  modelPath: string;
  status: string;
  isSelected: boolean;
  hovered: boolean;
  dominantCondition?: string;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const statusTint = STATUS_TINTS[status];
    const conditionTint = dominantCondition ? CONDITION_COLORS[dominantCondition] : undefined;
    const tintColor = conditionTint || statusTint;

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = (child.material as THREE.MeshStandardMaterial).clone();
        if (tintColor) {
          mat.color.lerp(new THREE.Color(tintColor), conditionTint ? 0.45 : 0.35);
        }
        if (isSelected) {
          mat.emissive = new THREE.Color('#3b82f6');
          mat.emissiveIntensity = 0.4;
        } else if (hovered) {
          mat.emissive = new THREE.Color('#60a5fa');
          mat.emissiveIntensity = 0.15;
        }
        child.material = mat;
      }
    });
    return clone;
  }, [scene, status, isSelected, hovered, dominantCondition]);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 1.4 / maxDim;
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x * s, -center.y * s, -center.z * s),
    };
  }, [clonedScene]);

  const position = getRowPosition(fdi);
  const quadrant = Math.floor(fdi / 10);
  const isUpper = quadrant <= 2;
  const mirror = shouldMirrorModel(fdi);

  // Buccal/facial view: rotate around X so tooth stands upright.
  // Model long axis = Z. Upper: roots up (rotX=-90°), Lower: roots down (rotX=+90°).
  const rotX = isUpper ? -Math.PI / 2 : Math.PI / 2;
  const rotY = mirror ? Math.PI : 0;
  const rotZ = 0;

  return (
    <group position={position}>
      <group rotation={[rotX, rotY, rotZ]} scale={mirror ? [-1, 1, 1] : [1, 1, 1]}>
        <primitive
          object={clonedScene}
          scale={scale}
          position={offset}
          onClick={(e: any) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e: any) => { e.stopPropagation(); onPointerOver(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e: any) => { e.stopPropagation(); onPointerOut(); document.body.style.cursor = 'auto'; }}
        />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Gum line — curved path through tooth cervical points
// ---------------------------------------------------------------------------

function GumLine({ row, yBase }: { row: number[]; yBase: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    row.forEach((fdi, idx) => {
      const x = (idx - 7.5) * TOOTH_SPACING;
      // Slight wave for natural look
      const wave = Math.sin((idx / (row.length - 1)) * Math.PI) * 0.12;
      pts.push(new THREE.Vector3(x, yBase + wave, 0.3));
    });
    return pts;
  }, [row, yBase]);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [points]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.03, 8, false);
  }, [curve]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshBasicMaterial color="#e74c3c" transparent opacity={0.7} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Jaw label
// ---------------------------------------------------------------------------

function JawLabel({ text, y }: { text: string; y: number }) {
  return (
    <Html position={[-9.5, y, 0]} style={{ pointerEvents: 'none' }}>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
        {text}
      </span>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Scene content
// ---------------------------------------------------------------------------

function ArchScene({
  teeth,
  surfaces,
  selectedTooth,
  onToothSelect,
}: DentalArch3DProps) {
  const allTeeth = [...UPPER_ROW, ...LOWER_ROW];

  function getStatus(fdi: number) {
    return teeth.find((t) => t.toothNumber === fdi)?.status ?? 'PRESENT';
  }

  function getDominantCondition(fdi: number): string | undefined {
    const toothSurfaces = surfaces.filter((s) => s.toothNumber === fdi && s.condition !== 'HEALTHY');
    if (toothSurfaces.length === 0) return undefined;
    // Priority: CARIES > ENDO > CROWN > FILLING > IMPLANT
    const priority = ['CARIES', 'ENDO', 'CROWN', 'FILLING', 'IMPLANT'];
    for (const cond of priority) {
      if (toothSurfaces.some((s) => s.condition === cond)) return cond;
    }
    return toothSurfaces[0].condition;
  }

  return (
    <>
      {allTeeth.map((fdi) => (
        <RowTooth
          key={fdi}
          fdi={fdi}
          status={getStatus(fdi)}
          isSelected={selectedTooth === fdi}
          dominantCondition={getDominantCondition(fdi)}
          onClick={() => onToothSelect(fdi)}
        />
      ))}

      {/* Gum lines removed for cleaner look */}

      {/* Jaw labels */}
      <JawLabel text="Bovenkaak" y={ROW_GAP / 2 + 0.9} />
      <JawLabel text="Onderkaak" y={-ROW_GAP / 2 - 0.9} />

      {/* Tooth numbers */}
      {UPPER_ROW.map((fdi, idx) => (
        <Html
          key={`num-${fdi}`}
          position={[(idx - 7.5) * TOOTH_SPACING, 0, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className={`text-[10px] font-bold tabular-nums select-none ${
            selectedTooth === fdi ? 'text-blue-400' : 'text-gray-500'
          }`}>
            {fdi}
          </span>
        </Html>
      ))}
      {LOWER_ROW.map((fdi, idx) => (
        <Html
          key={`num-${fdi}`}
          position={[(idx - 7.5) * TOOTH_SPACING, -0.15, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className={`text-[10px] font-bold tabular-nums select-none ${
            selectedTooth === fdi ? 'text-blue-400' : 'text-gray-500'
          }`}>
            {fdi}
          </span>
        </Html>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function ArchLoading() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        Laden...
      </div>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export default function DentalArch3D({
  teeth,
  surfaces,
  selectedTooth,
  onToothSelect,
}: DentalArch3DProps) {
  return (
    <div className="w-full rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden" style={{ height: 520 }}>
      <Canvas
        dpr={[1.5, 2.5]}
        camera={{ position: [0, 0, 18], fov: 30, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: '#0f1117' }}
      >
        <color attach="background" args={['#0f1117']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={1.2} />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <directionalLight position={[0, -5, 5]} intensity={0.3} />
        <pointLight position={[0, 0, 5]} intensity={0.4} />

        <Suspense fallback={<ArchLoading />}>
          <ArchScene
            teeth={teeth}
            surfaces={surfaces}
            selectedTooth={selectedTooth}
            onToothSelect={onToothSelect}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          target={[0, 0, 0]}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
