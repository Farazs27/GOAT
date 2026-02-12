'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, ChevronRight, ChevronDown, Plus, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { CustomCategoryDialog } from './custom-category-dialog';

interface NzaCode {
  id: string;
  code: string;
  category: string;
  subcategory: string | null;
  descriptionNl: string;
  descriptionEn: string | null;
  maxTariff: string | number;
  requiresTooth: boolean;
  requiresSurface: boolean;
  toelichting: string | null;
  points: string | number | null;
  unit: string;
}

interface CustomCategory {
  id: string;
  name: string;
  description: string | null;
  codes: Array<{ nzaCodeId: string; nzaCode: NzaCode }>;
}

interface CodeBrowserPanelProps {
  onSelectCode: (code: { code: string; description: string; tariff: number; nzaCodeId?: string }) => void;
}

// Map actual DB category names → short display labels
const KNMT_CATEGORIES: Record<string, string> = {
  'Consultatie en diagnostiek': 'C · Consultatie',
  "Maken en/of beoordelen foto's": "X · Foto's",
  'Preventieve mondzorg': 'M · Preventie',
  'Verdoving': 'A · Verdoving',
  'Verdoving door middel van een roesje': 'B · Roesje',
  'Vullingen': 'V · Vullingen',
  'Wortelkanaalbehandelingen': 'E · Wortelkanaal',
  'Kronen en bruggen': 'R · Kroon & Brug',
  'Behandeling Kauwstelsel': 'G · Kaakgewricht',
  'Chirurgische ingrepen': 'H · Chirurgie',
  'Kunstgebitten': 'P · Prothese',
  'Tandvleesbehandelingen': 'T · Parodontologie',
  'Implantaten': 'J · Implantaten',
  'Uurtarieven': 'U · Uurtarieven',
  'Informatieverstrekking en onderlinge dienstverlening': 'Y · Info & diensten',
  'Orthodontie': 'F · Orthodontie',
};

const CATEGORY_ORDER = Object.keys(KNMT_CATEGORIES);

interface GroupedCodes {
  [category: string]: {
    [subcategory: string]: NzaCode[];
  };
}

