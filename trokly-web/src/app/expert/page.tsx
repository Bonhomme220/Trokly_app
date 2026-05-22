"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Listing } from "@/lib/types";
import { formatDate, formatPrice, CONDITION_LABELS } from "@/lib/utils";
import Button from "@/components/ui/Button";
import {
  Microscope, CheckCircle, XCircle, ChevronDown, ChevronUp,
  MessageCircle, Battery, Package, Smartphone,
} from "lucide-react";

// ─── Checklist items (boolean) ────────────────────────────────────────────────
const CHECKLIST_ITEMS: { key: string; label: string; icon?: string }[] = [
  { key: "ecran_intact",      label: "Écran intact (aucune fissure, aucune marque)" },
  { key: "chassis_intact",    label: "Châssis intact (aucun choc, aucune déformation)" },
  { key: "face_id_ok",        label: "Face ID / Touch ID fonctionnel" },
  { key: "cameras_ok",        label: "Caméras (avant + arrière) opérationnelles" },
  { key: "boutons_ok",        label: "Boutons (volume, power, silencieux) OK" },
  { key: "haut_parleur_ok",   label: "Haut-parleur et micro fonctionnels" },
  { key: "sim_ok",            label: "Connecteur SIM + carte nano-SIM OK" },
  { key: "icloud_deconnecte", label: "iCloud déconnecté — aucun blocage d'activation" },
  { key: "wifi_bt_ok",        label: "WiFi et Bluetooth fonctionnels" },
  { key: "chargeur_inclus",   label: "Chargeur / câble inclus" },
  { key: "boite_incluse",     label: "Boîte d'origine incluse" },
];

const GRADES = [
  { value: "A", label: "Grade A", desc: "Comme neuf, aucun défaut visible" },
  { value: "B", label: "Grade B", desc: "Légères traces d'usage, tout fonctionne" },
  { value: "C", label: "Grade C", desc: "Marques visibles mais appareil fonctionnel" },
];

interface ExpertiseListing extends Listing {
  expertise?: { id: number };
}

interface FormState {
  checklist: Record<string, boolean>;
  battery_health: number;   // 0–100
  grade: string;
  notes: string;
  expertiseId?: number;
  started: boolean;
  submitting: boolean;
  done: boolean;
  error: string;
}

const defaultForm = (): FormState => ({
  checklist: Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, false])),
  battery_health: 80,
  grade: "B",
  notes: "",
  started: false,
  submitting: false,
  done: false,
  error: "",
});

