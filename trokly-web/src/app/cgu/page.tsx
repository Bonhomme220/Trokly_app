export default function CguPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Conditions Générales d'Utilisation</h1>
      <p className="text-sm mb-10" style={{ color: "#8A99AA" }}>Dernière mise à jour : mai 2026</p>

      <div className="space-y-8" style={{ color: "#4A5568", lineHeight: 1.8 }}>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>1. Objet</h2>
          <p>
            Trokly est une marketplace en ligne permettant à des particuliers de vendre, acheter et
            troquer des iPhones expertisés au Bénin. Les présentes CGU régissent l'utilisation de la
            plateforme accessible sur trokly.bj.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>2. Inscription et compte</h2>
          <p>
            L'inscription est gratuite et ouverte à toute personne physique majeure. L'utilisateur s'engage
            à fournir des informations exactes lors de la création de son compte et à les maintenir à jour.
            Chaque compte est strictement personnel et ne peut être cédé à un tiers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>3. Vérification d'identité (KYC)</h2>
          <p>
            Afin de sécuriser les transactions, Trokly exige une vérification d'identité avant toute mise
            en vente ou retrait de fonds. L'utilisateur doit fournir une pièce d'identité valide et un
            selfie. Trokly se réserve le droit de refuser ou suspendre un compte dont le KYC est incomplet
            ou frauduleux.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>4. Mise en vente d'un iPhone</h2>
          <p>
            Tout iPhone mis en vente sur Trokly doit être déposé auprès d'un expert partenaire pour
            vérification physique. L'expert contrôle l'état de l'appareil, ses caractéristiques et son
            authenticité. En cas de non-conformité, l'appareil est restitué au vendeur sans publication.
          </p>
          <p className="mt-2">
            Le vendeur garantit être le propriétaire légitime de l'appareil et que celui-ci n'est pas
            volé, bloqué (iCloud ou opérateur) ou sous financement en cours.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>5. Transactions et paiements</h2>
          <p>
            Les paiements sont sécurisés via PayPlus Africa. Le montant de la vente est séquestré par
            Trokly jusqu'à confirmation de la livraison. Une commission est prélevée sur chaque transaction
            (taux communiqué lors de la mise en vente).
          </p>
          <p className="mt-2">
            L'acheteur dispose d'un délai de rétractation de 72 heures après réception pour signaler
            une non-conformité. Passé ce délai, les fonds sont libérés au vendeur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>6. Troc</h2>
          <p>
            Le troc permet l'échange de deux iPhones entre utilisateurs, avec ou sans soulte. Après accord
            des deux parties, chaque téléphone est soumis à expertise. Si les deux appareils sont validés,
            l'échange est organisé par Trokly. En cas de désaccord sur l'état d'un appareil, un litige peut
            être ouvert.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>7. Livraison</h2>
          <p>
            Trokly assure la livraison des appareils via ses livreurs partenaires. Le livreur effectue un
            contrôle visuel à la collecte (pickup check). En cas de différence constatée avec l'état expertisé,
            la transaction est suspendue et les parties notifiées.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>8. Litiges</h2>
          <p>
            En cas de litige entre acheteur et vendeur, Trokly joue le rôle d'arbitre. Sa décision
            (remboursement acheteur ou libération vendeur) est définitive et s'impose aux deux parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>9. Comportements interdits</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Vente d'appareils volés, bloqués ou sous engagement de financement</li>
            <li>Usurpation d'identité ou falsification de documents KYC</li>
            <li>Tentative de contournement de la plateforme (paiement direct hors Trokly)</li>
            <li>Publication d'informations mensongères dans les annonces</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>10. Suspension et résiliation</h2>
          <p>
            Trokly se réserve le droit de suspendre ou supprimer tout compte ne respectant pas les
            présentes CGU, sans préavis ni indemnité. Les fonds légitimement dus restent restitués
            après traitement des éventuels litiges en cours.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0B1A2B" }}>11. Contact</h2>
          <p>
            Pour toute question :{" "}
            <a href="mailto:contact@trokly.bj" style={{ color: "#00B070" }}>contact@trokly.bj</a>{" "}
            · 01 96 17 13 00
          </p>
        </section>

      </div>
    </main>
  );
}
