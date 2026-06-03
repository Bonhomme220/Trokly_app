"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Listing } from "@/lib/types";
import { CONDITION_LABELS, formatDate, formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye, Shield, ChevronLeft, ChevronRight, MessageCircle,
  CheckCircle, XCircle, Battery, BadgeCheck, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// Libellés de la checklist (mêmes clés que le formulaire expert)
const CHECKLIST_LABELS: Record<string, string> = {
  ecran_intact:      "Écran intact",
  chassis_intact:    "Châssis intact",
  face_id_ok:        "Face ID / Touch ID",
  cameras_ok:        "Caméras (avant + arrière)",
  boutons_ok:        "Boutons",
  haut_parleur_ok:   "Haut-parleur & micro",
  sim_ok:            "Connecteur SIM",
  icloud_deconnecte: "iCloud déconnecté",
  wifi_bt_ok:        "WiFi & Bluetooth",
  chargeur_inclus:   "Chargeur inclus",
  boite_incluse:     "Boîte d'origine incluse",
};

const GRADE_COLORS: Record<string, string> = {
  A: "#00B070",
  B: "#0B1A2B",
  C: "#F59E0B",
};

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  verified_seller: { label: "Vendeur vérifié",  color: "#00B070" },
  verified_phone:  { label: "iPhone vérifié",   color: "#00B070" },
  basic:           { label: "Annonce Basic",     color: "#8A99AA" },
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    api
      .get<Listing>(`/listings/${id}`)
      .then(res => setListing(res.data))
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-6 rounded mb-6" style={{ background: "#E8E4DF", width: "30%" }} />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-[18px]" style={{ background: "#E8E4DF" }} />
          <div className="space-y-4">
            <div className="h-7 rounded" style={{ background: "#E8E4DF" }} />
            <div className="h-4 rounded" style={{ background: "#E8E4DF", width: "60%" }} />
            <div className="h-12 rounded" style={{ background: "#E8E4DF", width: "50%" }} />
          </div>
        </div>
      </main>
    );
  }

  if (!listing) return null;

  const photos = listing.photos || [];
  const currentPhoto = photos[photoIndex];
  const isOwner = user?.id === listing.seller_id;
  const expertise = listing.expertise;
  const hasReport = expertise?.status === "validated" && expertise.checklist;

  const whatsappHref = listing.whatsapp_number
    ? `https://wa.me/${listing.whatsapp_number.replace(/\D/g, "")}`
    : null;

  const planBadge = listing.plan ? PLAN_BADGE[listing.plan] : null;

  // Battery health from checklist
  const batteryHealth = hasReport
    ? (expertise.checklist["battery_health"] as number | undefined)
    : undefined;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "#8A99AA" }}>
        <ChevronLeft size={16} />
        Retour au marketplace
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ── Photos ── */}
        <div>
          <div
            className="relative aspect-square rounded-[18px] overflow-hidden mb-3"
            style={{ background: "#F0EDE8" }}
          >
            {currentPhoto ? (
              <img src={currentPhoto.url} alt={listing.iphone_model} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📱</div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(11,26,43,0.5)", color: "white" }}
                  onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(11,26,43,0.5)", color: "white" }}
                  onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{ background: i === photoIndex ? "#00D084" : "rgba(255,255,255,0.5)" }}
                      onClick={() => setPhotoIndex(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: i === photoIndex ? "#00D084" : "transparent" }}
                  onClick={() => setPhotoIndex(i)}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant={listing.condition === "new" || listing.condition === "like_new" ? "signal" : "ink"}>
              {CONDITION_LABELS[listing.condition]}
            </Badge>
            {listing.quality_grade && (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: `${GRADE_COLORS[listing.quality_grade]}18`, color: GRADE_COLORS[listing.quality_grade] }}
              >
                Grade {listing.quality_grade}
              </span>
            )}
            {planBadge && listing.plan !== "basic" && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(0,208,132,0.1)", color: planBadge.color }}>
                <BadgeCheck size={11} />
                {planBadge.label}
              </span>
            )}
            {listing.is_boosted && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                TOP
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0B1A2B" }}>
            {listing.iphone_model} {listing.capacity} Go
          </h1>
          <p className="text-sm mb-4" style={{ color: "#8A99AA" }}>
            Coloris {listing.color} · Publié le {formatDate(listing.created_at)}
          </p>

          <p className="text-3xl font-bold font-mono mb-5" style={{ color: "#0B1A2B" }}>
            {formatPrice(listing.asking_price)}
          </p>

          {/* Seller */}
          {listing.seller && (
            <Link
              href={`/vendeurs/${listing.seller_id}`}
              className="flex items-center gap-3 p-3 rounded-xl mb-4 transition-opacity hover:opacity-80"
              style={{ background: "rgba(11,26,43,0.04)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "#0B1A2B", color: "#00D084" }}
              >
                {listing.seller.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>
                  {listing.seller.full_name}
                </p>
                {listing.plan === "verified_seller" && (
                  <p className="text-xs flex items-center gap-1" style={{ color: "#00B070" }}>
                    <BadgeCheck size={10} /> Vendeur vérifié Trokly
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: "#8A99AA" }}>
                <Eye size={12} />
                {listing.views_count}
              </div>
            </Link>
          )}

          {/* Description */}
          {listing.description && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: "#0B1A2B" }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: "#8A99AA" }}>{listing.description}</p>
            </div>
          )}

          {/* Expertise badge (résumé) */}
          {expertise && expertise.status === "validated" && (
            <div
              className="mb-4 rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(0,208,132,0.25)" }}
            >
              {/* En-tête cliquable */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ background: "rgba(0,208,132,0.06)" }}
                onClick={() => setReportOpen(o => !o)}
              >
                <Shield size={16} style={{ color: "#00D084", flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>
                    Vérifié par Trokly — Grade {expertise.quality_grade}
                    {batteryHealth !== undefined && (
                      <span className="ml-2 text-xs font-medium" style={{ color: "#8A99AA" }}>
                        · Batterie {batteryHealth}%
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "#8A99AA" }}>
                    Contrôlé le {formatDate(expertise.completed_at)} · Voir le rapport complet
                  </p>
                </div>
                <ChevronRight
                  size={15}
                  style={{ color: "#8A99AA", transform: reportOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }}
                />
              </button>

              {/* Rapport détaillé */}
              {reportOpen && (
                <div className="px-4 py-3 space-y-2" style={{ borderTop: "1px solid rgba(0,208,132,0.15)", background: "white" }}>

                  {/* Battery health */}
                  {batteryHealth !== undefined && (
                    <div className="flex items-center gap-2 py-1">
                      <Battery size={14} style={{ color: "#0B1A2B", flexShrink: 0 }} />
                      <span className="text-sm flex-1" style={{ color: "#0B1A2B" }}>Santé batterie</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: batteryHealth >= 80 ? "#00B070" : batteryHealth >= 70 ? "#F59E0B" : "#CC0000" }}
                      >
                        {batteryHealth}%
                      </span>
                    </div>
                  )}

                  {/* Checklist items */}
                  {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
                    const val = expertise.checklist[key];
                    if (val === undefined) return null;
                    const ok = val === true;
                    return (
                      <div key={key} className="flex items-center gap-2 py-0.5">
                        {ok
                          ? <CheckCircle size={14} style={{ color: "#00B070", flexShrink: 0 }} />
                          : <XCircle    size={14} style={{ color: "#CC4444", flexShrink: 0 }} />}
                        <span className="text-sm flex-1" style={{ color: "#0B1A2B" }}>{label}</span>
                        <span className="text-xs font-medium" style={{ color: ok ? "#00B070" : "#CC4444" }}>
                          {ok ? "OK" : "Non OK"}
                        </span>
                      </div>
                    );
                  })}

                  {/* Notes */}
                  {expertise.notes && (
                    <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(11,26,43,0.06)" }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "#0B1A2B" }}>Observations</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#8A99AA" }}>{expertise.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Mise en garde annonce non vérifiée ── */}
          {listing.plan === "basic" && !isOwner && (
            <div className="mb-4 rounded-xl p-4 space-y-2"
              style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} style={{ color: "#B8860B", flexShrink: 0 }} />
                <p className="text-sm font-semibold" style={{ color: "#B8860B" }}>
                  Téléphone non vérifié par Trokly
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#8A99AA" }}>
                Cette annonce n&apos;a pas fait l&apos;objet d&apos;une expertise physique par notre équipe.
                Nous ne pouvons pas garantir l&apos;état réel de l&apos;appareil.
                Pour plus de sécurité, privilégiez les annonces avec le badge{" "}
                <span style={{ color: "#00B070", fontWeight: 600 }}>iPhone vérifié</span>.
              </p>
              <Link
                href="/?plan=verified_phone"
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "#00B070" }}>
                <BadgeCheck size={12} />
                Voir les annonces iPhone vérifié →
              </Link>
            </div>
          )}

          {/* CTA */}
          {!isOwner ? (
            <div className="space-y-3">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: "#25D366", color: "white" }}
                >
                  <MessageCircle size={18} />
                  Contacter le vendeur sur WhatsApp
                </a>
              ) : (
                <div
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-xl text-sm"
                  style={{ background: "rgba(11,26,43,0.06)", color: "#8A99AA" }}
                >
                  Numéro WhatsApp non disponible
                </div>
              )}
              <p className="text-xs text-center" style={{ color: "#8A99AA" }}>
                La transaction se fait directement entre vous et le vendeur.
              </p>
            </div>
          ) : (
            <div
              className="p-3 rounded-xl text-sm text-center"
              style={{ background: "rgba(11,26,43,0.04)", color: "#8A99AA" }}
            >
              C&apos;est votre annonce
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
