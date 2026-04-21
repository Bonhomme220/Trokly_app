"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, Expertise } from "@/lib/types";
import { formatDate, formatPrice, CONDITION_LABELS } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Microscope, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

const CHECKLIST_LABELS: Record<string, string> = {
  ecran_intact:      "Écran intact (pas de fissure, pas de marque)",
  chassis_intact:    "Châssis intact (pas de choc, pas de déformation)",
  batterie_ok:       "Batterie ≥ 80% de capacité",
  face_id_ok:        "Face ID / Touch ID fonctionnel",
  cameras_ok:        "Caméras (avant + arrière) OK",
  boutons_ok:        "Boutons (volume, power, silencieux) OK",
  haut_parleur_ok:   "Haut-parleur et micro OK",
  sim_ok:            "Connecteur SIM + nano-SIM OK",
  icloud_deconnecte: "iCloud déconnecté / pas de blocage activation",
};

const GRADES = [
  { value: "A", label: "Grade A", desc: "Comme neuf, aucun défaut visible" },
  { value: "B", label: "Grade B", desc: "Légères traces d'usage, tout fonctionne" },
  { value: "C", label: "Grade C", desc: "Marques visibles, fonctionnel" },
  { value: "D", label: "Grade D", desc: "Défauts importants, à préciser" },
];

interface ExpertiseListing extends Listing {
  expertise?: Expertise & { id: number };
}

