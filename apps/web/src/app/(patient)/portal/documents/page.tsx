"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  Euro,
  Download,
  Search,
  Filter,
  FileImage,
  FileCheck,
  FileBadge,
  Scan,
  EyeOff,
  RotateCcw,
  Maximize2,
} from "lucide-react";
import { XRayLightbox } from "@/components/patient-portal/xray-lightbox";

const statusLabels: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  PARTIALLY_PAID: "Deels betaald",
  PAID: "Betaald",
  OVERDUE: "Verlopen",
  CANCELLED: "Geannuleerd",
  CREDITED: "Gecrediteerd",
  PENDING: "In afwachting",
  SIGNED: "Getekend",
  PROPOSED: "Voorgesteld",
  ACCEPTED: "Geaccepteerd",
  COMPLETED: "Voltooid",
};

const statusClasses: Record<string, string> = {
  DRAFT: "bg-white/[0.06] text-white/50 border-white/[0.08]",
  SENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PARTIALLY_PAID: "bg-[#e8945a]/10 text-[#e8945a] border-[#e8945a]/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  OVERDUE: "bg-red-500/10 text-red-400 border-red-500/20",
  CANCELLED: "bg-white/[0.06] text-white/40 border-white/[0.08]",
  CREDITED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SIGNED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PROPOSED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACCEPTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function formatCurrency(val: number | string) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(val));
}

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "Onbekend";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getDocumentIcon(type: string) {
  switch (type) {
    case "consent":
      return FileCheck;
    case "treatment_plan":
      return FileBadge;
    default:
      return FileText;
  }
}

function getImageTypeLabel(type: string) {
  const labels: Record<string, string> = {
    XRAY: "Röntgen",
    INTRAORAL: "Intraoraal",
    EXTRAORAL: "Extraoraal",
    OTHER: "Overig",
  };
  return labels[type] || type;
}

interface XRayImage {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  imageType: string;
  notes?: string;
  createdAt: string;
  uploader?: {
    firstName: string;
    lastName: string;
  };
}

interface Document {
  id: string;
  title: string;
  documentType: string;
  subType?: string;
  status?: string;
  createdAt: string;
  signedAt?: string;
  proposedAt?: string;
  acceptedAt?: string;
  uploadedBy?: string;
  fileSize?: number;
  mimeType?: string;
  s3Key?: string;
  type: string;
}

export default function DocumentsPage() {
  const [data, setData] = useState<{
    invoices: any[];
    documents: Document[];
  } | null>(null);
  const [images, setImages] = useState<XRayImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [tab, setTab] = useState<"invoices" | "xrays" | "documents">(
    "invoices",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // X-ray viewer state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState<number | undefined>(
    undefined,
  );
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(
    null,
  );

  // Document filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchData = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    try {
      const response = await fetch(`/api/patient-portal/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    try {
      const response = await fetch(`/api/patient-portal/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setImages(result.images || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchImages();
  }, []);

  const handleDownloadInvoice = async (
    invoiceId: string,
    invoiceNumber: string,
  ) => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    setDownloadingId(invoiceId);
    try {
      const response = await fetch(
        `/api/patient-portal/invoices/${invoiceId}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("Download mislukt");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factuur-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadImage = async (image: XRayImage) => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    try {
      // If the image has a direct URL, use it
      if (image.filePath) {
        const link = document.createElement("a");
        link.href = image.filePath;
        link.download = image.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    const token = localStorage.getItem("patient_token");
    if (!token || !doc.s3Key) return;

    setDownloadingId(doc.id);
    try {
      const response = await fetch(
        `/api/patient-portal/documents/${doc.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("Download mislukt");
      }

      const result = await response.json();

      // For now, open in new tab since we don't have the actual file
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      }
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    setCompareMode(false);
    setCompareIndex(undefined);
  };

  const openCompareMode = (index: number) => {
    if (selectedForCompare === null) {
      setSelectedForCompare(images[index].id);
    } else {
      const firstIndex = images.findIndex(
        (img) => img.id === selectedForCompare,
      );
      if (firstIndex !== -1 && firstIndex !== index) {
        setCurrentImageIndex(firstIndex);
        setCompareIndex(index);
        setCompareMode(true);
        setLightboxOpen(true);
        setSelectedForCompare(null);
      } else {
        setSelectedForCompare(images[index].id);
      }
    }
  };

  const tabs = [
    { key: "invoices" as const, label: "Facturen", icon: Receipt },
    { key: "xrays" as const, label: "Röntgenfoto's", icon: Scan },
    { key: "documents" as const, label: "Documenten", icon: FileText },
  ];

  // Filter documents
  const filteredDocuments =
    data?.documents?.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || doc.type === typeFilter;
      return matchesSearch && matchesType;
    }) || [];

  // Get unique document types for filter
  const documentTypes = Array.from(
    new Set(data?.documents?.map((d) => d.type) || []),
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#e8945a]/10 border border-[#e8945a]/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#e8945a]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white/90">Documenten</h1>
          <p className="text-sm text-white/40">
            Uw facturen, röntgenfoto&apos;s en documenten
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-white/[0.08]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${
                isActive
                  ? "text-[#e8945a]"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e8945a] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "invoices" && (
        <InvoicesTab
          invoices={data?.invoices || []}
          loading={loading}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          downloadingId={downloadingId}
          onDownload={handleDownloadInvoice}
        />
      )}

      {tab === "xrays" && (
        <XRayTab
          images={images}
          loading={imagesLoading}
          onOpenImage={openLightbox}
          onCompare={openCompareMode}
          selectedForCompare={selectedForCompare}
          onDownload={handleDownloadImage}
        />
      )}

      {tab === "documents" && (
        <DocumentsTab
          documents={filteredDocuments}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          documentTypes={documentTypes}
          downloadingId={downloadingId}
          onDownload={handleDownloadDocument}
        />
      )}

      {/* X-Ray Lightbox */}
      <XRayLightbox
        images={images}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={() => {
          setLightboxOpen(false);
          setCompareMode(false);
          setSelectedForCompare(null);
        }}
        onNavigate={setCurrentImageIndex}
        onDownload={handleDownloadImage}
        compareMode={compareMode}
        compareIndex={compareIndex}
      />
    </div>
  );
}

