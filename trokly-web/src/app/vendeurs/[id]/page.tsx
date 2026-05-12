"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import ListingCard from "@/components/listings/ListingCard";
import { BadgeCheck, Shield, Calendar, TrendingUp, Package } from "lucide-react";
import { Listing } from "@/lib/types";

interface SellerData {
  seller: {
    id: number;
    full_name: string;
    member_since: string;
    is_kyc_verified: boolean;
    listing_credits: number;
  };
  stats: {
    active_listings: number;
    total_sales: number;
    sales_last_6months: number;
  };
  listings: Listing[];
}

export default function SellerProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sellers/${id}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return null;

  if (!data) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p style={{ color: "#8A99AA" }}>Vendeur introuvable.</p>
      </main>
    );
  }

  const { seller, stats, listings } = data;
  const memberSince = new Date(seller.member_since).getFullYear();

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">

      {/* Header vendeur */}
      <div className="card p-6 mb-8 flex items-start gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
          style={{ background: "#0B1A2B", color: "#00D084" }}
        >
          {seller.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold" style={{ color: "#0B1A2B" }}>{seller.full_name}</h1>
            {seller.is_kyc_verified && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#0B1A2B", color: "#00D084" }}>
                <BadgeCheck size={11} /> Vendeur vérifié
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs mb-4" style={{ color: "#8A99AA" }}>
            <Calendar size={11} /> Membre depuis {memberSince}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl" style={{ background: "rgba(0,208,132,0.07)" }}>
              <p className="text-xl font-black" style={{ color: "#0B1A2B" }}>{stats.active_listings}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                <Package size={10} className="inline mr-1" />
                Annonces actives
              </p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: "rgba(0,208,132,0.07)" }}>
              <p className="text-xl font-black" style={{ color: "#0B1A2B" }}>{stats.sales_last_6months}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                <TrendingUp size={10} className="inline mr-1" />
                Ventes (6 mois)
              </p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: "rgba(0,208,132,0.07)" }}>
              <p className="text-xl font-black" style={{ color: "#0B1A2B" }}>{stats.total_sales}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                <Shield size={10} className="inline mr-1" />
                Total ventes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Annonces */}
      <h2 className="font-bold text-lg mb-4" style={{ color: "#0B1A2B" }}>
        Annonces actives ({listings.length})
      </h2>

      {listings.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: "#8A99AA" }}>
          Ce vendeur n'a pas d'annonces actives pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </main>
  );
}
