export default function MentionsLegalesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Mentions légales</h1>
      <p className="text-sm mb-10" style={{ color: "#8A99AA" }}>Dernière mise à jour : mai 2026</p>

      <div className="space-y-8" style={{ color: "#4A5568", lineHeight: 1.8 }}>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>Éditeur de la plateforme</h2>
          <p><strong style={{ color: "#0B1A2B" }}>Trokly</strong></p>
          <p>Marketplace iPhones expertisés</p>
          <p>Cotonou, Bénin</p>
          <p>
            Email :{" "}
            <a href="mailto:contact@trokly.bj" style={{ color: "#00B070" }}>contact@trokly.bj</a>
          </p>
          <p>Téléphone : 01 96 17 13 00</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>Hébergement</h2>
          <p>
            La plateforme Trokly est hébergée par{" "}
            <strong style={{ color: "#0B1A2B" }}>Render</strong> (render.com),
            525 Brannan St, Suite 300, San Francisco, CA 94107, États-Unis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments constituant la plateforme Trokly (logo, textes, interface, code)
            sont la propriété exclusive de Trokly. Toute reproduction, même partielle, sans autorisation
            écrite préalable est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>Limitation de responsabilité</h2>
          <p>
            Trokly agit en tant qu'intermédiaire entre acheteurs et vendeurs. Bien que chaque appareil
            soit expertisé par un partenaire, Trokly ne saurait être tenu responsable d'éventuels
            défauts non détectés lors de l'expertise. Trokly s'engage à traiter tout litige de manière
            impartiale dans les délais prévus aux CGU.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au droit béninois. En cas de litige,
            les tribunaux compétents de Cotonou, Bénin, seront seuls compétents.
          </p>
        </section>

      </div>
    </main>
  );
}
