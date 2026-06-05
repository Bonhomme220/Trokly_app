import Link from "next/link";
import { Check, Zap, BadgeCheck, MessageCircle, Shield, ChevronRight, Crown } from "lucide-react";

const PLANS = [
  {
    key: "basic",
    name: "Basic",
    price: 499,
    badge: null,
    highlight: false,
    tagline: "Pour commencer à vendre rapidement",
    features: [
      "Publication immédiate après paiement",
      "Annonce active pendant 30 jours",
      "Numéro WhatsApp visible pour les acheteurs",
      "Photos uploadées par le vendeur",
      "Accès au dashboard vendeur",
    ],
    notIncluded: [
      "Badge de vérification",
      "Expertise physique Trokly",
    ],
  },
  {
    key: "verified_phone",
    name: "iPhone vérifié",
    price: 1499,
    badge: "iPhone vérifié",
    highlight: false,
    tagline: "Pour vendre plus vite avec la confiance",
    features: [
      "Expertise physique chez un partenaire Trokly",
      "Badge « iPhone vérifié » sur l'annonce",
      "Annonce active pendant 30 jours",
      "Numéro WhatsApp visible pour les acheteurs",
      "Photos officielles Trokly",
      "Priorité dans les résultats",
    ],
    notIncluded: [
      "Badge Vendeur vérifié (KYC)",
    ],
  },
  {
    key: "verified_seller",
    name: "Vendeur vérifié",
    price: 2999,
    badge: "Vendeur vérifié",
    highlight: true,
    tagline: "Pour les vendeurs sérieux et réguliers",
    features: [
      "Vérification d'identité (KYC)",
      "Expertise physique chez un partenaire Trokly",
      "Badge « Vendeur vérifié » sur votre profil",
      "Badge « iPhone vérifié » sur l'annonce",
      "Annonce active pendant 30 jours",
      "Numéro WhatsApp visible pour les acheteurs",
      "Photos officielles Trokly",
      "Priorité maximale dans les résultats",
    ],
    notIncluded: [],
  },
];

