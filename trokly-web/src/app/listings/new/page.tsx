"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { CONDITION_LABELS, CONDITION_OPTIONS, formatPrice } from "@/lib/utils";
import { Sparkles, Shield } from "lucide-react";
import Link from "next/link";

const IPHONE_MODELS = [
  "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max",
];

const COLORS = ["Noir", "Blanc", "Bleu", "Vert", "Rouge", "Violet", "Jaune", "Or", "Argent", "Autre"];

export default function NewListingPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    iphone_model: "",
    capacity: "128",
    color: "",
    condition: "good",
    imei: "",
    description: "",
    asking_price: "",
    accepts_trade: false,
    sale_type: "marketplace",
    photos: ["", "", "", "", "", ""],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<{ suggested_price: number; price_range: [number, number] } | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  function setField(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPhoto(index: number, url: string) {
    const photos = [...form.photos];
    photos[index] = url;
    setForm((f) => ({ ...f, photos }));
  }

  async function submit() {
    setError("");
    const filledPhotos = form.photos.filter(Boolean);
    if (filledPhotos.length < 6) return setError("Ajoutez au moins 6 photos.");
    if (!form.iphone_model) return setError("Choisissez le modèle.");
    if (!form.asking_price) return setError("Entrez le prix demandé.");

    setSubmitting(true);
    try {
      const res = await api.post("/listings", {
        ...form,
        capacity: parseInt(form.capacity),
        asking_price: parseInt(form.asking_price),
        photos: filledPhotos,
      });
      if (res.data.ai_suggestion) setAiSuggestion(res.data.ai_suggestion);
      setSuccess(true);
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

  if (success) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1A2B" }}>
            Annonce soumise !
          </h1>
          <p className="text-sm mb-6" style={{ color: "#8A99AA" }}>
            Votre iPhone va être expertisé par notre équipe. Vous serez notifié une fois validé.
          </p>

          {aiSuggestion && (
            <div
              className="card p-4 mb-6 text-left"
              style={{ border: "1px solid rgba(0,208,132,0.25)", background: "rgba(0,208,132,0.04)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} style={{ color: "#00D084" }} />
                <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>
                  Suggestion IA Trokly
                </p>
              </div>
              <p className="font-mono font-bold text-xl" style={{ color: "#0B1A2B" }}>
                {formatPrice(aiSuggestion.suggested_price)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                Fourchette estimée : {formatPrice(aiSuggestion.price_range[0])} – {formatPrice(aiSuggestion.price_range[1])}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link href="/profile">
              <Button className="w-full">Voir mes annonces</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">Retour au marketplace</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1A2B" }}>
        Mettre en vente mon iPhone
      </h1>
      <div className="flex items-center gap-2 mb-8">
        <Shield size={14} style={{ color: "#00D084" }} />
        <p className="text-sm" style={{ color: "#8A99AA" }}>
          Votre iPhone sera expertisé avant publication. Remise en main propre à Cotonou.
        </p>
      </div>

      <div className="space-y-6">
        {/* Modèle */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Informations du téléphone</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Modèle</label>
              <select
                className="input"
                value={form.iphone_model}
                onChange={(e) => setField("iphone_model", e.target.value)}
              >
                <option value="">Choisir un modèle</option>
                {IPHONE_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Capacité</label>
                <select
                  className="input"
                  value={form.capacity}
                  onChange={(e) => setField("capacity", e.target.value)}
                >
                  {[64, 128, 256, 512].map((c) => (
                    <option key={c} value={c}>{c} Go</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Couleur</label>
                <select
                  className="input"
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                >
                  <option value="">Choisir</option>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
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

            <Input
              label="IMEI"
              id="imei"
              placeholder="15 chiffres (composer *#06#)"
              value={form.imei}
              onChange={(e) => setField("imei", e.target.value)}
            />
          </div>
        </div>

        {/* Prix */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Prix et type de vente</h2>
          <div className="space-y-4">
            <Input
              label="Prix demandé (FCFA)"
              id="asking_price"
              type="number"
              placeholder="Ex: 220000"
              value={form.asking_price}
              onChange={(e) => setField("asking_price", e.target.value)}
            />

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Type de vente</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "marketplace", label: "Marketplace", desc: "Vous gardez le téléphone jusqu'à vente" },
                  { value: "quick_sale", label: "Vente rapide", desc: "Trokly rachète directement" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className="p-3 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: form.sale_type === opt.value ? "#00D084" : "rgba(11,26,43,0.12)",
                      background: form.sale_type === opt.value ? "rgba(0,208,132,0.06)" : "white",
                    }}
                    onClick={() => setField("sale_type", opt.value)}
                  >
                    <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
                style={{ background: form.accepts_trade ? "#00D084" : "rgba(11,26,43,0.15)" }}
                onClick={() => setField("accepts_trade", !form.accepts_trade)}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ left: form.accepts_trade ? 22 : 4 }}
                />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>Accepter les trocs</p>
                <p className="text-xs" style={{ color: "#8A99AA" }}>Les acheteurs peuvent proposer leur iPhone</p>
              </div>
            </label>
          </div>
        </div>

        {/* Photos */}
        <div className="card p-5">
          <h2 className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Photos (minimum 6)</h2>
          <p className="text-xs mb-4" style={{ color: "#8A99AA" }}>
            Collez les URLs de vos photos (Cloudinary, imgur, etc.)
          </p>
          <div className="space-y-2">
            {form.photos.map((url, i) => (
              <Input
                key={i}
                placeholder={`Photo ${i + 1} — URL`}
                value={url}
                onChange={(e) => setPhoto(i, e.target.value)}
              />
            ))}
            <button
              className="text-sm font-medium"
              style={{ color: "#00D084" }}
              onClick={() => setForm((f) => ({ ...f, photos: [...f.photos, ""] }))}
            >
              + Ajouter une photo
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="card p-5">
          <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
            Description (optionnel)
          </label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="État de la batterie, accessoires inclus, historique..."
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "#CC0000" }}>{error}</p>
        )}

        <Button size="lg" className="w-full" loading={submitting} onClick={submit}>
          Soumettre pour expertise
        </Button>
      </div>
    </main>
  );
}
