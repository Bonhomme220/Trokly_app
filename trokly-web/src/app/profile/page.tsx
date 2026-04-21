"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, Wallet, PaginatedResponse } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Package, Wallet as WalletIcon, LogOut } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending_expertise: "En attente d'expertise",
  under_expertise: "Expertise en cours",
  published: "Publiée",
  sold: "Vendue",
  rejected: "Refusée",
  draft: "Brouillon",
  unpublished: "Dépubliée",
};

const STATUS_VARIANTS: Record<string, "signal" | "ink" | "warning" | "error"> = {
  pending_expertise: "warning",
  under_expertise: "warning",
  published: "signal",
  sold: "ink",
  rejected: "error",
  draft: "ink",
  unpublished: "ink",
};

type Tab = "listings" | "wallet";

export default function ProfilePage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (tab === "listings") {
      setDataLoading(true);
      api
        .get<PaginatedResponse<Listing>>("/my/listings")
        .then((res) => setListings(res.data.data))
        .finally(() => setDataLoading(false));
    } else {
      setDataLoading(true);
      api
        .get<{ wallet: Wallet }>("/wallet")
        .then((res) => setWallet(res.data.wallet))
        .finally(() => setDataLoading(false));
    }
  }, [tab, isAuthenticated]);

  if (loading || !user) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-16 rounded-[18px]" style={{ background: "#E8E4DF" }} />
        <div className="h-40 rounded-[18px]" style={{ background: "#E8E4DF" }} />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: "#0B1A2B", color: "#00D084" }}
          >
            {user.full_name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: "#0B1A2B" }}>{user.full_name}</p>
            <p className="text-sm font-mono" style={{ color: "#8A99AA" }}>{user.phone}</p>
          </div>
        </div>
        <button
          className="p-2 rounded-full opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: "#0B1A2B" }}
          onClick={() => { logout(); router.push("/"); }}
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-full p-1 mb-6"
        style={{ background: "rgba(11,26,43,0.06)" }}
      >
        {[
          { key: "listings", label: "Mes annonces", icon: Package },
          { key: "wallet", label: "Portefeuille", icon: WalletIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: tab === key ? "#0B1A2B" : "transparent",
              color: tab === key ? "#00D084" : "#0B1A2B",
            }}
            onClick={() => setTab(key as Tab)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {tab === "listings" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium" style={{ color: "#8A99AA" }}>
              {listings.length} annonce{listings.length !== 1 ? "s" : ""}
            </p>
            <Link href="/listings/new">
              <Button size="sm">+ Nouvelle annonce</Button>
            </Link>
          </div>

          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-20 animate-pulse" style={{ background: "#E8E4DF" }} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-semibold" style={{ color: "#0B1A2B" }}>Aucune annonce</p>
              <p className="text-sm mt-1 mb-4" style={{ color: "#8A99AA" }}>
                Vendez votre premier iPhone sur Trokly.
              </p>
              <Link href="/listings/new">
                <Button>Mettre en vente</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <div className="card p-4 flex items-center gap-4 hover:border-opacity-20 transition-all">
                    <div
                      className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ background: "#F0EDE8" }}
                    >
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📱</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "#0B1A2B" }}>
                        {listing.iphone_model} {listing.capacity} Go
                      </p>
                      <p className="text-xs" style={{ color: "#8A99AA" }}>
                        {formatDate(listing.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="font-bold text-sm font-mono" style={{ color: "#0B1A2B" }}>
                        {formatPrice(listing.asking_price)}
                      </p>
                      <Badge variant={STATUS_VARIANTS[listing.status] || "ink"}>
                        {STATUS_LABELS[listing.status] || listing.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wallet tab */}
      {tab === "wallet" && (
        <div>
          {dataLoading ? (
            <div className="card h-40 animate-pulse" style={{ background: "#E8E4DF" }} />
          ) : wallet ? (
            <>
              {/* Balance cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="card p-4" style={{ background: "#0B1A2B" }}>
                  <p className="text-xs mb-1" style={{ color: "rgba(247,245,240,0.5)" }}>Solde disponible</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: "#00D084" }}>
                    {formatPrice(wallet.balance)}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="text-xs mb-1" style={{ color: "#8A99AA" }}>En attente</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: "#0B1A2B" }}>
                    {formatPrice(wallet.pending_balance)}
                  </p>
                </div>
              </div>

              <Link href="/wallet/withdraw">
                <Button variant="secondary" className="w-full mb-6">
                  Retirer vers MoMo
                </Button>
              </Link>

              {/* Transactions */}
              <div>
                <p className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>Historique</p>
                {wallet.wallet_transactions?.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "#8A99AA" }}>
                    Aucune transaction pour le moment.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {wallet.wallet_transactions?.map((tx) => (
                      <div key={tx.id} className="card p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>
                            {tx.description}
                          </p>
                          <p className="text-xs" style={{ color: "#8A99AA" }}>
                            {formatDate(tx.created_at)}
                          </p>
                        </div>
                        <p
                          className="font-bold font-mono text-sm"
                          style={{ color: tx.type === "credit" ? "#00B070" : "#CC0000" }}
                        >
                          {tx.type === "credit" ? "+" : "-"}{formatPrice(tx.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: "#8A99AA" }}>
              Impossible de charger le portefeuille.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
