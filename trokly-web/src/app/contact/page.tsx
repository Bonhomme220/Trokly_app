import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3" style={{ color: "#0B1A2B" }}>Contactez-nous</h1>
        <p className="text-base" style={{ color: "#8A99AA" }}>
          Une question, un problème ou une suggestion ? Nous sommes là pour vous aider.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-10">
        <div className="card p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,208,132,0.12)" }}>
            <Phone size={18} style={{ color: "#00B070" }} />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Téléphone</p>
            <a href="tel:0196171300" className="text-sm font-mono" style={{ color: "#8A99AA" }}>
              01 96 17 13 00
            </a>
          </div>
        </div>

        <div className="card p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,208,132,0.12)" }}>
            <Mail size={18} style={{ color: "#00B070" }} />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Email</p>
            <a href="mailto:contact@trokly.bj" className="text-sm" style={{ color: "#8A99AA" }}>
              contact@trokly.bj
            </a>
          </div>
        </div>

        <div className="card p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,208,132,0.12)" }}>
            <MapPin size={18} style={{ color: "#00B070" }} />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Localisation</p>
            <p className="text-sm" style={{ color: "#8A99AA" }}>Cotonou, Bénin</p>
          </div>
        </div>

        <div className="card p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,208,132,0.12)" }}>
            <Clock size={18} style={{ color: "#00B070" }} />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: "#0B1A2B" }}>Horaires</p>
            <p className="text-sm" style={{ color: "#8A99AA" }}>Lun – Sam · 8h à 18h</p>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="font-bold text-lg mb-6" style={{ color: "#0B1A2B" }}>Envoyer un message</h2>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0B1A2B" }}>Nom complet</label>
              <input className="input" placeholder="Votre nom" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0B1A2B" }}>Email</label>
              <input className="input" type="email" placeholder="votre@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0B1A2B" }}>Sujet</label>
            <input className="input" placeholder="Ex : Question sur une annonce" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0B1A2B" }}>Message</label>
            <textarea
              className="input min-h-[140px] resize-none"
              placeholder="Décrivez votre demande..."
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "#00D084", color: "#0B1A2B" }}
          >
            Envoyer le message
          </button>
        </form>
      </div>
    </main>
  );
}
