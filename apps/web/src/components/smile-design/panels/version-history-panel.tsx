'use client';

import { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useDsdStore } from '@/lib/smile-design/store';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Clock, RotateCcw } from 'lucide-react';
import type { VersionData, LandmarkPoint, CalibrationData, Measurements, DerivedStructures } from '@/lib/smile-design/types';

interface VersionItem {
  id: string;
  versionNumber: number;
  createdBy: string;
  notes: string | null;
  createdAt: string;
}

interface FullVersion extends VersionItem {
  landmarkData: { landmarks: LandmarkPoint[] };
  calibrationData: CalibrationData | null;
  measurements: Measurements | null;
  derivedLines: DerivedStructures | null;
}

export function VersionHistoryPanel() {
  const designId = useDsdStore((s) => s.designId);
  const loadVersion = useDsdStore((s) => s.loadVersion);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!designId) return;
    try {
      const res = await authFetch(`/api/smile-design/${designId}/versions`);
      if (res.ok) setVersions(await res.json());
    } finally {
      setLoading(false);
    }
  }, [designId]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const handleRestore = async (versionId: string) => {
    if (!designId) return;
    setRestoring(versionId);
    try {
      // Fetch the full version data
      const res = await authFetch(`/api/smile-design/${designId}`);
      if (!res.ok) return;

      // We need to get versions list with full data — use a separate call
      // For now, re-fetch the design with the version included
      const versionsRes = await authFetch(`/api/smile-design/${designId}/versions`);
      if (!versionsRes.ok) return;

      // Find the version — we need full data which isn't in the list endpoint
      // So we save a new version that copies the old one
      // For simplicity, we'll refetch the design endpoint which includes latest version
      // A proper approach would be a GET /versions/:id endpoint
      // For now, just reload the page state
      // TODO: Add GET /versions/:id for individual version retrieval

    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[var(--text-primary)]">Versiegeschiedenis</h2>
        <button
          onClick={fetchVersions}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--text-tertiary)] transition-colors"
          title="Vernieuwen"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
          Geen versies gevonden
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((version, idx) => (
            <div
              key={version.id}
              className={`px-3 py-2.5 rounded-xl transition-all ${
                idx === 0
                  ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  v{version.versionNumber}
                  {idx === 0 && (
                    <span className="ml-2 text-xs text-[var(--accent-primary)]">huidige</span>
                  )}
                </span>
                <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true, locale: nl })}
                </div>
              </div>
              {version.notes && (
                <p className="text-xs text-[var(--text-secondary)] mb-1">{version.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
