"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Subscription } from "@/lib/types";
import { Crown, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

function SubscriptionSuccessInner() {
  const params     = useSearchParams();
  const router     = useRouter();
  const token      = params.get("token") ?? params.get("invoice_token");
  const [status, setStatus]   = useState<"loading" | "success" | "error">("loading");
  const [sub, setSub]         = useState<Subscription | null>(null);
  const [errMsg, setErrMsg]   = useState("");

  useEffect(() => {
    if (!token) { router.replace("/abonnement"); return; }

    api.post<{ subscription: Subscription }>("/subscription/verify", { token })
      .then(r => { setSub(r.data.subscription); setStatus("success"); })
      .catch(e => {
        const msg = e?.response?.data?.message ?? "Vérification impossible.";
        // Si déjà activé, récupérer l'abo
        if (msg.includes("Déjà activé")) {
          api.get<{ subscription: Subscription }>("/subscription/me")
            .then(r => { setSub(r.data.subscription); setStatus("success"); })
            .catch(() => { setErrMsg(msg); setStatus("error"); });
        } else {
          setErrMsg(msg);
          setStatus("error");
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "loading") {
    return (
      <main className="max-w-md mx-auto px-4 py-24 flex flex-col items-center gap-4">
        <Loader2 size={36} className="animate-spin" style={{ color: "#00D084" }} />
        <p className="text-sm font-medium" style={{ color: "#8A99AA" }}>Confirmation de votre abonnement…</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-2xl mb-3">😕</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Vérification impossible</h1>
        <p className="text-sm mb-6" style={{ color: "#8A99AA" }}>{errMsg}</p>
        <Link href="/abonnement"><Button>Retour à l'abonnement</Button></Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      {/* Icône succès */}
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: "rgba(0,208,132,0.12)" }}>
        <CheckCircle size={40} style={{ color: "#00D084" }} />
      </div>

      <h1 className="text-2xl font-black mb-2" style={{ color: "#0B1A2B" }}>
        Abonnement Pro activé 🎉
      </h1>
      <p className="text-sm mb-8 leading-relaxed" style={{ color: "#8A99AA" }}>
        Votre abonnement Trokly Pro est actif jusqu'au{" "}
        <strong style={{ color: "#0B1A2B" }}>
          {sub ? new Date(sub.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        </strong>.
        Publiez autant d'annonces que vous voulez.
      </p>

      {/* Récap avantages */}
      <div className="rounded-2xl p-5 mb-8 text-left"
        style={{ background: "#0B1A2B" }}>
        <p className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: "rgba(247,245,240,0.5)" }}>
          <Crown size={12} style={{ color: "#00D084" }} /> VOS AVANTAGES PRO
        </p>
        {[
          "Badge Vendeur vérifié sur toutes vos annonces",
          "Annonces illimitées pendant la période d'abonnement",
          "Option iPhone vérifié disponible (+1 499 FCFA)",
          "Option TOP boost disponible (+500 FCFA)",
        ].map(a => (
          <div key={a} className="flex items-start gap-2.5 mb-2.5 text-sm">
            <CheckCircle size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#00D084" }} />
            <span style={{ color: "rgba(247,245,240,0.8)" }}>{a}</span>
          </div>
        ))}
      </div>

      <Link href="/listings/new">
        <Button className="w-full mb-3">
          Publier une annonce <ChevronRight size={14} />
        </Button>
      </Link>
      <Link href="/seller">
        <Button variant="ghost" className="w-full" style={{ color: "#8A99AA" }}>
          Aller à mon espace vendeur
        </Button>
      </Link>
    </main>
  );
}

export default function SubscriptionSuccess() {
  return (
    <Suspense>
      <SubscriptionSuccessInner />
    </Suspense>
  );
}
