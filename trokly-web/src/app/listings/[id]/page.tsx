"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Listing } from "@/lib/types";
import { CONDITION_LABELS, formatDate, formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeftRight, Eye, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Listing>(`/listings/${id}`)
      .then((res) => setListing(res.data))
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleBuy() {
    if (!isAuthenticated) return router.push("/login");
    setBuyLoading(true);
    setError("");
    try {
      const res = await api.post("/transactions", { listing_id: listing!.id });
      router.push(`/transactions/${res.data.transaction.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur lors de l'achat.");
      setBuyLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 rounded mb-4" style={{ background: "#E8E4DF", width: "40%" }} />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-[18px]" style={{ background: "#E8E4DF" }} />
          <div className="space-y-4">
            <div className="h-6 rounded" style={{ background: "#E8E4DF" }} />
            <div className="h-4 rounded" style={{ background: "#E8E4DF", width: "60%" }} />
            <div className="h-10 rounded" style={{ background: "#E8E4DF", width: "50%" }} />
          </div>
        </div>
      </main>
    );
  }

  if (!listing) return null;

  const photos = listing.photos || [];
  const currentPhoto = photos[photoIndex];
  const isOwner = user?.id === listing.seller_id;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm mb-6"
        style={{ color: "#8A99AA" }}
      >
        <ChevronLeft size={16} />
        Retour au marketplace
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Photos */}
        <div>
          <div
            className="relative aspect-square rounded-[18px] overflow-hidden mb-3"
            style={{ background: "#F0EDE8" }}
          >
            {currentPhoto ? (
              <img
                src={currentPhoto.url}
                alt={listing.iphone_model}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📱</div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(11,26,43,0.5)", color: "white" }}
                  onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(11,26,43,0.5)", color: "white" }}
                  onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
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

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
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

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={listing.condition === "new" || listing.condition === "like_new" ? "signal" : "ink"}>
              {CONDITION_LABELS[listing.condition]}
            </Badge>
            {listing.quality_grade && (
              <Badge variant="ink">Grade {listing.quality_grade}</Badge>
            )}
            {listing.accepts_trade && (
              <Badge variant="signal">
                <ArrowLeftRight size={10} className="mr-1" />
                Troc accepté
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0B1A2B" }}>
            {listing.iphone_model} {listing.capacity} Go
          </h1>
          <p className="text-sm mb-4" style={{ color: "#8A99AA" }}>
            Couleur {listing.color} · Publié le {formatDate(listing.created_at)}
          </p>

          <p className="text-3xl font-bold font-mono mb-1" style={{ color: "#0B1A2B" }}>
            {formatPrice(listing.asking_price)}
          </p>
          {listing.retail_price && (
            <p className="text-sm mb-4" style={{ color: "#8A99AA" }}>
              Prix neuf estimé : {formatPrice(listing.retail_price)}
            </p>
          )}

          {/* Seller */}
          {listing.seller && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{ background: "rgba(11,26,43,0.04)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "#0B1A2B", color: "#00D084" }}
              >
                {listing.seller.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>
                  {listing.seller.full_name}
                </p>
                <p className="text-xs" style={{ color: "#8A99AA" }}>Vendeur vérifié Trokly</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-xs font-medium" style={{ color: "#8A99AA" }}>
                <Eye size={12} />
                {listing.views_count} vues
              </div>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: "#0B1A2B" }}>Description</p>
              <p className="text-sm" style={{ color: "#8A99AA" }}>{listing.description}</p>
            </div>
          )}

          {/* Expertise */}
          {listing.expertise && (
            <div
              className="flex items-start gap-3 p-3 rounded-xl mb-6"
              style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)" }}
            >
              <Shield size={18} style={{ color: "#00D084", flexShrink: 0 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>
                  Expertisé par Trokly — Grade {listing.expertise.quality_grade}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                  Contrôlé le {formatDate(listing.expertise.completed_at)}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm mb-3" style={{ color: "#CC0000" }}>{error}</p>
          )}

          {/* Actions */}
          {!isOwner && (
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full" loading={buyLoading} onClick={handleBuy}>
                Acheter maintenant
              </Button>
              {listing.accepts_trade && (
                <Link href={`/listings/${listing.id}/trade`}>
                  <Button variant="secondary" size="lg" className="w-full">
                    <ArrowLeftRight size={18} />
                    Proposer un troc
                  </Button>
                </Link>
              )}
            </div>
          )}

          {isOwner && (
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
