"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Listing } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { CONDITION_LABELS, CONDITION_OPTIONS, formatPrice } from "@/lib/utils";
import { Sparkles, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

const IPHONE_MODELS = [
  "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max",
];

export default function TradeProposalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [form, setForm] = useState({
    initiator_iphone_model: "",
    initiator_capacity: "128",
    initiator_color: "",
    initiator_condition: "good",
    initiator_imei: "",
    initiator_asking_soulte: "",
    photos: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState<{
    suggested_soulte: number;
    initiator_estimated_value: number;
    target_estimated_value: number;
    direction: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    api.get<Listing>(`/listings/${id}`).then((res) => setListing(res.data));
  }, [id]);

  function setField(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setError("");
    const filledPhotos = form.photos.filter(Boolean);
    if (filledPhotos.length < 4) return setError("Ajoutez au moins 4 photos de votre iPhone.");
    if (!form.initiator_iphone_model) return setError("Choisissez le modèle de votre iPhone.");

    setSubmitting(true);
    try {
      const res = await api.post("/trades", {
        listing_id: parseInt(id),
        ...form,
        initiator_capacity: parseInt(form.initiator_capacity),
        initiator_asking_soulte: form.initiator_asking_soulte
          ? parseInt(form.initiator_asking_soulte)
          : undefined,
        photos: filledPhotos,
      });
      if (res.data.ai_suggestion) setAiResult(res.data.ai_suggestion);
      router.push(`/trades/${res.data.trade.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const firstError = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]?.[0]
        : err.response?.data?.message;
      setError(firstError || "Erreur lors de la soumission du troc.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!listing) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-10 rounded" style={{ background: "#E8E4DF", width: "60%" }} />
        <div className="h-64 card" style={{ background: "#E8E4DF" }} />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/listings/${id}`} className="text-sm mb-6 block" style={{ color: "#8A99AA" }}>
        ← Retour à l&apos;annonce
      </Link>

      <h1 className="text-2xl font-bold mb-1" style={{ color: "#0B1A2B" }}>
        Proposer un troc
      </h1>

      {/* Target */}
      <div
        className="flex items-center gap-3 p-3 rounded-xl mb-6"
        style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)" }}
      >
        <ArrowLeftRight size={18} style={{ color: "#00D084" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>
            Contre : {listing.iphone_model} {listing.capacity} Go
          </p>
          <p className="text-xs" style={{ color: "#8A99AA" }}>
            {formatPrice(listing.asking_price)} · {CONDITION_LABELS[listing.condition]}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Votre iPhone */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Votre iPhone</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Modèle</label>
              <select
                className="input"
                value={form.initiator_iphone_model}
                onChange={(e) => setField("initiator_iphone_model", e.target.value)}
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
                  value={form.initiator_capacity}
                  onChange={(e) => setField("initiator_capacity", e.target.value)}
                >
                  {[64, 128, 256, 512].map((c) => (
                    <option key={c} value={c}>{c} Go</option>
                  ))}
                </select>
              </div>
              <Input
                label="Couleur"
                id="color"
                placeholder="Ex: Noir"
                value={form.initiator_color}
                onChange={(e) => setField("initiator_color", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>État</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITION_OPTIONS.map((c) => (
                  <button
                    key={c}
                    className="p-3 rounded-xl border-2 text-sm font-medium transition-all"
                    style={{
                      borderColor: form.initiator_condition === c ? "#00D084" : "rgba(11,26,43,0.12)",
                      background: form.initiator_condition === c ? "rgba(0,208,132,0.06)" : "white",
                      color: "#0B1A2B",
                    }}
                    onClick={() => setField("initiator_condition", c)}
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
              value={form.initiator_imei}
              onChange={(e) => setField("initiator_imei", e.target.value)}
            />

            <Input
              label="Soulte demandée (FCFA) — optionnel"
              id="soulte"
              type="number"
              placeholder="Ex: 50000 (si votre iPhone vaut moins)"
              value={form.initiator_asking_soulte}
              onChange={(e) => setField("initiator_asking_soulte", e.target.value)}
            />
          </div>
        </div>

        {/* Photos */}
        <div className="card p-5">
          <h2 className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Photos de votre iPhone (minimum 4)</h2>
          <p className="text-xs mb-4" style={{ color: "#8A99AA" }}>
            Recto, verso, écran allumé, IMEI visible
          </p>
          <PhotoUpload
            photos={form.photos}
            onChange={(photos) => setForm((f) => ({ ...f, photos }))}
            min={4}
            max={8}
          />
        </div>

        {/* AI info */}
        {aiResult && (
          <div
            className="card p-4"
            style={{ border: "1px solid rgba(0,208,132,0.25)", background: "rgba(0,208,132,0.04)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} style={{ color: "#00D084" }} />
              <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>Estimation Trokly IA</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p style={{ color: "#8A99AA" }}>Votre iPhone estimé</p>
                <p className="font-bold font-mono" style={{ color: "#0B1A2B" }}>
                  {formatPrice(aiResult.initiator_estimated_value)}
                </p>
              </div>
              <div>
                <p style={{ color: "#8A99AA" }}>iPhone cible estimé</p>
                <p className="font-bold font-mono" style={{ color: "#0B1A2B" }}>
                  {formatPrice(aiResult.target_estimated_value)}
                </p>
              </div>
              <div className="col-span-2">
                <p style={{ color: "#8A99AA" }}>Soulte suggérée</p>
                <p className="font-bold font-mono text-lg" style={{ color: aiResult.suggested_soulte > 0 ? "#CC0000" : "#00B070" }}>
                  {aiResult.direction === "initiator_pays"
                    ? `Vous payez ${formatPrice(Math.abs(aiResult.suggested_soulte))}`
                    : aiResult.direction === "target_pays"
                    ? `Vous recevez ${formatPrice(Math.abs(aiResult.suggested_soulte))}`
                    : "Troc équitable"}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm" style={{ color: "#CC0000" }}>{error}</p>}

        <Button size="lg" className="w-full" loading={submitting} onClick={submit}>
          Soumettre la proposition
        </Button>
      </div>
    </main>
  );
}
