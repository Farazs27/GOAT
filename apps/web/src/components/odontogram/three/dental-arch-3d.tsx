'use client';

import React, { useMemo, Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getModelPath } from './model-paths';

const DEBUG_MODE = false;

interface PendingRestoration {
  toothNumber: number;
  restorationType: string;
  surfaces: string[];
  statusChange?: string;
}

interface DentalArch3DProps {
  teeth: Array<{ toothNumber: number; status: string; notes?: string | null }>;
  surfaces: Array<{ toothNumber: number; surface: string; condition: string; material?: string | null }>;
  selectedTooth: number | null;
  onToothSelect: (toothNumber: number) => void;
  pendingRestoration?: PendingRestoration | null;
}

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

// Colors for restoration type previews on 3D teeth
const RESTORATION_COLORS: Record<string, string> = {
  FILLING: '#60a5fa',
  INLAY: '#c084fc',
  ONLAY: '#a78bfa',
  VENEER: '#67e8f9',
  PARTIAL_CROWN: '#fbbf24',
  CROWN_RESTORATION: '#f59e0b',
};

const MAXILLA: readonly number[] = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
];

const MANDIBLE: readonly number[] = [
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
];

const SLOT = 1.2;
const Y_GAP = 2.5;

function getToothX(index: number): number {
  return (index - 7.5) * SLOT;
}

// Root count per tooth position (FDI last digit)
function getRootCount(fdi: number): number {
  const tooth = fdi % 10;
  // 1=central incisor(1), 2=lateral(1), 3=canine(1), 4=premolar1(2), 5=premolar2(1), 6=molar1(3), 7=molar2(3), 8=molar3(2)
  return [0, 1, 1, 1, 2, 1, 3, 3, 2][tooth] || 1;
}

// 3D canal line positions relative to tooth center, per root count
// Each canal is [xOffset, xTilt] where xTilt is the lean at the apex
function getCanalOffsets(rootCount: number): Array<[number, number]> {
  if (rootCount === 1) return [[0, 0]];
  if (rootCount === 2) return [[-0.12, -0.06], [0.12, 0.06]];
  return [[-0.18, -0.08], [0, 0], [0.18, 0.08]];
}