export default function ExpertPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<ExpertiseListing[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [forms, setForms] = useState<Record<number, FormState>>({});

  const isExpert = user?.roles?.some(r => ["expert", "admin", "super_admin"].includes(r));

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isExpert)) router.push("/");
  }, [loading, isAuthenticated, isExpert, router]);

  useEffect(() => {
    if (!isExpert) return;
    api.get("/expert/queue")
      .then(res => setQueue(res.data.data || res.data || []))
      .finally(() => setDataLoading(false));
  }, [isExpert]);

  function getForm(id: number): FormState {
    return forms[id] ?? defaultForm();
  }

  function patchForm(id: number, patch: Partial<FormState>) {
    setForms(prev => ({ ...prev, [id]: { ...getForm(id), ...patch } }));
  }

  function setCheck(listingId: number, key: string, val: boolean) {
    const f = getForm(listingId);
    patchForm(listingId, { checklist: { ...f.checklist, [key]: val } });
  }

  function toggle(listing: ExpertiseListing) {
    if (!forms[listing.id]) setForms(p => ({ ...p, [listing.id]: defaultForm() }));
    setActiveId(prev => prev === listing.id ? null : listing.id);
  }

  async function startExpertise(listing: ExpertiseListing) {
    patchForm(listing.id, { submitting: true, error: "" });
    try {
      const res = await api.post(`/expert/expertises/${listing.id}/start`);
      patchForm(listing.id, { started: true, expertiseId: res.data.expertise?.id, submitting: false });
    } catch {
      patchForm(listing.id, { submitting: false, error: "Impossible de démarrer l'expertise." });
    }
  }

  async function submitExpertise(listing: ExpertiseListing) {
    const f = getForm(listing.id);
    if (!f.expertiseId) return;
    patchForm(listing.id, { submitting: true, error: "" });
    try {
      await api.put(`/expert/expertises/${f.expertiseId}`, {
        quality_grade: f.grade,
        checklist: { ...f.checklist, battery_health: f.battery_health },
        notes: f.notes || null,
      });
      patchForm(listing.id, { done: true, submitting: false });
      setQueue(q => q.map(l => l.id === listing.id ? { ...l, status: "under_expertise" as const } : l));
    } catch {
      patchForm(listing.id, { submitting: false, error: "Erreur lors de la soumission." });
    }
  }

  if (loading) return null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,208,132,0.1)" }}>
          <Microscope size={20} style={{ color: "#00D084" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>Rapports de vérification</h1>
          <p className="text-sm" style={{ color: "#8A99AA" }}>
            {dataLoading ? "Chargement…" : `${queue.length} iPhone${queue.length !== 1 ? "s" : ""} à vérifier`}
          </p>
        </div>
      </div>

      {dataLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: "#E8E4DF" }} />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
          <p className="font-semibold" style={{ color: "#0B1A2B" }}>File vide</p>
          <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Tous les iPhones ont été vérifiés.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(listing => {
            const f = getForm(listing.id);
            const isOpen = activeId === listing.id;

            return (
              <div
                key={listing.id}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(11,26,43,0.1)", background: "white" }}
              >
                {/* Row header */}
                <button
                  className="w-full p-4 flex items-center gap-4 text-left"
                  onClick={() => toggle(listing)}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
                    {listing.photos?.[0]
                      ? <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📱</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: "#0B1A2B" }}>
                      {listing.iphone_model} {listing.capacity} Go · {listing.color}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                      {CONDITION_LABELS[listing.condition]} · {formatPrice(listing.asking_price)} · {formatDate(listing.created_at)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                      Vendeur : <strong style={{ color: "#0B1A2B" }}>{listing.seller?.full_name}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.done && <span className="text-xs font-semibold" style={{ color: "#00B070" }}>Soumis ✓</span>}
                    {isOpen ? <ChevronUp size={18} style={{ color: "#8A99AA" }} /> : <ChevronDown size={18} style={{ color: "#8A99AA" }} />}
                  </div>
                </button>

                {/* Rapport form */}
                {isOpen && (
                  <div className="border-t px-5 pb-6 pt-4 space-y-5" style={{ borderColor: "rgba(11,26,43,0.08)" }}>

                    {f.done ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)" }}>
                        <CheckCircle size={20} style={{ color: "#00D084" }} />
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>
                            Rapport soumis — Grade {f.grade} · Batterie {f.battery_health}%
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                            En attente de validation par un administrateur.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Contact vendeur */}
                        {listing.whatsapp_number && (
                          <div className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)" }}>
                            <MessageCircle size={16} style={{ color: "#25D366", flexShrink: 0 }} />
                            <p className="text-sm flex-1" style={{ color: "#0B1A2B" }}>
                              Contacter le vendeur pour organiser la visite :
                              <span className="font-semibold ml-1">{listing.whatsapp_number}</span>
                            </p>
                            <a
                              href={`https://wa.me/${listing.whatsapp_number?.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              style={{ background: "#25D366", color: "white" }}
                            >
                              WhatsApp
                            </a>
                          </div>
                        )}

                        {/* Start button */}
                        {!f.started && (
                          <div className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: "rgba(11,26,43,0.03)", border: "1px solid rgba(11,26,43,0.07)" }}>
                            <div className="flex items-center gap-2">
                              <Smartphone size={15} style={{ color: "#8A99AA" }} />
                              <p className="text-sm" style={{ color: "#0B1A2B" }}>
                                Vous êtes chez le vendeur ? Démarrez la vérification.
                              </p>
                            </div>
                            <Button size="sm" loading={f.submitting} onClick={() => startExpertise(listing)}>
                              Démarrer
                            </Button>
                          </div>
                        )}

                        {f.started && (
                          <>
                            {/* Grade */}
                            <div>
                              <p className="text-sm font-semibold mb-2" style={{ color: "#0B1A2B" }}>
                                Grade qualité global
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {GRADES.map(g => (
                                  <button
                                    key={g.value}
                                    className="p-3 rounded-xl border-2 text-left transition-all"
                                    style={{
                                      borderColor: f.grade === g.value ? "#00D084" : "rgba(11,26,43,0.1)",
                                      background: f.grade === g.value ? "rgba(0,208,132,0.06)" : "white",
                                    }}
                                    onClick={() => patchForm(listing.id, { grade: g.value })}
                                  >
                                    <p className="font-bold text-sm" style={{ color: "#0B1A2B" }}>{g.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>{g.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Batterie */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Battery size={15} style={{ color: "#0B1A2B" }} />
                                  <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>
                                    Santé de la batterie
                                  </p>
                                </div>
                                <span
                                  className="text-lg font-black font-mono"
                                  style={{ color: f.battery_health >= 80 ? "#00B070" : f.battery_health >= 70 ? "#F59E0B" : "#CC0000" }}
                                >
                                  {f.battery_health}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0} max={100} step={1}
                                value={f.battery_health}
                                onChange={e => patchForm(listing.id, { battery_health: Number(e.target.value) })}
                                className="w-full accent-green-500"
                                style={{ accentColor: "#00D084" }}
                              />
                              <div className="flex justify-between text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                                <span>0%</span>
                                <span style={{ color: "#CC0000" }}>⚠ &lt;70%</span>
                                <span style={{ color: "#F59E0B" }}>70–79%</span>
                                <span style={{ color: "#00B070" }}>≥ 80%</span>
                                <span>100%</span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>
                                Lisible dans Réglages → Batterie → Santé de la batterie
                              </p>
                            </div>

                            {/* Checklist */}
                            <div>
                              <p className="text-sm font-semibold mb-2" style={{ color: "#0B1A2B" }}>Points de contrôle</p>
                              <div className="space-y-1.5">
                                {CHECKLIST_ITEMS.map(item => (
                                  <label
                                    key={item.key}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                                    style={{ background: f.checklist[item.key] ? "rgba(0,208,132,0.05)" : "rgba(11,26,43,0.03)" }}
                                  >
                                    <div
                                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all"
                                      style={{
                                        borderColor: f.checklist[item.key] ? "#00D084" : "rgba(11,26,43,0.2)",
                                        background: f.checklist[item.key] ? "#00D084" : "white",
                                      }}
                                      onClick={() => setCheck(listing.id, item.key, !f.checklist[item.key])}
                                    >
                                      {f.checklist[item.key] && <CheckCircle size={11} color="white" />}
                                    </div>
                                    <span className="text-sm" style={{ color: "#0B1A2B" }}>{item.label}</span>
                                    {(item.key === "chargeur_inclus" || item.key === "boite_incluse") && (
                                      <Package size={13} style={{ color: "#8A99AA", flexShrink: 0, marginLeft: "auto" }} />
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Notes */}
                            <div>
                              <p className="text-sm font-semibold mb-1.5" style={{ color: "#0B1A2B" }}>
                                Observations (optionnel)
                              </p>
                              <textarea
                                className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none transition-colors"
                                style={{ border: "1px solid rgba(11,26,43,0.15)", color: "#0B1A2B", background: "white" }}
                                rows={3}
                                placeholder="Défauts constatés, remarques, état des accessoires…"
                                value={f.notes}
                                onChange={e => patchForm(listing.id, { notes: e.target.value })}
                              />
                            </div>

                            {/* Error */}
                            {f.error && (
                              <p className="text-sm text-center" style={{ color: "#CC0000" }}>{f.error}</p>
                            )}

                            <Button
                              className="w-full"
                              loading={f.submitting}
                              onClick={() => submitExpertise(listing)}
                            >
                              <CheckCircle size={15} />
                              Soumettre le rapport
                            </Button>
                          </>
                        )}

                        {/* Error pre-start */}
                        {!f.started && f.error && (
                          <p className="text-sm text-center" style={{ color: "#CC0000" }}>{f.error}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
