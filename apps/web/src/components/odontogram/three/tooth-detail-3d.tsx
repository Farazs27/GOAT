'use client';

import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getModelPath, shouldMirrorModel } from './model-paths';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToothDetail3DProps {
  fdi: number;
  status: string;
  surfaceConditions?: Record<string, { condition: string; material?: string }>;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const STATUS_TINTS: Record<string, string> = {
  CROWN: '#f59e0b',
  IMPLANT: '#8b5cf6',
  ENDO: '#f97316',
};

const CONDITION_LABELS: Record<string, string> = {
  HEALTHY: 'Gezond',
  CARIES: 'Cariës',
  FILLING: 'Vulling',
  CROWN: 'Kroon',
  ENDO: 'Endodontisch',
  IMPLANT: 'Implantaat',
  MISSING: 'Afwezig',
};

// ---------------------------------------------------------------------------
// Tooth model
// ---------------------------------------------------------------------------

function DetailToothModel({
  modelPath,
  status,
  mirror,
}: {
  modelPath: string;
  status: string;
  mirror: boolean;
}) {
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const tintColor = STATUS_TINTS[status];

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = (child.material as THREE.MeshStandardMaterial).clone();
        if (tintColor) {
          mat.color.lerp(new THREE.Color(tintColor), 0.35);
        }
        mat.roughness = Math.min(mat.roughness, 0.6);
        mat.metalness = Math.max(mat.metalness, 0.05);
        child.material = mat;
      }
    });
    return clone;
  }, [scene, status]);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 2.5 / maxDim;
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x * s, -center.y * s, -center.z * s),
    };
  }, [clonedScene]);

  return (
    <group scale={mirror ? [-1, 1, 1] : [1, 1, 1]}>
      <primitive object={clonedScene} scale={scale} position={offset} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ToothDetail3D({
  fdi,
  status,
  surfaceConditions,
  onClose,
}: ToothDetail3DProps) {
  const modelPath = getModelPath(fdi);
  const mirror = shouldMirrorModel(fdi);
  const quadrant = Math.floor(fdi / 10);
  const toothNum = fdi % 10;

  const toothTypeNames: Record<number, string> = {
    1: 'Centrale snijtand',
    2: 'Laterale snijtand',
    3: 'Hoektand',
    4: 'Eerste premolaar',
    5: 'Tweede premolaar',
    6: 'Eerste molaar',
    7: 'Tweede molaar',
    8: 'Verstandskies',
  };

  const quadrantNames: Record<number, string> = {
    1: 'Rechts boven',
    2: 'Links boven',
    3: 'Links onder',
    4: 'Rechts onder',
  };

  const surfaceEntries = surfaceConditions
    ? Object.entries(surfaceConditions).filter(([, v]) => v.condition !== 'HEALTHY')
    : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">
            Tand {fdi}
          </h3>
          <p className="text-sm text-gray-400">
            {quadrantNames[quadrant]} &mdash; {toothTypeNames[toothNum]}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug
        </button>
      </div>

      {/* 3D Viewer */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden" style={{ height: 340 }}>
        {modelPath && status !== 'MISSING' ? (
          <Canvas
            dpr={[1.5, 2.5]}
            camera={{ position: [0, 2, 5], fov: 30, near: 0.1, far: 50 }}
            gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
            style={{ background: '#0f1117' }}
          >
            <color attach="background" args={['#0f1117']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 5, 5]} intensity={1.2} castShadow />
            <directionalLight position={[-3, 3, -3]} intensity={0.4} />
            <directionalLight position={[0, -3, 5]} intensity={0.3} />
            <pointLight position={[0, -3, 2]} intensity={0.3} color="#b4c6ef" />

            <Suspense fallback={
              <Html center>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  Laden...
                </div>
              </Html>
            }>
              <DetailToothModel modelPath={modelPath} status={status} mirror={mirror} />
            </Suspense>

            <OrbitControls
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              autoRotate
              autoRotateSpeed={2}
              minDistance={2}
              maxDistance={10}
            />
          </Canvas>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-sm">Tand is afwezig</p>
            </div>
          </div>
        )}
      </div>

      {/* Drag hint */}
      <p className="text-xs text-gray-500 text-center">
        Sleep om te draaien &mdash; scroll om in/uit te zoomen
      </p>

      {/* Surface conditions */}
      {surfaceEntries.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Oppervlakken</h4>
          <div className="grid grid-cols-2 gap-1.5">
            {surfaceEntries.map(([surface, data]) => (
              <div key={surface} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-gray-300 w-4">{surface}</span>
                <span className="text-gray-400">{CONDITION_LABELS[data.condition] || data.condition}</span>
                {data.material && (
                  <span className="text-xs text-gray-500">({data.material})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Status:</span>
        <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-medium">
          {CONDITION_LABELS[status] || status}
        </span>
      </div>
    </div>
  );
}
