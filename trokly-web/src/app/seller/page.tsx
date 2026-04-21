"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, Wallet, PaginatedResponse, Trade, Transaction } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  Package, Wallet as WalletIcon, ArrowLeftRight,
  TrendingUp, Eye, Plus, Clock, CheckCircle, ChevronRight,
  ShoppingBag, Zap, EyeOff, Pencil
} from "lucide-react";

type Tab = "overview" | "listings" | "wallet" | "trades" | "purchases" | "sales";

const LISTING_STATUS: Record<string, { label: string; variant: "signal" | "ink" | "warning" | "error" }> = {
  pending_expertise: { label: "En attente d'expertise", variant: "warning" },
  under_expertise:   { label: "Expertise en cours", variant: "warning" },
  published:         { label: "En ligne", variant: "signal" },
  sold:              { label: "Vendu", variant: "ink" },
  rejected:          { label: "Refusé", variant: "error" },
  draft:             { label: "Brouillon", variant: "ink" },
  unpublished:       { label: "Dépublié", variant: "ink" },
};

export default function SellerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAuthenticated]);

  async function loadTabData() {
    setDataLoading(true);
    try {
      if (tab === "overview" || tab === "listings") {
        const res = await api.get<PaginatedResponse<Listing>>("/my/listings");
        setListings(res.data.data || []);
      }
      if (tab === "overview" || tab === "wallet") {
        const res = await api.get<{ wallet: Wallet }>("/wallet");
        setWallet(res.data.wallet);
      }
      if (tab === "overview" || tab === "trades") {
        const res = await api.get("/my/trades").catch(() => ({ data: { data: [] } }));
        setTrades(res.data.data || []);
      }
      if (tab === "purchases") {
        const res = await api.get("/my/purchases").catch(() => ({ data: { data: [] } }));
        setPurchases(res.data.data || res.data || []);
      }
      if (tab === "sales") {
        const res = await api.get("/my/sales").catch(() => ({ data: { data: [] } }));
        setSales(res.data.data || res.data || []);
      }
    } finally {
      setDataLoading(false);
    }
  }

  async function unpublishListing(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/listings/${id}/unpublish`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "unpublished" as const } : l));
    } finally {
      setActionLoading(null);
    }
  }

  async function boostListing(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/listings/${id}/boost`, { days: 7 });
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_boosted: true } : l));
    } catch {
      // boost may require payment — fail silently
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || !user) return null;

  const published = listings.filter((l) => l.status === "published");
  const pending = listings.filter((l) => ["pending_expertise", "under_expertise"].includes(l.status));
  const sold = listings.filter((l) => l.status === "sold");
  const activeTrades = trades.filter((t) => ["estimation_done", "in_negotiation"].includes(t.status));

  const TABS = [
    { key: "overview", label: "Accueil", icon: TrendingUp },
    { key: "listings", label: "Annonces", icon: Package },
    { key: "wallet", label: "Portefeuille", icon: WalletIcon },
    { key: "trades", label: "Trocs", icon: ArrowLeftRight, badge: activeTrades.length },
    { key: "purchases", label: "Achats", icon: ShoppingBag },
    { key: "sales", label: "Ventes", icon: CheckCircle },
  ] as { key: Tab; label: string; icon: typeof TrendingUp; badge?: number }[];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: "#0B1A2B", color: "#00D084" }}
          >
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#0B1A2B" }}>{user.full_name}</h1>
            <p className="text-sm font-mono" style={{ color: "#8A99AA" }}>{user.phone}</p>
          </div>
        </div>
        <Link href="/listings/new">
          <Button size="sm">
            <Plus size={14} />
            Nouvelle annonce
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: tab === key ? "#0B1A2B" : "rgba(11,26,43,0.06)",
              color: tab === key ? "#00D084" : "#0B1A2B",
            }}
          >
            <Icon size={15} />
            {label}
            {badge ? (
              <span
                className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: "#00D084", color: "#0B1A2B" }}
              >
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse" style={{ background: "#E8E4DF" }} />)}
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Package, label: "En ligne", value: published.length, color: "#00B070" },
                  { icon: Clock, label: "En attente", value: pending.length, color: "#B8860B" },
                  { icon: CheckCircle, label: "Vendus", value: sold.length, color: "#0B1A2B" },
                  { icon: ArrowLeftRight, label: "Trocs actifs", value: activeTrades.length, color: "#0B1A2B" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="card p-4">
                    <Icon size={16} className="mb-2" style={{ color: "#8A99AA" }} />
                    <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Wallet preview */}
              {wallet && (
                <div className="card p-5" style={{ background: "#0B1A2B" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <WalletIcon size={16} style={{ color: "#00D084" }} />
                      <p className="text-sm font-semibold" style={{ color: "rgba(247,245,240,0.6)" }}>Mon portefeuille</p>
                    </div>
                    <button onClick={() => setTab("wallet")} className="text-xs font-medium" style={{ color: "#00D084" }}>
                      Voir tout →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs mb-1" style={{ color: "rgba(247,245,240,0.4)" }}>Disponible</p>
                      <p className="text-2xl font-bold font-mono" style={{ color: "#00D084" }}>
                        {formatPrice(wallet.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: "rgba(247,245,240,0.4)" }}>En attente</p>
                      <p className="text-2xl font-bold font-mono" style={{ color: "rgba(247,245,240,0.5)" }}>
                        {formatPrice(wallet.pending_balance)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent listings */}
              {listings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold" style={{ color: "#0B1A2B" }}>Mes annonces récentes</h2>
                    <button onClick={() => setTab("listings")} className="text-sm font-medium" style={{ color: "#00B070" }}>
                      Voir tout →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {listings.slice(0, 3).map((l) => <ListingRow key={l.id} listing={l} />)}
                  </div>
                </div>
              )}

              {listings.length === 0 && (
                <div className="card p-8 text-center">
                  <Package size={36} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
                  <p className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Aucune annonce</p>
                  <p className="text-sm mb-4" style={{ color: "#8A99AA" }}>Déposez votre premier iPhone pour commencer à vendre.</p>
                  <Link href="/listings/new">
                    <Button>Déposer un iPhone</Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── LISTINGS ── */}
          {tab === "listings" && (
            <div className="space-y-3">
              {listings.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Aucune annonce</p>
                  <Link href="/listings/new"><Button>Déposer un iPhone</Button></Link>
                </div>
              ) : (
                listings.map((l) => (
                  <div key={l.id} className="card p-4">
                    <ListingRow listing={l} />
                    {l.status === "published" && (
                      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(11,26,43,0.08)" }}>
                        <Link href={`/listings/${l.id}/edit`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full">
                            <Pencil size={13} /> Modifier
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1"
                          loading={actionLoading === l.id}
                          onClick={() => boostListing(l.id)}
                          style={l.is_boosted ? { color: "#00B070" } : {}}
                        >
                          <Zap size={13} /> {l.is_boosted ? "Boosté" : "Booster"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1"
                          loading={actionLoading === l.id}
                          onClick={() => unpublishListing(l.id)}
                          style={{ color: "#8A99AA" }}
                        >
                          <EyeOff size={13} /> Dépublier
                        </Button>
                      </div>
                    )}
                    {l.status !== "published" && (
                      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(11,26,43,0.08)" }}>
                        <Link href={`/listings/${l.id}/edit`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full">
                            <Pencil size={13} /> Modifier
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── WALLET ── */}
          {tab === "wallet" && wallet && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-5" style={{ background: "#0B1A2B" }}>
                  <p className="text-xs mb-1" style={{ color: "rgba(247,245,240,0.5)" }}>Disponible</p>
                  <p className="text-3xl font-bold font-mono" style={{ color: "#00D084" }}>{formatPrice(wallet.balance)}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs mb-1" style={{ color: "#8A99AA" }}>En attente</p>
                  <p className="text-3xl font-bold font-mono" style={{ color: "#0B1A2B" }}>{formatPrice(wallet.pending_balance)}</p>
                </div>
              </div>
              <Link href="/wallet/withdraw" className="block">
                <Button variant="secondary" className="w-full">
                  <WalletIcon size={15} /> Retirer vers MoMo
                </Button>
              </Link>
              <div>
                <p className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>Historique</p>
                {!wallet.wallet_transactions?.length ? (
                  <p className="text-sm text-center py-8" style={{ color: "#8A99AA" }}>Aucune transaction.</p>
                ) : wallet.wallet_transactions.map((tx) => (
                  <div key={tx.id} className="card p-3 mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>{tx.description}</p>
                      <p className="text-xs" style={{ color: "#8A99AA" }}>{formatDate(tx.created_at)}</p>
                    </div>
                    <p className="font-bold font-mono text-sm" style={{ color: tx.type === "credit" ? "#00B070" : "#CC0000" }}>
                      {tx.type === "credit" ? "+" : "-"}{formatPrice(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PURCHASES ── */}
          {tab === "purchases" && (
            <div className="space-y-3">
              {purchases.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag size={36} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
                  <p className="font-semibold" style={{ color: "#0B1A2B" }}>Aucun achat</p>
                  <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Vos achats apparaîtront ici.</p>
                </div>
              ) : purchases.map(tx => (
                <Link key={tx.id} href={`/transactions/${tx.id}`}>
                  <div className="card p-4 flex items-center gap-4 hover:shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
                      {tx.listing?.photos?.[0]
                        ? <img src={tx.listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">📱</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
                        {tx.listing ? `${tx.listing.iphone_model} ${tx.listing.capacity} Go` : `Transaction #${tx.id}`}
                      </p>
                      <p className="text-xs" style={{ color: "#8A99AA" }}>{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-bold text-sm font-mono" style={{ color: "#0B1A2B" }}>{formatPrice(tx.amount)}</p>
                      <Badge variant={tx.status === "completed" ? "signal" : tx.status === "pending" ? "warning" : "error"}>
                        {tx.status === "completed" ? "Livré" : tx.status === "pending" ? "En attente" : tx.status === "in_retraction" ? "Rétractation" : tx.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── SALES ── */}
          {tab === "sales" && (
            <div className="space-y-3">
              {sales.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle size={36} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
                  <p className="font-semibold" style={{ color: "#0B1A2B" }}>Aucune vente</p>
                  <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Vos ventes apparaîtront ici une fois vos annonces achetées.</p>
                </div>
              ) : sales.map(tx => (
                <Link key={tx.id} href={`/transactions/${tx.id}`}>
                  <div className="card p-4 flex items-center gap-4 hover:shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
                      {tx.listing?.photos?.[0]
                        ? <img src={tx.listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">📱</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
                        {tx.listing ? `${tx.listing.iphone_model} ${tx.listing.capacity} Go` : `Transaction #${tx.id}`}
                      </p>
                      <p className="text-xs" style={{ color: "#8A99AA" }}>{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-bold text-sm font-mono" style={{ color: "#00B070" }}>{formatPrice(tx.seller_net)}</p>
                      <Badge variant={tx.status === "completed" ? "signal" : tx.status === "pending" ? "warning" : "error"}>
                        {tx.status === "completed" ? "Complétée" : tx.status === "pending" ? "En attente" : tx.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── TRADES ── */}
          {tab === "trades" && (
            <div className="space-y-3">
              {trades.length === 0 ? (
                <div className="text-center py-16">
                  <ArrowLeftRight size={36} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
                  <p className="font-semibold" style={{ color: "#0B1A2B" }}>Aucun troc</p>
                </div>
              ) : trades.map((trade) => (
                <Link key={trade.id} href={`/trades/${trade.id}`}>
                  <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,208,132,0.1)" }}>
                      <ArrowLeftRight size={16} style={{ color: "#00B070" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
                        {trade.initiator_iphone_model} {trade.initiator_capacity} Go
                      </p>
                      <p className="text-xs" style={{ color: "#8A99AA" }}>{formatDate(trade.created_at)}</p>
                    </div>
                    <Badge variant={["estimation_done", "in_negotiation"].includes(trade.status) ? "warning" : trade.status === "agreed" ? "signal" : "ink"}>
                      {trade.status === "estimation_done" ? "Estimation" :
                       trade.status === "in_negotiation" ? "Négociation" :
                       trade.status === "agreed" ? "Accord" : trade.status}
                    </Badge>
                    <ChevronRight size={16} style={{ color: "#8A99AA" }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const s = LISTING_STATUS[listing.status] ?? { label: listing.status, variant: "ink" as const };
  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="card p-4 flex items-center gap-4 hover:shadow-sm transition-all">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
          {listing.photos?.[0] ? (
            <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">📱</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "#0B1A2B" }}>
            {listing.iphone_model} {listing.capacity} Go · {listing.color}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs" style={{ color: "#8A99AA" }}>{formatDate(listing.created_at)}</p>
            {listing.views_count > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#8A99AA" }}>
                <Eye size={10} /> {listing.views_count}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="font-bold text-sm font-mono" style={{ color: "#0B1A2B" }}>{formatPrice(listing.asking_price)}</p>
          <Badge variant={s.variant}>{s.label}</Badge>
        </div>
      </div>
    </Link>
  );
}