export default function TarifsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-16">

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
          style={{ background: "rgba(0,208,132,0.12)", color: "#00B070" }}>
          <BadgeCheck size={12} /> Transparent · Sans commission sur la vente
        </div>
        <h1 className="text-4xl font-black mb-4" style={{ color: "#0B1A2B" }}>Tarifs vendeurs</h1>
        <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: "#8A99AA" }}>
          Vous payez une fois pour publier votre annonce. Aucune commission prélevée sur votre vente —
          la transaction se fait directement avec l'acheteur sur WhatsApp.
        </p>
      </div>

      {/* Abonnement Pro */}
      <div className="rounded-2xl overflow-hidden mb-10"
        style={{ border: "2px solid rgba(0,208,132,0.4)", boxShadow: "0 6px 32px rgba(0,0,0,0.1)" }}>
        <div className="p-6 flex flex-col md:flex-row items-center gap-6" style={{ background: "#0B1A2B" }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={16} style={{ color: "#00D084" }} />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(0,208,132,0.15)", color: "#00D084" }}>
                ABONNEMENT PRO — NOUVEAU
              </span>
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: "white" }}>
              Annonces illimitées pendant 30 jours
            </h2>
            <p className="text-sm mb-3" style={{ color: "rgba(247,245,240,0.5)" }}>
              Un abonnement mensuel couvre toutes vos publications. Badge Vendeur vérifié automatique.
              iPhone vérifié et TOP boost disponibles en option sur chaque annonce.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                "Annonces illimitées",
                "Badge Vendeur vérifié",
                "Option iPhone vérifié (+1 499 F)",
                "Option TOP boost (+500 F)",
              ].map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs"
                  style={{ color: "rgba(247,245,240,0.7)" }}>
                  <Check size={11} style={{ color: "#00D084", flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="text-center">
              <span className="text-4xl font-black font-mono" style={{ color: "#00D084" }}>4 999</span>
              <span className="text-sm font-bold ml-1" style={{ color: "rgba(247,245,240,0.5)" }}>FCFA</span>
              <p className="text-xs mt-0.5" style={{ color: "rgba(247,245,240,0.35)" }}>par mois</p>
            </div>
            <Link href="/abonnement"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap"
              style={{ background: "#00D084", color: "#0B1A2B" }}>
              <Crown size={14} /> Voir l'abonnement Pro
            </Link>
          </div>
        </div>
        <div className="px-6 py-3 text-xs" style={{ background: "rgba(0,208,132,0.06)", color: "#00B070" }}>
          💡 Idéal si vous vendez plus d'un iPhone par mois — rentable dès la 2ème annonce.
        </div>
      </div>

      {/* Plans à l'unité */}
      <h2 className="text-xl font-bold mb-5 text-center" style={{ color: "#0B1A2B" }}>Ou publiez à l'unité</h2>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {PLANS.map(plan => (
          <div
            key={plan.key}
            className="rounded-2xl p-7 flex flex-col"
            style={{
              background: plan.highlight ? "#0B1A2B" : "white",
              border: plan.highlight ? "none" : "1px solid rgba(11,26,43,0.1)",
              boxShadow: plan.highlight ? "0 8px 32px rgba(0,0,0,0.18)" : "none",
            }}
          >
            {/* Badge plan */}
            {plan.badge && (
              <div className="flex items-center gap-1.5 mb-4">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: plan.highlight ? "rgba(0,208,132,0.15)" : "rgba(0,176,112,0.1)",
                    color: plan.highlight ? "#00D084" : "#00B070",
                  }}>
                  <BadgeCheck size={11} /> {plan.badge}
                </span>
              </div>
            )}

            <h2 className="text-xl font-black mb-1" style={{ color: plan.highlight ? "white" : "#0B1A2B" }}>
              {plan.name}
            </h2>
            <p className="text-sm mb-5" style={{ color: plan.highlight ? "rgba(247,245,240,0.5)" : "#8A99AA" }}>
              {plan.tagline}
            </p>

            {/* Prix */}
            <div className="mb-6">
              <span className="text-4xl font-black font-mono" style={{ color: plan.highlight ? "#00D084" : "#0B1A2B" }}>
                {plan.price.toLocaleString("fr-FR")}
              </span>
              <span className="text-sm font-semibold ml-1" style={{ color: plan.highlight ? "rgba(247,245,240,0.5)" : "#8A99AA" }}>
                FCFA
              </span>
              <p className="text-xs mt-1" style={{ color: plan.highlight ? "rgba(247,245,240,0.35)" : "#8A99AA" }}>
                paiement unique · par annonce
              </p>
            </div>

            {/* Features incluses */}
            <ul className="space-y-2.5 mb-5 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm"
                  style={{ color: plan.highlight ? "rgba(247,245,240,0.8)" : "#4A5568" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#00D084" }} />
                  {f}
                </li>
              ))}
              {plan.notIncluded.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm line-through"
                  style={{ color: plan.highlight ? "rgba(247,245,240,0.25)" : "rgba(11,26,43,0.2)" }}>
                  <span className="w-3.5 flex-shrink-0 mt-0.5 text-center" style={{ fontSize: 12 }}>–</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link href="/listings/new"
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: plan.highlight ? "#00D084" : "#0B1A2B",
                color: plan.highlight ? "#0B1A2B" : "white",
              }}>
              Déposer mon iPhone
              <ChevronRight size={15} />
            </Link>
          </div>
        ))}
      </div>

      {/* Boost TOP */}
      <div className="rounded-2xl p-6 mb-14 flex items-center gap-5"
        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(245,158,11,0.15)" }}>
          <Zap size={22} style={{ color: "#F59E0B" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base" style={{ color: "#0B1A2B" }}>Option TOP</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
              +500 FCFA
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#4A5568" }}>
            À ajouter à n'importe quelle formule au moment du dépôt. Votre annonce est épinglée en tête
            des résultats et affiche le badge TOP. Durée : 30 jours (identique à l'annonce).
          </p>
        </div>
      </div>

      {/* Comparatif rapide */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: "#0B1A2B" }}>Comparatif</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(11,26,43,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#0B1A2B" }}>
                <th className="text-left px-5 py-4 font-semibold" style={{ color: "rgba(247,245,240,0.5)" }}>Fonctionnalité</th>
                {PLANS.map(p => (
                  <th key={p.key} className="px-4 py-4 font-bold text-center" style={{ color: p.highlight ? "#00D084" : "white" }}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Prix",                  values: ["499 FCFA", "1 499 FCFA", "2 999 FCFA"] },
                { label: "Durée annonce",          values: ["30 jours", "30 jours", "30 jours"] },
                { label: "Contact WhatsApp",       values: [true, true, true] },
                { label: "Publication immédiate",  values: [true, false, false] },
                { label: "Expertise physique",     values: [false, true, true] },
                { label: "Badge iPhone vérifié",   values: [false, true, true] },
                { label: "Vérification identité (KYC)", values: [false, false, true] },
                { label: "Badge Vendeur vérifié",  values: [false, false, true] },
                { label: "Option TOP disponible",  values: [true, true, true] },
              ].map(({ label, values }, ri) => (
                <tr key={label} style={{ background: ri % 2 === 0 ? "white" : "#F7F5F0" }}>
                  <td className="px-5 py-3.5 font-medium" style={{ color: "#0B1A2B" }}>{label}</td>
                  {values.map((v, ci) => (
                    <td key={ci} className="px-4 py-3.5 text-center">
                      {typeof v === "boolean"
                        ? v
                          ? <span style={{ color: "#00B070", fontSize: 18 }}>✓</span>
                          : <span style={{ color: "rgba(11,26,43,0.2)", fontSize: 16 }}>–</span>
                        : <span className="font-bold font-mono" style={{ color: "#0B1A2B" }}>{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Garanties */}
      <div className="grid md:grid-cols-3 gap-4 mb-14">
        {[
          { icon: Shield,        title: "Aucune commission",      desc: "Vous vendez au prix que vous fixez. Trokly ne prend rien sur la transaction." },
          { icon: MessageCircle, title: "Contact direct",         desc: "L'acheteur vous contacte directement sur WhatsApp. Aucun intermédiaire." },
          { icon: BadgeCheck,    title: "Crédit si rejet",        desc: "Si votre iPhone n'est pas accepté à l'expertise, vous recevez un crédit pour republier gratuitement." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl p-5 flex gap-4"
            style={{ background: "#F7F5F0", border: "1px solid rgba(11,26,43,0.07)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,208,132,0.12)" }}>
              <Icon size={18} style={{ color: "#00D084" }} />
            </div>
            <div>
              <p className="font-bold text-sm mb-1" style={{ color: "#0B1A2B" }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "#8A99AA" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ rapide */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "#0B1A2B" }}>Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            {
              q: "Est-ce que Trokly prend une commission sur ma vente ?",
              a: "Non. Vous payez uniquement pour publier votre annonce. La vente se fait directement entre vous et l'acheteur via WhatsApp. Trokly ne touche rien sur le montant de la transaction.",
            },
            {
              q: "Que se passe-t-il si mon iPhone est refusé à l'expertise ?",
              a: "Votre annonce n'est pas publiée, mais vous recevez automatiquement un crédit de republication. Ce crédit vous permet de déposer une nouvelle annonce gratuitement.",
            },
            {
              q: "Quelle est la différence entre « iPhone vérifié » et « Vendeur vérifié » ?",
              a: "Le badge iPhone vérifié certifie l'état de l'appareil vendu (expertise physique). Le badge Vendeur vérifié certifie votre identité (KYC) en plus de l'expertise — il reste attaché à votre profil pour toutes vos annonces futures.",
            },
            {
              q: "Puis-je choisir le plan Basic et passer à une formule supérieure plus tard ?",
              a: "Pas pour la même annonce. Chaque annonce est liée à la formule choisie au moment du dépôt. Vous pouvez en revanche créer une nouvelle annonce avec la formule de votre choix.",
            },
            {
              q: "Combien de temps dure mon annonce ?",
              a: "30 jours à partir de la date de publication. Passé ce délai, elle est automatiquement dépubliée. Vous pouvez la republier en payant une nouvelle fois (ou en utilisant un crédit si vous en avez).",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-2xl p-5" style={{ background: "#F7F5F0", border: "1px solid rgba(11,26,43,0.07)" }}>
              <p className="font-semibold text-sm mb-2" style={{ color: "#0B1A2B" }}>{q}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#8A99AA" }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA final */}
      <div className="rounded-2xl p-10 text-center" style={{ background: "#0B1A2B" }}>
        <h2 className="text-2xl font-bold mb-3" style={{ color: "white" }}>Prêt à vendre votre iPhone ?</h2>
        <p className="text-sm mb-7 max-w-md mx-auto" style={{ color: "rgba(247,245,240,0.5)" }}>
          Déposez votre annonce en 5 minutes. Choisissez votre formule, payez en ligne, et les acheteurs vous contactent sur WhatsApp.
        </p>
        <Link href="/listings/new"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm"
          style={{ background: "#00D084", color: "#0B1A2B" }}>
          Déposer mon iPhone
          <ChevronRight size={15} />
        </Link>
      </div>

    </main>
  );
}
