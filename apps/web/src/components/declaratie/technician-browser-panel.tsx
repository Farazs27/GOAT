'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { Search, ChevronRight, ChevronDown, Plus, Wrench } from 'lucide-react';

interface TechnicianItem {
  id: string;
  description: string;
  price: number;
  note?: string;
}

interface TechnicianCategory {
  name: string;
  items: TechnicianItem[];
}

interface Technician {
  id: string;
  name: string;
  categories: TechnicianCategory[];
}

interface TechnicianBrowserPanelProps {
  onSelectItem: (item: { description: string; price: number; technician: string }) => void;
}

// Nucci Digital Lab by Marcos Gatti
const NUCCI: Technician = {
  id: 'nucci',
  name: 'Nucci (Marcos Gatti)',
  categories: [
    {
      name: 'Zirconia',
      items: [
        { id: 'n-z1', description: 'Anterior Full Contour Crown', price: 150 },
        { id: 'n-z2', description: 'Posterior Full Contour Crown', price: 130 },
        { id: 'n-z3', description: 'Cut Back + Microlayering', price: 160 },
        { id: 'n-z4', description: 'Layered gums', price: 45 },
        { id: 'n-z5', description: 'Build up for Layered coping', price: 100 },
        { id: 'n-z6', description: 'Coping and Abutment', price: 80 },
        { id: 'n-z7', description: 'Full Arch Full Contour FP3 (no Ti bar)', price: 2100 },
        { id: 'n-z8', description: 'Full Arch Full Layered FP3 (no Ti bar)', price: 2680 },
      ],
    },
    {
      name: 'Aesthetics Works (Lithium Disilicate)',
      items: [
        { id: 'n-a1', description: 'Anterior Veneers Full Contour', price: 160 },
        { id: 'n-a2', description: 'Posterior Veneers Full Contour', price: 130 },
        { id: 'n-a3', description: 'Anterior Veneers Cut Back + Microlayering', price: 190 },
        { id: 'n-a4', description: 'Posterior Crown Full Contour', price: 130 },
        { id: 'n-a5', description: 'Anterior Crown Full Contour', price: 160 },
        { id: 'n-a6', description: 'Maryland', price: 160 },
        { id: 'n-a7', description: 'Inlay and Onlay', price: 110 },
      ],
    },
    {
      name: 'Motivational Planning',
      items: [
        { id: 'n-m1', description: 'Mock up', price: 20, note: 'per element' },
        { id: 'n-m2', description: 'Index', price: 10 },
        { id: 'n-m3', description: 'Digital Model', price: 15 },
      ],
    },
    {
      name: 'Temporary',
      items: [
        { id: 'n-t1', description: 'Temporary in PMMA', price: 45, note: 'per element' },
        { id: 'n-t2', description: 'Temporary Printed Resin', price: 35, note: 'per element' },
      ],
    },
    {
      name: 'Refractory Veneers',
      items: [
        { id: 'n-r1', description: 'Feldspar Veneers', price: 300, note: 'per element' },
        { id: 'n-r2', description: 'Gueller model', price: 40 },
      ],
    },
  ],
};

// ACA - Advanced Ceramic Aesthetics
const ACA: Technician = {
  id: 'aca',
  name: 'ACA (Advanced Ceramic Aesthetics)',
  categories: [
    {
      name: 'FGTP Planning',
      items: [
        { id: 'a-p1', description: 'FGTP Occlusion - Occlusal analysis', price: 30 },
        { id: 'a-p2', description: 'FGTP Resto - Upper AND lower jaw', price: 625 },
        { id: 'a-p3', description: 'FGTP Resto - Upper OR lower jaw', price: 300 },
        { id: 'a-p4', description: 'FGTP Ortho - Upper and lower', price: 400 },
        { id: 'a-p5', description: 'FGTP Ortho & Resto - Per jaw', price: 500 },
        { id: 'a-p6', description: 'TAD Planning (CBCT mandatory)', price: 75 },
        { id: 'a-p7', description: 'SFOT design (CBCT mandatory)', price: 150 },
        { id: 'a-p8', description: 'FGTP Multidisciplinary', price: 1000 },
        { id: 'a-p9', description: 'FGTP Perio - Crown lengthening simulation', price: 200 },
      ],
    },
    {
      name: 'Implant Planning',
      items: [
        { id: 'a-i1', description: 'FGTP Single implant planning', price: 170 },
        { id: 'a-i2', description: 'Every next implant', price: 50 },
        { id: 'a-i3', description: 'FGTP Full-Arch Fixed Prosthesis on Implants', price: 1200, note: 'per jaw' },
      ],
    },
    {
      name: 'Autotransplant',
      items: [
        { id: 'a-at1', description: 'Root segmentation with handle', price: 50 },
        { id: 'a-at2', description: 'Fully guided planning incl. root + guide design', price: 150 },
      ],
    },
    {
      name: 'Airway & Advanced',
      items: [
        { id: 'a-aw1', description: 'Airway CBCT segmentation and analysis', price: 150 },
        { id: 'a-aw2', description: 'AFGTP wholistic driven planning', price: 1000 },
      ],
    },
    {
      name: 'Modjaw Registration',
      items: [
        { id: 'a-mj1', description: 'Splint registration', price: 265 },
        { id: 'a-mj2', description: 'Registration for use with any FGTP', price: 365 },
      ],
    },
  ],
};

