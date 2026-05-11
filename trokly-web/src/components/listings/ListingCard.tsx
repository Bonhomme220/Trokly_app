import Link from "next/link";
import { Listing } from "@/lib/types";
import { CONDITION_LABELS, formatPrice } from "@/lib/utils";
import { Zap, ArrowLeftRight, Shield, Eye } from "lucide-react";

interface Props {
  listing: Listing;
}

const CONDITION_COLORS: Record<string, { bg: string; text: string }> = {
  new:      { bg: "rgba(0,208,132,0.12)", text: "#00B070" },
  like_new: { bg: "rgba(0,208,132,0.12)", text: "#00B070" },
  good:     { bg: "rgba(11,26,43,0.07)",  text: "#1E2F42" },
  fair:     { bg: "rgba(255,193,7,0.15)", text: "#B8860B" },
};

export default function ListingCard({ listing }: Props) {
  const photo = listing.photos?.[0];
  const cond = CONDITION_COLORS[listing.condition] ?? CONDITION_COLORS.good;

  return (
    <Link href={`/listings/${listing.id}`} className="block group">
      <div
        className="card overflow-hidden flex flex-col transition-all duration-200 group-hover:shadow-lg"
        style={{
          boxShadow: "0 1px 8px rgba(11,26,43,0.07)",
          transform: "translateY(0)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        {/* Photo */}
        <div
          className="relative overflow-hidden"
          style={{ background: "#F0EDE8", aspectRatio: "1 / 1" }}
        >
          {photo ? (
            <img
              src={photo.url}
              alt={`${listing.iphone_model} ${listing.capacity}Go`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-15">📱</span>
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {listing.is_boosted && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#0B1A2B", color: "#00D084" }}
              >
                <Zap size={9} />
                Boosté
              </span>
            )}
          </div>

          {listing.accepts_trade && (
            <div className="absolute top-2.5 right-2.5">
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(0,208,132,0.18)", color: "#00B070" }}
              >
                <ArrowLeftRight size={9} />
                Troc
              </span>
            </div>
          )}

          {/* Grade badge bottom */}
          {listing.quality_grade && (
            <div className="absolute bottom-2.5 left-2.5">
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(11,26,43,0.65)", color: "#F7F5F0", backdropFilter: "blur(4px)" }}
              >
                <Shield size={9} />
                Grade {listing.quality_grade}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-sm leading-tight flex-1" style={{ color: "#0B1A2B" }}>
              {listing.iphone_model}
            </p>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: cond.bg, color: cond.text }}
            >
              {CONDITION_LABELS[listing.condition]}
            </span>
          </div>

          <p className="text-xs" style={{ color: "#8A99AA" }}>
            {listing.capacity} Go · {listing.color}
          </p>

          <div className="mt-auto pt-1 flex items-end justify-between">
            <p className="font-bold text-base leading-none" style={{ color: "#0B1A2B", fontVariantNumeric: "tabular-nums" }}>
              {formatPrice(listing.asking_price)}
            </p>
            {listing.retail_price && listing.retail_price > listing.asking_price && (
              <p className="text-xs line-through" style={{ color: "#8A99AA" }}>
                {formatPrice(listing.retail_price)}
              </p>
            )}
          </div>

          {listing.views_count > 0 && (
            <div className="flex items-center gap-1 pt-1" style={{ color: "#8A99AA" }}>
              <Eye size={11} />
              <span className="text-xs">{listing.views_count} vue{listing.views_count > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
