'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, FileText, ChevronDown, ChevronUp, Eye, Calendar, Euro } from 'lucide-react';

const statusLabels: Record<string, string> = {
    DRAFT: 'Concept',
    SENT: 'Verzonden',
    PARTIALLY_PAID: 'Deels betaald',
    PAID: 'Betaald',
    OVERDUE: 'Verlopen',
    CANCELLED: 'Geannuleerd',
    CREDITED: 'Gecrediteerd',
};

const statusClasses: Record<string, string> = {
    DRAFT: 'bg-white/[0.06] text-white/50 border-white/[0.08]',
    SENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PARTIALLY_PAID: 'bg-[#e8945a]/10 text-[#e8945a] border-[#e8945a]/20',
    PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/20',
    CANCELLED: 'bg-white/[0.06] text-white/40 border-white/[0.08]',
    CREDITED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function formatCurrency(val: number | string) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(val));
}

function InvoiceStatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${statusClasses[status] || statusClasses.DRAFT}`}>
            {statusLabels[status] || status}
        </span>
    );
}

export default function DocumentsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'invoices' | 'documents'>('invoices');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('patient_token');
        if (!token) return;
        fetch(`/api/patient-portal/documents`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const tabs = [
        { key: 'invoices' as const, label: 'Facturen', icon: Receipt },
        { key: 'documents' as const, label: 'Documenten', icon: FileText },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e8945a]/10 border border-[#e8945a]/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#e8945a]" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-white/90">Documenten</h1>
                    <p className="text-sm text-white/40">Uw facturen en documenten</p>
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
                                    ? 'text-[#e8945a]'
                                    : 'text-white/40 hover:text-white/60'
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
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#e8945a] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : tab === 'invoices' ? (
                <div className="space-y-3">
                    {data?.invoices?.length > 0 ? (
                        data.invoices.map((inv: any) => {
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
                                                        <h3 className="text-base font-semibold text-white/90">{inv.invoiceNumber}</h3>
                                                        <InvoiceStatusBadge status={inv.status} />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1 text-white/35">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <p className="text-xs">
                                                            {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('nl-NL', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5">
                                                <div className="text-right">
                                                    <p className="text-xs text-white/35 mb-0.5">Totaal</p>
                                                    <p className="text-2xl font-bold text-[#e8945a]">{formatCurrency(inv.total)}</p>
                                                </div>
                                                {inv.patientAmount != null && (
                                                    <div className="text-right pl-4 border-l border-white/[0.08]">
                                                        <p className="text-xs text-white/35 mb-0.5">Eigen bijdrage</p>
                                                        <p className="text-lg font-semibold text-white/70">{formatCurrency(inv.patientAmount)}</p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                                                    className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-white/40 hover:bg-white/[0.04] hover:text-[#e8945a] transition-all flex-shrink-0"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                                                            <th className="text-left px-4 py-3 text-white/35 font-medium text-xs uppercase tracking-wider">Omschrijving</th>
                                                            <th className="text-right px-4 py-3 text-white/35 font-medium text-xs uppercase tracking-wider">Bedrag</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="border-b border-white/[0.04]">
                                                            <td className="px-4 py-3 text-white/60">Factuurnummer</td>
                                                            <td className="px-4 py-3 text-right text-white/80 font-medium">{inv.invoiceNumber}</td>
                                                        </tr>
                                                        <tr className="border-b border-white/[0.04]">
                                                            <td className="px-4 py-3 text-white/60">Status</td>
                                                            <td className="px-4 py-3 text-right"><InvoiceStatusBadge status={inv.status} /></td>
                                                        </tr>
                                                        <tr className="border-b border-white/[0.04]">
                                                            <td className="px-4 py-3 text-white/60">Totaalbedrag</td>
                                                            <td className="px-4 py-3 text-right text-[#e8945a] font-semibold">{formatCurrency(inv.total)}</td>
                                                        </tr>
                                                        {inv.patientAmount != null && (
                                                            <tr>
                                                                <td className="px-4 py-3 text-white/60">Eigen bijdrage</td>
                                                                <td className="px-4 py-3 text-right text-white/80 font-medium">{formatCurrency(inv.patientAmount)}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-16 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl">
                            <Receipt className="w-12 h-12 mx-auto text-white/10 mb-3" />
                            <p className="text-sm text-white/30">Geen facturen gevonden</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {data?.documents?.length > 0 ? (
                        data.documents.map((doc: any) => (
                            <div
                                key={doc.id}
                                className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 transition-all duration-300 hover:bg-white/[0.06] shadow-lg"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-white/40" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-white/90">{doc.title}</h3>
                                            <div className="flex items-center gap-1.5 mt-1 text-white/35">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <p className="text-xs">
                                                    {doc.documentType} &mdash; {new Date(doc.createdAt).toLocaleDateString('nl-NL', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href="/portal/consent"
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/[0.08] text-sm text-white/50 hover:bg-[#e8945a]/10 hover:text-[#e8945a] hover:border-[#e8945a]/20 transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Bekijken
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl">
                            <FileText className="w-12 h-12 mx-auto text-white/10 mb-3" />
                            <p className="text-sm text-white/30">Geen documenten gevonden</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
