"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ToggleLeft,
  ToggleRight,
  FileText,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  title: string;
  consentType: string;
  contentNl: string;
  contentEn: string | null;
  expiryDays: number | null;
  isActive: boolean;
  createdAt: string;
  _count: { consentForms: number };
}

const CONSENT_TYPES = [
  "GENERAL",
  "TREATMENT",
  "PHOTOGRAPHY",
  "DATA_SHARING",
  "RESEARCH",
  "ANESTHESIA",
];

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "Algemeen",
  TREATMENT: "Behandeling",
  PHOTOGRAPHY: "Fotografie",
  DATA_SHARING: "Gegevensdeling",
  RESEARCH: "Onderzoek",
  ANESTHESIA: "Anesthesie",
};

export default function ConsentTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [consentType, setConsentType] = useState("GENERAL");
  const [contentNl, setContentNl] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [expiryDays, setExpiryDays] = useState("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/dashboard/consent-templates");
      if (res.ok) setTemplates(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const resetForm = () => {
    setTitle("");
    setConsentType("GENERAL");
    setContentNl("");
    setContentEn("");
    setExpiryDays("");
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowEditor(true);
  };

  const openEdit = (t: Template) => {
    setTitle(t.title);
    setConsentType(t.consentType);
    setContentNl(t.contentNl);
    setContentEn(t.contentEn || "");
    setExpiryDays(t.expiryDays ? String(t.expiryDays) : "");
    setEditingId(t.id);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !contentNl.trim()) return;
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        consentType,
        contentNl: contentNl.trim(),
        contentEn: contentEn.trim() || null,
        expiryDays: expiryDays ? Number(expiryDays) : null,
      };

      const res = editingId
        ? await authFetch(`/api/dashboard/consent-templates/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await authFetch("/api/dashboard/consent-templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        setShowEditor(false);
        resetForm();
        fetchTemplates();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    const res = await authFetch(`/api/dashboard/consent-templates/${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchTemplates();
  };

  const handleToggleActive = async (t: Template) => {
    const res = await authFetch(`/api/dashboard/consent-templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    if (res.ok) fetchTemplates();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Toestemmingsformulieren
          </h1>
          <div className="flex gap-4 mt-2">
            <Link
              href="/dashboard/consent"
              className="text-sm text-gray-500 hover:text-gray-700 pb-1"
            >
              Overzicht
            </Link>
            <span className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
              Sjablonen
            </span>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nieuw sjabloon
        </button>
      </div>

      {/* Template cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Laden...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>Nog geen sjablonen aangemaakt</p>
          <button
            onClick={openCreate}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Maak je eerste sjabloon
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`bg-white border rounded-xl p-5 ${
                t.isActive
                  ? "border-gray-200"
                  : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{t.title}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {TYPE_LABELS[t.consentType] || t.consentType}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(t)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title={t.isActive ? "Deactiveren" : "Activeren"}
                  >
                    {t.isActive ? (
                      <ToggleRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title="Bewerken"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                {t.contentNl.slice(0, 150)}
                {t.contentNl.length > 150 ? "..." : ""}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{t._count.consentForms} formulieren verstuurd</span>
                {t.expiryDays && <span>Verloopt na {t.expiryDays} dagen</span>}
              </div>

              {t.contentEn && (
                <div className="mt-2">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    NL + EN
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">
                {editingId ? "Sjabloon bewerken" : "Nieuw sjabloon"}
              </h2>
              <button
                onClick={() => {
                  setShowEditor(false);
                  resetForm();
                }}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijv. Toestemming behandeling"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={consentType}
                  onChange={(e) => setConsentType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {CONSENT_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {TYPE_LABELS[ct] || ct}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inhoud (Nederlands) *
                </label>
                <p className="text-xs text-gray-400 mb-1">
                  Merge velden: {"{patient_name}"}, {"{date}"},{" "}
                  {"{practitioner_name}"}
                </p>
                <textarea
                  value={contentNl}
                  onChange={(e) => setContentNl(e.target.value)}
                  rows={8}
                  placeholder="Schrijf hier de inhoud van het toestemmingsformulier..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inhoud (Engels) — optioneel
                </label>
                <textarea
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  rows={6}
                  placeholder="English content (optional)..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verlooptermijn (dagen) — optioneel
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  placeholder="Bijv. 365"
                  className="w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  min={1}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowEditor(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || !contentNl.trim() || saving}
                  className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Opslaan..."
                    : editingId
                      ? "Wijzigingen opslaan"
                      : "Sjabloon aanmaken"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
