"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";

function CancelContent() {
  useSearchParams(); // listing_id disponible si besoin

  return (
    <div className="w-full max-w-sm text-center">
      <XCircle size={52} className="mx-auto mb-4" style={{ color: "#CC0000" }} />
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Paiement annulé</h1>
      <p className="text-sm mb-8" style={{ color: "#8A99AA" }}>
        Votre annonce a été créée mais n'est pas encore active. Vous pouvez relancer le paiement depuis votre dashboard.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/seller" className="py-3 px-6 rounded-xl font-semibold text-sm text-center block"
          style={{ background: "#0B1A2B", color: "white" }}>
          Gérer mes annonces
        </Link>
        <Link href="/" className="text-sm" style={{ color: "#8A99AA" }}>
          Retour au marketplace
        </Link>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Suspense>
        <CancelContent />
      </Suspense>
    </main>
  );
}
