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
  BadgeCheck, Zap, Euro, Gift, X, Tag, Wallet, ArrowDownCircle,
} from "lucide-react";

type Tab = "overview" | "revenue" | "listings" | "expertises" | "sellers" | "staff" | "leads" | "ambassadors";

interface AmbassadorCode {
  id: number;
  code: string;
  discount_percent: number;
  commission_percent: number;
  uses_count: number;
  is_active: boolean;
  total_commissions: number;
  wallet_balance: number;
  created_at: string;
  user: { id: number; full_name: string; email: string };
}

interface AmbassadorWithdrawal {
  id: number;
  amount: number;
  status: "pending" | "paid" | "rejected";
  payment_method: string;
  payment_details: string;
  admin_note: string | null;
  paid_at: string | null;
  created_at: string;
  user: { id: number; full_name: string; email: string };
}

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
  listing_credits: number;
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
  const [sellerSearch, setSellerSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState<"all" | "active">("all");

  // Ambassador state
  const [ambassadors, setAmbassadors] = useState<AmbassadorCode[]>([]);
  const [ambassadorWithdrawals, setAmbassadorWithdrawals] = useState<AmbassadorWithdrawal[]>([]);
  const [ambassadorForm, setAmbassadorForm] = useState({ user_id: 0, discount_percent: "20", commission_percent: "10" });
  const [ambassadorSellerSearch, setAmbassadorSellerSearch] = useState("");
  const [ambassadorSellerSelected, setAmbassadorSellerSelected] = useState<AdminSeller | null>(null);
  const [ambassadorSellerOpen, setAmbassadorSellerOpen] = useState(false);
  const [ambassadorFormError, setAmbassadorFormError] = useState("");
  const [ambassadorFormSuccess, setAmbassadorFormSuccess] = useState("");
  const [ambassadorFormLoading, setAmbassadorFormLoading] = useState(false);
  const [ambassadorActionLoading, setAmbassadorActionLoading] = useState<number | null>(null);
  const [withdrawalFilter, setWithdrawalFilter] = useState<"pending" | "all">("pending");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [creditModal, setCreditModal] = useState<{ id: number; full_name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState(1);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditMsg, setCreditMsg] = useState("");

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
      } else if (tab === "ambassadors") {
        const [amRes, wdRes, sellersRes] = await Promise.all([
          api.get("/admin/ambassadors").catch(() => ({ data: { data: [] } })),
          api.get(`/admin/ambassador-withdrawals?status=${withdrawalFilter}`).catch(() => ({ data: { data: [] } })),
          api.get("/admin/sellers").catch(() => ({ data: { data: [] } })),
        ]);
        setAmbassadors(amRes.data.data || []);
        setAmbassadorWithdrawals(wdRes.data.data || []);
        setSellers(sellersRes.data.data || []);
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

  async function giveCredits() {
    if (!creditModal) return;
    setCreditLoading(true);
    setCreditMsg("");
    try {
      const res = await api.post(`/admin/users/${creditModal.id}/credits`, { credits: creditAmount });
      setCreditMsg(res.data.message);
      setSellers(prev => prev.map(s =>
        s.id === creditModal.id ? { ...s, listing_credits: res.data.listing_credits } : s
      ));
    } catch {
      setCreditMsg("Erreur lors de l'ajout des crédits.");
    } finally {
      setCreditLoading(false);
    }
  }

  async function createAmbassadorCode() {
    setAmbassadorFormError(""); setAmbassadorFormSuccess("");
    if (!ambassadorSellerSelected) return setAmbassadorFormError("Sélectionnez un vendeur.");
    const disc = parseInt(ambassadorForm.discount_percent);
    const comm = parseInt(ambassadorForm.commission_percent);
    if (!disc || disc < 1 || disc > 50) return setAmbassadorFormError("Réduction entre 1 et 50 %.");
    if (!comm || comm < 1 || comm > 30) return setAmbassadorFormError("Commission entre 1 et 30 %.");
    setAmbassadorFormLoading(true);
    try {
      const res = await api.post("/admin/ambassadors", {
        user_id: ambassadorSellerSelected.id,
        discount_percent: disc,
        commission_percent: comm,
      });
      setAmbassadorFormSuccess(res.data.message);
      setAmbassadorSellerSelected(null);
      setAmbassadorSellerSearch("");
      setAmbassadorForm(f => ({ ...f, discount_percent: "20", commission_percent: "10" }));
      setAmbassadors(prev => [{
        ...res.data.code,
        user: { id: ambassadorSellerSelected.id, full_name: ambassadorSellerSelected.full_name, email: ambassadorSellerSelected.email },
        total_commissions: 0,
        wallet_balance: 0,
      }, ...prev]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]?.[0]
        : err.response?.data?.message;
      setAmbassadorFormError(msg || "Erreur.");
    } finally { setAmbassadorFormLoading(false); }
  }

  async function toggleAmbassadorCode(id: number) {
    setAmbassadorActionLoading(id);
    try {
      const res = await api.put(`/admin/ambassadors/${id}/toggle`);
      setAmbassadors(prev => prev.map(a => a.id === id ? { ...a, is_active: res.data.is_active } : a));
    } finally { setAmbassadorActionLoading(null); }
  }

  async function approveWithdrawal(id: number) {
    setAmbassadorActionLoading(id);
    try {
      await api.post(`/admin/ambassador-withdrawals/${id}/approve`);
      setAmbassadorWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: "paid" as const } : w));
    } finally { setAmbassadorActionLoading(null); }
  }

  async function rejectWithdrawal(id: number) {
    const note = prompt("Motif du rejet (obligatoire) :");
    if (!note) return;
    setAmbassadorActionLoading(id);
    try {
      await api.post(`/admin/ambassador-withdrawals/${id}/reject`, { note });
      setAmbassadorWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: "rejected" as const } : w));
    } finally { setAmbassadorActionLoading(null); }
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
    ...(isAdmin ? [{ key: "ambassadors", label: "Ambassadeurs", icon: Tag }] : []),
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
              {/* Filtres */}
              <div className="flex items-center gap-2 mb-3">
                {(["all", "active"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSellerFilter(f)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={sellerFilter === f
                      ? { background: "#0B1A2B", color: "#00D084" }
                      : { background: "white", color: "#8A99AA", border: "1px solid rgba(11,26,43,0.12)" }}
                  >
                    {f === "all" ? "Tous" : "Avec annonces"}
                  </button>
                ))}
                <span className="text-xs ml-auto" style={{ color: "#8A99AA" }}>
                  {sellers.filter(s =>
                    (sellerFilter === "all" || s.listings_count > 0) &&
                    (s.full_name.toLowerCase().includes(sellerSearch.toLowerCase()) ||
                     s.email.toLowerCase().includes(sellerSearch.toLowerCase()))
                  ).length} vendeur{sellers.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Barre de recherche */}
              <div className="relative mb-2">
                <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A99AA" }} />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email…"
                  value={sellerSearch}
                  onChange={e => setSellerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ borderColor: "rgba(11,26,43,0.12)", background: "white", color: "#0B1A2B" }}
                />
                {sellerSearch && (
                  <button onClick={() => setSellerSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={14} style={{ color: "#8A99AA" }} />
                  </button>
                )}
              </div>

              {sellers.filter(s =>
                (sellerFilter === "all" || s.listings_count > 0) &&
                (s.full_name.toLowerCase().includes(sellerSearch.toLowerCase()) ||
                 s.email.toLowerCase().includes(sellerSearch.toLowerCase()))
              ).length === 0
                ? <p className="text-center py-12 text-sm" style={{ color: "#8A99AA" }}>
                    {sellerSearch ? `Aucun résultat pour "${sellerSearch}"` : sellerFilter === "active" ? "Aucun vendeur avec annonce." : "Aucun vendeur."}
                  </p>
                : sellers.filter(s =>
                    (sellerFilter === "all" || s.listings_count > 0) &&
                    (s.full_name.toLowerCase().includes(sellerSearch.toLowerCase()) ||
                     s.email.toLowerCase().includes(sellerSearch.toLowerCase()))
                  ).map(s => (
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
                        <div className="flex items-center gap-2 justify-end mt-1.5">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
                            {s.active} en ligne
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(11,26,43,0.06)", color: "#0B1A2B" }}>
                            {s.sold} vendus
                          </span>
                        </div>
                        {/* Crédits + bouton */}
                        <div className="flex items-center justify-end gap-2 mt-1.5">
                          {s.listing_credits > 0 && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                              <Gift size={10} /> {s.listing_credits} crédit{s.listing_credits > 1 ? "s" : ""}
                            </span>
                          )}
                          <button
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold transition-colors"
                            style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}
                            onClick={() => { setCreditModal({ id: s.id, full_name: s.full_name }); setCreditAmount(1); setCreditMsg(""); }}
                          >
                            <Gift size={11} /> Créditer
                          </button>
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

          {/* ── AMBASSADEURS ── */}
          {tab === "ambassadors" && (
            <div className="space-y-8">
              {/* Create form */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,208,132,0.1)" }}>
                    <Tag size={16} style={{ color: "#00B070" }} />
                  </div>
                  <h2 className="font-semibold text-lg" style={{ color: "#0B1A2B" }}>Créer un code ambassadeur</h2>
                </div>

                <div className="space-y-4 mb-4">
                  {/* Sélecteur vendeur */}
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                      Vendeur *
                    </label>
                    {ambassadorSellerSelected ? (
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: "rgba(0,208,132,0.08)", border: "1.5px solid rgba(0,208,132,0.3)" }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>
                            {ambassadorSellerSelected.full_name}
                          </p>
                          <p className="text-xs" style={{ color: "#8A99AA" }}>{ambassadorSellerSelected.email}</p>
                        </div>
                        <button onClick={() => { setAmbassadorSellerSelected(null); setAmbassadorSellerSearch(""); }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                          style={{ background: "rgba(11,26,43,0.08)", color: "#0B1A2B" }}>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          className="input"
                          placeholder="Rechercher par nom ou email…"
                          value={ambassadorSellerSearch}
                          onChange={e => { setAmbassadorSellerSearch(e.target.value); setAmbassadorSellerOpen(true); }}
                          onFocus={() => setAmbassadorSellerOpen(true)}
                          onBlur={() => setTimeout(() => setAmbassadorSellerOpen(false), 150)}
                        />
                        {ambassadorSellerOpen && ambassadorSellerSearch.length >= 1 && (() => {
                          const q = ambassadorSellerSearch.toLowerCase();
                          const filtered = sellers.filter(s =>
                            s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
                          ).slice(0, 6);
                          return filtered.length > 0 ? (
                            <div className="absolute z-30 top-full mt-1 left-0 right-0 rounded-xl shadow-xl overflow-hidden"
                              style={{ background: "white", border: "1px solid rgba(11,26,43,0.1)" }}>
                              {filtered.map(s => (
                                <button key={s.id}
                                  onMouseDown={() => { setAmbassadorSellerSelected(s); setAmbassadorSellerOpen(false); }}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                                  style={{ borderBottom: "1px solid rgba(11,26,43,0.05)" }}>
                                  <div>
                                    <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>{s.full_name}</p>
                                    <p className="text-xs" style={{ color: "#8A99AA" }}>{s.email}</p>
                                  </div>
                                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: "rgba(11,26,43,0.06)", color: "#8A99AA" }}>
                                    {s.listings_count} annonce{s.listings_count !== 1 ? "s" : ""}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="absolute z-30 top-full mt-1 left-0 right-0 rounded-xl shadow-xl px-4 py-3"
                              style={{ background: "white", border: "1px solid rgba(11,26,43,0.1)" }}>
                              <p className="text-sm" style={{ color: "#8A99AA" }}>Aucun vendeur trouvé.</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Discount + Commission */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                        Réduction offerte (%)
                      </label>
                      <input className="input" type="number" min={1} max={50} placeholder="20"
                        value={ambassadorForm.discount_percent}
                        onChange={e => setAmbassadorForm(f => ({ ...f, discount_percent: e.target.value }))} />
                      <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>Offerte aux acheteurs qui utilisent le code</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                        Commission ambassadeur (%)
                      </label>
                      <input className="input" type="number" min={1} max={30} placeholder="10"
                        value={ambassadorForm.commission_percent}
                        onChange={e => setAmbassadorForm(f => ({ ...f, commission_percent: e.target.value }))} />
                      <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>Reversée à l'ambassadeur sur chaque vente</p>
                    </div>
                  </div>
                </div>

                {ambassadorFormError && (
                  <p className="text-sm mb-3" style={{ color: "#CC0000" }}>{ambassadorFormError}</p>
                )}
                {ambassadorFormSuccess && (
                  <p className="text-sm mb-3 font-medium" style={{ color: "#00B070" }}>{ambassadorFormSuccess}</p>
                )}

                <Button loading={ambassadorFormLoading} onClick={createAmbassadorCode}>
                  <Tag size={14} /> Créer le code
                </Button>
              </div>

              {/* Ambassadors list */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>
                  Codes actifs ({ambassadors.length})
                </h3>
                {ambassadors.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "#8A99AA" }}>Aucun code créé.</p>
                ) : (
                  <div className="space-y-3">
                    {ambassadors.map(a => (
                      <div key={a.id} className="card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xl font-black tracking-widest" style={{ color: "#0B1A2B" }}>{a.code}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {a.is_active ? "Actif" : "Inactif"}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: "#4A5568" }}>
                              {a.user?.full_name} · <span style={{ color: "#8A99AA" }}>{a.user?.email}</span>
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs" style={{ color: "#8A99AA" }}>
                                <strong style={{ color: "#0B1A2B" }}>−{a.discount_percent}%</strong> réduction
                              </span>
                              <span className="text-xs" style={{ color: "#8A99AA" }}>
                                <strong style={{ color: "#0B1A2B" }}>{a.commission_percent}%</strong> commission
                              </span>
                              <span className="text-xs" style={{ color: "#8A99AA" }}>
                                <strong style={{ color: "#0B1A2B" }}>{a.uses_count}</strong> utilisations
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="mb-2">
                              <p className="text-xs" style={{ color: "#8A99AA" }}>Total commissions</p>
                              <p className="font-bold text-sm" style={{ color: "#00B070" }}>
                                {(a.total_commissions ?? 0).toLocaleString("fr-FR")} FCFA
                              </p>
                            </div>
                            <div className="mb-3">
                              <p className="text-xs" style={{ color: "#8A99AA" }}>Solde wallet</p>
                              <p className="font-bold text-sm" style={{ color: "#0B1A2B" }}>
                                {(a.wallet_balance ?? 0).toLocaleString("fr-FR")} FCFA
                              </p>
                            </div>
                            <button
                              disabled={ambassadorActionLoading === a.id}
                              onClick={() => toggleAmbassadorCode(a.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{
                                background: a.is_active ? "rgba(204,0,0,0.08)" : "rgba(0,208,132,0.1)",
                                color: a.is_active ? "#CC0000" : "#00B070",
                              }}>
                              {ambassadorActionLoading === a.id ? "…" : a.is_active ? "Désactiver" : "Activer"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Withdrawals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: "#0B1A2B" }}>
                    <ArrowDownCircle size={16} className="inline mr-2" style={{ color: "#8A99AA" }} />
                    Demandes de retrait
                  </h3>
                  <div className="flex gap-1">
                    {(["pending", "all"] as const).map(f => (
                      <button key={f}
                        onClick={() => {
                          setWithdrawalFilter(f);
                          api.get(`/admin/ambassador-withdrawals?status=${f}`)
                            .then(r => setAmbassadorWithdrawals(r.data.data || []))
                            .catch(() => {});
                        }}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: withdrawalFilter === f ? "#0B1A2B" : "rgba(11,26,43,0.06)",
                          color: withdrawalFilter === f ? "#00D084" : "#0B1A2B",
                        }}>
                        {f === "pending" ? "En attente" : "Tous"}
                      </button>
                    ))}
                  </div>
                </div>

                {ambassadorWithdrawals.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "#8A99AA" }}>
                    Aucune demande {withdrawalFilter === "pending" ? "en attente" : ""}.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ambassadorWithdrawals.map(w => (
                      <div key={w.id} className="card p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(0,208,132,0.08)" }}>
                          <Wallet size={16} style={{ color: "#00B070" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
                            {w.user?.full_name} — {w.amount.toLocaleString("fr-FR")} FCFA
                          </p>
                          <p className="text-xs" style={{ color: "#8A99AA" }}>
                            {w.payment_method.toUpperCase()} · {w.payment_details}
                          </p>
                          <p className="text-xs" style={{ color: "#8A99AA" }}>
                            {new Date(w.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          {w.admin_note && (
                            <p className="text-xs mt-0.5 italic" style={{ color: "#8A99AA" }}>Note : {w.admin_note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {w.status === "pending" ? (
                            <>
                              <button
                                disabled={ambassadorActionLoading === w.id}
                                onClick={() => approveWithdrawal(w.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
                                <CheckCircle size={15} />
                              </button>
                              <button
                                disabled={ambassadorActionLoading === w.id}
                                onClick={() => rejectWithdrawal(w.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(204,0,0,0.08)", color: "#CC0000" }}>
                                <XCircle size={15} />
                              </button>
                            </>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${w.status === "paid" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                              {w.status === "paid" ? "Payé" : "Rejeté"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {/* ── MODAL CRÉDIT ── */}
      {creditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(11,26,43,0.55)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setCreditModal(null)}
        >
          <div className="w-full max-w-sm rounded-2xl p-6 relative" style={{ background: "white", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(11,26,43,0.06)", color: "#0B1A2B" }}
              onClick={() => setCreditModal(null)}
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(245,158,11,0.12)" }}>
                <Gift size={18} style={{ color: "#F59E0B" }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: "#0B1A2B" }}>Donner des crédits</p>
                <p className="text-sm" style={{ color: "#8A99AA" }}>{creditModal.full_name}</p>
              </div>
            </div>

            <p className="text-sm mb-3" style={{ color: "#4A5568" }}>
              Chaque crédit permet au vendeur de publier une annonce gratuitement (Basic ou vérifié).
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold border-2 transition-all"
                style={{ borderColor: "rgba(11,26,43,0.15)", color: "#0B1A2B" }}
                onClick={() => setCreditAmount(Math.max(1, creditAmount - 1))}
              >−</button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-black font-mono" style={{ color: "#0B1A2B" }}>{creditAmount}</span>
                <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>crédit{creditAmount > 1 ? "s" : ""}</p>
              </div>
              <button
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold border-2 transition-all"
                style={{ borderColor: "rgba(11,26,43,0.15)", color: "#0B1A2B" }}
                onClick={() => setCreditAmount(Math.min(20, creditAmount + 1))}
              >+</button>
            </div>

            {creditMsg && (
              <p className="text-sm text-center mb-3 font-medium"
                style={{ color: creditMsg.startsWith("Erreur") ? "#CC0000" : "#00B070" }}>
                {creditMsg}
              </p>
            )}

            <Button className="w-full" loading={creditLoading} onClick={giveCredits}>
              <Gift size={14} />
              Ajouter {creditAmount} crédit{creditAmount > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
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
