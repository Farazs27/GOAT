'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';

function StlModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);

  const centeredGeometry = geometry.clone();
  centeredGeometry.computeBoundingBox();
  const bbox = centeredGeometry.boundingBox!;
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  centeredGeometry.translate(-center.x, -center.y, -center.z);

  const maxDim = Math.max(
    bbox.max.x - bbox.min.x,
    bbox.max.y - bbox.min.y,
    bbox.max.z - bbox.min.z,
  );
  const scale = 4 / maxDim;

  return (
    <mesh ref={meshRef} geometry={centeredGeometry} scale={[scale, scale, scale]}>
      <meshPhysicalMaterial
        color="#e8e0d8"
        roughness={0.3}
        metalness={0.05}
        clearcoat={0.4}
        clearcoatRoughness={0.2}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

export default function PatientStlViewer({ url }: { url: string }) {
  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1.5, 2]}
        camera={{ position: [0, 2, 6], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={['#0E0C0A']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        <pointLight position={[0, -3, 2]} intensity={0.2} color="#e8945a" />

        <Suspense fallback={
          <Html center>
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin w-8 h-8 border-2 border-[#e8945a] border-t-transparent rounded-full" />
              <span className="text-xs text-white/60">3D scan laden...</span>
            </div>
          </Html>
        }>
          <StlModel url={url} />
        </Suspense>

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          autoRotate
          autoRotateSpeed={1}
          minDistance={2}
          maxDistance={15}
        />
      </Canvas>
    </div>
  );
}
