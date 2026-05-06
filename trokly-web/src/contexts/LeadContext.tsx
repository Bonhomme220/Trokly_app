"use client";

import { createContext, useContext, useState, useCallback } from "react";
import api from "@/lib/api";
import { X, Check } from "lucide-react";

interface LeadContextValue {
  openLeadModal: () => void;
}

const LeadContext = createContext<LeadContextValue>({ openLeadModal: () => {} });

export function useLeadModal() {
  return useContext(LeadContext);
}

const CITIES = ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Autre"];

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    profile: "" as "buyer" | "seller" | "both" | "",
    city: "",
    has_iphone_to_sell: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const openLeadModal = useCallback(() => {
    setSuccess(false);
    setError("");
    setOpen(true);
  }, []);

  async function submit() {
    setError("");
    if (!form.full_name.trim()) return setError("Entrez votre nom.");
    if (!form.phone_number.trim()) return setError("Entrez votre numéro WhatsApp.");
    if (!form.profile) return setError("Choisissez votre profil.");
    if (!form.city) return setError("Choisissez votre ville.");
    setLoading(true);
    try {
      await api.post("/leads", form);
      setSuccess(true);
    } catch {
      setError("Une erreur s'est produite. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setTimeout(() => {
      setSuccess(false);
      setError("");
      setForm({ full_name: "", phone_number: "", profile: "", city: "", has_iphone_to_sell: false });
    }, 300);
  }

  return (
    <LeadContext.Provider value={{ openLeadModal }}>
      {children}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(11,26,43,0.6)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 relative"
            style={{ background: "white", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(11,26,43,0.06)", color: "#0B1A2B" }}
            >
              <X size={15} />
            </button>

            {success ? (
              <div className="text-center py-6">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(0,208,132,0.12)" }}
                >
                  <Check size={28} style={{ color: "#00D084" }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Vous êtes sur la liste !</h2>
                <p className="text-sm" style={{ color: "#8A99AA" }}>
                  On vous contacte sur WhatsApp dès le lancement. Merci de votre confiance !
                </p>
                <button
                  className="mt-6 btn btn-primary w-full"
                  onClick={close}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                    style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    Pré-lancement
                  </span>
                  <h2 className="text-xl font-bold" style={{ color: "#0B1A2B" }}>
                    Rejoindre la liste d'attente
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>
                    Soyez parmi les premiers à accéder à Trokly au Bénin.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Nom */}
                  <input
                    className="input"
                    placeholder="Nom complet"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  />

                  {/* Téléphone */}
                  <input
                    className="input"
                    type="tel"
                    placeholder="Numéro WhatsApp (+229...)"
                    value={form.phone_number}
                    onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                  />

                  {/* Profil */}
                  <div>
                    <label className="text-xs font-semibold block mb-2" style={{ color: "#8A99AA" }}>Vous êtes</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "buyer", label: "Acheteur" },
                        { value: "seller", label: "Vendeur" },
                        { value: "both", label: "Les deux" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className="py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                          style={{
                            borderColor: form.profile === opt.value ? "#00D084" : "rgba(11,26,43,0.1)",
                            background: form.profile === opt.value ? "rgba(0,208,132,0.08)" : "white",
                            color: form.profile === opt.value ? "#00B070" : "#0B1A2B",
                          }}
                          onClick={() => setForm(f => ({ ...f, profile: opt.value as "buyer" | "seller" | "both" }))}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="text-xs font-semibold block mb-2" style={{ color: "#8A99AA" }}>Votre ville</label>
                    <div className="flex flex-wrap gap-2">
                      {CITIES.map(city => (
                        <button
                          key={city}
                          type="button"
                          className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                          style={{
                            borderColor: form.city === city ? "#00D084" : "rgba(11,26,43,0.1)",
                            background: form.city === city ? "rgba(0,208,132,0.08)" : "white",
                            color: form.city === city ? "#00B070" : "#0B1A2B",
                          }}
                          onClick={() => setForm(f => ({ ...f, city }))}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* iPhone à vendre */}
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl" style={{ background: "#F7F5F0" }}>
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderColor: form.has_iphone_to_sell ? "#00D084" : "rgba(11,26,43,0.2)",
                        background: form.has_iphone_to_sell ? "#00D084" : "white",
                      }}
                      onClick={() => setForm(f => ({ ...f, has_iphone_to_sell: !f.has_iphone_to_sell }))}
                    >
                      {form.has_iphone_to_sell && <Check size={12} color="white" />}
                    </div>
                    <span className="text-sm" style={{ color: "#0B1A2B" }}>
                      J'ai un iPhone à vendre ou à échanger
                    </span>
                  </label>

                  {error && <p className="text-xs" style={{ color: "#CC0000" }}>{error}</p>}

                  <button
                    className="btn btn-primary w-full"
                    onClick={submit}
                    disabled={loading}
                  >
                    {loading ? "Enregistrement…" : "Rejoindre la liste"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </LeadContext.Provider>
  );
}
