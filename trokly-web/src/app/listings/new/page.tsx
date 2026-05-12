"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { CONDITION_LABELS, CONDITION_OPTIONS } from "@/lib/utils";
import { Shield, Star, BadgeCheck, Zap, MessageCircle } from "lucide-react";

const IPHONE_MODELS = [
  "iPhone 6", "iPhone 6 Plus",
  "iPhone 6s", "iPhone 6s Plus",
  "iPhone SE (1re gén.)",
  "iPhone 7", "iPhone 7 Plus",
  "iPhone 8", "iPhone 8 Plus",
  "iPhone X",
  "iPhone XS", "iPhone XS Max",
  "iPhone XR",
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
  "iPhone SE (2e gén.)",
  "iPhone 12 mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13 mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone SE (3e gén.)",
  "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
  "iPhone 16e",
];

const COLORS = ["Noir", "Blanc", "Bleu", "Vert", "Rouge", "Violet", "Jaune", "Or", "Argent", "Autre"];

const PLANS = [
  {
    id: "basic",
    label: "Annonce simple",
    price: 499,
    icon: Star,
    color: "#8A99AA",
    description: "Publication directe après validation",
    badge: null,
  },
  {
    id: "verified_phone",
    label: "iPhone vérifié",
    price: 1499,
    icon: Shield,
    color: "#00B070",
    description: "Badge « iPhone expertisé » par notre équipe",
    badge: "✓ iPhone vérifié",
  },
  {
    id: "verified_seller",
    label: "Vendeur vérifié",
    price: 2999,
    icon: BadgeCheck,
    color: "#0B1A2B",
    description: "Badge expertise iPhone + badge identité vendeur (KYC requis)",
    badge: "✓ Vendeur vérifié",
  },
];

