'use client';

import { useState, useCallback } from 'react';
import { useDsdStore } from '@/lib/smile-design/store';
import { Download, FileImage, FileJson, FileText } from 'lucide-react';
import type Konva from 'konva';

interface ExportPanelProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  designTitle: string;
  patientName: string;
}

export function ExportPanel({ stageRef, designTitle, patientName }: ExportPanelProps) {
  const landmarks = useDsdStore((s) => s.landmarks);
  const calibration = useDsdStore((s) => s.calibration);
  const measurements = useDsdStore((s) => s.measurements);
  const derivedStructures = useDsdStore((s) => s.derivedStructures);
  const [exporting, setExporting] = useState<string | null>(null);

  // --- PNG Export ---
  const exportPng = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;

    setExporting('png');
    try {
      const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
      const link = document.createElement('a');
      link.download = `${designTitle.replace(/\s+/g, '_')}_smile_design.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(null);
    }
  }, [stageRef, designTitle]);

  // --- JSON Export ---
  const exportJson = useCallback(() => {
    setExporting('json');
    try {
      const data = {
        exportDate: new Date().toISOString(),
        design: { title: designTitle, patient: patientName },
        landmarks,
        calibration,
        measurements,
        derivedStructures,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${designTitle.replace(/\s+/g, '_')}_smile_design.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }, [designTitle, patientName, landmarks, calibration, measurements, derivedStructures]);

  // --- PDF Export ---
  const exportPdf = useCallback(async () => {
    setExporting('pdf');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('Smile Design Rapport', 20, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Patiënt: ${patientName}`, 20, 28);
      doc.text(`Ontwerp: ${designTitle}`, 20, 34);
      doc.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, 20, 40);

      // Annotated image
      const stage = stageRef.current;
      if (stage) {
        const imgData = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
        const imgWidth = 170;
        const imgHeight = (stage.height() / stage.width()) * imgWidth;
        doc.addImage(imgData, 'PNG', 20, 48, imgWidth, Math.min(imgHeight, 120));
      }

      // Measurements table
      const yStart = stage ? Math.min(48 + (stage.height() / stage.width()) * 170, 168) + 10 : 50;

      if (measurements) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('Metingen', 20, yStart);

        const rows: string[][] = [];
        if (measurements.midlineDeviationMm !== null) {
          rows.push(['Middellijn deviatie', `${measurements.midlineDeviationMm.toFixed(1)} mm`]);
        }
        if (measurements.midlineDeviationDeg !== null) {
          rows.push(['Middellijn hoek', `${measurements.midlineDeviationDeg.toFixed(1)}°`]);
        }
        if (measurements.incisalPlaneAngleDeg !== null) {
          rows.push(['Incisaal vlak hoek', `${measurements.incisalPlaneAngleDeg.toFixed(1)}°`]);
        }
        if (measurements.centralDominance !== null) {
          rows.push(['Centrale dominantie', `${(measurements.centralDominance * 100).toFixed(0)}%`]);
        }
        if (measurements.redProportion !== null) {
          rows.push(['RED proportie', `${(measurements.redProportion * 100).toFixed(0)}%`]);
        }
        if (measurements.goldenProportionDeviation !== null) {
          rows.push(['Gouden snede afwijking', `${(measurements.goldenProportionDeviation * 100).toFixed(1)}%`]);
        }

        if (rows.length > 0) {
          autoTable(doc, {
            startY: yStart + 4,
            head: [['Meting', 'Waarde']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [232, 148, 90], textColor: 255 },
            styles: { fontSize: 9 },
            margin: { left: 20, right: 20 },
          });
        }
      }

      // Calibration info
      if (calibration) {
        const tableEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yStart + 30;
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Kalibratie: ${calibration.knownDistanceMm.toFixed(1)} mm referentie, ${calibration.mmPerPixel.toFixed(4)} mm/px`, 20, tableEnd + 8);
      }

      // Landmark count
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${landmarks.length} landmarks geplaatst`, 20, 285);
      doc.text('Gegenereerd door NEXIOM Smile Design', 120, 285);

      doc.save(`${designTitle.replace(/\s+/g, '_')}_rapport.pdf`);
    } finally {
      setExporting(null);
    }
  }, [stageRef, designTitle, patientName, landmarks, calibration, measurements]);

  const buttons = [
    { key: 'png', icon: FileImage, label: 'PNG afbeelding', desc: 'Hoge resolutie met overlays', onClick: exportPng },
    { key: 'json', icon: FileJson, label: 'JSON data', desc: 'Landmarks, metingen, kalibratie', onClick: exportJson },
    { key: 'pdf', icon: FileText, label: 'PDF rapport', desc: 'Afbeelding + metingen tabel', onClick: exportPdf },
  ];

  return (
    <div>
      <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">Exporteren</h2>

      <div className="space-y-2">
        {buttons.map(({ key, icon: Icon, label, desc, onClick }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={exporting !== null}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all text-left disabled:opacity-50"
          >
            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10">
              <Icon className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-[var(--text-primary)] block">{label}</span>
              <span className="text-xs text-[var(--text-tertiary)]">{desc}</span>
            </div>
            {exporting === key ? (
              <div className="animate-spin w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
            ) : (
              <Download className="w-4 h-4 text-[var(--text-tertiary)]" />
            )}
          </button>
        ))}
      </div>

      {landmarks.length === 0 && (
        <p className="mt-4 text-xs text-[var(--text-tertiary)] text-center">
          Plaats eerst landmarks voordat u exporteert
        </p>
      )}
    </div>
  );
}
