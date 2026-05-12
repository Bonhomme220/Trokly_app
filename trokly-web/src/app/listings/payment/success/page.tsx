"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { CheckCircle, Clock, Loader } from "lucide-react";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const listingId = params.get("listing_id");
  const [status, setStatus] = useState<"loading" | "confirmed" | "pending" | "error">("loading");

  useEffect(() => {
    if (!listingId) { setStatus("error"); return; }
    api.get(`/payments/verify?listing_id=${listingId}`)
      .then(res => {
        const s = res.data.listing?.status;
        setStatus(s === "published" || s === "pending_expertise" ? "confirmed" : "pending");
      })
      .catch(() => setStatus("pending"));
  }, [listingId]);

  if (status === "loading") {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <Loader size={32} className="animate-spin mx-auto mb-4" style={{ color: "#00D084" }} />
          <p className="text-sm" style={{ color: "#8A99AA" }}>Vérification du paiement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        {status === "confirmed" ? (
          <>
            <CheckCircle size={52} className="mx-auto mb-4" style={{ color: "#00D084" }} />
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Paiement confirmé !</h1>
            <p className="text-sm mb-8" style={{ color: "#8A99AA" }}>
              Votre annonce est en ligne. Les acheteurs peuvent maintenant vous contacter directement sur WhatsApp.
            </p>
          </>
        ) : (
          <>
            <Clock size={52} className="mx-auto mb-4" style={{ color: "#B8860B" }} />
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Paiement en cours de vérification</h1>
            <p className="text-sm mb-8" style={{ color: "#8A99AA" }}>
              Votre paiement est en cours de traitement. Votre annonce sera activée dans quelques minutes.
            </p>
          </>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/seller" className="btn-primary py-3 px-6 rounded-xl font-semibold text-sm text-center"
            style={{ background: "#00D084", color: "#0B1A2B", display: "block" }}>
            Voir mes annonces
          </Link>
          <Link href="/" className="text-sm" style={{ color: "#8A99AA" }}>
            Retour au marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}
