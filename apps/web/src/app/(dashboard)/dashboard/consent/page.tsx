"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  Download,
  Send,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface ConsentForm {
  id: string;
  title: string;
  consentType: string;
  status: string;
  signedAt: string | null;
  signedByName: string | null;
  signedIp: string | null;
  signedUserAgent: string | null;
  signerRelation: string | null;
  expiresAt: string | null;
  createdAt: string;
  patient: { id: string; firstName: string; lastName: string };
  template: { id: string; title: string } | null;
}

interface Template {
  id: string;
  title: string;
  consentType: string;
  contentNl: string;
  contentEn: string | null;
  isActive: boolean;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SIGNED: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  REVOKED: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "In afwachting",
  SIGNED: "Ondertekend",
  EXPIRED: "Verlopen",
  REVOKED: "Ingetrokken",
};

export default function ConsentOverviewPage() {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Send dialog
  const [showSend, setShowSend] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [sendPatientIds, setSendPatientIds] = useState<string[]>([]);
  const [sendLang, setSendLang] = useState<"nl" | "en">("nl");
  const [sendLoading, setSendLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  const fetchForms = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (statusFilter) params.set("status", statusFilter);
      if (templateFilter) params.set("templateId", templateFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await authFetch(`/api/dashboard/consent?${params}`);
      if (res.ok) {
        const data = await res.json();
        setForms(data.forms);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, templateFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  useEffect(() => {
    authFetch("/api/dashboard/consent-templates?active=true").then(async (res) => {
      if (res.ok) setTemplates(await res.json());
    });
  }, []);

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (templateFilter) params.set("templateId", templateFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await authFetch(`/api/dashboard/consent/export?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consent-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const openSendDialog = async () => {
    setShowSend(true);
    // Fetch patients for selection
    const res = await authFetch("/api/patients?limit=500");
    if (res.ok) {
      const data = await res.json();
      setPatients(data.patients || data);
    }
  };

  const handleSend = async () => {
    if (!sendTemplateId || sendPatientIds.length === 0) return;
    setSendLoading(true);
    try {
      const res = await authFetch("/api/dashboard/consent/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: sendTemplateId,
          patientIds: sendPatientIds,
          language: sendLang,
        }),
      });
      if (res.ok) {
        setShowSend(false);
        setSendTemplateId("");
        setSendPatientIds([]);
        fetchForms();
      }
    } finally {
      setSendLoading(false);
    }
  };

  const togglePatient = (id: string) => {
    setSendPatientIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const filteredPatients = patients.filter((p) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return name.includes(patientSearch.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Toestemmingsformulieren
          </h1>
          <div className="flex gap-4 mt-2">
            <span className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
              Overzicht
            </span>
            <Link
              href="/dashboard/consent/templates"
              className="text-sm text-gray-500 hover:text-gray-700 pb-1"
            >
              Sjablonen
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Exporteren
          </button>
          <button
            onClick={openSendDialog}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
            Versturen
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Alle statussen</option>
          <option value="PENDING">In afwachting</option>
          <option value="SIGNED">Ondertekend</option>
          <option value="EXPIRED">Verlopen</option>
          <option value="REVOKED">Ingetrokken</option>
        </select>

        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Alle sjablonen</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Van"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Tot"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Patient
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Formulier
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Type
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Ondertekend op
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Verloopt op
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Laden...
                </td>
              </tr>
            ) : forms.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Geen formulieren gevonden
                </td>
              </tr>
            ) : (
              forms.map((form) => (
                <>
                  <tr
                    key={form.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === form.id ? null : form.id)
                    }
                  >
                    <td className="px-4 py-3">
                      {form.patient.firstName} {form.patient.lastName}
                    </td>
                    <td className="px-4 py-3">{form.title}</td>
                    <td className="px-4 py-3">{form.consentType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[form.status] || "bg-gray-100 text-gray-800"}`}
                      >
                        {STATUS_LABELS[form.status] || form.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {form.signedAt
                        ? new Date(form.signedAt).toLocaleDateString("nl-NL")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {form.expiresAt
                        ? new Date(form.expiresAt).toLocaleDateString("nl-NL")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {expandedId === form.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
                  </tr>
                  {expandedId === form.id && (
                    <tr key={`${form.id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <h4 className="text-sm font-semibold mb-2 text-gray-700">
                          Audit Trail
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">IP-adres:</span>{" "}
                            {form.signedIp || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">User Agent:</span>{" "}
                            <span className="text-xs break-all">
                              {form.signedUserAgent || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">
                              Ondertekend door:
                            </span>{" "}
                            {form.signedByName || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">Relatie:</span>{" "}
                            {form.signerRelation || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">Aangemaakt:</span>{" "}
                            {new Date(form.createdAt).toLocaleString("nl-NL")}
                          </div>
                          <div>
                            <span className="text-gray-500">Sjabloon:</span>{" "}
                            {form.template?.title || "-"}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-gray-500">
              {pagination.total} resultaten
            </span>
            <div className="flex gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => fetchForms(p)}
                    className={`px-3 py-1 text-sm rounded ${
                      p === pagination.page
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Send Dialog */}
      {showSend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Toestemmingsformulier versturen
              </h2>
              <button onClick={() => setShowSend(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sjabloon
                </label>
                <select
                  value={sendTemplateId}
                  onChange={(e) => setSendTemplateId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecteer sjabloon...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.consentType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taal
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSendLang("nl")}
                    className={`px-4 py-2 text-sm rounded-lg border ${
                      sendLang === "nl"
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "border-gray-300"
                    }`}
                  >
                    Nederlands
                  </button>
                  <button
                    onClick={() => setSendLang("en")}
                    className={`px-4 py-2 text-sm rounded-lg border ${
                      sendLang === "en"
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "border-gray-300"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patienten ({sendPatientIds.length} geselecteerd)
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Zoek patient..."
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredPatients.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={sendPatientIds.includes(p.id)}
                        onChange={() => togglePatient(p.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">
                        {p.firstName} {p.lastName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={
                  !sendTemplateId || sendPatientIds.length === 0 || sendLoading
                }
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {sendLoading
                  ? "Versturen..."
                  : `Verstuur naar ${sendPatientIds.length} patient(en)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
