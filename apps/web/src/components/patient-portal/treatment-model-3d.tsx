"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage } from "@react-three/drei";
import * as THREE from "three";

interface TreatmentModel3DProps {
  modelPath: string | null;
  description: string;
}

function Model({ path }: { path: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(path);

  // Auto-rotate
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return <primitive ref={meshRef} object={scene} />;
}

export default function TreatmentModel3D({ modelPath, description }: TreatmentModel3DProps) {
  if (!modelPath) {
    return (
      <div className="h-full flex items-center justify-center bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
        <div className="text-center p-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-white/40">Geen 3D model beschikbaar</p>
          <p className="text-xs text-white/25 mt-1">voor deze behandeling</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 50], fov: 25 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} adjustCamera={1.8}>
            <Model path={modelPath} />
          </Stage>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate={true}
            autoRotateSpeed={2}
          />
        </Suspense>
      </Canvas>

      {/* Model info overlay */}
      <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md border border-white/[0.08] rounded-xl px-3 py-2">
        <p className="text-xs text-white/60 text-center truncate">
          3D visualisatie: {description}
        </p>
      </div>
    </div>
  );
}
