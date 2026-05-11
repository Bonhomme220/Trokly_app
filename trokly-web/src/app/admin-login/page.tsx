"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

type Step = "phone" | "otp";

export default function AdminLoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/admin");
  }, [loading, isAuthenticated, router]);

  async function sendOtp() {
    setError("");
    if (!phone.trim()) return setError("Entrez votre numéro.");
    setSubmitting(true);
    try {
      await api.post("/auth/otp/send", { phone_number: phone, type: "login" });
      setStep("otp");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Impossible d'envoyer le code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyAndLogin() {
    setError("");
    if (otp.length !== 6) return setError("Code à 6 chiffres.");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/login", { phone_number: phone, code: otp });
      await login(res.data.token);
      router.push("/admin");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Code invalide ou expiré.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <img src="/symbol.svg" alt="Trokly" className="mx-auto mb-4" style={{ width: 40, height: 40 }} />
          <h1 className="text-xl font-bold" style={{ color: "#0B1A2B" }}>Accès staff</h1>
          <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>
            {step === "phone" ? "Réservé à l'équipe Trokly" : `Code envoyé au ${phone}`}
          </p>
        </div>

        <div className="card p-5 space-y-3">
          {step === "phone" ? (
            <>
              <input
                className="input"
                type="tel"
                placeholder="+229 97 00 00 00"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendOtp()}
                autoFocus
              />
              {error && <p className="text-xs" style={{ color: "#CC0000" }}>{error}</p>}
              <Button className="w-full" loading={submitting} onClick={sendOtp}>
                Recevoir le code
              </Button>
            </>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="••••••"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && verifyAndLogin()}
                autoFocus
              />
              {error && <p className="text-xs" style={{ color: "#CC0000" }}>{error}</p>}
              <Button className="w-full" loading={submitting} onClick={verifyAndLogin}>
                Se connecter
              </Button>
              <button
                className="w-full text-xs text-center"
                style={{ color: "#8A99AA" }}
                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              >
                Modifier le numéro
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
