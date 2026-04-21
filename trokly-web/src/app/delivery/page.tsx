"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Delivery } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Truck, Package, CheckCircle, MapPin } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "signal" | "ink" | "warning" | "error" }> = {
  pending:    { label: "Non assigné",   variant: "ink" },
  assigned:   { label: "Assigné",       variant: "warning" },
  picked_up:  { label: "Récupéré",      variant: "warning" },
  delivered:  { label: "Livré",         variant: "signal" },
};

export default function DeliveryPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isDelivery = user?.roles?.some(r => ["delivery_agent", "admin", "super_admin"].includes(r));

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isDelivery)) router.push("/");
  }, [loading, isAuthenticated, isDelivery, router]);

  useEffect(() => {
    if (!isDelivery) return;
    api.get("/delivery/my-deliveries")
      .then(res => setDeliveries(res.data.data || res.data || []))
      .finally(() => setDataLoading(false));
  }, [isDelivery]);

  async function confirmPickup(delivery: Delivery) {
    setActionLoading(delivery.id);
    try {
      await api.post(`/delivery/deliveries/${delivery.id}/pickup`);
      setDeliveries(d => d.map(x => x.id === delivery.id ? { ...x, status: "picked_up" } : x));
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmDelivery(delivery: Delivery) {
    setActionLoading(delivery.id);
    try {
      await api.post(`/delivery/deliveries/${delivery.id}/deliver`);
      setDeliveries(d => d.map(x => x.id === delivery.id ? { ...x, status: "delivered" } : x));
    } finally {
      setActionLoading(null);
    }
  }

  const active = deliveries.filter(d => d.status !== "delivered");
  const done = deliveries.filter(d => d.status === "delivered");

  if (loading) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,208,132,0.1)" }}>
          <Truck size={20} style={{ color: "#00D084" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>Mes livraisons</h1>
          <p className="text-sm" style={{ color: "#8A99AA" }}>
            {dataLoading ? "Chargement…" : `${active.length} active${active.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {dataLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse" style={{ background: "#E8E4DF" }} />)}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-20">
          <Truck size={40} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
          <p className="font-semibold" style={{ color: "#0B1A2B" }}>Aucune livraison assignée</p>
          <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>L'admin vous assignera des livraisons prochainement.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#8A99AA" }}>En cours</p>
              <div className="space-y-3">
                {active.map(delivery => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    onPickup={confirmPickup}
                    onDeliver={confirmDelivery}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#8A99AA" }}>Terminées</p>
              <div className="space-y-3">
                {done.map(delivery => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    onPickup={confirmPickup}
                    onDeliver={confirmDelivery}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function DeliveryCard({ delivery, onPickup, onDeliver, actionLoading }: {
  delivery: Delivery;
  onPickup: (d: Delivery) => void;
  onDeliver: (d: Delivery) => void;
  actionLoading: number | null;
}) {
  const s = STATUS_MAP[delivery.status] ?? { label: delivery.status, variant: "ink" as const };
  const tx = delivery.transaction;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(11,26,43,0.06)" }}>
            <Package size={18} style={{ color: "#0B1A2B" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
              Livraison #{delivery.id}
            </p>
            <p className="text-xs" style={{ color: "#8A99AA" }}>
              Assignée le {formatDate(delivery.created_at)}
            </p>
          </div>
        </div>
        <Badge variant={s.variant}>{s.label}</Badge>
      </div>

      {tx && (
        <div className="p-3 rounded-xl mb-3 space-y-1" style={{ background: "rgba(11,26,43,0.03)" }}>
          {tx.listing && (
            <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>
              {tx.listing.iphone_model} {tx.listing.capacity} Go
            </p>
          )}
          <p className="text-xs font-mono font-semibold" style={{ color: "#0B1A2B" }}>
            {formatPrice(tx.amount)}
          </p>
          {tx.buyer && (
            <p className="text-xs flex items-center gap-1" style={{ color: "#8A99AA" }}>
              <MapPin size={10} /> Livrer à : {tx.buyer.full_name}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {delivery.status === "assigned" && (
          <Button size="sm" className="flex-1" loading={actionLoading === delivery.id} onClick={() => onPickup(delivery)}>
            <CheckCircle size={14} />
            Confirmer récupération
          </Button>
        )}
        {delivery.status === "picked_up" && (
          <Button size="sm" className="flex-1" loading={actionLoading === delivery.id} onClick={() => onDeliver(delivery)}>
            <Truck size={14} />
            Confirmer livraison
          </Button>
        )}
        {delivery.status === "delivered" && (
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#00B070" }}>
            <CheckCircle size={16} /> Livré le {delivery.delivered_at ? formatDate(delivery.delivered_at) : "—"}
          </div>
        )}
      </div>
    </div>
  );
}
