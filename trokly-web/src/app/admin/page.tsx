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
  LayoutDashboard, Package, Microscope,
  CheckCircle, XCircle, ShoppingBag, Users, Clock,
  Ban, UserCheck, UserPlus, Shield, ListChecks, Phone, MapPin
} from "lucide-react";

type Tab = "overview" | "listings" | "expertises" | "users" | "staff" | "leads";

interface DashboardStats {
  total_listings: number;
  pending_expertise: number;
  published: number;
  total_transactions: number;
  pending_transactions: number;
  total_revenue: number;
}

interface AdminListing extends Listing {
  seller: { id: number; full_name: string };
}

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [listings, setListings] = useState<AdminListing[]>([]);
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
  const isAdmin = user?.roles?.some((r) => ["admin", "super_admin"].includes(r));
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

  async function loadTabData() {
    setDataLoading(true);
    try {
      if (tab === "overview") {
        const res = await api.get("/admin/listings?per_page=100");
        const allListings: AdminListing[] = res.data.data || [];
        setListings(allListings);
        setStats({
          total_listings: allListings.length,
          pending_expertise: allListings.filter((l) => l.status === "pending_expertise").length,
          published: allListings.filter((l) => l.status === "published").length,
          total_transactions: 0,
          pending_transactions: 0,
          total_revenue: 0,
        });
      } else if (tab === "listings" || tab === "expertises") {
        const res = await api.get("/admin/listings?per_page=100");
        setListings(res.data.data || []);
      } else if (tab === "users") {
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
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "published" as const } : l));
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectListing(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/listings/${id}/reject`);
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "rejected" as const } : l));
    } finally {
      setActionLoading(null);
    }
  }

  async function createStaff() {
    setStaffError("");
    setStaffSuccess("");
    if (!staffForm.full_name.trim() || !staffForm.email.trim()) {
      return setStaffError("Nom et email requis.");
    }
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
    } finally {
      setStaffLoading(false);
    }
  }

  async function toggleUserActive(id: number, active: boolean) {
    setActionLoading(id);
    try {
      await api.post(`/admin/users/${id}/${active ? "activate" : "deactivate"}`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: active } : u));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || !canAccess) return null;

  const pendingListings = listings.filter((l) => ["pending_expertise", "under_expertise"].includes(l.status));
  const expertiseQueue = listings.filter((l) => l.status === "pending_expertise");

  const TABS = [
    { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    { key: "listings", label: "Annonces", icon: Package, badge: pendingListings.length },
    ...(isAdmin || isExpert ? [{ key: "expertises", label: "File expertise", icon: Microscope, badge: expertiseQueue.length }] : []),
    ...(isAdmin ? [{ key: "users", label: "Utilisateurs", icon: Users }] : []),
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
          <p className="text-sm mt-0.5" style={{ color: "#8A99AA" }}>
            Bienvenue, {user?.full_name}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {isAdmin ? "Administrateur" : "Expert"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
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
                style={{ background: tab === key ? "#00D084" : "#0B1A2B", color: tab === key ? "#0B1A2B" : "#F7F5F0" }}
              >
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-24 animate-pulse" style={{ background: "#E8E4DF" }} />
          ))}
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Package,   label: "Total annonces",      value: stats.total_listings,   color: "#0B1A2B" },
                  { icon: Clock,     label: "En attente expertise", value: stats.pending_expertise, color: "#B8860B" },
                  { icon: ShoppingBag, label: "Publiées",           value: stats.published,         color: "#00B070" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={16} style={{ color: "#8A99AA" }} />
                      <p className="text-xs font-medium" style={{ color: "#8A99AA" }}>{label}</p>
                    </div>
                    <p className="font-bold text-3xl font-mono" style={{ color }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent pending */}
              {pendingListings.length > 0 && (
                <div>
                  <h2 className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>Annonces à traiter</h2>
                  <div className="space-y-2">
                    {pendingListings.slice(0, 4).map((l) => (
                      <PendingListingRow key={l.id} listing={l} onPublish={publishListing} onReject={rejectListing} actionLoading={actionLoading} />
                    ))}
                  </div>
                  {pendingListings.length > 4 && (
                    <button className="text-sm font-medium mt-2" style={{ color: "#00B070" }} onClick={() => setTab("listings")}>
                      Voir les {pendingListings.length} annonces →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── LISTINGS ── */}
          {tab === "listings" && (
            <div className="space-y-3">
              {listings.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color: "#8A99AA" }}>Aucune annonce.</p>
              ) : (
                listings.map((l) => (
                  <PendingListingRow key={l.id} listing={l} onPublish={publishListing} onReject={rejectListing} actionLoading={actionLoading} showAll />
                ))
              )}
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
              ) : (
                expertiseQueue.map((l) => (
                  <div key={l.id} className="card p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
                      {l.photos?.[0] ? <img src={l.photos[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📱</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>{l.iphone_model} {l.capacity} Go · {CONDITION_LABELS[l.condition]}</p>
                      <p className="text-xs" style={{ color: "#8A99AA" }}>Vendeur : {l.seller?.full_name} · Déposé le {formatDate(l.created_at)}</p>
                      <p className="text-xs font-mono font-semibold mt-0.5" style={{ color: "#0B1A2B" }}>{formatPrice(l.asking_price)}</p>
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
                ))
              )}
            </div>
          )}

          {/* ── LEADS ── */}
          {tab === "leads" && isSuperAdmin && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total leads", value: leads.length, color: "#0B1A2B" },
                  { label: "Vendeurs potentiels", value: leads.filter(l => ["seller","both"].includes(l.profile)).length, color: "#00B070" },
                  { label: "Ont un iPhone", value: leads.filter(l => l.has_iphone_to_sell).length, color: "#B8860B" },
                ].map(s => (
                  <div key={s.label} className="card p-4 text-center">
                    <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Liste */}
              <div className="space-y-2">
                {leads.length === 0 ? (
                  <p className="text-center py-12 text-sm" style={{ color: "#8A99AA" }}>Aucun lead pour l'instant.</p>
                ) : leads.map(lead => (
                  <div key={lead.id} className="card p-4 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "#F0EDE8", color: "#0B1A2B" }}
                    >
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
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                        background: lead.profile === "seller" ? "rgba(184,134,11,0.1)" : lead.profile === "both" ? "rgba(0,208,132,0.1)" : "rgba(11,26,43,0.06)",
                        color: lead.profile === "seller" ? "#B8860B" : lead.profile === "both" ? "#00B070" : "#0B1A2B",
                      }}>
                        {lead.profile === "buyer" ? "Acheteur" : lead.profile === "seller" ? "Vendeur" : "Les deux"}
                      </span>
                      {lead.has_iphone_to_sell && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
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
              {/* Formulaire création */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus size={16} style={{ color: "#00D084" }} />
                  <h2 className="font-semibold" style={{ color: "#0B1A2B" }}>Créer un compte staff</h2>
                </div>
                <div className="space-y-3">
                  <input
                    className="input"
                    placeholder="Nom complet"
                    value={staffForm.full_name}
                    onChange={e => setStaffForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="email@exemple.com"
                    value={staffForm.email}
                    onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))}
                  />
                  <select
                    className="input"
                    value={staffForm.role}
                    onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}
                  >
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

              {/* Liste staff existants */}
              <div>
                <h2 className="font-semibold mb-3" style={{ color: "#0B1A2B" }}>Membres de l'équipe ({staffList.length})</h2>
                <div className="space-y-2">
                  {staffList.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: "#8A99AA" }}>Aucun staff pour l'instant.</p>
                  ) : staffList.map(u => (
                    <div key={u.id} className="card p-4 flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "#0B1A2B", color: "#00D084" }}
                      >
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
                            {r === "expert" ? "Expert" : r === "delivery_agent" ? "Livreur" : r === "admin" ? "Admin" : "Super Admin"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === "users" && isAdmin && (
            <div className="space-y-2">
              {users.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color: "#8A99AA" }}>Aucun utilisateur.</p>
              ) : users.map(u => (
                <div key={u.id} className="card p-4 flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: u.is_active ? "#0B1A2B" : "#E8E4DF", color: u.is_active ? "#00D084" : "#8A99AA" }}
                  >
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>{u.full_name}</p>
                    <p className="text-xs" style={{ color: "#8A99AA" }}>{u.email}</p>
                    {u.roles?.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {u.roles.map(r => (
                          <span key={r} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "rgba(11,26,43,0.06)", color: "#0B1A2B" }}>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={u.kyc?.status === "approved" ? "signal" : "ink"}>
                      {u.kyc?.status === "approved" ? "KYC ✓" : "KYC —"}
                    </Badge>
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        background: u.is_active ? "rgba(204,0,0,0.08)" : "rgba(0,208,132,0.1)",
                        color: u.is_active ? "#CC0000" : "#00B070",
                      }}
                      onClick={() => toggleUserActive(u.id, !u.is_active)}
                      disabled={actionLoading === u.id}
                      title={u.is_active ? "Désactiver" : "Activer"}
                    >
                      {u.is_active ? <Ban size={14} /> : <UserCheck size={14} />}
                    </button>
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
    under_expertise:   { label: "En cours", variant: "warning" },
    published:         { label: "Publiée", variant: "signal" },
    rejected:          { label: "Refusée", variant: "error" },
    sold:              { label: "Vendue", variant: "ink" },
    unpublished:       { label: "Dépubliée", variant: "ink" },
  };
  const s = STATUS_MAP[listing.status] ?? { label: listing.status, variant: "ink" as const };
  const isPending = ["pending_expertise", "under_expertise"].includes(listing.status);

  if (!showAll && !isPending) return null;

  return (
    <div className="card p-4 flex items-center gap-4">
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
        <p className="text-xs" style={{ color: "#8A99AA" }}>
          {listing.seller?.full_name} · {formatDate(listing.created_at)} · {formatPrice(listing.asking_price)}
        </p>
      </div>
      <Badge variant={s.variant}>{s.label}</Badge>
      {isPending && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}
            onClick={() => onPublish(listing.id)}
            disabled={actionLoading === listing.id}
          >
            <CheckCircle size={16} />
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(204,0,0,0.08)", color: "#CC0000" }}
            onClick={() => onReject(listing.id)}
            disabled={actionLoading === listing.id}
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
