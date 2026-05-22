"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, User } from "@/lib/types";
import { formatDate, formatPrice, CONDITION_LABELS } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  LayoutDashboard, Package, Microscope, TrendingUp,
  CheckCircle, XCircle, ShoppingBag, Users, Clock,
  Ban, UserCheck, UserPlus, Shield, ListChecks, Phone, MapPin,
  BadgeCheck, Zap, Euro,
} from "lucide-react";

type Tab = "overview" | "revenue" | "listings" | "expertises" | "sellers" | "staff" | "leads";

interface AdminListing extends Listing {
  seller: { id: number; full_name: string };
}

interface AdminStats {
  revenue: { total: number; period: number; period_days: number };
  plans: {
    basic: { count: number; revenue: number };
    verified_phone: { count: number; revenue: number };
    verified_seller: { count: number; revenue: number };
  };
  boosts: { count: number; revenue: number };
  listings: { total: number; paid: number; published: number; pending_expertise: number; sold: number; draft: number };
  sellers: { total: number; new_this_month: number };
  chart: Array<{ date: string; label: string; revenue: number; listings: number }>;
}

interface AdminSeller {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
  is_active: boolean;
  kyc_status: string | null;
  listings_count: number;
  active: number;
  sold: number;
  total_spent: number;
  plans: { basic: number; verified_phone: number; verified_seller: number };
}

