"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction } from "@/lib/types";
import { formatDate, formatPrice, CONDITION_LABELS } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ShoppingBag, Shield, AlertTriangle, CheckCircle, ChevronLeft } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "signal" | "ink" | "warning" | "error" }> = {
  pending:       { label: "En attente",       variant: "warning" },
  in_retraction: { label: "Rétractation",     variant: "warning" },
  completed:     { label: "Complétée",         variant: "signal" },
  refunded:      { label: "Remboursée",        variant: "ink" },
  litigated:     { label: "En litige",         variant: "error" },
};

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [retractLoading, setRetractLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<{ transaction: Transaction }>(`/transactions/${id}`)
      .then(res => setTx(res.data.transaction ?? res.data as unknown as Transaction))
      .finally(() => setDataLoading(false));
  }, [id, isAuthenticated]);

  async function retract() {
    if (!confirm("Êtes-vous sûr de vouloir vous rétracter ? Cela créera un litige.")) return;
    setRetractLoading(true);
    setError("");
    try {
      await api.post(`/transactions/${id}/retract`);
      setTx(t => t ? { ...t, status: "in_retraction" } : t);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur lors de la rétractation.");
    } finally {
      setRetractLoading(false);
    }
  }

  if (loading || dataLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 rounded" style={{ background: "#E8E4DF", width: "40%" }} />
        <div className="card h-48" style={{ background: "#E8E4DF" }} />
      </main>
    );
  }

  if (!tx) return null;

  const isBuyer = user?.id === tx.buyer_id;
  const canRetract = isBuyer && tx.status === "pending";
  const s = STATUS_MAP[tx.status] ?? { label: tx.status, variant: "ink" as const };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/seller" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "#8A99AA" }}>
        <ChevronLeft size={16} /> Mes achats
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(11,26,43,0.06)" }}>
            <ShoppingBag size={20} style={{ color: "#0B1A2B" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#0B1A2B" }}>Transaction #{tx.id}</h1>
            <p className="text-sm" style={{ color: "#8A99AA" }}>{formatDate(tx.created_at)}</p>
          </div>
        </div>
        <Badge variant={s.variant}>{s.label}</Badge>
      </div>

      {/* Produit */}
      {tx.listing && (
        <div className="card p-4 mb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
            {tx.listing.photos?.[0]
              ? <img src={tx.listing.photos[0].url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl">📱</div>}
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: "#0B1A2B" }}>
              {tx.listing.iphone_model} {tx.listing.capacity} Go
            </p>
            <p className="text-sm" style={{ color: "#8A99AA" }}>
              {CONDITION_LABELS[tx.listing.condition]} · {tx.listing.color}
            </p>
            {tx.listing.quality_grade && (
              <p className="text-xs font-semibold mt-1" style={{ color: "#00B070" }}>
                Grade {tx.listing.quality_grade} · Expertisé Trokly
              </p>
            )}
          </div>
        </div>
      )}

      {/* Récapitulatif financier */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>Détail financier</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "#8A99AA" }}>Prix payé</span>
            <span className="font-mono font-semibold" style={{ color: "#0B1A2B" }}>{formatPrice(tx.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "#8A99AA" }}>Commission Trokly (15%)</span>
            <span className="font-mono" style={{ color: "#8A99AA" }}>{formatPrice(tx.commission)}</span>
          </div>
          <hr style={{ borderColor: "rgba(11,26,43,0.08)" }} />
          <div className="flex justify-between font-semibold">
            <span style={{ color: "#0B1A2B" }}>Reversé au vendeur</span>
            <span className="font-mono" style={{ color: "#0B1A2B" }}>{formatPrice(tx.seller_net)}</span>
          </div>
        </div>
      </div>

      {/* Garantie Trokly */}
      {tx.status === "pending" && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)" }}>
          <Shield size={18} style={{ color: "#00D084", flexShrink: 0 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>Protection acheteur active</p>
            <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
              Vous pouvez vous rétracter et être remboursé. Le vendeur ne reçoit le paiement qu'après la livraison confirmée.
            </p>
          </div>
        </div>
      )}

      {tx.status === "completed" && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)" }}>
          <CheckCircle size={18} style={{ color: "#00D084" }} />
          <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>Transaction complétée — iPhone livré</p>
        </div>
      )}

      {tx.status === "in_retraction" && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.3)" }}>
          <AlertTriangle size={18} style={{ color: "#B8860B", flexShrink: 0 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>Rétractation en cours</p>
            <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>Un administrateur va examiner votre demande et procéder au remboursement.</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm mb-3" style={{ color: "#CC0000" }}>{error}</p>}

      {/* Actions */}
      {canRetract && (
        <Button variant="secondary" className="w-full" loading={retractLoading} onClick={retract}
          style={{ borderColor: "rgba(204,0,0,0.25)", color: "#CC0000" } as React.CSSProperties}
        >
          <AlertTriangle size={15} />
          Me rétracter et demander un remboursement
        </Button>
      )}
    </main>
  );
}
