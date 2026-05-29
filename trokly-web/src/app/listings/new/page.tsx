"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { CONDITION_LABELS, CONDITION_OPTIONS } from "@/lib/utils";
import { BadgeCheck, Zap, MessageCircle, Check, AlertTriangle, ChevronRight, Tag, Loader2 } from "lucide-react";
import Link from "next/link";

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
  "iPhone 17", "iPhone 17 Air", "iPhone 17 Pro", "iPhone 17 Pro Max",
];

const COLORS = ["Noir", "Blanc", "Bleu", "Vert", "Rouge", "Violet", "Jaune", "Or", "Argent", "Autre"];

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 499,
    color: "#0B1A2B",
    badge: null,
    tagline: "Publication immédiate après paiement",
    features: ["Annonce active 30 jours", "WhatsApp visible pour les acheteurs"],
    next: "Votre annonce est publiée immédiatement.",
  },
  {
    id: "verified_phone",
    name: "iPhone vérifié",
    price: 1499,
    color: "#00B070",
    badge: "iPhone vérifié",
    tagline: "Expertise physique + badge de confiance",
    features: ["Tout le Basic", "Expertise chez un partenaire Trokly", "Badge iPhone vérifié sur l'annonce"],
    next: "Vous recevez l'adresse d'un expert par email. Apportez votre iPhone pour l'expertise.",
  },
  {
    id: "verified_seller",
    name: "Vendeur vérifié",
    price: 2999,
    color: "#0B1A2B",
    badge: "Vendeur vérifié",
    tagline: "KYC + expertise + badge sur votre profil",
    features: ["Tout le plan iPhone vérifié", "Vérification d'identité (KYC)", "Badge Vendeur vérifié sur votre profil"],
    next: "Vous recevez l'adresse d'un expert par email. KYC + expertise sur place.",
    requiresKyc: true,
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

  // Ambassador code
  const [ambassadorCode, setAmbassadorCode] = useState("");
  const [ambassadorInfo, setAmbassadorInfo] = useState<{ code: string; discount_percent: number; ambassador_name: string } | null>(null);
  const [ambassadorLoading, setAmbassadorLoading] = useState(false);
  const [ambassadorError, setAmbassadorError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/register?next=/listings/new");
  }, [loading, isAuthenticated, router]);

  function setField(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const selectedPlan = PLANS.find(p => p.id === plan)!;
  const basePrice = selectedPlan.price + (boosted ? 500 : 0);
  const discountAmount = ambassadorInfo ? Math.round(basePrice * ambassadorInfo.discount_percent / 100) : 0;
  const totalPrice = basePrice - discountAmount;
  const hasCredit = (user?.listing_credits ?? 0) > 0 && plan === "basic";

  async function applyAmbassadorCode() {
    const code = ambassadorCode.trim().toUpperCase();
    if (!code) return;
    setAmbassadorLoading(true);
    setAmbassadorError("");
    setAmbassadorInfo(null);
    try {
      const res = await api.get(`/ambassador/codes/${code}/check`);
      setAmbassadorInfo(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAmbassadorError(err.response?.data?.message || "Code invalide.");
    } finally {
      setAmbassadorLoading(false);
    }
  }

  function removeAmbassadorCode() {
    setAmbassadorCode("");
    setAmbassadorInfo(null);
    setAmbassadorError("");
  }

  async function submit() {
    setError("");
    const filledPhotos = form.photos.filter(Boolean);
    if (!form.iphone_model)           return setError("Choisissez le modèle.");
    if (!form.color)                  return setError("Choisissez la couleur.");
    if (!form.asking_price)           return setError("Entrez le prix demandé.");
    if (!form.whatsapp_number.trim()) return setError("Entrez votre numéro WhatsApp.");
    if (filledPhotos.length < 3)      return setError("Ajoutez au moins 3 photos.");

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
        ...(ambassadorInfo ? { ambassador_code: ambassadorInfo.code, discount_amount: discountAmount } : {}),
      });

      if (res.data.used_credit) {
        router.push("/seller?listing_published=1");
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#0B1A2B" }}>Déposer une annonce</h1>
        <p className="text-sm" style={{ color: "#8A99AA" }}>
          Votre annonce sera visible par des milliers d'acheteurs au Bénin. Les acheteurs vous contacteront directement sur WhatsApp.
        </p>
      </div>

      <div className="space-y-6">

        {/* ── 1. Formule ── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "#0B1A2B" }}>Choisissez votre formule</h2>
            <Link href="/tarifs" target="_blank"
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#00B070" }}>
              Voir les détails <ChevronRight size={11} />
            </Link>
          </div>

          <div className="space-y-2">
            {PLANS.map(p => {
              const selected = plan === p.id;
              return (
                <button key={p.id} onClick={() => setPlan(p.id)}
                  className="w-full rounded-xl border-2 text-left transition-all overflow-hidden"
                  style={{
                    borderColor: selected ? p.color : "rgba(11,26,43,0.1)",
                    background: selected && p.id === "verified_seller" ? "#0B1A2B"
                      : selected ? `${p.color}0d`
                      : "white",
                  }}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm"
                            style={{ color: selected && p.id === "verified_seller" ? "white" : "#0B1A2B" }}>
                            {p.name}
                          </span>
                          {p.badge && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                              style={{
                                background: selected && p.id === "verified_seller" ? "rgba(0,208,132,0.2)" : `${p.color}18`,
                                color: p.color === "#0B1A2B" && selected ? "#00D084" : p.color,
                              }}>
                              <BadgeCheck size={9} /> {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: selected && p.id === "verified_seller" ? "rgba(247,245,240,0.5)" : "#8A99AA" }}>
                          {p.tagline}
                        </p>
                        {selected && (
                          <ul className="mt-2 space-y-1">
                            {p.features.map(f => (
                              <li key={f} className="flex items-center gap-1.5 text-xs"
                                style={{ color: selected && p.id === "verified_seller" ? "rgba(247,245,240,0.7)" : "#4A5568" }}>
                                <Check size={11} style={{ color: "#00D084", flexShrink: 0 }} /> {f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-lg"
                          style={{ color: selected && p.id === "verified_seller" ? "#00D084" : p.color }}>
                          {p.price.toLocaleString("fr-FR")}
                        </p>
                        <p className="text-xs" style={{ color: selected && p.id === "verified_seller" ? "rgba(247,245,240,0.4)" : "#8A99AA" }}>
                          FCFA
                        </p>
                      </div>
                    </div>

                    {/* Avertissement KYC */}
                    {selected && p.requiresKyc && user?.kyc?.status !== "approved" && (
                      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg"
                        style={{ background: "rgba(245,158,11,0.12)" }}>
                        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                        <p className="text-xs" style={{ color: "#B8860B" }}>
                          Cette formule nécessite une vérification d'identité (KYC).{" "}
                          <Link href="/kyc" className="font-semibold underline">Vérifier mon identité</Link>
                        </p>
                      </div>
                    )}

                    {/* Ce qui se passe après */}
                    {selected && p.id !== "basic" && (
                      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg"
                        style={{ background: p.id === "verified_seller" ? "rgba(0,208,132,0.1)" : "rgba(0,176,112,0.08)" }}>
                        <span className="text-base flex-shrink-0">📍</span>
                        <p className="text-xs" style={{ color: p.id === "verified_seller" ? "#00D084" : "#00B070" }}>
                          <strong>Après paiement :</strong> {p.next}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Boost TOP */}
          <button
            className="w-full mt-3 p-4 rounded-xl border-2 text-left transition-all"
            style={{
              borderColor: boosted ? "#F59E0B" : "rgba(11,26,43,0.1)",
              background: boosted ? "rgba(245,158,11,0.06)" : "white",
            }}
            onClick={() => setBoosted(!boosted)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: boosted ? "#F59E0B" : "rgba(11,26,43,0.08)" }}>
                  <Zap size={14} style={{ color: boosted ? "white" : "#8A99AA" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2" style={{ color: "#0B1A2B" }}>
                    Option TOP
                    <span className="text-xs font-normal" style={{ color: "#8A99AA" }}>— optionnel</span>
                  </p>
                  <p className="text-xs" style={{ color: "#8A99AA" }}>
                    Épinglée en tête des résultats pendant 30 jours
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-base" style={{ color: boosted ? "#F59E0B" : "#0B1A2B" }}>+500</p>
                <p className="text-xs" style={{ color: "#8A99AA" }}>FCFA</p>
              </div>
            </div>
          </button>

          {/* Code ambassadeur */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(11,26,43,0.08)" }}>
            {ambassadorInfo ? (
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(0,208,132,0.1)", border: "1px solid rgba(0,208,132,0.3)" }}>
                <div className="flex items-center gap-2">
                  <Tag size={14} style={{ color: "#00B070" }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#00B070" }}>
                      Code <span style={{ color: "#0B1A2B" }}>{ambassadorInfo.code}</span> appliqué
                    </p>
                    <p className="text-xs" style={{ color: "#8A99AA" }}>
                      −{ambassadorInfo.discount_percent}% • Économie : {discountAmount.toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>
                <button onClick={removeAmbassadorCode} className="text-xs font-medium" style={{ color: "#CC0000" }}>
                  Retirer
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "#0B1A2B" }}>
                  <Tag size={12} className="inline mr-1.5" style={{ color: "#8A99AA" }} />
                  Vous avez un code ambassadeur ?
                </p>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 uppercase"
                    placeholder="Ex: AARON20"
                    value={ambassadorCode}
                    onChange={e => { setAmbassadorCode(e.target.value); setAmbassadorError(""); }}
                    onKeyDown={e => e.key === "Enter" && applyAmbassadorCode()}
                  />
                  <button
                    onClick={applyAmbassadorCode}
                    disabled={ambassadorLoading || !ambassadorCode.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                    style={{
                      background: ambassadorCode.trim() ? "#0B1A2B" : "rgba(11,26,43,0.1)",
                      color: ambassadorCode.trim() ? "white" : "#8A99AA",
                    }}>
                    {ambassadorLoading ? <Loader2 size={14} className="animate-spin" /> : "Appliquer"}
                  </button>
                </div>
                {ambassadorError && (
                  <p className="text-xs mt-1.5" style={{ color: "#CC0000" }}>{ambassadorError}</p>
                )}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(11,26,43,0.08)" }}>
            <p className="text-sm font-medium" style={{ color: "#8A99AA" }}>Total à payer</p>
            <div className="text-right">
              {ambassadorInfo && !hasCredit && (
                <p className="text-xs line-through" style={{ color: "#8A99AA" }}>
                  {basePrice.toLocaleString("fr-FR")} FCFA
                </p>
              )}
              <p className="text-xl font-black" style={{ color: "#0B1A2B" }}>
                {hasCredit ? "Gratuit" : `${totalPrice.toLocaleString("fr-FR")} FCFA`}
              </p>
              {hasCredit && (
                <p className="text-xs" style={{ color: "#8A99AA" }}>
                  (valeur {basePrice.toLocaleString("fr-FR")} FCFA)
                </p>
              )}
            </div>
          </div>

          {hasCredit && (
            <div className="mt-3 p-3 rounded-xl flex items-center gap-2 text-xs font-medium"
              style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
              🎁 Vous avez {user?.listing_credits} crédit{(user?.listing_credits ?? 0) > 1 ? "s" : ""} de publication — paiement offert pour cette annonce.
            </div>
          )}
          {(user?.listing_credits ?? 0) > 0 && plan !== "basic" && (
            <div className="mt-3 p-3 rounded-xl flex items-center gap-2 text-xs font-medium"
              style={{ background: "rgba(245,158,11,0.1)", color: "#B8860B" }}>
              🎁 Vos crédits de publication s&apos;appliquent uniquement au plan <strong>Basic (499 FCFA)</strong>.
            </div>
          )}
        </div>

        {/* ── 2. Téléphone ── */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Informations du téléphone</h2>
          <div className="space-y-4">

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Modèle *</label>
              <select className="input" value={form.iphone_model} onChange={e => setField("iphone_model", e.target.value)}>
                <option value="">Choisir un modèle</option>
                {IPHONE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Capacité *</label>
                <select className="input" value={form.capacity} onChange={e => setField("capacity", e.target.value)}>
                  {[64, 128, 256, 512, 1024].map(c => <option key={c} value={c}>{c} Go</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Couleur *</label>
                <select className="input" value={form.color} onChange={e => setField("color", e.target.value)}>
                  <option value="">Choisir</option>
                  {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>État général *</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITION_OPTIONS.map(c => (
                  <button key={c}
                    className="p-3 rounded-xl border-2 text-sm font-medium text-left transition-all"
                    style={{
                      borderColor: form.condition === c ? "#00D084" : "rgba(11,26,43,0.12)",
                      background: form.condition === c ? "rgba(0,208,132,0.06)" : "white",
                      color: "#0B1A2B",
                    }}
                    onClick={() => setField("condition", c)}>
                    {CONDITION_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                IMEI
                <span className="font-normal ml-1" style={{ color: "#8A99AA" }}>(optionnel)</span>
              </label>
              <input className="input" placeholder="Composer *#06# pour l'obtenir"
                value={form.imei} onChange={e => setField("imei", e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── 3. Prix + WhatsApp ── */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Prix et contact</h2>
          <div className="space-y-4">
            <Input label="Prix demandé (FCFA) *" id="asking_price" type="number" placeholder="Ex: 220 000"
              value={form.asking_price} onChange={e => setField("asking_price", e.target.value)} />

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                <MessageCircle size={13} className="inline mr-1.5" style={{ color: "#25D366" }} />
                Numéro WhatsApp *
              </label>
              <input className="input" type="tel" placeholder="+229 01 XX XX XX XX"
                value={form.whatsapp_number} onChange={e => setField("whatsapp_number", e.target.value)} />
              <p className="text-xs mt-1.5" style={{ color: "#8A99AA" }}>
                Les acheteurs intéressés vous contacteront directement sur ce numéro.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. Photos ── */}
        <div className="card p-5">
          <h2 className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Photos *</h2>
          <p className="text-xs mb-4" style={{ color: "#8A99AA" }}>
            Minimum 3 photos. Photographiez la face, le dos, les côtés et tout défaut éventuel.
          </p>
          <PhotoUpload photos={form.photos} onChange={photos => setForm(f => ({ ...f, photos }))} min={3} max={10} />
        </div>

        {/* ── 5. Description ── */}
        <div className="card p-5">
          <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
            Description
            <span className="font-normal ml-1" style={{ color: "#8A99AA" }}>(optionnel)</span>
          </label>
          <textarea className="input resize-none" rows={4}
            placeholder="Niveau de la batterie, accessoires fournis, historique du téléphone..."
            value={form.description} onChange={e => setField("description", e.target.value)} />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl"
            style={{ background: "rgba(204,0,0,0.08)" }}>
            <AlertTriangle size={14} style={{ color: "#CC0000", flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#CC0000" }}>{error}</p>
          </div>
        )}

        <Button size="lg" className="w-full" loading={submitting} onClick={submit}>
          {hasCredit
            ? "Publier gratuitement (crédit)"
            : `Continuer vers le paiement — ${totalPrice.toLocaleString("fr-FR")} FCFA`}
        </Button>
        {ambassadorInfo && !hasCredit && (
          <p className="text-xs text-center -mt-2" style={{ color: "#00B070" }}>
            🎁 Code <strong>{ambassadorInfo.code}</strong> : −{ambassadorInfo.discount_percent}% appliqué ({discountAmount.toLocaleString("fr-FR")} FCFA économisés)
          </p>
        )}

        <p className="text-xs text-center pb-4" style={{ color: "#8A99AA" }}>
          Votre annonce sera active 30 jours.
          {plan === "basic" ? " Publication immédiate après paiement." : " Expertise requise avant publication."}
        </p>
      </div>
    </main>
  );
}
