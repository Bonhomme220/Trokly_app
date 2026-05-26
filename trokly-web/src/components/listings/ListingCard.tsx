import Link from "next/link";
import { Listing } from "@/lib/types";
import { CONDITION_LABELS, formatPrice } from "@/lib/utils";
import { Shield, BadgeCheck, Eye, MessageCircle } from "lucide-react";

interface Props {
  listing: Listing;
}

const CONDITION_COLORS: Record<string, { bg: string; text: string }> = {
  new:      { bg: "rgba(0,208,132,0.12)", text: "#00B070" },
  like_new: { bg: "rgba(0,208,132,0.12)", text: "#00B070" },
  good:     { bg: "rgba(11,26,43,0.07)",  text: "#1E2F42" },
  fair:     { bg: "rgba(255,193,7,0.15)", text: "#B8860B" },
};

function PlanBadge({ plan }: { plan?: string }) {
  if (plan === "verified_seller") {
    return (
      <>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "#0B1A2B", color: "#00D084" }}>
          <BadgeCheck size={9} /> Vendeur vérifié
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "white", color: "#00875A" }}>
          <Shield size={9} /> iPhone vérifié
        </span>
      </>
    );
  }
  if (plan === "verified_phone") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{ background: "white", color: "#00875A" }}>
        <Shield size={9} /> iPhone vérifié
      </span>
    );
  }
  return null;
}

export default function ListingCard({ listing }: Props) {
  const photo = listing.photos?.[0];
  const cond = CONDITION_COLORS[listing.condition] ?? CONDITION_COLORS.good;

  const waNumber = listing.whatsapp_number?.replace(/\D/g, "");
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre ${listing.iphone_model} ${listing.capacity}Go sur Trokly.`)}`
    : null;

  return (
    <div className="card overflow-hidden flex flex-col" style={{ boxShadow: "0 1px 8px rgba(11,26,43,0.07)" }}>
      {/* Photo */}
      <Link href={`/listings/${listing.id}`} className="block group">
        <div className="relative overflow-hidden" style={{ background: "#F0EDE8", aspectRatio: "1 / 1" }}>
          {photo ? (
            <img src={photo.url} alt={`${listing.iphone_model} ${listing.capacity}Go`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-15">📱</span>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            <PlanBadge plan={listing.plan} />
          </div>

          {listing.quality_grade && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(11,26,43,0.65)", color: "#F7F5F0", backdropFilter: "blur(4px)" }}>
                <Shield size={9} /> Grade {listing.quality_grade}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <Link href={`/listings/${listing.id}`} className="block">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-sm leading-tight flex-1" style={{ color: "#0B1A2B" }}>
              {listing.iphone_model}
            </p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: cond.bg, color: cond.text }}>
              {CONDITION_LABELS[listing.condition]}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
            {listing.capacity} Go · {listing.color}
          </p>
        </Link>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <p className="font-bold text-base leading-none" style={{ color: "#0B1A2B", fontVariantNumeric: "tabular-nums" }}>
            {formatPrice(listing.asking_price)}
          </p>
          {listing.views_count > 0 && (
            <div className="flex items-center gap-1" style={{ color: "#8A99AA" }}>
              <Eye size={11} />
              <span className="text-xs">{listing.views_count}</span>
            </div>
          )}
        </div>

        {/* WhatsApp CTA */}
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold mt-1 transition-opacity hover:opacity-90"
            style={{ background: "#25D366", color: "white" }}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle size={14} /> Contacter
          </a>
        )}
      </div>
    </div>
  );
}
