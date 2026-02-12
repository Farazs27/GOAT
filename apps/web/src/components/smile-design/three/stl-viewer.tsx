'use client';

import { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Environment } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { Upload } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { useDsdStore } from '@/lib/smile-design/store';

interface StlViewerProps {
  stlUrl: string | null;
  designId: string;
  onStlUploaded: (url: string, fileName: string) => void;
}

function StlModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);

  // Center and scale the geometry
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

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin w-8 h-8 border-2 border-[#e8945a] border-t-transparent rounded-full" />
        <span className="text-xs text-white/60">STL laden...</span>
      </div>
    </Html>
  );
}

export function StlViewer({ stlUrl, designId, onStlUploaded }: StlViewerProps) {
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(stlUrl);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await authFetch(`/api/smile-design/${designId}/stl`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLocalUrl(data.url);
        onStlUploaded(data.url, data.fileName);
      }
    } finally {
      setUploading(false);
    }
  }, [designId, onStlUploaded]);

  if (!localUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-primary)]">
        <div className="glass-card p-8 text-center max-w-sm">
          <Upload className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">STL uploaden</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Upload een 3D scan (STL-bestand) om te bekijken en te analyseren
          </p>
          <label className="btn-liquid-primary px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploaden...' : 'Bestand selecteren'}
            <input
              type="file"
              accept=".stl"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>
    );
  }

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

        <Suspense fallback={<LoadingSpinner />}>
          <StlModel url={localUrl} />
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

      {/* Re-upload button */}
      <div className="absolute bottom-4 right-4">
        <label className="p-2 rounded-xl glass-light border border-white/[0.08] cursor-pointer hover:bg-white/[0.08] transition-colors inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Upload className="w-3.5 h-3.5" />
          Nieuw STL
          <input
            type="file"
            accept=".stl"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
