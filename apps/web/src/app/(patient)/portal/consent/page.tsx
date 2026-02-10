'use client';

import { useState, useEffect, useRef, useCallback } from 'react';


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

// ─── Signature Canvas (iPad-optimised, touch-friendly) ───

function SignatureCanvas({
    onSave,
    onCancel,
}: {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    const getCoords = (
        e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>,
    ) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = (
        e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>,
    ) => {
        e.preventDefault();
        const ctx = canvasRef.current!.getContext('2d')!;
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setDrawing(true);
        setHasDrawn(true);
    };

    const draw = (
        e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>,
    ) => {
        if (!drawing) return;
        e.preventDefault();
        const ctx = canvasRef.current!.getContext('2d')!;
        const { x, y } = getCoords(e);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#fff';
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = () => setDrawing(false);

    const clear = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-white/50">
                Teken uw handtekening in het vak hieronder
            </p>
            <div className="relative rounded-2xl border-2 border-dashed border-white/20 overflow-hidden bg-white/5">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={250}
                    className="w-full touch-none cursor-crosshair"
                    style={{ height: 180 }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                />
                {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-white/20 text-base select-none">
                            Teken hier uw handtekening
                        </p>
                    </div>
                )}
            </div>
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={clear}
                    className="px-5 py-3 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                    Wissen
                </button>
                <button
                    onClick={onCancel}
                    className="px-5 py-3 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                    Annuleren
                </button>
                <button
                    disabled={!hasDrawn}
                    onClick={() => {
                        const dataUrl = canvasRef.current!.toDataURL('image/png');
                        onSave(dataUrl);
                    }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.98]"
                >
                    Ondertekenen
                </button>
            </div>
        </div>
    );
}

// ─── Status Badge ───

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING:
            'bg-amber-500/15 text-amber-300 border-amber-500/20',
        SIGNED:
            'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
        REVOKED:
            'bg-red-500/15 text-red-300 border-red-500/20',
    };
    const labels: Record<string, string> = {
        PENDING: 'Wacht op handtekening',
        SIGNED: 'Ondertekend',
        REVOKED: 'Ingetrokken',
    };
    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${styles[status] || styles.PENDING
                }`}
        >
            {labels[status] || status}
        </span>
    );
}

// ─── Main Page ───

export default function ConsentPage() {
    const [forms, setForms] = useState<ConsentForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ConsentForm | null>(null);
    const [signing, setSigning] = useState(false);
    const [signName, setSignName] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const token =
        typeof window !== 'undefined'
            ? localStorage.getItem('patient_token')
            : null;

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
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSign = async (signatureData: string) => {
        if (!selected || !signName.trim()) return;
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
                    body: JSON.stringify({
                        signatureData,
                        signedByName: signName.trim(),
                    }),
                },
            );
            if (res.ok) {
                setSuccess(
                    'Toestemmingsformulier ondertekend! U ontvangt een bevestiging per e-mail.',
                );
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

    // ─── Detail / Signing view ───

    if (selected) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back */}
                <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Terug naar overzicht
                </button>

                {/* Form card */}
                <div className="patient-glass rounded-3xl p-8 space-y-6">
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

                    {/* Consent content */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 max-h-[50vh] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-white/70 font-sans leading-relaxed">
                            {selected.content}
                        </pre>
                    </div>

                    {/* Already signed */}
                    {selected.status === 'SIGNED' && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
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
                    )}

                    {/* Sign actions */}
                    {selected.status === 'PENDING' && !signing && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/50 mb-2">
                                    Uw volledige naam
                                </label>
                                <input
                                    type="text"
                                    value={signName}
                                    onChange={(e) => setSignName(e.target.value)}
                                    placeholder="Volledige naam"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base text-white/90 outline-none focus:border-teal-500/40 transition-colors placeholder:text-white/20"
                                />
                            </div>
                            <button
                                disabled={!signName.trim()}
                                onClick={() => setSigning(true)}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-base shadow-lg shadow-teal-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.99]"
                            >
                                Ga verder naar ondertekening
                            </button>
                        </div>
                    )}

                    {/* Signature canvas */}
                    {selected.status === 'PENDING' && signing && (
                        <SignatureCanvas
                            onSave={handleSign}
                            onCancel={() => setSigning(false)}
                        />
                    )}

                    {saving && (
                        <div className="flex items-center justify-center gap-2 text-white/50 py-4">
                            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Opslaan...</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── List view ───

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-white/90">
                    Toestemmingsformulieren
                </h1>
                <p className="text-sm text-white/40 mt-1">
                    Bekijk en onderteken uw toestemmingsformulieren
                </p>
            </div>

            {success && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <p className="text-sm text-emerald-300">{success}</p>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!loading && forms.length === 0 && (
                <div className="text-center py-16 patient-glass rounded-3xl">
                    <svg className="w-12 h-12 mx-auto text-white/15 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
                    </svg>
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
                            className="w-full patient-glass rounded-2xl p-5 text-left hover:bg-white/5 transition-all active:scale-[0.99] group"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white/80 group-hover:text-white transition-colors truncate">
                                        {form.title}
                                    </h3>
                                    <p className="text-xs text-white/30 mt-1">
                                        {new Date(form.createdAt).toLocaleDateString('nl-NL', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <StatusBadge status={form.status} />
                                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
