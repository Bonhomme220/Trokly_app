"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Trade, TradeOffer } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatPrice, CONDITION_LABELS } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Sparkles, ArrowLeftRight, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  estimation_done: "Estimation disponible",
  in_negotiation: "Négociation en cours",
  agreed: "Accord trouvé",
  completed: "Terminé",
  cancelled: "Annulé",
  expired: "Expiré",
};

const STATUS_VARIANTS: Record<string, "signal" | "ink" | "warning" | "error"> = {
  estimation_done: "warning",
  in_negotiation: "warning",
  agreed: "signal",
  completed: "ink",
  cancelled: "error",
  expired: "error",
};

export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const [trade, setTrade] = useState<Trade | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [soulteAmount, setSoulteAmount] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  async function loadTrade() {
    try {
      const res = await api.get<Trade>(`/trades/${id}`);
      setTrade(res.data);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) loadTrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, id]);

  async function makeOffer() {
    setError("");
    if (!soulteAmount) return setError("Entrez un montant de soulte.");
    setOfferLoading(true);
    try {
      await api.post(`/trades/${id}/offers`, { soulte_amount: parseInt(soulteAmount) });
      setSoulteAmount("");
      await loadTrade();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur.");
    } finally {
      setOfferLoading(false);
    }
  }

  async function acceptOffer(offer: TradeOffer) {
    try {
      await api.post(`/trades/${id}/offers/${offer.id}/accept`);
      await loadTrade();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur.");
    }
  }

  async function refuseOffer(offer: TradeOffer) {
    try {
      await api.post(`/trades/${id}/offers/${offer.id}/refuse`);
      await loadTrade();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur.");
    }
  }

  async function withdraw() {
    try {
      await api.post(`/trades/${id}/withdraw`);
      await loadTrade();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur.");
    }
  }

  if (dataLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 rounded" style={{ background: "#E8E4DF", width: "50%" }} />
        <div className="card h-40" style={{ background: "#E8E4DF" }} />
      </main>
    );
  }

  if (!trade) return null;

  const isInitiator = user?.id === trade.initiator_id;
  const isSeller = trade.listing && user?.id === trade.listing.seller_id;
  const canNegotiate = ["estimation_done", "in_negotiation"].includes(trade.status);
  const lastOffer = trade.offers?.[trade.offers.length - 1];
  const pendingOffer = trade.offers?.find((o) => o.status === "pending");
  const myTurnToOffer = !pendingOffer || pendingOffer?.offered_by !== user?.id;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/trades" className="text-sm mb-6 block" style={{ color: "#8A99AA" }}>
        ← Mes trocs
      </Link>

      {/* Status header */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} style={{ color: "#00D084" }} />
            <h1 className="font-bold text-lg" style={{ color: "#0B1A2B" }}>Troc #{trade.id}</h1>
          </div>
          <Badge variant={STATUS_VARIANTS[trade.status] || "ink"}>
            {STATUS_LABELS[trade.status] || trade.status}
          </Badge>
        </div>

        {/* Phones comparison */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl" style={{ background: "rgba(11,26,43,0.04)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#8A99AA" }}>
              {isInitiator ? "Votre iPhone" : "iPhone proposé"}
            </p>
            <p className="font-semibold" style={{ color: "#0B1A2B" }}>
              {trade.initiator_iphone_model}
            </p>
            <p className="text-xs" style={{ color: "#8A99AA" }}>
              {trade.initiator_capacity} Go · {CONDITION_LABELS[trade.initiator_condition]}
            </p>
            {trade.platform_estimated_value && (
              <p className="font-mono font-bold mt-1" style={{ color: "#0B1A2B" }}>
                {formatPrice(trade.platform_estimated_value)}
              </p>
            )}
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(0,208,132,0.06)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#8A99AA" }}>
              {isSeller ? "Votre iPhone" : "iPhone ciblé"}
            </p>
            {trade.listing ? (
              <>
                <p className="font-semibold" style={{ color: "#0B1A2B" }}>{trade.listing.iphone_model}</p>
                <p className="text-xs" style={{ color: "#8A99AA" }}>
                  {trade.listing.capacity} Go · {CONDITION_LABELS[trade.listing.condition]}
                </p>
                <p className="font-mono font-bold mt-1" style={{ color: "#0B1A2B" }}>
                  {formatPrice(trade.listing.asking_price)}
                </p>
              </>
            ) : (
              <p className="text-xs" style={{ color: "#8A99AA" }}>Annonce #</p>
            )}
          </div>
        </div>

        {/* AI suggestion */}
        {trade.ai_suggested_soulte !== null && trade.ai_suggested_soulte !== undefined && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl mt-3"
            style={{ background: "rgba(0,208,132,0.06)" }}
          >
            <Sparkles size={14} style={{ color: "#00D084" }} />
            <p className="text-sm" style={{ color: "#0B1A2B" }}>
              Soulte suggérée par l&apos;IA :{" "}
              <span className="font-bold font-mono">{formatPrice(trade.ai_suggested_soulte)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Offers history */}
      {trade.offers && trade.offers.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Historique des offres</h2>
          <div className="space-y-3">
            {trade.offers.map((offer) => {
              const isMyOffer = offer.offered_by === user?.id;
              return (
                <div
                  key={offer.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: isMyOffer ? "rgba(11,26,43,0.04)" : "rgba(0,208,132,0.06)",
                  }}
                >
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: "#8A99AA" }}>
                      {isMyOffer ? "Vous" : offer.offeredBy?.full_name || "Autre partie"} · Tour {offer.round_number}
                    </p>
                    <p className="font-bold font-mono" style={{ color: "#0B1A2B" }}>
                      Soulte : {formatPrice(offer.soulte_amount)}
                    </p>
                    <p className="text-xs" style={{ color: "#8A99AA" }}>{formatDate(offer.created_at)}</p>
                  </div>
                  <Badge variant={
                    offer.status === "accepted" ? "signal" :
                    offer.status === "refused" ? "error" :
                    offer.status === "countered" ? "ink" : "warning"
                  }>
                    {offer.status === "accepted" ? "Acceptée" :
                     offer.status === "refused" ? "Refusée" :
                     offer.status === "countered" ? "Contrée" : "En attente"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending offer actions */}
      {pendingOffer && pendingOffer.offered_by !== user?.id && canNegotiate && (
        <div
          className="card p-5 mb-6"
          style={{ border: "1px solid rgba(0,208,132,0.3)" }}
        >
          <p className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>
            Offre reçue : {formatPrice(pendingOffer.soulte_amount)} de soulte
          </p>
          <p className="text-sm mb-4" style={{ color: "#8A99AA" }}>
            {pendingOffer.offeredBy?.full_name} propose cette soulte. Acceptez ou refusez.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => acceptOffer(pendingOffer)}>
              <CheckCircle size={16} />
              Accepter
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => refuseOffer(pendingOffer)}>
              <XCircle size={16} />
              Refuser
            </Button>
          </div>
        </div>
      )}

      {/* Make offer */}
      {canNegotiate && myTurnToOffer && !pendingOffer && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>Faire une offre</h2>
          <p className="text-xs mb-4" style={{ color: "#8A99AA" }}>
            Maximum 3 offres par partie. Une soulte positive = vous payez la différence.
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="Montant de soulte (FCFA)"
              type="number"
              value={soulteAmount}
              onChange={(e) => setSoulteAmount(e.target.value)}
            />
            <Button loading={offerLoading} onClick={makeOffer}>
              Envoyer
            </Button>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: "#CC0000" }}>{error}</p>}
        </div>
      )}

      {/* Withdraw */}
      {isInitiator && ["estimation_done", "in_negotiation"].includes(trade.status) && (
        <button
          className="w-full text-sm font-medium py-3 rounded-full border transition-colors"
          style={{ borderColor: "rgba(204,0,0,0.2)", color: "#CC0000" }}
          onClick={withdraw}
        >
          Annuler ma proposition
        </button>
      )}

      {/* Final state */}
      {trade.status === "agreed" && (
        <div
          className="card p-5 text-center"
          style={{ border: "1px solid rgba(0,208,132,0.3)", background: "rgba(0,208,132,0.04)" }}
        >
          <CheckCircle size={32} className="mx-auto mb-3" style={{ color: "#00D084" }} />
          <p className="font-bold" style={{ color: "#0B1A2B" }}>Accord trouvé !</p>
          <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>
            Les deux iPhones vont être expertisés par notre équipe avant finalisation.
          </p>
        </div>
      )}
    </main>
  );
}
