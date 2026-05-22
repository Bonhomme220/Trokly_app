import Link from "next/link";
import {
  Search, Shield, MessageCircle, CheckCircle, Camera,
  UserCheck, CreditCard, BadgeCheck, Zap, Phone
} from "lucide-react";

function Step({ number, icon: Icon, title, description, last }: {
  number: number;
  icon: typeof Search;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black"
          style={{ background: "#0B1A2B", color: "#00D084" }}
        >
          {number}
        </div>
        {!last && <div className="flex-1 w-px mt-2" style={{ background: "rgba(11,26,43,0.08)" }} />}
      </div>
      <div className={last ? "pb-0" : "pb-10"}>
        <div className="flex items-center gap-2 mb-2">
          <Icon size={16} style={{ color: "#00B070" }} />
          <h3 className="font-bold text-base" style={{ color: "#0B1A2B" }}>{title}</h3>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#4A5568" }}>{description}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-14">
      <h2 className="text-2xl font-bold mb-8" style={{ color: "#0B1A2B" }}>{title}</h2>
      {children}
    </div>
  );
}

export default function CommentCaMarchePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">

      {/* Hero */}
      <div className="text-center mb-16">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
          style={{ background: "rgba(0,208,132,0.12)", color: "#00B070" }}
        >
          <CheckCircle size={12} /> 100% expertisé · Contact WhatsApp direct
        </div>
        <h1 className="text-4xl font-black mb-4" style={{ color: "#0B1A2B" }}>Comment ça marche ?</h1>
        <p className="text-base leading-relaxed" style={{ color: "#8A99AA" }}>
          Trokly est la marketplace d'iPhones certifiés au Bénin. Les vendeurs paient pour publier une annonce,
          les acheteurs contactent directement par WhatsApp. Simple, rapide, de confiance.
        </p>
      </div>

      {/* Acheter */}
      <Section title="🛍️ Acheter un iPhone">
        <Step number={1} icon={Search}
          title="Parcourez les annonces"
          description="Filtrez par modèle, capacité, état et prix. Les annonces avec un badge iPhone vérifié ou Vendeur vérifié ont été contrôlées par notre équipe. Les annonces TOP apparaissent en premier."
        />
        <Step number={2} icon={Shield}
          title="Consultez la fiche annonce"
          description="Chaque fiche présente les photos, la note de condition (A à D), le profil du vendeur et son badge de vérification. Toutes les infos pour prendre votre décision."
        />
        <Step number={3} icon={MessageCircle}
          title="Contactez le vendeur sur WhatsApp"
          description="Cliquez sur le bouton WhatsApp de l'annonce pour ouvrir une discussion directe avec le vendeur. Posez vos questions, négociez le prix si nécessaire."
        />
        <Step number={4} icon={Phone}
          title="Finalisez la transaction"
          description="Mettez-vous d'accord avec le vendeur pour un rendez-vous ou une remise en main propre. Le paiement se fait directement entre vous — aucun intermédiaire financier."
          last
        />
      </Section>

      {/* Vendre */}
      <Section title="💰 Vendre votre iPhone">
        <Step number={1} icon={Camera}
          title="Créez votre annonce"
          description="Renseignez le modèle, l'état, la capacité, uploadez vos photos et indiquez votre numéro WhatsApp. Les acheteurs vous contacteront directement sur ce numéro."
        />
        <Step number={2} icon={BadgeCheck}
          title="Choisissez votre formule"
          description="Basic (499 FCFA) : annonce publiée immédiatement. iPhone vérifié (1 499 FCFA) : expertise physique + badge de confiance. Vendeur vérifié (2 999 FCFA) : KYC + expertise + badge premium. Option TOP +500 FCFA pour apparaître en tête des résultats."
        />
        <Step number={3} icon={CreditCard}
          title="Payez en ligne"
          description="Réglez votre formule en toute sécurité via PayPlus Africa : MoMo, Flooz ou carte bancaire. Une fois le paiement confirmé, votre annonce est activée."
        />
        <Step number={4} icon={Shield}
          title="Expertise chez un partenaire (formules payantes)"
          description="Pour les formules iPhone vérifié et Vendeur vérifié, vous recevez un email avec l'adresse d'un expert partenaire Trokly près de chez vous. Apportez votre iPhone et une pièce d'identité. L'expertise prend environ 20 minutes."
        />
        <Step number={5} icon={CheckCircle}
          title="Votre annonce est publiée"
          description="Après validation, votre annonce est visible sur la marketplace. Vous recevez les contacts d'acheteurs intéressés directement sur WhatsApp."
        />
        <Step number={6} icon={MessageCircle}
          title="Vendez et marquez comme vendu"
          description="Les acheteurs vous contactent sur WhatsApp. Vous organisez la remise en main propre et encaissez directement. Revenez sur votre dashboard pour marquer l'annonce comme vendue."
          last
        />
      </Section>

      {/* Formules et tarifs */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold mb-8" style={{ color: "#0B1A2B" }}>📋 Formules et tarifs</h2>
        <div className="space-y-3">
          {[
            {
              name: "Basic",
              price: "499 FCFA",
              badge: null,
              features: ["Publication immédiate", "30 jours d'exposition", "Contact WhatsApp direct"],
              color: "#0B1A2B",
            },
            {
              name: "iPhone vérifié",
              price: "1 499 FCFA",
              badge: "iPhone vérifié",
              features: ["Expertise physique par un expert", "Badge iPhone vérifié sur l'annonce", "30 jours d'exposition", "Contact WhatsApp direct"],
              color: "#00B070",
            },
            {
              name: "Vendeur vérifié",
              price: "2 999 FCFA",
              badge: "Vendeur vérifié",
              features: ["KYC + expertise physique", "Badge Vendeur vérifié sur votre profil", "30 jours d'exposition", "Contact WhatsApp direct"],
              color: "#0B1A2B",
              featured: true,
            },
          ].map(({ name, price, badge, features, color, featured }) => (
            <div
              key={name}
              className="rounded-2xl p-5"
              style={{
                background: featured ? "#0B1A2B" : "#F7F5F0",
                border: `1px solid ${featured ? "#0B1A2B" : "rgba(11,26,43,0.08)"}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-base" style={{ color: featured ? "white" : "#0B1A2B" }}>{name}</p>
                  {badge && (
                    <span
                      className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: featured ? "rgba(0,208,132,0.15)" : "rgba(0,208,132,0.12)",
                        color: "#00D084",
                      }}
                    >
                      <BadgeCheck size={10} /> {badge}
                    </span>
                  )}
                </div>
                <p className="font-black text-lg font-mono" style={{ color: featured ? "#00D084" : color }}>{price}</p>
              </div>
              <ul className="space-y-1.5">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: featured ? "rgba(247,245,240,0.65)" : "#4A5568" }}>
                    <CheckCircle size={13} style={{ color: "#00D084", flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* TOP Boost */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-base flex items-center gap-2" style={{ color: "#0B1A2B" }}>
                  <Zap size={16} style={{ color: "#F59E0B" }} /> Option TOP
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>À ajouter à n'importe quelle formule</p>
              </div>
              <p className="font-black text-lg font-mono" style={{ color: "#F59E0B" }}>+500 FCFA</p>
            </div>
            <ul className="space-y-1.5">
              {["Annonce épinglée en tête des résultats", "Badge TOP visible sur la fiche", "Visibilité maximale pendant 30 jours"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#4A5568" }}>
                  <CheckCircle size={13} style={{ color: "#F59E0B", flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Garanties */}
      <div className="card p-8 text-center" style={{ background: "#0B1A2B" }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "white" }}>Les engagements Trokly</h2>
        <p className="text-sm mb-8" style={{ color: "rgba(247,245,240,0.5)" }}>
          Une marketplace transparente, des vendeurs identifiés.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield,       label: "Expertisé",            desc: "Chaque iPhone des formules premium contrôlé physiquement par un expert" },
            { icon: MessageCircle, label: "Contact direct",       desc: "Le numéro WhatsApp du vendeur visible sur chaque annonce" },
            { icon: UserCheck,    label: "Identité vérifiée",    desc: "KYC et badges de confiance pour les vendeurs premium" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label}>
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(0,208,132,0.15)" }}>
                <Icon size={18} style={{ color: "#00D084" }} />
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: "white" }}>{label}</p>
              <p className="text-xs" style={{ color: "rgba(247,245,240,0.45)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="inline-block mt-8 px-8 py-3 rounded-xl font-bold text-sm"
          style={{ background: "#00D084", color: "#0B1A2B" }}
        >
          Voir les iPhones disponibles
        </Link>
      </div>

    </main>
  );
}
