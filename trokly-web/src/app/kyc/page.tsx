"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Kyc } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Shield, CheckCircle, Clock, XCircle } from "lucide-react";

export default function KycPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [form, setForm] = useState({ document_type: "cni", document_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/kyc/status")
      .then(res => setKyc(res.data.kyc || null))
      .catch(() => setKyc(null))
      .finally(() => setDataLoading(false));
  }, [isAuthenticated]);

  async function submit() {
    setError("");
    if (!form.document_url.trim()) return setError("Entrez l'URL de votre document.");
    setSubmitting(true);
    try {
      const res = await api.post("/kyc", form);
      setKyc(res.data.kyc);
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || dataLoading) return null;

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,208,132,0.1)" }}>
          <Shield size={20} style={{ color: "#00D084" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>Vérification d'identité</h1>
          <p className="text-sm" style={{ color: "#8A99AA" }}>Requis pour retirer vos fonds</p>
        </div>
      </div>

      {/* KYC déjà soumis */}
      {kyc ? (
        <div className="card p-6">
          {kyc.status === "approved" && (
            <div className="flex items-start gap-4">
              <CheckCircle size={24} style={{ color: "#00D084" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-lg" style={{ color: "#0B1A2B" }}>Identité vérifiée</p>
                <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Votre compte est entièrement vérifié. Vous pouvez retirer vos fonds.</p>
              </div>
            </div>
          )}
          {kyc.status === "pending" && (
            <div className="flex items-start gap-4">
              <Clock size={24} style={{ color: "#B8860B" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-lg" style={{ color: "#0B1A2B" }}>En cours de vérification</p>
                <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Notre équipe examine votre document. Délai habituel : 24h.</p>
              </div>
            </div>
          )}
          {kyc.status === "rejected" && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <XCircle size={24} style={{ color: "#CC0000" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-lg" style={{ color: "#0B1A2B" }}>Document refusé</p>
                  {kyc.rejection_reason && (
                    <p className="text-sm mt-1" style={{ color: "#CC0000" }}>{kyc.rejection_reason}</p>
                  )}
                  <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Veuillez soumettre un nouveau document.</p>
                </div>
              </div>
              <KycForm form={form} setForm={setForm} submitting={submitting} error={error} onSubmit={submit} />
            </div>
          )}
        </div>
      ) : success ? (
        <div className="card p-6 text-center">
          <Clock size={36} className="mx-auto mb-3" style={{ color: "#B8860B" }} />
          <p className="font-bold text-lg mb-1" style={{ color: "#0B1A2B" }}>Document soumis !</p>
          <p className="text-sm" style={{ color: "#8A99AA" }}>Notre équipe vérifiera votre document dans les 24h.</p>
        </div>
      ) : (
        <div className="card p-6">
          <p className="text-sm mb-4" style={{ color: "#8A99AA" }}>
            Pour retirer vos gains, Trokly doit vérifier votre identité conformément à la réglementation. Vos données sont sécurisées.
          </p>
          <KycForm form={form} setForm={setForm} submitting={submitting} error={error} onSubmit={submit} />
        </div>
      )}
    </main>
  );
}

function KycForm({ form, setForm, submitting, error, onSubmit }: {
  form: { document_type: string; document_url: string };
  setForm: (f: { document_type: string; document_url: string }) => void;
  submitting: boolean;
  error: string;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Type de document</label>
        <select className="input" value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })}>
          <option value="cni">Carte Nationale d'Identité</option>
          <option value="passport">Passeport</option>
          <option value="permis">Permis de conduire</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>URL du document scanné</label>
        <input
          type="url"
          className="input"
          placeholder="https://... (Cloudinary, Drive...)"
          value={form.document_url}
          onChange={e => setForm({ ...form, document_url: e.target.value })}
        />
        <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>Recto + verso dans un seul fichier si possible.</p>
      </div>
      {error && <p className="text-xs" style={{ color: "#CC0000" }}>{error}</p>}
      <Button className="w-full" loading={submitting} onClick={onSubmit}>
        <Shield size={15} />
        Soumettre mon document
      </Button>
    </div>
  );
}
