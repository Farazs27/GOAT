'use client';

import { useState, useRef } from 'react';
import { PenLine, X } from 'lucide-react';

export type SignerRelation = 'SELF' | 'PARENT' | 'GUARDIAN';

export function SignatureWidget({
    onSign,
    onCancel,
    disabled,
    defaultName,
    loading,
}: {
    onSign: (data: { signatureData: string; signedByName: string; signerRelation: SignerRelation }) => void;
    onCancel: () => void;
    disabled?: boolean;
    defaultName?: string;
    loading?: boolean;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [signName, setSignName] = useState(defaultName || '');
    const [signerRelation, setSignerRelation] = useState<SignerRelation>('SELF');

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
        if (disabled) return;
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
        ctx.strokeStyle = '#e8945a';
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = () => setDrawing(false);

    const handleSubmit = () => {
        if (!hasDrawn || !signName.trim()) return;
        const dataUrl = canvasRef.current!.toDataURL('image/png');
        onSign({ signatureData: dataUrl, signedByName: signName.trim(), signerRelation });
    };

    const relationOptions: { value: SignerRelation; label: string }[] = [
        { value: 'SELF', label: 'Mijzelf' },
        { value: 'PARENT', label: 'Ouder/Voogd' },
        { value: 'GUARDIAN', label: 'Wettelijk Vertegenwoordiger' },
    ];

    return (
        <div className="space-y-5">
            {/* Signer relation */}
            <div>
                <label className="block text-sm text-white/50 mb-2">Ik onderteken als:</label>
                <div className="flex gap-2 flex-wrap">
                    {relationOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSignerRelation(opt.value)}
                            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 border ${
                                signerRelation === opt.value
                                    ? 'bg-[#e8945a]/15 text-[#e8945a] border-[#e8945a]/30'
                                    : 'bg-white/[0.04] text-white/50 border-white/[0.12] hover:bg-white/[0.08]'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Name field */}
            <div>
                <label className="block text-sm text-white/50 mb-2">Uw volledige naam</label>
                <input
                    type="text"
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                    placeholder="Volledige naam"
                    className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-5 py-4 text-base text-white/90 outline-none focus:border-[#e8945a]/40 focus:ring-1 focus:ring-[#e8945a]/20 transition-all placeholder:text-white/20"
                />
            </div>

            {/* Signature canvas */}
            <div>
                <p className="text-sm text-white/50 mb-2">
                    Teken uw handtekening in het vak hieronder
                </p>
                <div className="relative rounded-2xl border-2 border-dashed border-[#e8945a]/30 overflow-hidden bg-white/[0.06]">
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
                            <div className="flex items-center gap-2 text-white/15">
                                <PenLine className="w-5 h-5" />
                                <p className="text-base select-none">Teken hier uw handtekening</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action buttons - one-shot: cancel or submit, no clear/redo */}
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/[0.12] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium"
                >
                    <X className="w-4 h-4" />
                    Annuleren
                </button>
                <button
                    disabled={!hasDrawn || !signName.trim() || loading}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4783e] text-white font-semibold text-sm shadow-lg shadow-[#e8945a]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-[#e8945a]/40 active:scale-[0.98]"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <PenLine className="w-4 h-4" />
                    )}
                    Ondertekenen
                </button>
            </div>
        </div>
    );
}