// Red endo canal lines rendered as thin cylinders through the root area only
function EndoCanals3D({ fdi, isUpper }: { fdi: number; isUpper: boolean }) {
  const rootCount = getRootCount(fdi);
  const canals = getCanalOffsets(rootCount);
  const dir = isUpper ? 1 : -1;
  // Root spans from cervical (y≈0) to apex (y≈±0.7). Keep lines strictly in root.
  const cervicalY = dir * 0.02;  // just past cervical line, don't enter crown
  const apexY = dir * 0.68;      // near tip of root

  return (
    <>
      {canals.map(([xOff, xTilt], i) => {
        const bottomX = xOff;
        const topX = xOff + xTilt;
        const dx = topX - bottomX;
        const dy = apexY - cervicalY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dx, dy);

        return (
          <mesh
            key={i}
            position={[(topX + bottomX) / 2, (apexY + cervicalY) / 2, 0.15]}
            rotation={[0, 0, -angle]}
          >
            <cylinderGeometry args={[0.018, 0.012, length, 6]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Renderer color space setup
// ---------------------------------------------------------------------------

function RendererSetup() {
  const { gl } = useThree();
  useMemo(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl]);
  return null;
}

// ---------------------------------------------------------------------------
// Single tooth mesh — premium PBR materials
// ---------------------------------------------------------------------------

function ArchToothModel({
  fdi,
  modelPath,
  status,
  isSelected,
  hovered,
  dominantCondition,
  pendingRestorationType,
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
  pendingRestorationType?: string;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const { scene } = useGLTF(modelPath);
  const { gl } = useThree();

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const statusTint = STATUS_TINTS[status];
    const conditionTint = dominantCondition ? CONDITION_COLORS[dominantCondition] : undefined;
    const restorationTint = pendingRestorationType ? RESTORATION_COLORS[pendingRestorationType] : undefined;
    const tintColor = restorationTint || conditionTint || statusTint;
    const maxAniso = gl.capabilities.getMaxAnisotropy();

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = (child.material as THREE.MeshStandardMaterial).clone();

        // PBR enamel look
        mat.roughness = 0.35;
        mat.metalness = 0.0;
        mat.envMapIntensity = 0.6;

        // Crisp textures
        if (mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace;
          mat.map.anisotropy = maxAniso;
        }
        if (mat.normalMap) {
          mat.normalMap.anisotropy = maxAniso;
        }

        // Status/condition/restoration tinting
        if (tintColor) {
          const lerpAmount = restorationTint ? 0.5 : conditionTint ? 0.45 : 0.35;
          mat.color.lerp(new THREE.Color(tintColor), lerpAmount);
        }

        // Pending restoration emissive glow
        if (restorationTint) {
          mat.emissive = new THREE.Color(restorationTint);
          mat.emissiveIntensity = 0.2;
        }

        // Selection/hover glow
        if (isSelected) {
          mat.emissive = new THREE.Color('#3b82f6');
          mat.emissiveIntensity = 0.4;
        } else if (hovered && !restorationTint) {
          mat.emissive = new THREE.Color('#60a5fa');
          mat.emissiveIntensity = 0.15;
        }

        child.material = mat;
      }
    });
    return clone;
  }, [scene, status, isSelected, hovered, dominantCondition, pendingRestorationType, gl]);

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

  return (
    <primitive
      object={clonedScene}
      scale={scale}
      position={offset}
      onClick={(e: any) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e: any) => { e.stopPropagation(); onPointerOver(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e: any) => { e.stopPropagation(); onPointerOut(); document.body.style.cursor = 'auto'; }}
    />
  );
}

// ---------------------------------------------------------------------------
// Implant GLB model — replaces tooth when IMPLANT status
// ---------------------------------------------------------------------------

const IMPLANT_MODEL_PATH = '/models/teeth/dental_implant.glb';

function ImplantModel({
  isUpper,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  isUpper: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const { scene } = useGLTF(IMPLANT_MODEL_PATH);
  const { gl } = useThree();

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = (child.material as THREE.MeshStandardMaterial).clone();
        mat.roughness = 0.3;
        mat.metalness = 0.6;
        mat.envMapIntensity = 0.8;
        mat.color.lerp(new THREE.Color('#8b5cf6'), 0.15);
        if (mat.map) { mat.map.colorSpace = THREE.SRGBColorSpace; mat.map.anisotropy = maxAniso; }
        child.material = mat;
      }
    });
    return clone;
  }, [scene, gl]);

  const { scaleArr, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 1.4 / maxDim;
    // Flip Y for lower jaw so screw points into the bone
    const yFlip = isUpper ? -1 : 1;
    return {
      scaleArr: [s, s * yFlip, s] as [number, number, number],
      offset: new THREE.Vector3(-center.x * s, -center.y * s * yFlip, -center.z * s),
    };
  }, [clonedScene, isUpper]);

  return (
    <primitive
      object={clonedScene}
      scale={scaleArr}
      position={offset}
      onClick={(e: any) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e: any) => { e.stopPropagation(); onPointerOver(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e: any) => { e.stopPropagation(); onPointerOut(); document.body.style.cursor = 'auto'; }}
    />
  );
}

// ---------------------------------------------------------------------------
// Pulsing emissive wrapper for pending status changes
// ---------------------------------------------------------------------------

function PulsingGlow({ color, children }: { color: string; children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = Math.sin(clock.getElapsedTime() * 3) * 0.5 + 0.5; // 0..1 pulsing
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && 'emissiveIntensity' in child.material) {
        (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(color);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15 + t * 0.35;
      }
    });
  });

  return <group ref={groupRef}>{children}</group>;
}

// ---------------------------------------------------------------------------
// Single tooth in the arch
// ---------------------------------------------------------------------------

