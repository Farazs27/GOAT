"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

function BetalenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("paymentId");

  const [status, setStatus] = useState<
    "loading" | "completed" | "failed" | "pending"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!paymentId) {
      setStatus("failed");
      setError("Geen betalings-ID gevonden");
      return;
    }

    let intervalId: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const token = localStorage.getItem("patient_token");
        const response = await fetch(
          `/api/patient-portal/payments/${paymentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const paymentStatus = data.status;

          if (paymentStatus === "COMPLETED") {
            setStatus("completed");
            clearInterval(intervalId);
          } else if (paymentStatus === "FAILED") {
            setStatus("failed");
            setError("De betaling is mislukt of geannuleerd");
            clearInterval(intervalId);
          } else {
            setPollCount((prev) => prev + 1);
          }
        } else {
          setError("Kon betalingsstatus niet ophalen");
          setStatus("failed");
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Failed to check payment status:", err);
        setError("Er is een fout opgetreden bij het controleren van de betaling");
        setStatus("failed");
        clearInterval(intervalId);
      }
    };

    checkPaymentStatus();

    intervalId = setInterval(() => {
      if (pollCount >= 10) {
        setStatus("pending");
        setError(
          "De betaling wordt nog verwerkt. Dit kan enkele minuten duren."
        );
        clearInterval(intervalId);
        return;
      }
      checkPaymentStatus();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [paymentId, pollCount]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-[#e8945a] animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white/95 mb-2">
              Betaling controleren...
            </h1>
            <p className="text-white/60">
              Even geduld terwijl we uw betaling verifiëren
            </p>
          </>
        )}

        {status === "completed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white/95 mb-2">
              Betaling geslaagd!
            </h1>
            <p className="text-white/60 mb-6">
              Uw betaling is succesvol verwerkt. Bedankt voor uw betaling.
            </p>
            <button
              onClick={() => router.push("/portal/invoices")}
              className="w-full bg-[#e8945a] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#d4864a] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar facturen
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-400/10 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white/95 mb-2">
              Betaling mislukt
            </h1>
            <p className="text-white/60 mb-6">
              {error || "Er is iets misgegaan met uw betaling."}
            </p>
            <button
              onClick={() => router.push("/portal/invoices")}
              className="w-full bg-[#e8945a] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#d4864a] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar facturen
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white/95 mb-2">
              Betaling in behandeling
            </h1>
            <p className="text-white/60 mb-6">
              {error ||
                "Uw betaling wordt nog verwerkt. Dit kan enkele minuten duren."}
            </p>
            <button
              onClick={() => router.push("/portal/invoices")}
              className="w-full bg-[#e8945a] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#d4864a] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar facturen
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function BetalenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
        </div>
      }
    >
      <BetalenContent />
    </Suspense>
  );
}
