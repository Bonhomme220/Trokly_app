import Link from "next/link";
import { Shield, MessageCircle, BadgeCheck, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "#0B1A2B", borderTop: "1px solid rgba(247,245,240,0.06)" }}>
      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <img src="/logo-horizontal-inverted.svg" alt="Trokly" style={{ height: 28, width: "auto", marginBottom: 16 }} />
          <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(247,245,240,0.45)" }}>
            La marketplace de référence pour acheter et vendre des iPhones expertisés au Bénin.
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(247,245,240,0.3)" }}>
            <MapPin size={12} />
            Cotonou, Bénin
          </div>
        </div>

        {/* Marketplace */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(247,245,240,0.3)" }}>
            Marketplace
          </p>
          <ul className="space-y-3">
            {[
              { label: "Tous les iPhones", href: "/" },
              { label: "iPhone 16 Series", href: "/?model=iPhone+16+Pro" },
              { label: "iPhone 15 Series", href: "/?model=iPhone+15+Pro" },
              { label: "iPhone 14 Series", href: "/?model=iPhone+14+Pro" },
              { label: "Tarifs vendeurs", href: "/tarifs" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(247,245,240,0.5)" }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Vendeurs */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(247,245,240,0.3)" }}>
            Vendeurs
          </p>
          <ul className="space-y-3">
            {[
              { label: "Déposer un iPhone", href: "/listings/new" },
              { label: "Nos tarifs", href: "/tarifs" },
              { label: "Mon dashboard", href: "/seller" },
              { label: "Vérification KYC", href: "/kyc" },
              { label: "Comment ça marche", href: "/comment-ca-marche" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(247,245,240,0.5)" }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(247,245,240,0.3)" }}>
            Contact
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-sm" style={{ color: "rgba(247,245,240,0.5)" }}>
              <Phone size={13} style={{ flexShrink: 0, color: "#00D084" }} />
              01 96 17 13 00
            </li>
            <li className="flex items-center gap-2 text-sm" style={{ color: "rgba(247,245,240,0.5)" }}>
              <Mail size={13} style={{ flexShrink: 0, color: "#00D084" }} />
              contact@trokly.bj
            </li>
            <li className="flex items-center gap-2 text-sm" style={{ color: "rgba(247,245,240,0.5)" }}>
              <MapPin size={13} style={{ flexShrink: 0, color: "#00D084" }} />
              Cotonou, Bénin
            </li>
          </ul>

          <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(247,245,240,0.07)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(247,245,240,0.3)" }}>Garanties</p>
            <div className="space-y-2">
              {[
                { icon: Shield,        label: "Expertisé Trokly" },
                { icon: MessageCircle, label: "Contact WhatsApp" },
                { icon: BadgeCheck,    label: "Vendeurs vérifiés" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={12} style={{ color: "#00D084", flexShrink: 0 }} />
                  <span className="text-xs" style={{ color: "rgba(247,245,240,0.45)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(247,245,240,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "rgba(247,245,240,0.25)" }}>
            © {new Date().getFullYear()} Trokly · Tous droits réservés · Cotonou, Bénin
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Confidentialité", href: "/confidentialite" },
              { label: "CGU", href: "/cgu" },
              { label: "Mentions légales", href: "/mentions-legales" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs transition-colors hover:text-white" style={{ color: "rgba(247,245,240,0.25)" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
