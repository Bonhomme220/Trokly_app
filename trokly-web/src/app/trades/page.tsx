"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Trade } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  estimation_done: "Estimation faite",
  in_negotiation: "En négociation",
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

export default function TradesPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<{ data: Trade[] }>("/my/trades")
      .then((res) => setTrades(res.data.data || []))
      .finally(() => setDataLoading(false));
  }, [isAuthenticated]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#0B1A2B" }}>Mes trocs</h1>

      {dataLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-pulse" style={{ background: "#E8E4DF" }} />
          ))}
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-20">
          <ArrowLeftRight size={40} className="mx-auto mb-4 opacity-20" style={{ color: "#0B1A2B" }} />
          <p className="font-semibold" style={{ color: "#0B1A2B" }}>Aucun troc</p>
          <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>
            Trouvez un iPhone et proposez le vôtre en échange.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <Link key={trade.id} href={`/trades/${trade.id}`}>
              <div className="card p-4 flex items-center gap-4 hover:shadow-sm transition-all">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,208,132,0.1)" }}
                >
                  <ArrowLeftRight size={18} style={{ color: "#00B070" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#0B1A2B" }}>
                    {trade.initiator_iphone_model} {trade.initiator_capacity} Go
                  </p>
                  <p className="text-xs" style={{ color: "#8A99AA" }}>
                    {formatDate(trade.created_at)}
                    {trade.ai_suggested_soulte !== undefined && trade.ai_suggested_soulte !== null && (
                      <> · Soulte IA : {formatPrice(trade.ai_suggested_soulte)}</>
                    )}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[trade.status] || "ink"}>
                  {STATUS_LABELS[trade.status] || trade.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
