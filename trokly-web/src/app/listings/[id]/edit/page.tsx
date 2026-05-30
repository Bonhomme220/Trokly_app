"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Listing } from "@/lib/types";
import { CONDITION_LABELS, PLAN_LABELS } from "@/lib/utils";
import Button from "@/components/ui/Button";
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
    asking_price: "",
    description: "",
    whatsapp_number: "",
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<{ listing: Listing }>(`/my/listings/${id}`)
      .then(res => {
        const l = res.data.listing ?? (res.data as unknown as Listing);
        if (l.seller_id !== user?.id) { router.push("/seller"); return; }
        setListing(l);
        setForm({
          asking_price: String(l.asking_price),
          description: l.description || "",
          whatsapp_number: l.whatsapp_number || "",
        });
      })
      .finally(() => setDataLoading(false));
  }, [id, isAuthenticated, user?.id, router]);

  async function save() {
    setError("");
    const price = parseFloat(form.asking_price);
    if (!price || price < 1000) return setError("Le prix doit être au minimum 1 000 FCFA.");
    if (!form.whatsapp_number.trim()) return setError("Le numéro WhatsApp est requis.");
    if (!/^\+\d{6,15}$/.test(form.whatsapp_number.replace(/\s/g, ''))) return setError("Le numéro WhatsApp doit inclure l'indicatif pays (ex: +22901XXXXXXXX).");
    setSubmitting(true);
    try {
      await api.put(`/listings/${id}`, {
        asking_price: price,
        description: form.description,
        whatsapp_number: form.whatsapp_number,
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

  const conditionLabel = CONDITION_LABELS[listing.condition] ?? listing.condition;
  const planLabel = listing.plan ? (PLAN_LABELS[listing.plan] ?? listing.plan) : "—";

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
        <div className="space-y-4">
          {/* Read-only summary */}
          <div className="card p-4" style={{ background: "rgba(11,26,43,0.03)" }}>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#8A99AA" }}>
              Informations non modifiables
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div>
                <span style={{ color: "#8A99AA" }}>Modèle : </span>
                <span className="font-medium" style={{ color: "#0B1A2B" }}>{listing.iphone_model}</span>
              </div>
              <div>
                <span style={{ color: "#8A99AA" }}>Capacité : </span>
                <span className="font-medium" style={{ color: "#0B1A2B" }}>{listing.capacity} Go</span>
              </div>
              <div>
                <span style={{ color: "#8A99AA" }}>Couleur : </span>
                <span className="font-medium" style={{ color: "#0B1A2B" }}>{listing.color}</span>
              </div>
              <div>
                <span style={{ color: "#8A99AA" }}>État : </span>
                <span className="font-medium" style={{ color: "#0B1A2B" }}>{conditionLabel}</span>
              </div>
              <div>
                <span style={{ color: "#8A99AA" }}>Formule : </span>
                <span className="font-medium" style={{ color: "#0B1A2B" }}>{planLabel}</span>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="card p-6 space-y-5">
            {/* Price */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                Prix demandé (FCFA)
              </label>
              <input
                type="number"
                className="input font-mono"
                placeholder="Ex: 150000"
                value={form.asking_price}
                onChange={e => setForm(f => ({ ...f, asking_price: e.target.value }))}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                Numéro WhatsApp
              </label>
              <input
                type="tel"
                className="input"
                placeholder="Ex: +229 97 00 00 00"
                value={form.whatsapp_number}
                onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                onBlur={e => setForm(f => ({ ...f, whatsapp_number: e.target.value.replace(/\s+/g, '') }))}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                Description <span style={{ color: "#8A99AA" }}>(optionnel)</span>
              </label>
              <textarea
                className="input resize-none text-sm"
                rows={4}
                placeholder="État, accessoires inclus, historique de réparation…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm" style={{ color: "#CC0000" }}>{error}</p>}

            <Button className="w-full" loading={submitting} onClick={save}>
              <Save size={15} />
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
