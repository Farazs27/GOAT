'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { useDsdStore } from '@/lib/smile-design/store';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save } from 'lucide-react';

const DsdWorkspace = dynamic(() => import('@/components/smile-design/workspace'), { ssr: false });

interface DesignData {
  id: string;
  title: string;
  status: string;
  patient: { id: string; firstName: string; lastName: string };
  image: { id: string; filePath: string; fileName: string };
  versions: Array<{
    id: string;
    versionNumber: number;
    landmarkData: { landmarks: Array<{ type: string; x: number; y: number }> };
    calibrationData: { point1: { x: number; y: number }; point2: { x: number; y: number }; knownDistanceMm: number; mmPerPixel: number } | null;
    measurements: Record<string, unknown> | null;
    derivedLines: Record<string, unknown> | null;
  }>;
}

export default function SmileDesignWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const designId = params.designId as string;
  const [design, setDesign] = useState<DesignData | null>(null);
  const [loading, setLoading] = useState(true);

  const { setDesign: setStoreDesign, loadVersion, isDirty, isSaving, setSaving, markClean, landmarks, calibration, measurements, derivedStructures, reset } = useDsdStore();

  useEffect(() => {
    return () => { reset(); };
  }, [reset]);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`/api/smile-design/${designId}`);
        if (!res.ok) { router.push('/smile-design'); return; }
        const data: DesignData = await res.json();
        setDesign(data);
        setStoreDesign(data.id, data.patient.id, data.image.filePath);

        // Load latest version
        if (data.versions.length > 0) {
          const v = data.versions[0];
          loadVersion({
            landmarks: (v.landmarkData as { landmarks: Array<{ type: string; x: number; y: number }> }).landmarks as never[],
            calibration: v.calibrationData as never,
            measurements: v.measurements as never,
            derivedLines: v.derivedLines as never,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [designId, router, setStoreDesign, loadVersion]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/smile-design/${designId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarkData: { landmarks },
          calibrationData: calibration,
          measurements,
          derivedLines: derivedStructures,
        }),
      });
      if (res.ok) markClean();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!design) return null;

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col -m-5 sm:-m-8 lg:-m-10">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/smile-design')}
            className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <div>
            <h1 className="text-sm font-medium text-[var(--text-primary)]">{design.title}</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {design.patient.firstName} {design.patient.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-amber-400">Niet-opgeslagen wijzigingen</span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="btn-liquid-primary px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden">
        <DsdWorkspace
          designTitle={design.title}
          patientName={`${design.patient.firstName} ${design.patient.lastName}`}
        />
      </div>
    </div>
  );
}
