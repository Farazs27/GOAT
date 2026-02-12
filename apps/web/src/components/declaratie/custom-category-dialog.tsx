'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Plus } from 'lucide-react';

interface CustomCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: { name: string; description: string; codeIds: string[] }) => void;
  existingCategory?: { id: string; name: string; description: string; codes: { nzaCodeId: string; code: string }[] };
  allCodes: Array<{ id: string; code: string; description: string; category: string }>;
}

export function CustomCategoryDialog({ isOpen, onClose, onSave, existingCategory, allCodes }: CustomCategoryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCodeIds, setSelectedCodeIds] = useState<Set<string>>(new Set());
  const [codeSearch, setCodeSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Initialize from existing category
  useEffect(() => {
    if (isOpen && existingCategory) {
      setName(existingCategory.name);
      setDescription(existingCategory.description || '');
      setSelectedCodeIds(new Set(existingCategory.codes.map(c => c.nzaCodeId)));
    } else if (isOpen) {
      setName('');
      setDescription('');
      setSelectedCodeIds(new Set());
      setCodeSearch('');
    }
  }, [isOpen, existingCategory]);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [isOpen]);

  const filteredCodes = useMemo(() => {
    if (!codeSearch.trim()) return allCodes;
    const q = codeSearch.toLowerCase();
    return allCodes.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }, [codeSearch, allCodes]);

  const selectedCodes = useMemo(() => {
    return allCodes.filter(c => selectedCodeIds.has(c.id));
  }, [allCodes, selectedCodeIds]);

  const toggleCode = (id: string) => {
    setSelectedCodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeCode = (id: string) => {
    setSelectedCodeIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      codeIds: Array.from(selectedCodeIds),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-4 bg-[#1e2235] border border-white/10 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <h3 className="text-sm font-semibold text-white/90">
            {existingCategory ? 'Categorie bewerken' : 'Nieuwe categorie'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.08] rounded-lg transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Naam</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Controlebezoek pakket"
              className="w-full mt-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Omschrijving (optioneel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Korte beschrijving van deze categorie..."
              rows={2}
              className="w-full mt-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          {/* Selected codes chips */}
          {selectedCodes.length > 0 && (
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
                Geselecteerde codes ({selectedCodes.length})
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {selectedCodes.map(c => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/15 border border-blue-500/20 rounded-lg text-[11px] text-blue-300 font-mono"
                  >
                    {c.code}
                    <button
                      onClick={() => removeCode(c.id)}
                      className="text-blue-300/50 hover:text-blue-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Code search */}
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Codes toevoegen</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Zoek op code of omschrijving..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
              {filteredCodes.map(c => {
                const isSelected = selectedCodeIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCode(c.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all duration-150 border-b border-white/[0.04] last:border-0 ${
                      isSelected
                        ? 'bg-blue-500/10 text-blue-300'
                        : 'hover:bg-white/[0.06] text-white/60'
                    }`}
                  >
                    <span className="font-mono text-[11px] font-medium w-10 flex-shrink-0">{c.code}</span>
                    <span className="text-[11px] truncate flex-1">{c.description}</span>
                    {isSelected ? (
                      <span className="text-[10px] text-blue-400 flex-shrink-0">Toegevoegd</span>
                    ) : (
                      <Plus className="h-3 w-3 text-white/20 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
              {filteredCodes.length === 0 && (
                <p className="text-[11px] text-white/25 text-center py-4">Geen codes gevonden</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-white/50 hover:text-white/70 hover:bg-white/[0.06] rounded-xl transition-all"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || selectedCodeIds.size === 0}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-500/80 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}
