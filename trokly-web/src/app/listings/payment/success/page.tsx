"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { CheckCircle, Clock, Loader } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const listingId = params.get("listing_id");
  const [status, setStatus] = useState<"loading" | "confirmed" | "pending" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!listingId) { setStatus("error"); return; }
    setStatus("loading");
    setAttempt(0);

    // PayPlus confirme de façon asynchrone — on retente jusqu'à 6 fois (12 secondes)
    const MAX_ATTEMPTS = 6;
    const DELAY_MS = 2000;
    let cancelled = false;

    const check = (n: number) => {
      api.get(`/payments/verify?listing_id=${listingId}`)
        .then(res => {
          if (cancelled) return;
          const s = res.data.listing?.status;
          if (s === "published" || s === "pending_expertise") {
            setStatus("confirmed");
          } else if (n < MAX_ATTEMPTS) {
            setAttempt(n + 1);
            setTimeout(() => check(n + 1), DELAY_MS);
          } else {
            setStatus("pending");
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (n < MAX_ATTEMPTS) {
            setAttempt(n + 1);
            setTimeout(() => check(n + 1), DELAY_MS);
          } else {
            setStatus("pending");
          }
        });
    };

    check(0);
    return () => { cancelled = true; };
  }, [listingId, retryCount]);

  if (status === "loading") {
    return (
      <div className="text-center">
        <Loader size={32} className="animate-spin mx-auto mb-4" style={{ color: "#00D084" }} />
        <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>Vérification du paiement…</p>
        {attempt > 0 && (
          <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>
            Confirmation en cours ({attempt}/6)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm text-center">
      {status === "confirmed" ? (
        <>
          <CheckCircle size={52} className="mx-auto mb-4" style={{ color: "#00D084" }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Paiement confirmé !</h1>
          <p className="text-sm mb-8" style={{ color: "#8A99AA" }}>
            Votre annonce est active. Les acheteurs peuvent maintenant vous contacter directement sur WhatsApp.
          </p>
        </>
      ) : (
        <>
          <Clock size={52} className="mx-auto mb-4" style={{ color: "#B8860B" }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Paiement en cours de vérification</h1>
          <p className="text-sm mb-6" style={{ color: "#8A99AA" }}>
            Le paiement n'a pas encore été confirmé par PayPlus. Votre annonce sera activée automatiquement dès que la confirmation arrive.
          </p>
          <button
            className="w-full py-3 px-6 rounded-xl font-semibold text-sm mb-3"
            style={{ background: "rgba(184,134,11,0.1)", color: "#B8860B" }}
            onClick={() => setRetryCount(r => r + 1)}>
            Vérifier à nouveau
          </button>
        </>
      )}
      <div className="flex flex-col gap-3">
        <Link href="/seller" className="py-3 px-6 rounded-xl font-semibold text-sm text-center block"
          style={{ background: "#00D084", color: "#0B1A2B" }}>
          Voir mes annonces
        </Link>
        <Link href="/" className="text-sm" style={{ color: "#8A99AA" }}>
          Retour au marketplace
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="text-center">
          <Loader size={32} className="animate-spin mx-auto mb-4" style={{ color: "#00D084" }} />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