// Invoices Tab Component
function InvoicesTab({
  invoices,
  loading,
  expandedId,
  setExpandedId,
  downloadingId,
  onDownload,
}: {
  invoices: any[];
  loading: boolean;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  downloadingId: string | null;
  onDownload: (id: string, number: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#e8945a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Geen facturen"
        description="Er zijn nog geen facturen beschikbaar"
      />
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((inv) => {
        const isExpanded = expandedId === inv.id;
        return (
          <div
            key={inv.id}
            className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden transition-all duration-300 shadow-lg"
          >
            {/* Invoice header */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-white/90">
                        {inv.invoiceNumber}
                      </h3>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${
                          statusClasses[inv.status] || statusClasses.DRAFT
                        }`}
                      >
                        {statusLabels[inv.status] || inv.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-white/35">
                      <Calendar className="w-3.5 h-3.5" />
                      <p className="text-xs">
                        {new Date(
                          inv.invoiceDate || inv.createdAt,
                        ).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-xs text-white/35 mb-0.5">Totaal</p>
                    <p className="text-2xl font-bold text-[#e8945a]">
                      {formatCurrency(inv.total)}
                    </p>
                  </div>
                  {inv.patientAmount != null && (
                    <div className="text-right pl-4 border-l border-white/[0.08]">
                      <p className="text-xs text-white/35 mb-0.5">
                        Eigen bijdrage
                      </p>
                      <p className="text-lg font-semibold text-white/70">
                        {formatCurrency(inv.patientAmount)}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => onDownload(inv.id, inv.invoiceNumber)}
                    disabled={downloadingId === inv.id}
                    className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-white/40 hover:bg-[#e8945a]/10 hover:text-[#e8945a] hover:border-[#e8945a]/20 transition-all flex-shrink-0 disabled:opacity-50"
                    title="Download PDF"
                  >
                    {downloadingId === inv.id ? (
                      <div className="w-4 h-4 border-2 border-[#e8945a] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                    className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-white/40 hover:bg-white/[0.04] hover:text-[#e8945a] transition-all flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-6 pb-6 pt-0">
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-4 py-3 text-white/35 font-medium text-xs uppercase tracking-wider">
                          Omschrijving
                        </th>
                        <th className="text-right px-4 py-3 text-white/35 font-medium text-xs uppercase tracking-wider">
                          Bedrag
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/[0.04]">
                        <td className="px-4 py-3 text-white/60">
                          Factuurnummer
                        </td>
                        <td className="px-4 py-3 text-right text-white/80 font-medium">
                          {inv.invoiceNumber}
                        </td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="px-4 py-3 text-white/60">Status</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${
                              statusClasses[inv.status] || statusClasses.DRAFT
                            }`}
                          >
                            {statusLabels[inv.status] || inv.status}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="px-4 py-3 text-white/60">
                          Totaalbedrag
                        </td>
                        <td className="px-4 py-3 text-right text-[#e8945a] font-semibold">
                          {formatCurrency(inv.total)}
                        </td>
                      </tr>
                      {inv.patientAmount != null && (
                        <tr>
                          <td className="px-4 py-3 text-white/60">
                            Eigen bijdrage
                          </td>
                          <td className="px-4 py-3 text-right text-white/80 font-medium">
                            {formatCurrency(inv.patientAmount)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// X-Ray Tab Component
function XRayTab({
  images,
  loading,
  onOpenImage,
  onCompare,
  selectedForCompare,
  onDownload,
}: {
  images: XRayImage[];
  loading: boolean;
  onOpenImage: (index: number) => void;
  onCompare: (index: number) => void;
  selectedForCompare: string | null;
  onDownload: (image: XRayImage) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-white/[0.04] border border-white/[0.08] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <EmptyState
        icon={Scan}
        title="Geen röntgenfoto's"
        description="Er zijn nog geen röntgenfoto's beschikbaar"
      />
    );
  }

  return (
    <div className="space-y-4">
      {selectedForCompare && (
        <div className="flex items-center justify-between p-4 bg-[#e8945a]/10 border border-[#e8945a]/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <Scan className="w-5 h-5 text-[#e8945a]" />
            <span className="text-sm text-white/80">
              Selecteer een tweede afbeelding om te vergelijken
            </span>
          </div>
          <button
            onClick={() => onCompare(0)}
            className="px-3 py-1.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            Annuleren
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => {
          const isSelected = selectedForCompare === image.id;
          return (
            <div
              key={image.id}
              className={`group relative aspect-square rounded-2xl border overflow-hidden transition-all duration-300 ${
                isSelected
                  ? "border-[#e8945a] ring-2 ring-[#e8945a]/30"
                  : "border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              {/* Thumbnail */}
              <div className="absolute inset-0 bg-black/40">
                {image.filePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.filePath}
                    alt={image.fileName}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Scan className="w-12 h-12 text-white/20" />
                  </div>
                )}
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white/90 text-sm font-medium truncate">
                    {getImageTypeLabel(image.imageType)}
                  </p>
                  <p className="text-white/50 text-xs">
                    {new Date(image.createdAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenImage(index);
                    }}
                    className="p-2 rounded-xl bg-black/60 text-white/80 hover:bg-[#e8945a] hover:text-white transition-all"
                    title="Bekijken"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompare(index);
                    }}
                    className={`p-2 rounded-xl transition-all ${
                      isSelected
                        ? "bg-[#e8945a] text-white"
                        : "bg-black/60 text-white/80 hover:bg-[#e8945a] hover:text-white"
                    }`}
                    title="Vergelijken"
                  >
                    <Scan className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Click to open */}
              <button
                onClick={() => onOpenImage(index)}
                className="absolute inset-0 w-full h-full"
                aria-label={`Bekijk ${image.fileName}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({
  documents,
  loading,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  documentTypes,
  downloadingId,
  onDownload,
}: {
  documents: Document[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: string;
  setTypeFilter: (t: string) => void;
  documentTypes: string[];
  downloadingId: string | null;
  onDownload: (doc: Document) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-3xl bg-white/[0.04] border border-white/[0.08] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Zoek documenten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#e8945a]/50 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white/90 focus:outline-none focus:border-[#e8945a]/50 transition-all appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#1a1a2e]">
              Alle types
            </option>
            {documentTypes.map((type) => (
              <option key={type} value={type} className="bg-[#1a1a2e]">
                {type === "consent" && "Toestemmingsformulieren"}
                {type === "treatment_plan" && "Behandelplannen"}
                {type === "document" && "Overige documenten"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents list */}
      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Geen documenten"
          description={
            searchQuery || typeFilter !== "all"
              ? "Geen documenten gevonden met de huidige filters"
              : "Er zijn nog geen documenten beschikbaar"
          }
        />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const Icon = getDocumentIcon(doc.type);
            return (
              <div
                key={doc.id}
                className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 transition-all duration-300 hover:bg-white/[0.06] shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#e8945a]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white/90 truncate">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-[#e8945a]">
                          {doc.documentType}
                        </span>
                        {doc.subType && (
                          <>
                            <span className="text-white/20">•</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                statusClasses[doc.status || ""] ||
                                "bg-white/[0.06] text-white/50"
                              }`}
                            >
                              {statusLabels[doc.subType] || doc.subType}
                            </span>
                          </>
                        )}
                        {doc.uploadedBy && (
                          <>
                            <span className="text-white/20">•</span>
                            <span className="text-xs text-white/40">
                              Door {doc.uploadedBy}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-white/35">
                        <Calendar className="w-3.5 h-3.5" />
                        <p className="text-xs">
                          {new Date(doc.createdAt).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        {doc.fileSize && (
                          <>
                            <span className="text-white/20 mx-1">•</span>
                            <span className="text-xs">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.s3Key && (
                      <button
                        onClick={() => onDownload(doc)}
                        disabled={downloadingId === doc.id}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#e8945a]/10 text-[#e8945a] hover:bg-[#e8945a]/20 transition-all disabled:opacity-50"
                      >
                        {downloadingId === doc.id ? (
                          <div className="w-4 h-4 border-2 border-[#e8945a] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium hidden sm:inline">
                          Download
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
        <Icon className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="text-lg font-medium text-white/70 mb-1">{title}</h3>
      <p className="text-sm text-white/40">{description}</p>
    </div>
  );
}
