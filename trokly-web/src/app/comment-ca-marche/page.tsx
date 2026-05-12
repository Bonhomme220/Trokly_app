import Link from "next/link";
import { Search, Shield, Truck, Wallet, ArrowLeftRight, CheckCircle, Camera, UserCheck } from "lucide-react";

function Step({ number, icon: Icon, title, description }: {
  number: number;
  icon: typeof Search;
  title: string;
  description: string;
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
        <div className="flex-1 w-px mt-2" style={{ background: "rgba(11,26,43,0.08)" }} />
      </div>
      <div className="pb-10">
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
          <CheckCircle size={12} /> 100% expertisé · Livraison sécurisée
        </div>
        <h1 className="text-4xl font-black mb-4" style={{ color: "#0B1A2B" }}>Comment ça marche ?</h1>
        <p className="text-base leading-relaxed" style={{ color: "#8A99AA" }}>
          Trokly est la marketplace qui garantit chaque iPhone par une expertise physique
          avant publication. Voici comment se passe chaque étape.
        </p>
      </div>

      {/* Acheter */}
      <Section title="🛍️ Acheter un iPhone">
        <Step number={1} icon={Search}
          title="Parcourez les annonces"
          description="Tous les iPhones listés sur Trokly ont déjà été expertisés physiquement par un partenaire certifié. Filtrez par modèle, capacité, état et prix."
        />
        <Step number={2} icon={Shield}
          title="Passez commande en toute sécurité"
          description="Votre paiement est sécurisé via PayPlus Africa et séquestré par Trokly jusqu'à confirmation de livraison. Vous ne risquez rien."
        />
        <Step number={3} icon={Truck}
          title="Recevez votre iPhone"
          description="Un livreur Trokly vous livre le téléphone à votre adresse sous 24–48h. Il effectue un contrôle visuel avant la remise."
        />
        <Step number={4} icon={CheckCircle}
          title="Période de rétractation 72h"
          description="Après réception, vous avez 72 heures pour signaler un problème. Si tout est conforme, le vendeur est payé et la transaction est clôturée."
        />
      </Section>

      {/* Vendre */}
      <Section title="💰 Vendre votre iPhone">
        <Step number={1} icon={Camera}
          title="Créez votre annonce"
          description="Renseignez le modèle, l'état, la capacité et publiez des photos claires de votre iPhone. Votre annonce est soumise à validation."
        />
        <Step number={2} icon={Shield}
          title="Expertise chez un partenaire"
          description="Vous recevrez par email l'adresse d'un expert partenaire Trokly près de chez vous. Apportez votre iPhone avec une pièce d'identité. L'expertise dure environ 20 minutes, devant vous."
        />
        <Step number={3} icon={CheckCircle}
          title="Publication et vente"
          description="Si votre iPhone est conforme, il est publié sur la marketplace. Vous serez notifié dès qu'un acheteur passe commande."
        />
        <Step number={4} icon={Truck}
          title="Le livreur récupère votre téléphone"
          description="Un livreur Trokly passe chez vous pour récupérer l'appareil et le remettre à l'acheteur. Il vérifie l'état au moment du pickup."
        />
        <Step number={5} icon={Wallet}
          title="Recevez votre argent"
          description="Après confirmation de livraison et expiration du délai de rétractation (72h), le montant est crédité sur votre wallet Trokly. Retirez ensuite vers votre Mobile Money."
        />
      </Section>

      {/* Troquer */}
      <Section title="🔄 Troquer votre iPhone">
        <Step number={1} icon={ArrowLeftRight}
          title="Proposez un troc"
          description="Consultez les annonces qui acceptent le troc et proposez votre iPhone en échange. Vous pouvez négocier une soulte si les valeurs ne sont pas équivalentes."
        />
        <Step number={2} icon={CheckCircle}
          title="Accord entre les deux parties"
          description="Les deux parties négocient jusqu'à 3 rounds d'offres. Dès qu'un accord est trouvé, les deux téléphones doivent être expertisés."
        />
        <Step number={3} icon={Shield}
          title="Double expertise"
          description="Chaque propriétaire amène son iPhone chez un expert partenaire Trokly. Les deux appareils sont vérifiés indépendamment avant l'échange."
        />
        <Step number={4} icon={Truck}
          title="Échange organisé par Trokly"
          description="Une fois les deux téléphones validés, Trokly organise l'échange. Si une soulte est due, elle transite également via Trokly."
        />
      </Section>

      {/* Garanties */}
      <div className="card p-8 text-center" style={{ background: "#0B1A2B" }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "white" }}>Les garanties Trokly</h2>
        <p className="text-sm mb-8" style={{ color: "rgba(247,245,240,0.5)" }}>
          Chaque transaction est protégée de bout en bout.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, label: "Expertisé", desc: "Chaque iPhone vérifié physiquement par un expert" },
            { icon: Wallet, label: "Paiement sécurisé", desc: "Fonds séquestrés jusqu'à livraison confirmée" },
            { icon: UserCheck, label: "Identité vérifiée", desc: "KYC obligatoire pour tous les vendeurs" },
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
