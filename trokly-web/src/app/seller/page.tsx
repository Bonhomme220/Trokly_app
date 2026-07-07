"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, PaginatedResponse } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Subscription } from "@/lib/types";
import {
  Package, TrendingUp, Eye, Plus, Clock, CheckCircle,
  BadgeCheck, CreditCard, Zap, EyeOff, CheckSquare, Gift, Tag, Pencil, RefreshCw, Crown, ChevronRight
} from "lucide-react";

type Tab = "overview" | "listings";

const STATUS_MAP: Record<string, { label: string; variant: "signal" | "ink" | "warning" | "error" }> = {
  pending_expertise: { label: "En attente d'expertise", variant: "warning" },
  under_expertise:   { label: "Expertise en cours",    variant: "warning" },
  published:         { label: "En ligne",              variant: "signal" },
  sold:              { label: "Vendu",                 variant: "ink" },
  rejected:          { label: "Refusé",                variant: "error" },
  draft:             { label: "Paiement requis",       variant: "error" },
  unpublished:       { label: "Dépublié",              variant: "ink" },
};

function SellerDashboardInner() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState(searchParams.get("listing_published") ? "Annonce publiée avec succès !" : "");
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [ambassadorCode, setAmbassadorCode] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadListings();
    api.get("/ambassador/me").then(r => {
      if (r.data.is_ambassador) {
        setIsAmbassador(true);
        setAmbassadorCode(r.data.code);
      }
    }).catch(() => {});
    api.get<{ subscription: Subscription | null }>("/subscription/me")
      .then(r => setSubscription(r.data.subscription))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function loadListings() {
    setDataLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Listing>>("/my/listings");
      setListings(res.data.data || []);
    } finally {
      setDataLoading(false);
    }
  }

  async function markSold(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/listings/${id}/mark-sold`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "sold" as const } : l));
    } finally {
      setActionLoading(null);
    }
  }

  async function unpublish(id: number) {
    setActionLoading(id);
    try {
      await api.delete(`/listings/${id}`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "unpublished" as const } : l));
    } finally {
      setActionLoading(null);
    }
  }

  async function republish(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/listings/${id}/republish`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "published" as const } : l));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  async function relaunchPayment(listing: Listing) {
    setActionLoading(listing.id);
    try {
      const res = await api.post(`/payments/${listing.id}/initiate`);
      if (res.data.payment_url) window.location.href = res.data.payment_url;
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || !user) return null;

  const published = listings.filter(l => l.status === "published");
  const pending   = listings.filter(l => ["pending_expertise", "under_expertise"].includes(l.status));
  const sold      = listings.filter(l => l.status === "sold");
  const drafts    = listings.filter(l => l.status === "draft" && l.payment_status === "pending_payment");

  const credits = user.listing_credits ?? 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: "#0B1A2B", color: "#00D084" }}>
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#0B1A2B" }}>{user.full_name}</h1>
            <p className="text-sm" style={{ color: "#8A99AA" }}>{user.email}</p>
          </div>
        </div>
        <Link href="/listings/new">
          <Button size="sm"><Plus size={14} /> Nouvelle annonce</Button>
        </Link>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-2 text-sm font-medium"
          style={{ background: "rgba(0,208,132,0.12)", color: "#00B070" }}>
          <CheckCircle size={16} /> {successMsg}
          <button className="ml-auto text-xs opacity-60" onClick={() => setSuccessMsg("")}>✕</button>
        </div>
      )}

      {/* Badge ambassadeur */}
      {isAmbassador && ambassadorCode && (
        <Link href="/ambassador">
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 transition-all hover:opacity-90 cursor-pointer"
            style={{ background: "rgba(11,26,43,0.04)", border: "1px solid rgba(11,26,43,0.1)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#0B1A2B" }}>
              <Tag size={16} style={{ color: "#00D084" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>
                Vous êtes ambassadeur Trokly 🤝
              </p>
              <p className="text-xs" style={{ color: "#8A99AA" }}>
                Code : <strong style={{ color: "#0B1A2B", letterSpacing: "0.05em" }}>{ambassadorCode}</strong> · Voir mes commissions →
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Abonnement Pro */}
      {subscription?.status === "active" ? (
        <Link href="/abonnement">
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 transition-all hover:opacity-90 cursor-pointer"
            style={{ background: "#0B1A2B", border: "none" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,208,132,0.15)" }}>
              <Crown size={16} style={{ color: "#00D084" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "white" }}>
                Abonnement Pro actif 🎉
              </p>
              <p className="text-xs" style={{ color: "rgba(247,245,240,0.5)" }}>
                Expire le {new Date(subscription.expires_at).toLocaleDateString("fr-FR")} · Annonces illimitées
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: "rgba(0,208,132,0.15)", color: "#00D084" }}>
              PRO
            </span>
          </div>
        </Link>
      ) : (
        <Link href="/abonnement">
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 transition-all hover:opacity-90 cursor-pointer"
            style={{ background: "rgba(11,26,43,0.03)", border: "1px solid rgba(11,26,43,0.08)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(11,26,43,0.07)" }}>
              <Crown size={16} style={{ color: "#0B1A2B" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>Passer à Trokly Pro</p>
              <p className="text-xs" style={{ color: "#8A99AA" }}>
                4 999 FCFA/mois · Annonces illimitées + badge Vendeur vérifié
              </p>
            </div>
            <ChevronRight size={15} style={{ color: "#8A99AA" }} />
          </div>
        </Link>
      )}

      {/* Crédit offert */}
      {credits > 0 && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <Gift size={18} style={{ color: "#F59E0B" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>
              {credits} crédit{credits > 1 ? "s" : ""} offert{credits > 1 ? "s" : ""} disponible{credits > 1 ? "s" : ""}
            </p>
            <p className="text-xs" style={{ color: "#8A99AA" }}>
              −499 FCFA sur une annonce iPhone vérifié ou Vendeur vérifié : vous ne payez que la différence.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {([
          { key: "overview", label: "Vue d'ensemble", icon: TrendingUp },
          { key: "listings", label: `Mes annonces (${listings.length})`, icon: Package },
        ] as { key: Tab; label: string; icon: typeof TrendingUp }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: tab === key ? "#0B1A2B" : "rgba(11,26,43,0.06)",
              color: tab === key ? "#00D084" : "#0B1A2B",
            }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse" style={{ background: "#E8E4DF" }} />)}
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Package,     label: "En ligne",       value: published.length, color: "#00B070" },
                  { icon: Clock,       label: "En expertise",   value: pending.length,   color: "#B8860B" },
                  { icon: CheckCircle, label: "Vendus",         value: sold.length,      color: "#0B1A2B" },
                  { icon: CreditCard,  label: "À payer",        value: drafts.length,    color: "#CC0000" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="card p-4">
                    <Icon size={16} className="mb-2" style={{ color: "#8A99AA" }} />
                    <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Annonces en attente de paiement */}
              {drafts.length > 0 && (
                <div>
                  <h2 className="font-semibold mb-3" style={{ color: "#CC0000" }}>
                    Paiement requis ({drafts.length})
                  </h2>
                  <div className="space-y-2">
                    {drafts.map(l => (
                      <div key={l.id} className="card p-4 flex items-center gap-4"
                        style={{ border: "1px solid rgba(204,0,0,0.2)" }}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
                          {l.photos?.[0] ? <img src={l.photos[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">📱</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
                            {l.iphone_model} {l.capacity} Go
                          </p>
                          <p className="text-xs" style={{ color: "#8A99AA" }}>{formatPrice(l.asking_price)}</p>
                        </div>
                        <Button size="sm" loading={actionLoading === l.id} onClick={() => relaunchPayment(l)}>
                          <CreditCard size={13} /> Payer
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Annonces récentes */}
              {published.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold" style={{ color: "#0B1A2B" }}>Annonces en ligne</h2>
                    <button onClick={() => setTab("listings")} className="text-sm font-medium" style={{ color: "#00B070" }}>
                      Voir tout →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {published.slice(0, 3).map(l => <ListingRow key={l.id} listing={l} />)}
                  </div>
                </div>
              )}

              {listings.length === 0 && (
                <div className="card p-8 text-center">
                  <Package size={36} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
                  <p className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Aucune annonce</p>
                  <p className="text-sm mb-4" style={{ color: "#8A99AA" }}>Déposez votre premier iPhone pour commencer à vendre.</p>
                  <Link href="/listings/new"><Button>Déposer un iPhone</Button></Link>
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
              ) : listings.map(l => (
                <div key={l.id} className="card p-4">
                  <ListingRow listing={l} />
                  <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(11,26,43,0.08)" }}>
                    {/* Paiement requis */}
                    {l.status === "draft" && l.payment_status === "pending_payment" && (
                      <Button size="sm" loading={actionLoading === l.id} onClick={() => relaunchPayment(l)}>
                        <CreditCard size={13} /> Finaliser le paiement
                      </Button>
                    )}
                    {/* Expertise en attente — info */}
                    {l.status === "pending_expertise" && (
                      <p className="text-xs w-full py-1.5 px-3 rounded-lg"
                        style={{ background: "rgba(184,134,11,0.08)", color: "#B8860B" }}>
                        ⏳ Un expert va vous contacter sur WhatsApp pour fixer un rendez-vous de vérification.
                      </p>
                    )}
                    {/* Expertise en cours — info */}
                    {l.status === "under_expertise" && (
                      <p className="text-xs w-full py-1.5 px-3 rounded-lg"
                        style={{ background: "rgba(184,134,11,0.08)", color: "#B8860B" }}>
                        🔍 Expertise en cours — votre annonce sera publiée dès validation par l'expert.
                      </p>
                    )}
                    {/* Annonce vendue */}
                    {l.status === "sold" && (
                      <p className="text-xs w-full py-1.5 px-3 rounded-lg"
                        style={{ background: "rgba(0,176,112,0.08)", color: "#00B070" }}>
                        ✅ Annonce vendue — félicitations !
                      </p>
                    )}
                    {/* Rejeté — info */}
                    {l.status === "rejected" && (
                      <p className="text-xs w-full py-1.5 px-3 rounded-lg"
                        style={{ background: "rgba(204,0,0,0.07)", color: "#CC0000" }}>
                        ❌ Annonce refusée à l'expertise. Modifiez-la et relancez un paiement, ou utilisez votre crédit.
                      </p>
                    )}
                    {/* Modifier */}
                    {["published", "unpublished", "draft", "rejected"].includes(l.status) && (
                      <Link href={`/listings/${l.id}/edit`} className="flex-shrink-0">
                        <Button size="sm" variant="ghost" style={{ color: "#0B1A2B" }}>
                          <Pencil size={13} /> Modifier
                        </Button>
                      </Link>
                    )}
                    {/* Marquer vendu */}
                    {l.status === "published" && (
                      <Button size="sm" variant="ghost"
                        loading={actionLoading === l.id}
                        onClick={() => markSold(l.id)}
                        style={{ color: "#00B070" }}>
                        <CheckSquare size={13} /> Marquer vendu
                      </Button>
                    )}
                    {/* Republier */}
                    {l.status === "unpublished" && (
                      <Button size="sm" variant="ghost"
                        loading={actionLoading === l.id}
                        onClick={() => republish(l.id)}
                        style={{ color: "#00B070" }}>
                        <RefreshCw size={13} /> Republier
                      </Button>
                    )}
                    {/* Voir l'annonce */}
                    {l.status === "published" && (
                      <Link href={`/listings/${l.id}`} className="flex-shrink-0">
                        <Button size="sm" variant="ghost">
                          <Eye size={13} /> Voir
                        </Button>
                      </Link>
                    )}
                    {/* TOP boost */}
                    {l.status === "published" && !l.is_boosted && (
                      <Button size="sm" variant="ghost" style={{ color: "#F59E0B" }}>
                        <Zap size={13} /> Passer en TOP
                      </Button>
                    )}
                    {l.is_boosted && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                        <Zap size={11} /> TOP actif
                      </span>
                    )}
                    {/* Dépublier */}
                    {l.status === "published" && (
                      <Button size="sm" variant="ghost" className="ml-auto"
                        loading={actionLoading === l.id}
                        onClick={() => unpublish(l.id)}
                        style={{ color: "#8A99AA" }}>
                        <EyeOff size={13} /> Dépublier
                      </Button>
                    )}
                    {/* Plan badge */}
                    {l.plan && l.plan !== "basic" && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ml-auto"
                        style={{
                          background: l.plan === "verified_seller" ? "rgba(11,26,43,0.08)" : "rgba(0,176,112,0.1)",
                          color: l.plan === "verified_seller" ? "#0B1A2B" : "#00B070",
                        }}>
                        <BadgeCheck size={11} />
                        {l.plan === "verified_seller" ? "Vendeur vérifié" : "iPhone vérifié"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const s = STATUS_MAP[listing.status] ?? { label: listing.status, variant: "ink" as const };
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
        {listing.photos?.[0]
          ? <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-lg">📱</div>}
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
          {listing.expires_at && listing.status === "published" && (
            <span className="text-xs" style={{ color: "#8A99AA" }}>
              · expire le {new Date(listing.expires_at).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="font-bold text-sm font-mono" style={{ color: "#0B1A2B" }}>{formatPrice(listing.asking_price)}</p>
        <Badge variant={s.variant}>{s.label}</Badge>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  return (
    <Suspense>
      <SellerDashboardInner />
    </Suspense>
  );
}
