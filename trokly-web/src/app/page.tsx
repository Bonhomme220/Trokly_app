"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { Listing, PaginatedResponse, Condition } from "@/lib/types";
import ListingCard from "@/components/listings/ListingCard";
import Button from "@/components/ui/Button";
import {
  Search, SlidersHorizontal, X, Shield, Zap, ArrowLeftRight,
  Truck, RotateCcw, Star, ChevronRight, Check
} from "lucide-react";
import { CONDITION_LABELS, CONDITION_OPTIONS, formatPrice } from "@/lib/utils";
import Link from "next/link";

const MODEL_SERIES = [
  { label: "Tous", value: "" },
  { label: "iPhone 16", value: "iPhone 16" },
  { label: "iPhone 15", value: "iPhone 15" },
  { label: "iPhone 14", value: "iPhone 14" },
  { label: "iPhone 13", value: "iPhone 13" },
  { label: "iPhone 12", value: "iPhone 12" },
];

const IPHONE_MODELS = [
  "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max",
];

const TESTIMONIALS = [
  { name: "Kossi A.", city: "Cotonou", text: "J'ai acheté un iPhone 14 Pro, expertisé grade A. Livré en 24h, exactement comme décrit. Je recommande !", stars: 5 },
  { name: "Fatima D.", city: "Porto-Novo", text: "Super expérience de troc. J'ai échangé mon iPhone 12 contre un 14, avec soulte. L'équipe Trokly a tout géré.", stars: 5 },
  { name: "Marc B.", city: "Cotonou", text: "Vendeur satisfait ! Mon iPhone 13 Pro vendu en 3 jours. Paiement sur MoMo direct, zéro prise de tête.", stars: 5 },
];