function ArchTooth({
  fdi,
  x,
  y,
  status,
  isSelected,
  dominantCondition,
  pendingStatus,
  pendingRestorationType,
  onClick,
}: {
  fdi: number;
  x: number;
  y: number;
  status: string;
  isSelected: boolean;
  dominantCondition?: string;
  pendingStatus?: string;
  pendingRestorationType?: string;
  onClick: () => void;
}) {
  const modelPath = getModelPath(fdi);
  const [hovered, setHovered] = useState(false);

  const effectiveStatus = pendingStatus || status;
  const isImplant = effectiveStatus === 'IMPLANT';
  const isMissing = effectiveStatus === 'MISSING';
  const isEndo = effectiveStatus === 'ENDO';

  // Ghost out for pending MISSING
  if (isMissing) {
    return (
      <group position={[x, y, 0]}>
        <mesh onClick={onClick}>
          <capsuleGeometry args={[0.15, 0.6, 4, 8]} />
          <meshBasicMaterial color="#6b7280" wireframe transparent opacity={pendingStatus ? 0.3 : 0.15} />
        </mesh>
      </group>
    );
  }

  // Implant model replacement
  if (isImplant) {
    const content = (
      <group position={[x, y, 0]}>
        <mesh
          onClick={(e: any) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e: any) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <boxGeometry args={[0.9, 1.4, 0.9]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <ImplantModel
          isUpper={Math.floor(fdi / 10) <= 2}
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        />
      </group>
    );
    return pendingStatus ? <PulsingGlow color="#8b5cf6">{content}</PulsingGlow> : content;
  }

  if (!modelPath) {
    return (
      <group position={[x, y, 0]}>
        <mesh onClick={onClick}>
          <capsuleGeometry args={[0.15, 0.6, 4, 8]} />
          <meshBasicMaterial color="#6b7280" wireframe transparent opacity={0.15} />
        </mesh>
      </group>
    );
  }

  const isUpper = Math.floor(fdi / 10) <= 2;

  const toothContent = (
    <group position={[x, y, 0]}>
      <mesh
        onClick={(e: any) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e: any) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[0.9, 1.4, 0.9]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <ArchToothModel
        fdi={fdi}
        modelPath={modelPath}
        status={status}
        isSelected={isSelected}
        hovered={hovered}
        dominantCondition={dominantCondition}
        pendingRestorationType={pendingRestorationType}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      {isEndo && <EndoCanals3D fdi={fdi} isUpper={isUpper} />}
    </group>
  );

  // Endo: just show tooth with red canal lines, no glow
  if (isEndo) {
    return toothContent;
  }

  return toothContent;
}

// ---------------------------------------------------------------------------
// Debug scene (tooth 11 + 41 only)
// ---------------------------------------------------------------------------

function DebugToothModel({ fdi, xOffset }: { fdi: number; xOffset: number }) {
  const modelPath = getModelPath(fdi);
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 2.0 / maxDim;
    return { scale: s, offset: new THREE.Vector3(-center.x * s, -center.y * s, -center.z * s) };
  }, [clonedScene]);

  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    console.log(`[DEBUG ${fdi}] size:`, { x: size.x.toFixed(3), y: size.y.toFixed(3), z: size.z.toFixed(3) });
  }, [clonedScene, fdi]);

  return (
    <group position={[xOffset, 0, 0]} ref={groupRef}>
      <primitive object={clonedScene} scale={scale} position={offset} />
      <axesHelper args={[1.5]} />
      <Html position={[0, -2, 0]} center>
        <span className="text-white text-sm font-bold bg-black/80 px-2 py-1 rounded">Tooth {fdi}</span>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Production scene
// ---------------------------------------------------------------------------

function ArchScene({ teeth, surfaces, selectedTooth, onToothSelect, pendingRestoration }: DentalArch3DProps) {
  function getStatus(fdi: number) {
    return teeth.find((t) => t.toothNumber === fdi)?.status ?? 'PRESENT';
  }

  function getDominantCondition(fdi: number): string | undefined {
    const s = surfaces.filter((s) => s.toothNumber === fdi && s.condition !== 'HEALTHY');
    if (s.length === 0) return undefined;
    for (const cond of ['CARIES', 'ENDO', 'CROWN', 'FILLING', 'IMPLANT']) {
      if (s.some((x) => x.condition === cond)) return cond;
    }
    return s[0].condition;
  }

  return (
    <>
      {/* MAXILLA — models naturally have roots up, no transform needed */}
      {MAXILLA.map((fdi, idx) => (
        <ArchTooth
          key={fdi}
          fdi={fdi}
          x={getToothX(idx)}
          y={Y_GAP}
          status={getStatus(fdi)}
          isSelected={selectedTooth === fdi}
          dominantCondition={getDominantCondition(fdi)}
          pendingStatus={pendingRestoration?.toothNumber === fdi ? pendingRestoration.statusChange : undefined}
          pendingRestorationType={pendingRestoration?.toothNumber === fdi ? pendingRestoration.restorationType : undefined}
          onClick={() => onToothSelect(fdi)}
        />
      ))}

      {/* MANDIBLE — no group transform, same as maxilla */}
      {MANDIBLE.map((fdi, idx) => (
        <ArchTooth
          key={fdi}
          fdi={fdi}
          x={getToothX(idx)}
          y={-Y_GAP}
          status={getStatus(fdi)}
          isSelected={selectedTooth === fdi}
          dominantCondition={getDominantCondition(fdi)}
          pendingStatus={pendingRestoration?.toothNumber === fdi ? pendingRestoration.statusChange : undefined}
          pendingRestorationType={pendingRestoration?.toothNumber === fdi ? pendingRestoration.restorationType : undefined}
          onClick={() => onToothSelect(fdi)}
        />
      ))}

      {/* Tooth numbers — upper */}
      {MAXILLA.map((fdi, idx) => (
        <Html key={`nu-${fdi}`} position={[getToothX(idx), 0.15, 0]} center style={{ pointerEvents: 'none' }}>
          <span className={`text-[10px] font-bold tabular-nums select-none ${selectedTooth === fdi ? 'text-blue-400' : 'text-gray-500'}`}>{fdi}</span>
        </Html>
      ))}

      {/* Tooth numbers — lower */}
      {MANDIBLE.map((fdi, idx) => (
        <Html key={`nl-${fdi}`} position={[getToothX(idx), -0.15, 0]} center style={{ pointerEvents: 'none' }}>
          <span className={`text-[10px] font-bold tabular-nums select-none ${selectedTooth === fdi ? 'text-blue-400' : 'text-gray-500'}`}>{fdi}</span>
        </Html>
      ))}

      {/* Jaw labels */}
      <Html position={[0, Y_GAP + 1.8, 0]} center style={{ pointerEvents: 'none' }}>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Bovenkaak</span>
      </Html>
      <Html position={[0, -(Y_GAP + 1.8), 0]} center style={{ pointerEvents: 'none' }}>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Onderkaak</span>
      </Html>

      {/* Midline */}
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[0.02, Y_GAP * 2 + 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </mesh>
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
// Main
// ---------------------------------------------------------------------------

export default function DentalArch3D({ teeth, surfaces, selectedTooth, onToothSelect, pendingRestoration }: DentalArch3DProps) {
  return (
    <div
      className="w-full rounded-xl border border-gray-700/50 overflow-hidden relative"
      style={{
        height: 520,
        background: 'linear-gradient(180deg, #0B1220 0%, #070B12 100%)',
      }}
    >
      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, DEBUG_MODE ? 6 : 18], fov: 30, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ background: 'transparent' }}
      >
        <RendererSetup />

        {/* Premium lighting — enamel highlights */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[6, 8, 10]} intensity={1.1} />
        <directionalLight position={[-6, 4, 8]} intensity={0.55} />
        <hemisphereLight args={['#b1c5ff', '#2a1a0e', 0.35]} />

        <Suspense fallback={<ArchLoading />}>
          {DEBUG_MODE ? (
            <>
              <DebugToothModel fdi={11} xOffset={-2} />
              <DebugToothModel fdi={41} xOffset={2} />
              <axesHelper args={[3]} />
            </>
          ) : (
            <ArchScene teeth={teeth} surfaces={surfaces} selectedTooth={selectedTooth} onToothSelect={onToothSelect} pendingRestoration={pendingRestoration} />
          )}
        </Suspense>

        <OrbitControls enablePan={false} enableZoom={false} enableRotate={DEBUG_MODE} target={[0, 0, 0]} makeDefault />
      </Canvas>
    </div>
  );
}
