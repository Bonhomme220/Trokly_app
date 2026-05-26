"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Listing } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/utils";

const IPHONE_MODELS = [
  "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
  "iPhone 16e",
  "iPhone 17", "iPhone 17 Air", "iPhone 17 Pro", "iPhone 17 Pro Max",
];

const CAPACITIES = [64, 128, 256, 512, 1024];
import Button from "@/components/ui/Button";
import PhotoUpload from "@/components/ui/PhotoUpload";
import Link from "next/link";
import { ChevronLeft, Save } from "lucide-react";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    iphone_model: "",
    capacity: 128,
    color: "",
    condition: "good",
    asking_price: "",
    description: "",
    accepts_trade: false,
    photos: [] as string[],
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<{ listing: Listing }>(`/listings/${id}`)
      .then(res => {
        const l = res.data.listing ?? (res.data as unknown as Listing);
        if (l.seller_id !== user?.id) { router.push("/seller"); return; }
        setListing(l);
        setForm({
          iphone_model: l.iphone_model,
          capacity: l.capacity,
          color: l.color,
          condition: l.condition,
          asking_price: String(l.asking_price),
          description: l.description || "",
          accepts_trade: l.accepts_trade,
          photos: l.photos?.map(p => p.url) ?? [],
        });
      })
      .finally(() => setDataLoading(false));
  }, [id, isAuthenticated, user?.id, router]);

  async function save() {
    setError("");
    const price = parseFloat(form.asking_price);
    if (!form.iphone_model) return setError("Sélectionnez un modèle.");
    if (!price || price <= 0) return setError("Entrez un prix valide.");
    setSubmitting(true);
    try {
      await api.put(`/listings/${id}`, {
        iphone_model: form.iphone_model,
        capacity: form.capacity,
        color: form.color,
        condition: form.condition,
        asking_price: price,
        description: form.description,
        accepts_trade: form.accepts_trade,
        photo_urls: form.photos,
      });
      setSuccess(true);
      setTimeout(() => router.push("/seller"), 1200);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || dataLoading) return null;
  if (!listing) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/seller" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "#8A99AA" }}>
        <ChevronLeft size={16} /> Mes annonces
      </Link>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "#0B1A2B" }}>Modifier l'annonce</h1>

      {success ? (
        <div className="card p-8 text-center">
          <p className="text-lg font-bold mb-1" style={{ color: "#0B1A2B" }}>Annonce mise à jour !</p>
          <p className="text-sm" style={{ color: "#8A99AA" }}>Redirection…</p>
        </div>
      ) : (
        <div className="card p-6 space-y-5">
          {/* Model */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Modèle</label>
            <select className="input" value={form.iphone_model} onChange={e => setForm(f => ({ ...f, iphone_model: e.target.value }))}>
              <option value="">Sélectionner…</option>
              {IPHONE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Capacity + Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Capacité</label>
              <select className="input" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}>
                {CAPACITIES.map(c => <option key={c} value={c}>{c} Go</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Couleur</label>
              <input type="text" className="input" placeholder="Ex: Minuit" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: "#0B1A2B" }}>État</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CONDITION_LABELS) as [string, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="p-3 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: form.condition === key ? "#00D084" : "rgba(11,26,43,0.1)",
                    background: form.condition === key ? "rgba(0,208,132,0.06)" : "white",
                  }}
                  onClick={() => setForm(f => ({ ...f, condition: key }))}
                >
                  <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Prix demandé (FCFA)</label>
            <input
              type="number"
              className="input font-mono"
              placeholder="Ex: 150000"
              value={form.asking_price}
              onChange={e => setForm(f => ({ ...f, asking_price: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Description (optionnel)</label>
            <textarea
              className="input resize-none text-sm"
              rows={3}
              placeholder="État, accessoires inclus, historique…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Photos */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: "#0B1A2B" }}>Photos</label>
            <PhotoUpload
              photos={form.photos}
              onChange={(photos) => setForm(f => ({ ...f, photos }))}
              min={1}
              max={10}
            />
          </div>

          {/* Accepts trade */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: form.accepts_trade ? "#00D084" : "rgba(11,26,43,0.2)",
                background: form.accepts_trade ? "#00D084" : "white",
              }}
              onClick={() => setForm(f => ({ ...f, accepts_trade: !f.accepts_trade }))}
            >
              {form.accepts_trade && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm" style={{ color: "#0B1A2B" }}>Accepter les propositions de troc</span>
          </label>

          {error && <p className="text-sm" style={{ color: "#CC0000" }}>{error}</p>}

          <Button className="w-full" loading={submitting} onClick={save}>
            <Save size={15} />
            Enregistrer les modifications
          </Button>
        </div>
      )}
    </main>
  );
}
