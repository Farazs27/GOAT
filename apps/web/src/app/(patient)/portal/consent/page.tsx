'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FileCheck, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, PenLine, X, Download, AlertCircle } from 'lucide-react';
import { SignatureWidget, type SignerRelation } from '@/components/patient/signature-widget';

interface ConsentForm {
    id: string;
    treatmentType: string;
    title: string;
    content: string;
    status: string;
    signedAt: string | null;
    signedByName: string | null;
    createdAt: string;
}

// ─── Status Badge ───

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { classes: string; icon: React.ReactNode; label: string }> = {
        PENDING: {
            classes: 'bg-[#e8945a]/10 text-[#e8945a] border-[#e8945a]/20',
            icon: <Clock className="w-3.5 h-3.5" />,
            label: 'Wacht op handtekening',
        },
        SIGNED: {
            classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            label: 'Ondertekend',
        },
        REVOKED: {
            classes: 'bg-red-500/10 text-red-400 border-red-500/20',
            icon: <XCircle className="w-3.5 h-3.5" />,
            label: 'Ingetrokken',
        },
        EXPIRED: {
            classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            icon: <XCircle className="w-3.5 h-3.5" />,
            label: 'Verlopen',
        },
    };
    const c = config[status] || config.PENDING;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${c.classes}`}>
            {c.icon}
            {c.label}
        </span>
    );
}

function cardBorderClass(status: string): string {
    const map: Record<string, string> = {
        PENDING: 'border-[#e8945a]/20 shadow-[#e8945a]/5',
        SIGNED: 'border-emerald-500/20 shadow-emerald-500/5',
        REVOKED: 'border-red-500/20 shadow-red-500/5',
        EXPIRED: 'border-gray-500/20 shadow-gray-500/5',
    };
    return map[status] || map.PENDING;
}

// ─── Main Page ───

export default function ConsentPage() {
    const [forms, setForms] = useState<ConsentForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ConsentForm | null>(null);
    const [signing, setSigning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const token =
        typeof window !== 'undefined'
            ? localStorage.getItem('patient_token')
            : null;

    const pendingCount = forms.filter((f) => f.status === 'PENDING').length;

    const fetchForms = useCallback(async () => {
        try {
            const res = await fetch(`/api/patient-portal/consent`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setForms(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    // Check if content fits without scrolling on mount/select
    useEffect(() => {
        if (selected && scrollRef.current) {
            const el = scrollRef.current;
            if (el.scrollHeight <= el.clientHeight) {
                setHasScrolledToBottom(true);
            }
        }
    }, [selected]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
            setHasScrolledToBottom(true);
        }
    };

    const openForm = async (form: ConsentForm) => {
        try {
            const res = await fetch(
                `/api/patient-portal/consent/${form.id}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
                setSelected(await res.json());
                setSigning(false);
                setSuccess('');
                setHasScrolledToBottom(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSign = async (data: { signatureData: string; signedByName: string; signerRelation: SignerRelation }) => {
        if (!selected) return;
        setSaving(true);
        try {
            const res = await fetch(
                `/api/patient-portal/consent/${selected.id}/sign`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                },
            );
            if (res.ok) {
                setSuccess('Toestemmingsformulier ondertekend!');
                setSigning(false);
                setSelected(null);
                fetchForms();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPdf = async (formId: string) => {
        try {
            const res = await fetch(
                `/api/patient-portal/consent/${formId}/pdf`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `consent-${formId}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // ─── Detail / Signing view ───

    if (selected) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back */}
                <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-2 text-white/50 hover:text-[#e8945a] transition-colors text-sm group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Terug naar overzicht
                </button>

                {/* Form card */}
                <div className={`bg-white/[0.06] backdrop-blur-2xl border rounded-3xl p-8 space-y-6 shadow-xl shadow-black/10 ${cardBorderClass(selected.status)}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="text-xl font-semibold text-white/90">
                                {selected.title}
                            </h2>
                            <p className="text-sm text-white/40 mt-1">
                                {selected.treatmentType.replace(/_/g, ' ')}
                            </p>
                        </div>
                        <StatusBadge status={selected.status} />
                    </div>

                    {/* Consent content with scroll tracking */}
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="rounded-2xl bg-white/[0.06] border border-white/[0.12] p-6 max-h-[60vh] overflow-y-auto"
                    >
                        <pre className="whitespace-pre-wrap text-sm text-white/70 font-sans leading-relaxed">
                            {selected.content}
                        </pre>
                    </div>

                    {/* Scroll prompt */}
                    {selected.status === 'PENDING' && !hasScrolledToBottom && (
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#e8945a]/[0.08] border border-[#e8945a]/20 text-[#e8945a] text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            Scroll naar beneden om te ondertekenen
                        </div>
                    )}

                    {/* Already signed */}
                    {selected.status === 'SIGNED' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-300">
                                        Ondertekend door {selected.signedByName}
                                    </p>
                                    <p className="text-xs text-emerald-400/60">
                                        {selected.signedAt &&
                                            new Date(selected.signedAt).toLocaleDateString('nl-NL', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownloadPdf(selected.id)}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] hover:text-white transition-all text-sm font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                        </div>
                    )}

                    {/* Sign actions - only when scrolled to bottom */}
                    {selected.status === 'PENDING' && hasScrolledToBottom && !signing && (
                        <button
                            onClick={() => setSigning(true)}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4783e] text-white font-semibold text-base shadow-lg shadow-[#e8945a]/25 transition-all hover:shadow-[#e8945a]/40 active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                            <PenLine className="w-5 h-5" />
                            Ga verder naar ondertekening
                        </button>
                    )}

                    {/* Signature widget */}
                    {selected.status === 'PENDING' && signing && (
                        <SignatureWidget
                            onSign={handleSign}
                            onCancel={() => setSigning(false)}
                            loading={saving}
                        />
                    )}
                </div>
            </div>
        );
    }

    // ─── List view ───

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-2xl bg-[#e8945a]/10 border border-[#e8945a]/20 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-[#e8945a]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold text-white/90">
                                Toestemmingsformulieren
                            </h1>
                            {pendingCount > 0 && (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#e8945a] text-white text-xs font-bold">
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-white/40">
                            Bekijk en onderteken uw toestemmingsformulieren
                        </p>
                    </div>
                </div>
            </div>

            {success && (
                <div className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-emerald-300">{success}</p>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#e8945a] border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!loading && forms.length === 0 && (
                <div className="text-center py-16 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-xl shadow-black/10">
                    <FileCheck className="w-12 h-12 mx-auto text-white/10 mb-3" />
                    <p className="text-sm text-white/30">
                        Geen toestemmingsformulieren gevonden
                    </p>
                </div>
            )}

            {!loading && forms.length > 0 && (
                <div className="space-y-3">
                    {forms.map((form) => (
                        <button
                            key={form.id}
                            onClick={() => openForm(form)}
                            className={`w-full bg-white/[0.06] backdrop-blur-2xl border rounded-3xl p-5 text-left hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300 active:scale-[0.99] group shadow-xl shadow-black/10 ${cardBorderClass(form.status)}`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center flex-shrink-0">
                                        {form.status === 'SIGNED' ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        ) : form.status === 'REVOKED' || form.status === 'EXPIRED' ? (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        ) : (
                                            <Clock className="w-5 h-5 text-[#e8945a]" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-white/80 group-hover:text-white transition-colors truncate">
                                            {form.title}
                                        </h3>
                                        <p className="text-xs text-white/30 mt-1">
                                            {form.status === 'SIGNED' && form.signedAt
                                                ? `Ondertekend op ${new Date(form.signedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                                : new Date(form.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <StatusBadge status={form.status} />
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#e8945a]/60 transition-colors" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