export function CodeBrowserPanel({ onSelectCode }: CodeBrowserPanelProps) {
  const [allCodes, setAllCodes] = useState<NzaCode[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [expandedCustom, setExpandedCustom] = useState<Set<string>>(new Set());
  const [showToelichting, setShowToelichting] = useState(false);
  const [hoveredToelichtingId, setHoveredToelichtingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch all codes on mount
  useEffect(() => {
    if (allCodes.length === 0) {
      setLoading(true);
      authFetch('/api/nza-codes?all=true')
        .then(res => res.json())
        .then(data => {
          setAllCodes(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [allCodes.length]);

  // Fetch custom categories
  useEffect(() => {
    authFetch('/api/custom-code-categories')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) setCustomCategories(data);
      })
      .catch(() => {});
  }, []);

  // Group codes by category > subcategory
  const groupedCodes = useMemo<GroupedCodes>(() => {
    const groups: GroupedCodes = {};
    for (const code of allCodes) {
      const cat = code.category || 'Overig';
      const sub = code.subcategory || 'Algemeen';
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][sub]) groups[cat][sub] = [];
      groups[cat][sub].push(code);
    }
    return groups;
  }, [allCodes]);

  // Filtered codes for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allCodes.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.descriptionNl.toLowerCase().includes(q)
    );
  }, [searchQuery, allCodes]);

  // Sorted categories
  const sortedCategories = useMemo(() => {
    const cats = Object.keys(groupedCodes);
    return cats.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [groupedCodes]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleSubcategory = useCallback((key: string) => {
    setExpandedSubcategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleCustom = useCallback((id: string) => {
    setExpandedCustom(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectCode = useCallback((code: NzaCode) => {
    onSelectCode({
      code: code.code,
      description: code.descriptionNl,
      tariff: Number(code.maxTariff),
      nzaCodeId: code.id,
    });
  }, [onSelectCode]);

  const handleSaveCustomCategory = useCallback(async (category: { name: string; description: string; codeIds: string[] }) => {
    try {
      const res = await authFetch('/api/custom-code-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustomCategories(prev => [...prev, saved]);
      }
    } catch {}
    setCustomDialogOpen(false);
  }, []);

  const renderCodeCard = (code: NzaCode) => {
    const tariff = Number(code.maxTariff);
    const hasToelichting = !!code.toelichting;

    return (
      <div
        key={code.id}
        className="group relative flex items-center justify-between gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
        onClick={() => handleSelectCode(code)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-blue-300 text-sm font-medium">{code.code}</span>
            <span className="text-xs text-white/60 truncate">{code.descriptionNl}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white/50 text-xs">&euro;{tariff.toFixed(2)}</span>
            {code.requiresTooth && (
              <span className="text-[10px] text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded">element</span>
            )}
          </div>
          {showToelichting && hasToelichting && (
            <p className="text-[11px] text-white/35 mt-1 leading-relaxed">{code.toelichting}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasToelichting && !showToelichting && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); }}
                onMouseEnter={() => setHoveredToelichtingId(code.id)}
                onMouseLeave={() => setHoveredToelichtingId(null)}
                className="p-1 text-white/20 hover:text-blue-300 transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
              {hoveredToelichtingId === code.id && (
                <div className="absolute right-0 bottom-full mb-1 w-64 p-2.5 rounded-xl bg-[#1e2235] border border-white/10 shadow-2xl z-50">
                  <p className="text-[11px] text-white/60 leading-relaxed">{code.toelichting}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleSelectCode(code); }}
            className="p-1 text-white/20 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
          <h2 className="text-xs font-semibold text-white/90 uppercase tracking-wider">Codes</h2>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 space-y-2 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Zoek op code of omschrijving..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button
            onClick={() => setShowToelichting(!showToelichting)}
            className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/60 transition-colors"
          >
            {showToelichting ? (
              <ToggleRight className="h-4 w-4 text-blue-400" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            Toelichting tonen
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : searchResults !== null ? (
            /* Search results - flat list */
            <div className="space-y-1.5">
              <p className="text-xs text-white/30 mb-2">
                {searchResults.length} resultaten voor &ldquo;{searchQuery}&rdquo;
              </p>
              {searchResults.map(renderCodeCard)}
              {searchResults.length === 0 && (
                <p className="text-xs text-white/25 text-center py-8">Geen codes gevonden</p>
              )}
            </div>
          ) : (
            <>
              {/* KNMT Categories */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-2">KNMT Categorie&euml;n</p>
                <div className="space-y-0.5">
                  {sortedCategories.map(cat => {
                    const label = KNMT_CATEGORIES[cat] || cat;
                    const isExpanded = expandedCategories.has(cat);
                    const subcategories = groupedCodes[cat];
                    const subKeys = Object.keys(subcategories).sort();

                    return (
                      <div key={cat}>
                        <button
                          onClick={() => toggleCategory(cat)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 hover:bg-white/[0.06] ${
                            isExpanded ? 'bg-white/[0.04] border-l-2 border-blue-500/50' : 'border-l-2 border-transparent'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                          )}
                          <span className="text-xs text-white/70 font-medium truncate">
                            {label}
                          </span>
                          <span className="text-[10px] text-white/20 ml-auto flex-shrink-0">
                            {Object.values(subcategories).reduce((sum, arr) => sum + arr.length, 0)}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="ml-4 mt-0.5 space-y-0.5">
                            {subKeys.map(sub => {
                              const subKey = `${cat}::${sub}`;
                              const isSubExpanded = expandedSubcategories.has(subKey);
                              const codes = subcategories[sub];

                              return (
                                <div key={subKey}>
                                  <button
                                    onClick={() => toggleSubcategory(subKey)}
                                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all duration-200 hover:bg-white/[0.06] ${
                                      isSubExpanded ? 'bg-white/[0.03]' : ''
                                    }`}
                                  >
                                    {isSubExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-white/25 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-white/25 flex-shrink-0" />
                                    )}
                                    <span className="text-[11px] text-white/50 truncate">{sub}</span>
                                    <span className="text-[10px] text-white/15 ml-auto flex-shrink-0">{codes.length}</span>
                                  </button>

                                  {isSubExpanded && (
                                    <div className="ml-4 mt-1 mb-2 space-y-1">
                                      {codes.map(renderCodeCard)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Categories */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-2">Mijn Categorie&euml;n</p>
                <div className="space-y-0.5">
                  {customCategories.map(cc => {
                    const isExpanded = expandedCustom.has(cc.id);
                    return (
                      <div key={cc.id}>
                        <button
                          onClick={() => toggleCustom(cc.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 hover:bg-white/[0.06] ${
                            isExpanded ? 'bg-white/[0.04] border-l-2 border-blue-500/50' : 'border-l-2 border-transparent'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                          )}
                          <span className="text-xs text-white/70 font-medium">{cc.name}</span>
                          <span className="text-[10px] text-white/20 ml-auto">{cc.codes.length}</span>
                        </button>
                        {isExpanded && (
                          <div className="ml-4 mt-1 mb-2 space-y-1">
                            {cc.codes.map(({ nzaCode }) => renderCodeCard(nzaCode))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCustomDialogOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 mt-2 px-3 py-2 bg-white/[0.04] border border-dashed border-white/[0.12] rounded-xl text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.06] hover:border-white/[0.18] transition-all duration-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nieuwe categorie
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Category Dialog */}
      <CustomCategoryDialog
        isOpen={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        onSave={handleSaveCustomCategory}
        allCodes={allCodes.map(c => ({ id: c.id, code: c.code, description: c.descriptionNl, category: c.category }))}
      />
    </>
  );
}
