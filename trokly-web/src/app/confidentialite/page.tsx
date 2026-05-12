export default function ConfidentialitePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Politique de confidentialité</h1>
      <p className="text-sm mb-10" style={{ color: "#8A99AA" }}>Dernière mise à jour : mai 2026</p>

      <div className="prose space-y-8" style={{ color: "#4A5568", lineHeight: 1.8 }}>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>1. Responsable du traitement</h2>
          <p>
            Trokly est une marketplace spécialisée dans la vente et le troc d'iPhones expertisés au Bénin.
            Le responsable du traitement des données personnelles est Trokly, joignable à l'adresse{" "}
            <a href="mailto:contact@trokly.bj" style={{ color: "#00B070" }}>contact@trokly.bj</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Nom complet et adresse email (lors de l'inscription)</li>
            <li>Numéro de téléphone (optionnel, pour la livraison)</li>
            <li>Documents d'identité (KYC : pièce d'identité, selfie)</li>
            <li>Données de transaction (montants, statuts)</li>
            <li>Photos des appareils mis en vente</li>
            <li>Adresse IP et données de navigation (cookies techniques)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>3. Finalités du traitement</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gestion des comptes utilisateurs et authentification</li>
            <li>Traitement des transactions et sécurisation des paiements</li>
            <li>Vérification de l'identité (KYC) conformément aux exigences légales</li>
            <li>Organisation des livraisons</li>
            <li>Envoi de notifications transactionnelles par email</li>
            <li>Amélioration de la plateforme et lutte contre la fraude</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>4. Base légale</h2>
          <p>
            Le traitement est fondé sur l'exécution du contrat (CGU acceptées), le respect d'obligations
            légales (KYC), ainsi que notre intérêt légitime à sécuriser la plateforme et prévenir les fraudes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>5. Conservation des données</h2>
          <p>
            Les données de compte sont conservées pendant toute la durée de la relation contractuelle,
            puis 3 ans après la clôture du compte. Les données KYC sont conservées 5 ans conformément
            aux obligations légales. Les documents de transaction sont conservés 10 ans.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>6. Partage des données</h2>
          <p>Vos données ne sont jamais vendues. Elles peuvent être partagées avec :</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Nos prestataires techniques (hébergement, email transactionnel, stockage photos)</li>
            <li>Les experts partenaires (uniquement les informations nécessaires à l'expertise)</li>
            <li>Les livreurs (nom, téléphone, adresse de livraison)</li>
            <li>Les autorités compétentes sur réquisition légale</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>7. Vos droits</h2>
          <p>
            Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et de portabilité
            de vos données. Pour exercer ces droits, contactez-nous à{" "}
            <a href="mailto:contact@trokly.bj" style={{ color: "#00B070" }}>contact@trokly.bj</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>8. Contact</h2>
          <p>
            Pour toute question relative à vos données personnelles :{" "}
            <a href="mailto:contact@trokly.bj" style={{ color: "#00B070" }}>contact@trokly.bj</a>{" "}
            · 01 96 17 13 00
          </p>
        </section>
      </div>
    </main>
  );
}
