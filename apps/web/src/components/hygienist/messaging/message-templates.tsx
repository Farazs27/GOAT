"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, ChevronDown } from "lucide-react";

interface Template {
  label: string;
  text: string;
}

const TEMPLATES: Template[] = [
  {
    label: "Nazorg na reiniging",
    text: "Beste [patient], na uw parodontale reiniging adviseren wij om de komende 24 uur geen heet of gekruid voedsel te nuttigen. Gebruik de voorgeschreven mondspoeling tweemaal daags. Bij aanhoudende klachten kunt u contact met ons opnemen.",
  },
  {
    label: "Recall herinnering",
    text: "Beste [patient], het is tijd voor uw periodieke controle. Wij adviseren u om een afspraak te maken voor uw volgende behandeling. U kunt online boeken via het patiëntenportaal of bel ons op het praktijknummer.",
  },
  {
    label: "Thuiszorg instructies",
    text: "Beste [patient], hier zijn uw persoonlijke thuiszorginstructies: gebruik een zachte tandenborstel, poets minimaal twee keer per dag en gebruik ragers of interdentale borsteltjes voor de tussenruimtes.",
  },
  {
    label: "Afspraak bevestiging",
    text: "Beste [patient], uw afspraak op [datum] is bevestigd. Wij verzoeken u om 5 minuten voor aanvang aanwezig te zijn. Mocht u verhinderd zijn, neem dan tijdig contact met ons op.",
  },
  {
    label: "Verwijzing informatie",
    text: "Beste [patient], wij verwijzen u door naar een specialist voor verdere behandeling. U ontvangt binnenkort een brief met alle details. Neem bij vragen gerust contact met ons op.",
  },
];

interface MessageTemplatesProps {
  patientName: string;
  onSelect: (text: string) => void;
}

export function MessageTemplates({ patientName, onSelect }: MessageTemplatesProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (template: Template) => {
    const text = template.text.replace(/\[patient\]/g, patientName);
    onSelect(text);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-3 rounded-2xl hover:bg-white/[0.06] transition-all text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        title="Sjablonen"
      >
        <FileText className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-72 glass-card rounded-xl border border-white/[0.1] shadow-xl z-20 py-1 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Sjablonen
          </div>
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => handleSelect(t)}
              className="w-full text-left px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
            >
              <div className="text-sm font-medium text-[var(--text-secondary)]">{t.label}</div>
              <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                {t.text.slice(0, 60)}...
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