export default function ExpertPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<ExpertiseListing[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<number, {
    checklist: Record<string, boolean>;
    grade: string;
    notes: string;
    expertiseId?: number;
    started: boolean;
    submitting: boolean;
    done: boolean;
  }>>({});

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

  function initForm(id: number) {
    if (form[id]) return;
    const defaultChecklist = Object.fromEntries(Object.keys(CHECKLIST_LABELS).map(k => [k, false]));
    setForm(f => ({
      ...f,
      [id]: { checklist: defaultChecklist, grade: "B", notes: "", started: false, submitting: false, done: false },
    }));
  }

  function toggle(listingId: number) {
    initForm(listingId);
    setActiveId(prev => prev === listingId ? null : listingId);
  }

  function setCheck(listingId: number, key: string, val: boolean) {
    setForm(f => ({
      ...f,
      [listingId]: { ...f[listingId], checklist: { ...f[listingId].checklist, [key]: val } },
    }));
  }

  async function startExpertise(listing: ExpertiseListing) {
    setForm(f => ({ ...f, [listing.id]: { ...f[listing.id], submitting: true } }));
    try {
      const res = await api.post(`/expert/expertises/${listing.id}/start`);
      const expertiseId = res.data.expertise?.id;
      setForm(f => ({ ...f, [listing.id]: { ...f[listing.id], started: true, expertiseId, submitting: false } }));
      setQueue(q => q.map(l => l.id === listing.id ? { ...l, status: "under_expertise" } : l));
    } catch {
      setForm(f => ({ ...f, [listing.id]: { ...f[listing.id], submitting: false } }));
    }
  }

  async function submitExpertise(listing: ExpertiseListing) {
    const f = form[listing.id];
    if (!f?.expertiseId) return;
    setForm(prev => ({ ...prev, [listing.id]: { ...f, submitting: true } }));
    try {
      await api.put(`/expert/expertises/${f.expertiseId}`, {
        quality_grade: f.grade,
        checklist: f.checklist,
        notes: f.notes,
      });
      setForm(prev => ({ ...prev, [listing.id]: { ...f, submitting: false, done: true } }));
    } catch {
      setForm(prev => ({ ...prev, [listing.id]: { ...f, submitting: false } }));
    }
  }

  if (loading) return null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,208,132,0.1)" }}>
          <Microscope size={20} style={{ color: "#00D084" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>File d'expertise</h1>
          <p className="text-sm" style={{ color: "#8A99AA" }}>
            {dataLoading ? "Chargement…" : `${queue.length} iPhone${queue.length !== 1 ? "s" : ""} à expertiser`}
          </p>
        </div>
      </div>

      {dataLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" style={{ background: "#E8E4DF" }} />)}
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-20" style={{ color: "#0B1A2B" }} />
          <p className="font-semibold" style={{ color: "#0B1A2B" }}>File vide</p>
          <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Tous les iPhones ont été expertisés.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(listing => {
            const f = form[listing.id];
            const isOpen = activeId === listing.id;
            return (
              <div key={listing.id} className="card overflow-hidden">
                {/* Header */}
                <button
                  className="w-full p-4 flex items-center gap-4 text-left"
                  onClick={() => toggle(listing.id)}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
                    {listing.photos?.[0]
                      ? <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📱</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: "#0B1A2B" }}>
                      {listing.iphone_model} {listing.capacity} Go · {listing.color}
                    </p>
                    <p className="text-sm" style={{ color: "#8A99AA" }}>
                      {CONDITION_LABELS[listing.condition]} · {formatPrice(listing.asking_price)} · {formatDate(listing.created_at)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>
                      Vendeur : {listing.seller?.full_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f?.done && <span className="text-xs font-semibold" style={{ color: "#00B070" }}>Soumis ✓</span>}
                    {isOpen ? <ChevronUp size={18} style={{ color: "#8A99AA" }} /> : <ChevronDown size={18} style={{ color: "#8A99AA" }} />}
                  </div>
                </button>

                {/* Expertise form */}
                {isOpen && (
                  <div className="border-t px-4 pb-5 pt-4 space-y-5" style={{ borderColor: "rgba(11,26,43,0.08)" }}>
                    {f?.done ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)" }}>
                        <CheckCircle size={20} style={{ color: "#00D084" }} />
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>Expertise soumise — Grade {f.grade}</p>
                          <p className="text-xs" style={{ color: "#8A99AA" }}>En attente de validation par un administrateur.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Start button */}
                        {!f?.started && (
                          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(11,26,43,0.04)" }}>
                            <p className="text-sm" style={{ color: "#0B1A2B" }}>Démarrez l'expertise pour accéder au formulaire.</p>
                            <Button size="sm" loading={f?.submitting} onClick={() => startExpertise(listing)}>
                              Démarrer
                            </Button>
                          </div>
                        )}

                        {/* Grade selector */}
                        {f?.started && (
                          <>
                            <div>
                              <p className="text-sm font-semibold mb-2" style={{ color: "#0B1A2B" }}>Grade qualité</p>
                              <div className="grid grid-cols-2 gap-2">
                                {GRADES.map(g => (
                                  <button
                                    key={g.value}
                                    className="p-3 rounded-xl border-2 text-left transition-all"
                                    style={{
                                      borderColor: f.grade === g.value ? "#00D084" : "rgba(11,26,43,0.1)",
                                      background: f.grade === g.value ? "rgba(0,208,132,0.06)" : "white",
                                    }}
                                    onClick={() => setForm(prev => ({ ...prev, [listing.id]: { ...f, grade: g.value } }))}
                                  >
                                    <p className="font-bold text-sm" style={{ color: "#0B1A2B" }}>{g.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: "#8A99AA" }}>{g.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Checklist */}
                            <div>
                              <p className="text-sm font-semibold mb-2" style={{ color: "#0B1A2B" }}>Points de contrôle</p>
                              <div className="space-y-2">
                                {Object.entries(CHECKLIST_LABELS).map(([key, label]) => (
                                  <label key={key} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors" style={{ background: f.checklist[key] ? "rgba(0,208,132,0.05)" : "rgba(11,26,43,0.03)" }}>
                                    <div
                                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all"
                                      style={{
                                        borderColor: f.checklist[key] ? "#00D084" : "rgba(11,26,43,0.2)",
                                        background: f.checklist[key] ? "#00D084" : "white",
                                      }}
                                      onClick={() => setCheck(listing.id, key, !f.checklist[key])}
                                    >
                                      {f.checklist[key] && <CheckCircle size={12} color="white" />}
                                    </div>
                                    <span className="text-sm" style={{ color: "#0B1A2B" }}>{label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Notes */}
                            <div>
                              <p className="text-sm font-semibold mb-1.5" style={{ color: "#0B1A2B" }}>Notes (optionnel)</p>
                              <textarea
                                className="input resize-none text-sm"
                                rows={3}
                                placeholder="Observations, défauts constatés, remarques..."
                                value={f.notes}
                                onChange={e => setForm(prev => ({ ...prev, [listing.id]: { ...f, notes: e.target.value } }))}
                              />
                            </div>

                            <div className="flex gap-3">
                              <Button className="flex-1" loading={f.submitting} onClick={() => submitExpertise(listing)}>
                                <CheckCircle size={15} />
                                Soumettre l'expertise
                              </Button>
                            </div>
                          </>
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