export default function HomePage() {
  const listingsRef = useRef<HTMLElement>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSeries, setActiveSeries] = useState("");

  const [filters, setFilters] = useState({
    model: "",
    condition: "" as Condition | "",
    capacity: "",
    max_price: "",
    accepts_trade: false,
  });

  async function fetchListings(p = 1, replace = true, overrideModel?: string) {
    setLoading(true);
    try {
      const model = overrideModel !== undefined ? overrideModel : filters.model;
      const params: Record<string, string> = { page: String(p) };
      if (model) params.model = model;
      if (filters.condition) params.condition = filters.condition;
      if (filters.capacity) params.capacity = filters.capacity;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.accepts_trade) params.accepts_trade = "1";

      const res = await api.get<PaginatedResponse<Listing>>("/listings", { params });
      if (replace) setListings(res.data.data);
      else setListings((prev) => [...prev, ...res.data.data]);
      setLastPage(res.data.last_page);
      setPage(p);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchListings(1, true); }, []);

  function applyFilters() {
    setShowFilters(false);
    setActiveSeries("");
    fetchListings(1, true);
  }

  function resetFilters() {
    setFilters({ model: "", condition: "", capacity: "", max_price: "", accepts_trade: false });
    setActiveSeries("");
  }

  function selectSeries(series: string) {
    setActiveSeries(series);
    setFilters(f => ({ ...f, model: series }));
    setSearch("");
    fetchListings(1, true, series);
    listingsRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const activeFilterCount = [
    filters.model, filters.condition, filters.capacity, filters.max_price, filters.accepts_trade,
  ].filter(Boolean).length;

  const filteredBySearch = search.trim()
    ? listings.filter((l) =>
        l.iphone_model.toLowerCase().includes(search.toLowerCase()) ||
        l.color?.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  const totalListings = filteredBySearch.length;

  return (
    <main className="flex-1">

      {/* ═══ HERO ═══ */}
      <section style={{ background: "#0B1A2B" }}>
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-12">

          {/* Label */}
          <div className="flex justify-center mb-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(0,208,132,0.12)", color: "#00D084" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Marketplace iPhones · Cotonou, Bénin
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center text-4xl md:text-6xl font-bold leading-[1.08] mb-5" style={{ color: "#F7F5F0", letterSpacing: "-0.025em" }}>
            Les meilleurs iPhones,<br />
            <span style={{ color: "#00D084" }}>certifiés par Trokly.</span>
          </h1>
          <p className="text-center text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgba(247,245,240,0.5)" }}>
            Chaque téléphone est expertisé, photographié et garanti par notre équipe. Achetez en toute confiance ou vendez le vôtre.
          </p>

          {/* Hero search bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8A99AA" }} />
              <input
                type="text"
                placeholder="Rechercher un iPhone (modèle, couleur…)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm font-medium outline-none border-0"
                style={{ background: "rgba(247,245,240,0.08)", color: "#F7F5F0", caretColor: "#00D084" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => listingsRef.current?.scrollIntoView({ behavior: "smooth" })}
              />
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-12">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => listingsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Voir les iPhones
              <ChevronRight size={16} />
            </button>
            <Link href="/listings/new">
              <button
                className="btn btn-lg"
                style={{ background: "rgba(247,245,240,0.08)", color: "#F7F5F0", border: "1px solid rgba(247,245,240,0.12)" }}
              >
                Vendre le mien
              </button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 max-w-lg mx-auto" style={{ borderTop: "1px solid rgba(247,245,240,0.08)", paddingTop: 24, gap: 0 }}>
            {[
              { value: "100%", label: "Expertisés" },
              { value: "24–48h", label: "Livraison" },
              { value: "Troc", label: "Accepté" },
            ].map((s, i) => (
              <div key={s.label} className="text-center" style={{ borderRight: i < 2 ? "1px solid rgba(247,245,240,0.08)" : "none" }}>
                <p className="text-2xl font-bold font-mono" style={{ color: "#00D084" }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(247,245,240,0.35)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section style={{ background: "white", borderBottom: "1px solid rgba(11,26,43,0.07)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { icon: Shield, title: "Expertisé Trokly", desc: "Contrôlé par notre équipe avant vente" },
              { icon: Truck, title: "Livraison 24–48h", desc: "Remise en main propre à Cotonou" },
              { icon: RotateCcw, title: "Retour 7 jours", desc: "Remboursement si problème constaté" },
              { icon: ArrowLeftRight, title: "Troc avec soulte", desc: "Échangez votre iPhone facilement" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex items-start gap-3 py-5 px-5"
                style={{ borderRight: i < 3 ? "1px solid rgba(11,26,43,0.07)" : "none" }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(0,208,132,0.1)" }}>
                  <Icon size={16} style={{ color: "#00D084" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>{title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#8A99AA" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATÉGORIES ═══ */}
      <section style={{ background: "#F7F5F0", borderBottom: "1px solid rgba(11,26,43,0.07)" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold flex-shrink-0 mr-1" style={{ color: "#8A99AA" }}>Série :</span>
          {MODEL_SERIES.map((s) => (
            <button
              key={s.value}
              onClick={() => selectSeries(s.value)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: activeSeries === s.value ? "#0B1A2B" : "white",
                color: activeSeries === s.value ? "#00D084" : "#0B1A2B",
                border: "1px solid",
                borderColor: activeSeries === s.value ? "#0B1A2B" : "rgba(11,26,43,0.12)",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ LISTINGS ═══ */}
      <section ref={listingsRef} style={{ background: "#F7F5F0" }} className="pb-16">
        <div className="max-w-6xl mx-auto px-4 pt-10">

          {/* Section header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>
                {activeSeries ? `${activeSeries} disponibles` : "iPhones disponibles"}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "#8A99AA" }}>
                {loading ? "Chargement…" : `${totalListings} annonce${totalListings !== 1 ? "s" : ""} en ligne`}
              </p>
            </div>

            <button
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
              style={{
                background: activeFilterCount ? "#0B1A2B" : "white",
                color: activeFilterCount ? "#00D084" : "#0B1A2B",
                border: "1px solid",
                borderColor: activeFilterCount ? "#0B1A2B" : "rgba(11,26,43,0.12)",
              }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={15} />
              Filtres
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: "#00D084", color: "#0B1A2B" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="card p-5 mb-6" style={{ background: "white" }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#8A99AA" }}>Modèle</label>
                  <select className="input text-sm" value={filters.model} onChange={(e) => setFilters({ ...filters, model: e.target.value })}>
                    <option value="">Tous les modèles</option>
                    {IPHONE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#8A99AA" }}>État</label>
                  <select className="input text-sm" value={filters.condition} onChange={(e) => setFilters({ ...filters, condition: e.target.value as Condition | "" })}>
                    <option value="">Tous les états</option>
                    {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#8A99AA" }}>Capacité</label>
                  <select className="input text-sm" value={filters.capacity} onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}>
                    <option value="">Toutes</option>
                    {[64, 128, 256, 512].map((c) => <option key={c} value={c}>{c} Go</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#8A99AA" }}>Prix max (FCFA)</label>
                  <input type="number" className="input text-sm" placeholder="Ex: 400 000" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                    style={{ background: filters.accepts_trade ? "#00D084" : "rgba(11,26,43,0.15)" }}
                    onClick={() => setFilters({ ...filters, accepts_trade: !filters.accepts_trade })}
                  >
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: filters.accepts_trade ? 17 : 2 }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#0B1A2B" }}>Accepte le troc</span>
                </label>
                <div className="flex gap-2">
                  <button className="text-sm flex items-center gap-1" style={{ color: "#8A99AA" }} onClick={resetFilters}>
                    <X size={13} /> Réinitialiser
                  </button>
                  <Button size="sm" onClick={applyFilters}>Appliquer</Button>
                </div>
              </div>
            </div>
          )}

          {/* Active chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {filters.model && (
                <span className="badge badge-ink flex items-center gap-1">{filters.model}
                  <button onClick={() => { setFilters({ ...filters, model: "" }); setActiveSeries(""); }}><X size={11} /></button>
                </span>
              )}
              {filters.condition && (
                <span className="badge badge-ink flex items-center gap-1">{CONDITION_LABELS[filters.condition as Condition]}
                  <button onClick={() => setFilters({ ...filters, condition: "" })}><X size={11} /></button>
                </span>
              )}
              {filters.capacity && (
                <span className="badge badge-ink flex items-center gap-1">{filters.capacity} Go
                  <button onClick={() => setFilters({ ...filters, capacity: "" })}><X size={11} /></button>
                </span>
              )}
              {filters.max_price && (
                <span className="badge badge-ink flex items-center gap-1">Max {parseInt(filters.max_price).toLocaleString("fr-FR")} FCFA
                  <button onClick={() => setFilters({ ...filters, max_price: "" })}><X size={11} /></button>
                </span>
              )}
              {filters.accepts_trade && (
                <span className="badge badge-signal flex items-center gap-1">Troc accepté
                  <button onClick={() => setFilters({ ...filters, accepts_trade: false })}><X size={11} /></button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading && filteredBySearch.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse" style={{ background: "white" }}>
                  <div className="aspect-square" style={{ background: "#E8E4DF" }} />
                  <div className="p-3 space-y-2">
                    <div className="h-4 rounded" style={{ background: "#E8E4DF", width: "70%" }} />
                    <div className="h-3 rounded" style={{ background: "#E8E4DF", width: "50%" }} />
                    <div className="h-5 rounded" style={{ background: "#E8E4DF", width: "55%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBySearch.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">📭</p>
              <p className="font-semibold text-lg" style={{ color: "#0B1A2B" }}>Aucun résultat</p>
              <p className="text-sm mt-1 mb-6" style={{ color: "#8A99AA" }}>
                {search ? `Aucun iPhone correspondant à "${search}".` : "Aucune annonce avec ces filtres."}
              </p>
              {(search || activeFilterCount > 0) && (
                <Button variant="secondary" onClick={() => { resetFilters(); setSearch(""); fetchListings(1, true, ""); }}>
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBySearch.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
              {page < lastPage && (
                <div className="text-center mt-10">
                  <Button variant="secondary" loading={loading} onClick={() => fetchListings(page + 1, false)}>
                    Voir plus d&apos;iPhones
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ═══ POURQUOI TROKLY ═══ */}
      <section style={{ background: "white", borderTop: "1px solid rgba(11,26,43,0.07)" }} className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#00B070" }}>Notre engagement</p>
            <h2 className="text-3xl font-bold" style={{ color: "#0B1A2B" }}>Pourquoi choisir Trokly ?</h2>
            <p className="text-base mt-3 max-w-lg mx-auto" style={{ color: "#8A99AA" }}>
              Pas de mauvaises surprises, pas de vendeurs anonymes. Chaque iPhone passe par notre équipe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🔬",
                title: "Expertise rigoureuse",
                desc: "Écran, batterie, caméras, Face ID, châssis… Nos experts contrôlent chaque point avant la mise en vente.",
                points: ["9 points de contrôle", "Grade qualité A à D", "Photos officielles Trokly"],
              },
              {
                emoji: "🔒",
                title: "Paiement sécurisé",
                desc: "Le vendeur ne reçoit le paiement qu'après confirmation de livraison. Protection acheteur active à chaque transaction.",
                points: ["Séquestre jusqu'à livraison", "Remboursement si problème", "Retrait MoMo instantané"],
              },
              {
                emoji: "🔄",
                title: "Troc intelligent",
                desc: "Proposez votre iPhone en échange d'un autre. Notre IA estime la soulte juste, et vous négociez directement.",
                points: ["Estimation par IA", "Négociation en 3 rounds", "Soulte ou sans complément"],
              },
            ].map(({ emoji, title, desc, points }) => (
              <div key={title} className="rounded-2xl p-7" style={{ background: "#F7F5F0", border: "1px solid rgba(11,26,43,0.07)" }}>
                <div className="text-3xl mb-5">{emoji}</div>
                <h3 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>{title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#8A99AA" }}>{desc}</p>
                <ul className="space-y-2">
                  {points.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm" style={{ color: "#0B1A2B" }}>
                      <Check size={14} style={{ color: "#00D084", flexShrink: 0 }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TÉMOIGNAGES ═══ */}
      <section style={{ background: "#F7F5F0", borderTop: "1px solid rgba(11,26,43,0.07)" }} className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#00B070" }}>Avis clients</p>
            <h2 className="text-3xl font-bold" style={{ color: "#0B1A2B" }}>Ils nous font confiance</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, city, text, stars }) => (
              <div key={name} className="card p-6" style={{ background: "white" }}>
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} fill="#00D084" style={{ color: "#00D084" }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#0B1A2B" }}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "#0B1A2B", color: "#00D084" }}
                  >
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>{name}</p>
                    <p className="text-xs" style={{ color: "#8A99AA" }}>{city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VENDEUR CTA ═══ */}
      <section style={{ background: "#0B1A2B" }} className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#00D084" }}>Pour les vendeurs</p>
              <h2 className="text-3xl font-bold mb-4" style={{ color: "#F7F5F0", letterSpacing: "-0.02em" }}>
                Vendez votre iPhone en toute sécurité
              </h2>
              <p className="text-base mb-8 leading-relaxed" style={{ color: "rgba(247,245,240,0.5)" }}>
                Déposez votre annonce en 5 minutes. Notre équipe s'occupe de l'expertise, des photos et de la livraison. Vous encaissez sur MoMo, sans friction.
              </p>
              <Link href="/listings/new">
                <button className="btn btn-primary btn-lg">
                  Déposer mon iPhone
                  <ChevronRight size={16} />
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { step: "01", title: "Déposez", desc: "Remplissez le formulaire en 5 min" },
                { step: "02", title: "Expertise", desc: "Notre équipe inspecte votre téléphone" },
                { step: "03", title: "Publication", desc: "Votre annonce est mise en ligne" },
                { step: "04", title: "Encaissement", desc: "Paiement MoMo à la livraison" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-2xl p-4" style={{ background: "rgba(247,245,240,0.05)", border: "1px solid rgba(247,245,240,0.08)" }}>
                  <p className="text-xs font-bold font-mono mb-2" style={{ color: "#00D084" }}>{step}</p>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#F7F5F0" }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(247,245,240,0.4)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROMO TROC ═══ */}
      <section style={{ background: "white", borderTop: "1px solid rgba(11,26,43,0.07)" }} className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(0,208,132,0.1)" }}>
            <ArrowLeftRight size={24} style={{ color: "#00D084" }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0B1A2B" }}>Vous avez un iPhone à échanger ?</h2>
          <p className="mb-8 max-w-md mx-auto" style={{ color: "#8A99AA" }}>
            Trouvez un iPhone qui vous intéresse, proposez le vôtre en troc, et notre IA calcule la soulte équitable. Simple, rapide, transparent.
          </p>
          <button
            className="btn btn-lg"
            style={{ background: "#0B1A2B", color: "#00D084", border: "1px solid rgba(0,208,132,0.2)" }}
            onClick={() => { selectSeries(""); listingsRef.current?.scrollIntoView({ behavior: "smooth" }); }}
          >
            <ArrowLeftRight size={16} />
            Voir les annonces avec troc
          </button>
        </div>
      </section>

    </main>
  );
}
