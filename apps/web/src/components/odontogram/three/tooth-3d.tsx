'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getModelPath, shouldMirrorModel } from './model-paths';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tooth3DProps {
  fdi: number;
  view: 'side' | 'occlusal';
  status: string;
  surfaceConditions?: Record<string, { condition: string; material?: string }>;
  isSelected?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Color maps (static, no dynamic Tailwind)
// ---------------------------------------------------------------------------

const STATUS_TINTS: Record<string, string> = {
  CROWN: '#f59e0b',
  IMPLANT: '#8b5cf6',
  ENDO: '#f97316',
};

// ---------------------------------------------------------------------------
// Auto-fit: adjusts camera zoom to fit the model in view
// ---------------------------------------------------------------------------

function AutoFit({ target }: { target: THREE.Object3D | null }) {
  const { camera } = useThree();
  useMemo(() => {
    if (!target) return;
    const box = new THREE.Box3().setFromObject(target);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0 && camera instanceof THREE.OrthographicCamera) {
      camera.zoom = 0.85 / maxDim * 40;
      camera.updateProjectionMatrix();
    }
  }, [target, camera]);
  return null;
}

// ---------------------------------------------------------------------------
// Tooth mesh component (inside Canvas)
// ---------------------------------------------------------------------------

function ToothModel({
  modelPath,
  fdi,
  view,
  status,
  isSelected,
}: {
  modelPath: string;
  fdi: number;
  view: 'side' | 'occlusal';
  status: string;
  isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    const tintColor = STATUS_TINTS[status];
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = (child.material as THREE.MeshStandardMaterial).clone();
        if (status === 'MISSING') {
          mat.transparent = true;
          mat.opacity = 0.15;
          mat.wireframe = true;
          mat.color.set('#6b7280');
        } else if (tintColor) {
          mat.color.lerp(new THREE.Color(tintColor), 0.35);
        }
        if (isSelected) {
          mat.emissive = new THREE.Color('#3b82f6');
          mat.emissiveIntensity = 0.3;
        }
        child.material = mat;
      }
    });

    return clone;
  }, [scene, status, isSelected]);

  // Center the model at origin and compute scale
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 1.0 / maxDim;
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x * s, -center.y * s, -center.z * s),
    };
  }, [clonedScene]);

  const quadrant = Math.floor(fdi / 10);
  const isUpper = quadrant === 1 || quadrant === 2;
  const isLower = quadrant === 3 || quadrant === 4;
  const mirror = shouldMirrorModel(fdi);

  // Models have long axis along Z. Camera at [0,0,5] looks along -Z.
  // For buccal/side view: rotate Z→Y so tooth stands upright on screen.
  let rotX = 0;
  let rotY = mirror ? Math.PI : 0;
  let rotZ = 0;

  if (view === 'side') {
    // Buccal view: rotate -90° around X to bring Z-axis (long axis) to Y-axis
    rotX = -Math.PI / 2;
    // Lower teeth: additionally flip 180° so roots point down
    if (isLower) {
      rotX = Math.PI / 2;
    }
  } else {
    // Occlusal view: no X rotation needed, camera already looks along -Z
    rotX = 0;
    if (isLower) rotX = Math.PI;
  }

  return (
    <group ref={groupRef}>
      <group rotation={[rotX, rotY, rotZ]} scale={mirror ? [-1, 1, 1] : [1, 1, 1]}>
        <primitive object={clonedScene} scale={scale} position={offset} />
      </group>
      <AutoFit target={groupRef.current} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

function Tooth3DInner({
  fdi,
  view,
  status,
  surfaceConditions,
  isSelected = false,
  onClick,
  onContextMenu,
  width = 48,
  height = 100,
}: Tooth3DProps) {
  const modelPath = getModelPath(fdi);

  if (!modelPath || status === 'MISSING') {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center opacity-30"
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        <svg viewBox="0 0 30 76" width={width * 0.6} height={height * 0.6}>
          <ellipse
            cx={15}
            cy={38}
            rx={10}
            ry={30}
            fill="none"
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{ width, height, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={isSelected ? 'ring-2 ring-blue-400 rounded' : ''}
    >
      <Canvas
        dpr={[1.5, 2]}
        frameloop="always"
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        orthographic
        camera={{ zoom: 35, position: [0, 0, 5], near: 0.1, far: 100 }}
        style={{ width, height, background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 7]} intensity={1.2} />
        <directionalLight position={[-3, -1, 5]} intensity={0.4} />
        <directionalLight position={[0, -3, 4]} intensity={0.3} />
        <pointLight position={[0, 0, 3]} intensity={0.2} />
        <Suspense fallback={null}>
          <ToothModel
            modelPath={modelPath}
            fdi={fdi}
            view={view}
            status={status}
            isSelected={isSelected}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

const Tooth3D = React.memo(Tooth3DInner);
export default Tooth3D;