export default function NewListingPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  const [plan, setPlan] = useState("basic");
  const [boosted, setBoosted] = useState(false);
  const [form, setForm] = useState({
    iphone_model: "",
    capacity: "128",
    color: "",
    condition: "good",
    imei: "",
    description: "",
    asking_price: "",
    whatsapp_number: "",
    photos: [] as string[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  function setField(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const totalPrice = PLANS.find(p => p.id === plan)!.price + (boosted ? 500 : 0);

  async function submit() {
    setError("");
    const filledPhotos = form.photos.filter(Boolean);
    if (!form.iphone_model) return setError("Choisissez le modèle.");
    if (!form.asking_price) return setError("Entrez le prix demandé.");
    if (!form.whatsapp_number.trim()) return setError("Entrez votre numéro WhatsApp.");
    if (filledPhotos.length < 3) return setError("Ajoutez au moins 3 photos.");

    setSubmitting(true);
    try {
      const res = await api.post("/listings", {
        ...form,
        capacity: parseInt(form.capacity),
        asking_price: parseInt(form.asking_price),
        photos: filledPhotos,
        plan,
        is_boosted: boosted,
        sale_type: "marketplace",
        accepts_trade: false,
      });

      if (res.data.used_credit) {
        router.push(`/seller?listing_published=1`);
        return;
      }

      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
        return;
      }

      router.push("/seller");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const firstError = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]?.[0]
        : err.response?.data?.message;
      setError(firstError || "Erreur lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0B1A2B" }}>Déposer une annonce</h1>
      <p className="text-sm mb-8" style={{ color: "#8A99AA" }}>
        Votre annonce sera visible par des milliers d'acheteurs au Bénin.
      </p>

      <div className="space-y-6">

        {/* Choix du plan */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Choisissez votre offre</h2>
          <div className="space-y-3">
            {PLANS.map((p) => {
              const Icon = p.icon;
              const selected = plan === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className="w-full p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: selected ? p.color : "rgba(11,26,43,0.1)",
                    background: selected ? `rgba(0,0,0,0.02)` : "white",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: selected ? p.color : "rgba(11,26,43,0.08)" }}>
                        <Icon size={15} style={{ color: selected ? "white" : "#8A99AA" }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>{p.label}</p>
                        <p className="text-xs" style={{ color: "#8A99AA" }}>{p.description}</p>
                      </div>
                    </div>
                    <p className="font-black text-base flex-shrink-0 ml-3" style={{ color: selected ? p.color : "#0B1A2B" }}>
                      {p.price} F
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Option boost */}
          <div
            className="mt-4 p-4 rounded-xl border-2 cursor-pointer transition-all"
            style={{
              borderColor: boosted ? "#F59E0B" : "rgba(11,26,43,0.1)",
              background: boosted ? "rgba(245,158,11,0.06)" : "white",
            }}
            onClick={() => setBoosted(!boosted)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: boosted ? "#F59E0B" : "rgba(11,26,43,0.08)" }}>
                  <Zap size={14} style={{ color: boosted ? "white" : "#8A99AA" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
                    TOP annonces <span className="text-xs font-normal ml-1" style={{ color: "#8A99AA" }}>— optionnel</span>
                  </p>
                  <p className="text-xs" style={{ color: "#8A99AA" }}>Votre annonce apparaît en tête de liste</p>
                </div>
              </div>
              <p className="font-black text-base flex-shrink-0 ml-3" style={{ color: boosted ? "#F59E0B" : "#0B1A2B" }}>
                +500 F
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(11,26,43,0.08)" }}>
            <p className="text-sm font-medium" style={{ color: "#8A99AA" }}>Total à payer</p>
            <p className="text-xl font-black" style={{ color: "#0B1A2B" }}>{totalPrice.toLocaleString()} FCFA</p>
          </div>

          {(user?.listing_credits ?? 0) > 0 && (
            <div className="mt-3 p-3 rounded-xl text-xs font-medium" style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
              🎁 Vous avez {user.listing_credits} crédit(s) de republication — il sera utilisé automatiquement.
            </div>
          )}
        </div>

        {/* Infos téléphone */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Informations du téléphone</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Modèle</label>
              <select className="input" value={form.iphone_model} onChange={(e) => setField("iphone_model", e.target.value)}>
                <option value="">Choisir un modèle</option>
                {IPHONE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Capacité</label>
                <select className="input" value={form.capacity} onChange={(e) => setField("capacity", e.target.value)}>
                  {[64, 128, 256, 512, 1024].map((c) => <option key={c} value={c}>{c} Go</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Couleur</label>
                <select className="input" value={form.color} onChange={(e) => setField("color", e.target.value)}>
                  <option value="">Choisir</option>
                  {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>État général</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITION_OPTIONS.map((c) => (
                  <button
                    key={c}
                    className="p-3 rounded-xl border-2 text-sm font-medium text-left transition-all"
                    style={{
                      borderColor: form.condition === c ? "#00D084" : "rgba(11,26,43,0.12)",
                      background: form.condition === c ? "rgba(0,208,132,0.06)" : "white",
                      color: "#0B1A2B",
                    }}
                    onClick={() => setField("condition", c)}
                  >
                    {CONDITION_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            <Input label="IMEI" id="imei" placeholder="15 chiffres — composer *#06#"
              value={form.imei} onChange={(e) => setField("imei", e.target.value)} />
          </div>
        </div>

        {/* Prix + WhatsApp */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Prix et contact</h2>
          <div className="space-y-4">
            <Input label="Prix demandé (FCFA)" id="asking_price" type="number" placeholder="Ex: 220 000"
              value={form.asking_price} onChange={(e) => setField("asking_price", e.target.value)} />

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                <MessageCircle size={13} className="inline mr-1.5" style={{ color: "#25D366" }} />
                Numéro WhatsApp
              </label>
              <input className="input" type="tel" placeholder="+229 01 XX XX XX XX"
                value={form.whatsapp_number} onChange={(e) => setField("whatsapp_number", e.target.value)} />
              <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>
                Les acheteurs vous contacteront directement sur ce numéro.
              </p>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="card p-5">
          <h2 className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Photos (minimum 3)</h2>
          <p className="text-xs mb-4" style={{ color: "#8A99AA" }}>
            Face, dos, côtés, défauts éventuels. Plus il y a de photos, plus vite vous vendez.
          </p>
          <PhotoUpload photos={form.photos} onChange={(photos) => setForm((f) => ({ ...f, photos }))} min={3} max={10} />
        </div>

        {/* Description */}
        <div className="card p-5">
          <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Description (optionnel)</label>
          <textarea className="input resize-none" rows={4}
            placeholder="État de la batterie, accessoires inclus, historique..."
            value={form.description} onChange={(e) => setField("description", e.target.value)} />
        </div>

        {error && <p className="text-sm" style={{ color: "#CC0000" }}>{error}</p>}

        <Button size="lg" className="w-full" loading={submitting} onClick={submit}>
          Continuer vers le paiement — {totalPrice.toLocaleString()} FCFA
        </Button>
        <p className="text-xs text-center pb-4" style={{ color: "#8A99AA" }}>
          Votre annonce sera active 30 jours après paiement.
        </p>
      </div>
    </main>
  );
}
