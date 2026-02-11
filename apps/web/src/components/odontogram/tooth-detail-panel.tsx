'use client';

import { useState, useEffect } from 'react';
import { X, Clock, User, FileText } from 'lucide-react';
import { getToothTypeName, getSurfaceLabel, type SurfaceKey } from './tooth-shapes';

interface TreatmentHistoryItem {
  id: string;
  date: string;
  description: string;
  nzaCode: string;
  performedBy: string;
  surfaces?: string[];
}

interface SurfaceCondition {
  surface: SurfaceKey;
  condition: string;
  material?: string;
}

interface ToothDetailPanelProps {
  toothNumber: number;
  status: string;
  surfaces: SurfaceCondition[];
  treatmentHistory: TreatmentHistoryItem[];
  onClose: () => void;
  onSurfaceClick?: (surface: SurfaceKey) => void;
  onStatusChange?: (status: string) => void;
  readOnly?: boolean;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Aanwezig', color: '#22c55e' },
  { value: 'MISSING', label: 'Afwezig', color: '#6b7280' },
  { value: 'CROWN', label: 'Kroon', color: '#f59e0b' },
  { value: 'IMPLANT', label: 'Implantaat', color: '#8b5cf6' },
];

const CONDITION_COLORS: Record<string, string> = {
  HEALTHY: '#22c55e',
  CARIES: '#ef4444',
  FILLING: '#3b82f6',
  FILLING_PLANNED: 'rgba(59, 130, 246, 0.5)',
  CROWN: '#f59e0b',
  ENDO: '#f97316',
  MISSING: '#6b7280',
  IMPLANT: '#8b5cf6',
};

const CONDITION_LABELS: Record<string, string> = {
  HEALTHY: 'Gezond',
  CARIES: 'Caries',
  FILLING: 'Vulling',
  FILLING_PLANNED: 'Vulling (gepland)',
  CROWN: 'Kroon',
  ENDO: 'Endodontisch',
  MISSING: 'Afwezig',
  IMPLANT: 'Implantaat',
};

export default function ToothDetailPanel({
  toothNumber,
  status,
  surfaces,
  treatmentHistory,
  onClose,
  onSurfaceClick,
  onStatusChange,
  readOnly = false,
  loading = false,
}: ToothDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  const quadrant = Math.floor(toothNumber / 10);
  const quadrantNames: Record<number, string> = {
    1: 'Rechtsboven (Q1)',
    2: 'Linksboven (Q2)',
    3: 'Linksonder (Q3)',
    4: 'Rechtsonder (Q4)',
  };

  const allSurfaces: SurfaceKey[] = ['M', 'D', 'O', 'B', 'L'];

  return (
    <div className={`tooth-detail-panel ${isVisible ? 'tooth-detail-panel--visible' : ''}`}>
      {/* Header */}
      <div className="tooth-detail-header">
        <div>
          <h3 className="tooth-detail-title">Tand {toothNumber}</h3>
          <p className="tooth-detail-subtitle">{getToothTypeName(toothNumber)}</p>
          <p className="tooth-detail-quadrant">{quadrantNames[quadrant]}</p>
        </div>
        <button onClick={handleClose} className="tooth-detail-close" aria-label="Sluiten">
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div className="tooth-detail-loading">
          <div className="tooth-detail-spinner" />
          <span>Laden...</span>
        </div>
      ) : (
        <>
          {/* Status */}
          <div className="tooth-detail-section">
            <h4 className="tooth-detail-section-title">Status</h4>
            <div className="tooth-detail-status-grid">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`tooth-detail-status-btn ${status === opt.value ? 'tooth-detail-status-btn--active' : ''}`}
                  style={{
                    borderColor: status === opt.value ? opt.color : undefined,
                    backgroundColor: status === opt.value ? `${opt.color}20` : undefined,
                  }}
                  onClick={() => !readOnly && onStatusChange?.(opt.value)}
                  disabled={readOnly}
                >
                  <span className="tooth-detail-status-dot" style={{ backgroundColor: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surfaces */}
          <div className="tooth-detail-section">
            <h4 className="tooth-detail-section-title">Vlakken</h4>
            <div className="tooth-detail-surfaces">
              {allSurfaces.map((key) => {
                const surface = surfaces.find((s) => s.surface === key);
                const condition = surface?.condition || 'HEALTHY';
                const color = CONDITION_COLORS[condition] || CONDITION_COLORS.HEALTHY;
                return (
                  <button
                    key={key}
                    className="tooth-detail-surface-item"
                    onClick={() => !readOnly && onSurfaceClick?.(key)}
                    disabled={readOnly}
                  >
                    <span className="tooth-detail-surface-dot" style={{ backgroundColor: color }} />
                    <span className="tooth-detail-surface-key">{key}</span>
                    <span className="tooth-detail-surface-label">
                      {getSurfaceLabel(key, toothNumber)}
                    </span>
                    <span className="tooth-detail-surface-condition" style={{ color }}>
                      {CONDITION_LABELS[condition] || condition}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Treatment History */}
          <div className="tooth-detail-section">
            <h4 className="tooth-detail-section-title">
              <FileText size={14} />
              Behandelhistorie
            </h4>
            {treatmentHistory.length === 0 ? (
              <p className="tooth-detail-empty">Geen behandelingen gevonden</p>
            ) : (
              <div className="tooth-detail-history">
                {treatmentHistory.map((item) => (
                  <div key={item.id} className="tooth-detail-history-item">
                    <div className="tooth-detail-history-header">
                      <span className="tooth-detail-history-code">{item.nzaCode}</span>
                      <span className="tooth-detail-history-date">
                        <Clock size={12} />
                        {new Date(item.date).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                    <p className="tooth-detail-history-desc">{item.description}</p>
                    <p className="tooth-detail-history-by">
                      <User size={12} />
                      {item.performedBy}
                    </p>
                    {item.surfaces && item.surfaces.length > 0 && (
                      <div className="tooth-detail-history-surfaces">
                        {item.surfaces.map((s) => (
                          <span key={s} className="tooth-detail-history-surface-tag">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