const TECHNICIANS = [NUCCI, ACA];

export function TechnicianBrowserPanel({ onSelectItem }: TechnicianBrowserPanelProps) {
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const activeTechnician = useMemo(() => {
    return TECHNICIANS.find(t => t.id === selectedTechnician) || null;
  }, [selectedTechnician]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !activeTechnician) return null;
    const q = searchQuery.toLowerCase();
    const results: (TechnicianItem & { categoryName: string })[] = [];
    for (const cat of activeTechnician.categories) {
      for (const item of cat.items) {
        if (item.description.toLowerCase().includes(q)) {
          results.push({ ...item, categoryName: cat.name });
        }
      }
    }
    return results;
  }, [searchQuery, activeTechnician]);

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleSelect = useCallback((item: TechnicianItem) => {
    if (!activeTechnician) return;
    onSelectItem({
      description: item.description,
      price: item.price,
      technician: activeTechnician.name,
    });
  }, [activeTechnician, onSelectItem]);

  const renderItem = (item: TechnicianItem) => (
    <div
      key={item.id}
      className="group flex items-center justify-between gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
      onClick={() => handleSelect(item)}
    >
      <div className="flex-1 min-w-0">
        <span className="text-xs text-white/70 block truncate">{item.description}</span>
        {item.note && (
          <span className="text-[10px] text-white/30">{item.note}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs text-emerald-400/80 font-mono">&euro;{item.price.toFixed(2)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); handleSelect(item); }}
          className="p-1 text-white/20 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]">
        <Wrench className="h-3.5 w-3.5 text-white/40" />
        <h2 className="text-xs font-semibold text-white/90 uppercase tracking-wider">Techniek</h2>
      </div>

      {/* Technician selector */}
      <div className="px-3 py-2.5 border-b border-white/[0.06]">
        {!selectedTechnician ? (
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Kies technicus</p>
            {TECHNICIANS.map(tech => (
              <button
                key={tech.id}
                onClick={() => { setSelectedTechnician(tech.id); setExpandedCategories(new Set()); setSearchQuery(''); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white/50">
                    {tech.id === 'nucci' ? 'MG' : 'ACA'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/80 font-medium truncate">{tech.name}</p>
                  <p className="text-[10px] text-white/30">{tech.categories.length} categorieën</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-white/20 ml-auto flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => { setSelectedTechnician(null); setSearchQuery(''); }}
              className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Andere technicus
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Zoek item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {activeTechnician && (
          <>
            {/* Active technician label */}
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
              {activeTechnician.id === 'nucci' ? 'Marcos Gatti' : 'ACA'}
            </p>

            {searchResults !== null ? (
              <div className="space-y-1.5">
                <p className="text-xs text-white/30 mb-2">
                  {searchResults.length} resultaten
                </p>
                {searchResults.map(item => renderItem(item))}
                {searchResults.length === 0 && (
                  <p className="text-xs text-white/25 text-center py-6">Geen items gevonden</p>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                {activeTechnician.categories.map(cat => {
                  const isExpanded = expandedCategories.has(cat.name);
                  return (
                    <div key={cat.name}>
                      <button
                        onClick={() => toggleCategory(cat.name)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 hover:bg-white/[0.06] ${
                          isExpanded ? 'bg-white/[0.04] border-l-2 border-emerald-500/50' : 'border-l-2 border-transparent'
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                        )}
                        <span className="text-xs text-white/70 font-medium truncate">{cat.name}</span>
                        <span className="text-[10px] text-white/20 ml-auto flex-shrink-0">{cat.items.length}</span>
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 mb-2 space-y-1">
                          {cat.items.map(renderItem)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
