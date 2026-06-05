"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Subscription } from "@/lib/types";
import Button from "@/components/ui/Button";
import {
  BadgeCheck, Zap, Check, ChevronRight, Crown,
  RefreshCw, CalendarDays, CreditCard
} from "lucide-react";

export default function AbonnementPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login?redirect=/abonnement");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<{ subscription: Subscription | null }>("/subscription/me")
      .then(r => setSub(r.data.subscription))
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, [isAuthenticated]);

  async function handleSubscribe() {
    setPaying(true);
    setError("");
    try {
      const res = await api.post<{ payment_url: string }>("/subscription/initiate");
      window.location.href = res.data.payment_url;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Impossible d'initier le paiement.");
      setPaying(false);
    }
  }

  if (loading || subLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="card h-64 animate-pulse" style={{ background: "#E8E4DF" }} />
      </main>
    );
  }

  const isActive = sub?.status === "active";
  const daysLeft = isActive
    ? Math.max(0, Math.ceil((new Date(sub!.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
          style={{ background: "rgba(0,208,132,0.12)", color: "#00B070" }}>
          <Crown size={12} /> Abonnement Pro
        </div>
        <h1 className="text-3xl font-black mb-3" style={{ color: "#0B1A2B" }}>
          Trokly Pro
        </h1>
        <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: "#8A99AA" }}>
          Annonces illimitées, badge Vendeur vérifié automatique, et l'option iPhone vérifié ou TOP boost à chaque publication.
        </p>
      </div>

      {/* Abonnement actif */}
      {isActive && sub && (
        <div className="rounded-2xl p-6 mb-8"
          style={{ background: "#0B1A2B", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,208,132,0.15)" }}>
              <Crown size={20} style={{ color: "#00D084" }} />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: "white" }}>Abonnement Pro actif</p>
              <p className="text-xs" style={{ color: "rgba(247,245,240,0.5)" }}>
                {new Date(sub.started_at).toLocaleDateString("fr-FR")} → {new Date(sub.expires_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(0,208,132,0.15)", color: "#00D084" }}>
              {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
            </span>
          </div>

          {/* Barre de progression */}
          <div className="h-1.5 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%`, background: "#00D084" }} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: BadgeCheck, label: "Vendeur vérifié", desc: "Sur toutes vos annonces" },
              { icon: Zap,        label: "TOP boost",       desc: "Option à chaque publi" },
              { icon: BadgeCheck, label: "iPhone vérifié",  desc: "Option à chaque publi" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon size={16} className="mx-auto mb-1" style={{ color: "#00D084" }} />
                <p className="text-xs font-bold" style={{ color: "white" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(247,245,240,0.4)" }}>{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link href="/listings/new" className="flex-1">
              <Button className="w-full" size="sm">
                <ChevronRight size={14} /> Publier une annonce
              </Button>
            </Link>
            <Button variant="ghost" size="sm" loading={paying} onClick={handleSubscribe}
              style={{ color: "rgba(247,245,240,0.6)" }}>
              <RefreshCw size={14} /> Renouveler ({(4999).toLocaleString("fr-FR")} FCFA)
            </Button>
          </div>
        </div>
      )}

      {/* Pas d'abonnement */}
      {!isActive && (
        <div className="rounded-2xl overflow-hidden mb-8"
          style={{ border: "1px solid rgba(11,26,43,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>

          {/* Header prix */}
          <div className="p-8 text-center" style={{ background: "#0B1A2B" }}>
            <p className="text-sm font-semibold mb-2" style={{ color: "rgba(247,245,240,0.5)" }}>
              Abonnement mensuel
            </p>
            <div className="flex items-baseline justify-center gap-1.5 mb-1">
              <span className="text-5xl font-black font-mono" style={{ color: "#00D084" }}>4 999</span>
              <span className="text-lg font-bold" style={{ color: "rgba(247,245,240,0.5)" }}>FCFA</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(247,245,240,0.35)" }}>par mois · renouvellement manuel</p>
          </div>

          {/* Features */}
          <div className="p-6 bg-white">
            <ul className="space-y-3 mb-6">
              {[
                { icon: BadgeCheck, text: "Badge Vendeur vérifié sur toutes vos annonces", highlight: true },
                { icon: BadgeCheck, text: "Annonces illimitées pendant 30 jours", highlight: false },
                { icon: BadgeCheck, text: "Option iPhone vérifié disponible (+1 499 FCFA / annonce)", highlight: false },
                { icon: Zap,        text: "Option TOP boost disponible (+500 FCFA / annonce)", highlight: false },
                { icon: CalendarDays, text: "Annonces actives jusqu'à expiration de l'abonnement", highlight: false },
                { icon: RefreshCw,  text: "Renouvellement manuel — vous gardez le contrôle", highlight: false },
              ].map(({ icon: Icon, text, highlight }) => (
                <li key={text} className="flex items-start gap-3 text-sm">
                  <Icon size={15} className="mt-0.5 flex-shrink-0"
                    style={{ color: highlight ? "#0B1A2B" : "#00D084" }} />
                  <span style={{ color: highlight ? "#0B1A2B" : "#4A5568", fontWeight: highlight ? 600 : 400 }}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm"
                style={{ background: "rgba(204,0,0,0.08)", color: "#CC0000" }}>
                {error}
              </div>
            )}

            <Button className="w-full" size="lg" loading={paying} onClick={handleSubscribe}>
              <CreditCard size={15} /> S'abonner pour 4 999 FCFA
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: "#8A99AA" }}>
              Paiement sécurisé via PayPlus · Mobile Money ou carte
            </p>
          </div>
        </div>
      )}

      {/* Note explication */}
      <div className="rounded-2xl p-5 text-sm leading-relaxed"
        style={{ background: "rgba(11,26,43,0.04)", border: "1px solid rgba(11,26,43,0.08)" }}>
        <p className="font-semibold mb-2" style={{ color: "#0B1A2B" }}>Comment ça marche ?</p>
        <ul className="space-y-1.5" style={{ color: "#8A99AA" }}>
          <li>• Vous souscrivez pour 30 jours. Le renouvellement est manuel.</li>
          <li>• Chaque annonce publiée pendant l'abonnement est active jusqu'à son expiration.</li>
          <li>• Si l'abonnement expire, vos annonces sont dépubliées. Elles se réactivent dès le renouvellement.</li>
          <li>• Le badge Vendeur vérifié nécessite votre KYC (à faire une seule fois depuis votre profil).</li>
        </ul>
      </div>

    </main>
  );
}