// ─── Mini bar chart (no dependency) ──────────────────────────────────────────
function RevenueChart({ data }: { data: Array<{ label: string; revenue: number }> }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.revenue), 1);
  const H = 160;

  const showLabel = (i: number) => {
    const n = data.length;
    if (n <= 10) return true;
    if (n <= 31) return i === 0 || i === n - 1 || i % 7 === 0;
    return i === 0 || i === n - 1 || i % 14 === 0;
  };

  return (
    <div>
      <div className="flex items-end gap-px" style={{ height: H }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex items-end relative"
            style={{ height: H }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && d.revenue > 0 && (
              <div className="absolute bottom-full mb-2 left-1/2 z-20 pointer-events-none"
                style={{ transform: "translateX(-50%)" }}>
                <div className="rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap shadow-lg"
                  style={{ background: "#0B1A2B", color: "#00D084" }}>
                  {formatPrice(d.revenue)}
                  <div className="text-xs font-normal opacity-60">{d.label}</div>
                </div>
                <div className="w-2 h-2 mx-auto -mt-1 rotate-45"
                  style={{ background: "#0B1A2B" }} />
              </div>
            )}
            <div
              className="w-full rounded-t transition-colors cursor-default"
              style={{
                height: `${Math.max((d.revenue / max) * (H - 8), d.revenue > 0 ? 3 : 2)}px`,
                background: hovered === i && d.revenue > 0
                  ? "#00B070"
                  : d.revenue > 0 ? "#00D084" : "rgba(11,26,43,0.07)",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-px mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center overflow-hidden">
            {showLabel(i) && (
              <span style={{ color: "#8A99AA", fontSize: 9 }}>{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Plan label helper ────────────────────────────────────────────────────────
const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  verified_phone: "iPhone vérifié",
  verified_seller: "Vendeur vérifié",
};
const PLAN_PRICES: Record<string, number> = {
  basic: 499,
  verified_phone: 1499,
  verified_seller: 2999,
};

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsDays, setStatsDays] = useState(30);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<{ id: number; full_name: string; phone_number: string; profile: string; city: string; has_iphone_to_sell: boolean; created_at: string }[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [staffForm, setStaffForm] = useState({ full_name: "", email: "", role: "expert" });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isSuperAdmin = user?.roles?.includes("super_admin");
  const isAdmin = user?.roles?.some(r => ["admin", "super_admin"].includes(r));
  const isExpert = user?.roles?.includes("expert");
  const canAccess = isAdmin || isExpert;

  useEffect(() => {
    if (!loading && (!isAuthenticated || !canAccess)) router.push("/");
  }, [loading, isAuthenticated, canAccess, router]);

  useEffect(() => {
    if (!canAccess) return;
    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, canAccess]);

  // Reload stats when period changes
  useEffect(() => {
    if (tab === "revenue" && canAccess) loadStats(statsDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsDays]);

  async function loadStats(days: number) {
    setDataLoading(true);
    try {
      const res = await api.get(`/admin/stats?days=${days}`);
      setStats(res.data);
    } finally {
      setDataLoading(false);
    }
  }

  async function loadTabData() {
    setDataLoading(true);
    try {
      if (tab === "overview") {
        const [lstRes] = await Promise.all([
          api.get("/admin/listings?per_page=100"),
        ]);
        setListings(lstRes.data.data || []);
      } else if (tab === "revenue") {
        await loadStats(statsDays);
      } else if (tab === "listings" || tab === "expertises") {
        const res = await api.get("/admin/listings?per_page=100");
        setListings(res.data.data || []);
      } else if (tab === "sellers") {
        const res = await api.get("/admin/sellers").catch(() => ({ data: { data: [] } }));
        setSellers(res.data.data || []);
      } else if ((tab as string) === "users") {
        const res = await api.get("/admin/users?per_page=100").catch(() => ({ data: { data: [] } }));
        setUsers(res.data.data || res.data || []);
      } else if (tab === "staff") {
        const res = await api.get("/admin/staff").catch(() => ({ data: { data: [] } }));
        setStaffList(res.data.data || []);
      } else if (tab === "leads") {
        const res = await api.get("/leads").catch(() => ({ data: { data: [] } }));
        setLeads(res.data.data || []);
      }
    } finally {
      setDataLoading(false);
    }
  }

  async function publishListing(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/listings/${id}/publish`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "published" as const } : l));
    } finally { setActionLoading(null); }
  }

  async function rejectListing(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/listings/${id}/reject`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "rejected" as const } : l));
    } finally { setActionLoading(null); }
  }

  async function createStaff() {
    setStaffError(""); setStaffSuccess("");
    if (!staffForm.full_name.trim() || !staffForm.email.trim()) return setStaffError("Nom et email requis.");
    setStaffLoading(true);
    try {
      const res = await api.post("/admin/staff", staffForm);
      setStaffSuccess(`Compte créé : ${res.data.user.full_name}`);
      setStaffForm({ full_name: "", email: "", role: "expert" });
      setStaffList(prev => [res.data.user, ...prev]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]?.[0]
        : err.response?.data?.message;
      setStaffError(msg || "Erreur lors de la création.");
    } finally { setStaffLoading(false); }
  }

  async function toggleUserActive(id: number, active: boolean) {
    setActionLoading(id);
    try {
      await api.post(`/admin/users/${id}/${active ? "activate" : "deactivate"}`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: active } : u));
    } finally { setActionLoading(null); }
  }

  if (loading || !canAccess) return null;

  const pendingListings = listings.filter(l => ["pending_expertise", "under_expertise"].includes(l.status));
  const expertiseQueue = listings.filter(l => l.status === "pending_expertise");

  const TABS = [
    { key: "overview",   label: "Vue d'ensemble",                    icon: LayoutDashboard },
    { key: "revenue",    label: "Revenus",                           icon: TrendingUp },
    { key: "listings",   label: "Annonces",  icon: Package,          badge: pendingListings.length },
    ...(isAdmin || isExpert ? [{ key: "expertises", label: "File expertise", icon: Microscope, badge: expertiseQueue.length }] : []),
    ...(isAdmin ? [{ key: "sellers", label: "Vendeurs", icon: Users }] : []),
    ...(isSuperAdmin ? [{ key: "staff", label: "Équipe", icon: Shield }] : []),
    ...(isSuperAdmin ? [{ key: "leads", label: "Leads", icon: ListChecks }] : []),
  ] as { key: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>
            {isAdmin ? "Dashboard Admin" : "Dashboard Expert"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8A99AA" }}>Bienvenue, {user?.full_name}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {isAdmin ? "Administrateur" : "Expert"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: tab === key ? "#0B1A2B" : "rgba(11,26,43,0.06)",
              color: tab === key ? "#00D084" : "#0B1A2B",
            }}>
            <Icon size={15} />
            {label}
            {badge ? (
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: tab === key ? "#00D084" : "#0B1A2B", color: tab === key ? "#0B1A2B" : "#F7F5F0" }}>
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse" style={{ background: "#E8E4DF" }} />)}
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Package,    label: "Total annonces",       value: listings.length,    color: "#0B1A2B" },
                  { icon: Clock,      label: "En attente expertise",  value: expertiseQueue.length, color: "#B8860B" },
                  { icon: ShoppingBag, label: "Publiées",             value: listings.filter(l => l.status === "published").length, color: "#00B070" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={16} style={{ color: "#8A99AA" }} />
                      <p className="text-xs font-medium" style={{ color: "#8A99AA" }}>{label}</p>
                    </div>
                    <p className="font-bold text-3xl font-mono" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {pendingListings.length > 0 && (
                <div>
                  <h2 className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>
                    Annonces à traiter ({pendingListings.length})
                  </h2>
                  <div className="space-y-2">
                    {pendingListings.slice(0, 5).map(l => (
                      <PendingListingRow key={l.id} listing={l} onPublish={publishListing} onReject={rejectListing} actionLoading={actionLoading} />
                    ))}
                  </div>
                  {pendingListings.length > 5 && (
                    <button className="text-sm font-medium mt-2" style={{ color: "#00B070" }} onClick={() => setTab("expertises")}>
                      Voir les {pendingListings.length} annonces →
                    </button>
                  )}
                </div>
              )}

              {pendingListings.length === 0 && (
                <div className="card p-8 text-center">
                  <CheckCircle size={36} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
                  <p className="font-semibold" style={{ color: "#0B1A2B" }}>File vide</p>
                  <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Toutes les annonces ont été traitées.</p>
                </div>
              )}
            </div>
          )}

          {/* ── REVENUS ── */}
          {tab === "revenue" && (
            <div className="space-y-6">
              {/* Period selector */}
              <div className="flex gap-2">
                {[
                  { label: "7 jours",  days: 7 },
                  { label: "30 jours", days: 30 },
                  { label: "3 mois",   days: 90 },
                ].map(({ label, days }) => (
                  <button key={days} onClick={() => setStatsDays(days)}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: statsDays === days ? "#0B1A2B" : "rgba(11,26,43,0.06)",
                      color: statsDays === days ? "#00D084" : "#0B1A2B",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {stats ? (
                <>
                  {/* KPI cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "CA total",             value: formatPrice(stats.revenue.total),  color: "#00B070", sub: "Depuis le début" },
                      { label: `CA sur ${stats.revenue.period_days}j`, value: formatPrice(stats.revenue.period), color: "#00D084", sub: "Période sélectionnée" },
                      { label: "Annonces payées",      value: stats.listings.paid,               color: "#0B1A2B", sub: "Toutes périodes" },
                      { label: "Vendeurs actifs",      value: stats.sellers.total,               color: "#0B1A2B", sub: `+${stats.sellers.new_this_month} ce mois` },
                    ].map(({ label, value, color, sub }) => (
                      <div key={label} className="card p-4">
                        <p className="text-xs font-medium mb-2" style={{ color: "#8A99AA" }}>{label}</p>
                        <p className="font-bold text-xl font-mono" style={{ color }}>{value}</p>
                        <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="font-semibold" style={{ color: "#0B1A2B" }}>Revenus par jour</h2>
                        <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                          {formatPrice(stats.revenue.period)} sur les {stats.revenue.period_days} derniers jours
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: "#00D084" }} />
                        <span className="text-xs" style={{ color: "#8A99AA" }}>Revenus (FCFA)</span>
                      </div>
                    </div>
                    <RevenueChart data={stats.chart} />
                  </div>

                  {/* Plan breakdown */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Plans */}
                    <div className="card p-5">
                      <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Répartition par formule</h2>
                      <div className="space-y-3">
                        {(["basic", "verified_phone", "verified_seller"] as const).map(plan => {
                          const p = stats.plans[plan];
                          const total = stats.listings.paid || 1;
                          const pct = Math.round((p.count / total) * 100);
                          return (
                            <div key={plan}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium" style={{ color: "#0B1A2B" }}>
                                    {PLAN_LABELS[plan]}
                                  </span>
                                  <span className="text-xs font-mono" style={{ color: "#8A99AA" }}>
                                    {PLAN_PRICES[plan].toLocaleString("fr-FR")} FCFA
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold font-mono" style={{ color: "#0B1A2B" }}>
                                    {p.count}×
                                  </span>
                                  <span className="text-xs font-bold" style={{ color: "#00B070" }}>
                                    {formatPrice(p.revenue)}
                                  </span>
                                </div>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(11,26,43,0.08)" }}>
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: plan === "verified_seller" ? "#0B1A2B" : plan === "verified_phone" ? "#00B070" : "#00D084" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Autres métriques */}
                    <div className="card p-5">
                      <h2 className="font-semibold mb-4" style={{ color: "#0B1A2B" }}>Autres métriques</h2>
                      <div className="space-y-4">
                        {/* Boosts */}
                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)" }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(245,158,11,0.15)" }}>
                            <Zap size={16} style={{ color: "#F59E0B" }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>TOP Boosts</p>
                            <p className="text-xs" style={{ color: "#8A99AA" }}>{stats.boosts.count} boost{stats.boosts.count !== 1 ? "s" : ""} vendus</p>
                          </div>
                          <p className="font-bold font-mono text-sm" style={{ color: "#F59E0B" }}>
                            {formatPrice(stats.boosts.revenue)}
                          </p>
                        </div>

                        {/* Statuts annonces */}
                        {[
                          { label: "En attente paiement", value: stats.listings.draft,             color: "#CC0000" },
                          { label: "En attente expertise", value: stats.listings.pending_expertise, color: "#B8860B" },
                          { label: "Publiées",             value: stats.listings.published,         color: "#00B070" },
                          { label: "Vendues",              value: stats.listings.sold,              color: "#0B1A2B" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: "#4A5568" }}>{label}</span>
                            <span className="font-bold font-mono text-sm" style={{ color }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card p-8 text-center">
                  <p className="text-sm" style={{ color: "#8A99AA" }}>Chargement des statistiques…</p>
                </div>
              )}
            </div>
          )}

          {/* ── LISTINGS ── */}
          {tab === "listings" && (
            <div className="space-y-3">
              {listings.length === 0
                ? <p className="text-center py-12 text-sm" style={{ color: "#8A99AA" }}>Aucune annonce.</p>
                : listings.map(l => (
                    <PendingListingRow key={l.id} listing={l} onPublish={publishListing} onReject={rejectListing} actionLoading={actionLoading} showAll />
                  ))
              }
            </div>
          )}

          {/* ── EXPERTISES ── */}
          {tab === "expertises" && (
            <div className="space-y-3">
              {expertiseQueue.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle size={36} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
                  <p className="font-semibold" style={{ color: "#0B1A2B" }}>File vide</p>
                  <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Toutes les annonces ont été traitées.</p>
                </div>
              ) : expertiseQueue.map(l => (
                <div key={l.id} className="card p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
                    {l.photos?.[0]
                      ? <img src={l.photos[0].url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">📱</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
                      {l.iphone_model} {l.capacity} Go · {CONDITION_LABELS[l.condition]}
                    </p>
                    <p className="text-xs" style={{ color: "#8A99AA" }}>
                      {l.seller?.full_name} · {formatDate(l.created_at)} · {formatPrice(l.asking_price)}
                    </p>
                    {l.plan && l.plan !== "basic" && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium" style={{ color: "#00B070" }}>
                        <BadgeCheck size={11} /> {PLAN_LABELS[l.plan]}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => publishListing(l.id)} loading={actionLoading === l.id}>
                      <CheckCircle size={14} /> Valider
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => rejectListing(l.id)} loading={actionLoading === l.id}>
                      <XCircle size={14} /> Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── VENDEURS ── */}
          {tab === "sellers" && isAdmin && (
            <div className="space-y-3">
              {sellers.length === 0
                ? <p className="text-center py-12 text-sm" style={{ color: "#8A99AA" }}>Aucun vendeur.</p>
                : sellers.map(s => (
                  <div key={s.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: s.is_active ? "#0B1A2B" : "#E8E4DF", color: s.is_active ? "#00D084" : "#8A99AA" }}>
                        {s.full_name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>{s.full_name}</p>
                          {s.kyc_status === "approved" && (
                            <span className="flex items-center gap-0.5 text-xs font-semibold"
                              style={{ color: "#00B070" }}>
                              <UserCheck size={11} /> KYC ✓
                            </span>
                          )}
                          {!s.is_active && (
                            <Badge variant="error">Suspendu</Badge>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "#8A99AA" }}>{s.email}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>Inscrit le {formatDate(s.created_at)}</p>

                        {/* Plans chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {s.plans.basic > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "rgba(11,26,43,0.06)", color: "#0B1A2B" }}>
                              Basic ×{s.plans.basic}
                            </span>
                          )}
                          {s.plans.verified_phone > 0 && (
                            <span className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
                              <BadgeCheck size={10} /> iPhone vérifié ×{s.plans.verified_phone}
                            </span>
                          )}
                          {s.plans.verified_seller > 0 && (
                            <span className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "rgba(11,26,43,0.08)", color: "#0B1A2B" }}>
                              <BadgeCheck size={10} /> Vendeur vérifié ×{s.plans.verified_seller}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats côté droit */}
                      <div className="flex-shrink-0 text-right space-y-1">
                        <p className="font-bold text-sm font-mono" style={{ color: "#00B070" }}>
                          {formatPrice(s.total_spent)}
                        </p>
                        <p className="text-xs" style={{ color: "#8A99AA" }}>dépensés</p>
                        <div className="flex items-center gap-2 justify-end mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
                            {s.active} en ligne
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(11,26,43,0.06)", color: "#0B1A2B" }}>
                            {s.sold} vendus
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── LEADS ── */}
          {tab === "leads" && isSuperAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total leads",       value: leads.length,                                                  color: "#0B1A2B" },
                  { label: "Vendeurs potentiels", value: leads.filter(l => ["seller","both"].includes(l.profile)).length, color: "#00B070" },
                  { label: "Ont un iPhone",     value: leads.filter(l => l.has_iphone_to_sell).length,               color: "#B8860B" },
                ].map(s => (
                  <div key={s.label} className="card p-4 text-center">
                    <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {leads.length === 0
                  ? <p className="text-center py-12 text-sm" style={{ color: "#8A99AA" }}>Aucun lead.</p>
                  : leads.map(lead => (
                    <div key={lead.id} className="card p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "#F0EDE8", color: "#0B1A2B" }}>
                        {lead.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>{lead.full_name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#8A99AA" }}>
                            <Phone size={11} /> {lead.phone_number}
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#8A99AA" }}>
                            <MapPin size={11} /> {lead.city}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: lead.profile === "seller" ? "rgba(184,134,11,0.1)" : lead.profile === "both" ? "rgba(0,208,132,0.1)" : "rgba(11,26,43,0.06)",
                            color: lead.profile === "seller" ? "#B8860B" : lead.profile === "both" ? "#00B070" : "#0B1A2B",
                          }}>
                          {lead.profile === "buyer" ? "Acheteur" : lead.profile === "seller" ? "Vendeur" : "Les deux"}
                        </span>
                        {lead.has_iphone_to_sell && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
                            iPhone à vendre
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── STAFF ── */}
          {tab === "staff" && isSuperAdmin && (
            <div className="space-y-6">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus size={16} style={{ color: "#00D084" }} />
                  <h2 className="font-semibold" style={{ color: "#0B1A2B" }}>Créer un compte staff</h2>
                </div>
                <div className="space-y-3">
                  <input className="input" placeholder="Nom complet"
                    value={staffForm.full_name} onChange={e => setStaffForm(f => ({ ...f, full_name: e.target.value }))} />
                  <input className="input" type="email" placeholder="email@exemple.com"
                    value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} />
                  <select className="input" value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="expert">Expert</option>
                    <option value="admin">Administrateur</option>
                  </select>
                  {staffError && <p className="text-xs" style={{ color: "#CC0000" }}>{staffError}</p>}
                  {staffSuccess && <p className="text-xs font-medium" style={{ color: "#00B070" }}>{staffSuccess}</p>}
                  <Button className="w-full" loading={staffLoading} onClick={createStaff}>
                    <UserPlus size={14} /> Créer le compte
                  </Button>
                </div>
              </div>

              <div>
                <h2 className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>
                  Membres de l'équipe ({staffList.length})
                </h2>
                <div className="space-y-2">
                  {staffList.length === 0
                    ? <p className="text-sm text-center py-8" style={{ color: "#8A99AA" }}>Aucun staff.</p>
                    : staffList.map(u => (
                      <div key={u.id} className="card p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: "#0B1A2B", color: "#00D084" }}>
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>{u.full_name}</p>
                          <p className="text-xs" style={{ color: "#8A99AA" }}>{u.email}</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {u.roles?.map(r => (
                            <span key={r} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(0,208,132,0.12)", color: "#00B070" }}>
                              {r === "expert" ? "Expert" : r === "admin" ? "Admin" : "Super Admin"}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

// ─── Composant ligne annonce ──────────────────────────────────────────────────
function PendingListingRow({
  listing, onPublish, onReject, actionLoading, showAll = false,
}: {
  listing: AdminListing;
  onPublish: (id: number) => void;
  onReject: (id: number) => void;
  actionLoading: number | null;
  showAll?: boolean;
}) {
  const STATUS_MAP: Record<string, { label: string; variant: "signal" | "ink" | "warning" | "error" }> = {
    pending_expertise: { label: "En attente", variant: "warning" },
    under_expertise:   { label: "En cours",   variant: "warning" },
    published:         { label: "Publiée",    variant: "signal" },
    rejected:          { label: "Refusée",    variant: "error" },
    sold:              { label: "Vendue",     variant: "ink" },
    unpublished:       { label: "Dépubliée",  variant: "ink" },
    draft:             { label: "À payer",    variant: "error" },
  };
  const s = STATUS_MAP[listing.status] ?? { label: listing.status, variant: "ink" as const };
  const isPending = ["pending_expertise", "under_expertise"].includes(listing.status);

  if (!showAll && !isPending) return null;

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
        {listing.photos?.[0]
          ? <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-lg">📱</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "#0B1A2B" }}>
          {listing.iphone_model} {listing.capacity} Go · {listing.color}
        </p>
        <p className="text-xs" style={{ color: "#8A99AA" }}>
          {listing.seller?.full_name} · {formatDate(listing.created_at)} · {formatPrice(listing.asking_price)}
        </p>
        {listing.plan && listing.plan !== "basic" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium mt-0.5" style={{ color: "#00B070" }}>
            <BadgeCheck size={10} /> {PLAN_LABELS[listing.plan]}
          </span>
        )}
      </div>
      <Badge variant={s.variant}>{s.label}</Badge>
      {isPending && (
        <div className="flex gap-2 flex-shrink-0">
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}
            onClick={() => onPublish(listing.id)} disabled={actionLoading === listing.id}>
            <CheckCircle size={16} />
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(204,0,0,0.08)", color: "#CC0000" }}
            onClick={() => onReject(listing.id)} disabled={actionLoading === listing.id}>
            <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
