"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Kyc } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Shield, CheckCircle, Clock, XCircle, Upload, X } from "lucide-react";

export default function KycPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [documentType, setDocumentType] = useState("cni");
  const [documentUrl, setDocumentUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/kyc/status")
      .then(res => {
        // L'API retourne directement { status, ... } sans clé 'kyc'
        if (res.data.status && res.data.status !== "not_submitted") {
          setKyc(res.data);
        } else {
          setKyc(null);
        }
      })
      .catch(() => setKyc(null))
      .finally(() => setDataLoading(false));
  }, [isAuthenticated]);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocumentUrl(res.data.url);
      setPreview(res.data.url);
    } catch {
      setError("Échec de l'upload. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError("");
    if (!documentUrl) return setError("Veuillez ajouter votre document.");
    setSubmitting(true);
    try {
      const res = await api.post("/kyc", { document_url: documentUrl, document_type: documentType });
      setKyc(res.data.kyc ?? { status: "pending", rejection_reason: null, verified_at: null });
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || dataLoading) return null;

  const form = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Type de document</label>
        <select className="input" value={documentType} onChange={e => setDocumentType(e.target.value)}>
          <option value="cni">Carte Nationale d'Identité</option>
          <option value="passport">Passeport</option>
          <option value="permis">Permis de conduire</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Photo du document</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="relative rounded-xl overflow-hidden" style={{ border: "2px solid rgba(0,208,132,0.3)" }}>
            <img src={preview} alt="Document" className="w-full object-cover max-h-64" />
            <button
              onClick={() => { setPreview(""); setDocumentUrl(""); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "#0B1A2B", color: "white" }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full py-10 rounded-xl flex flex-col items-center gap-3 transition-colors"
            style={{
              border: "2px dashed rgba(11,26,43,0.15)",
              background: uploading ? "rgba(0,208,132,0.04)" : "transparent",
              color: "#8A99AA",
            }}
          >
            {uploading ? (
              <>
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00D084", borderTopColor: "transparent" }} />
                <span className="text-sm">Envoi en cours...</span>
              </>
            ) : (
              <>
                <Upload size={24} style={{ color: "#00D084" }} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>Cliquez pour importer</p>
                  <p className="text-xs mt-0.5">JPG, PNG ou PDF · Recto + verso si possible</p>
                </div>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs" style={{ color: "#CC0000" }}>{error}</p>}
      <Button className="w-full" loading={submitting} onClick={submit} disabled={uploading}>
        <Shield size={15} />
        Soumettre mon document
      </Button>
    </div>
  );

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
            <div className="space-y-5">
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
              {form}
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
          <p className="text-sm mb-5" style={{ color: "#8A99AA" }}>
            Pour retirer vos gains, Trokly doit vérifier votre identité conformément à la réglementation. Vos données sont sécurisées.
          </p>
          {form}
        </div>
      )}
    </main>
  );
}
