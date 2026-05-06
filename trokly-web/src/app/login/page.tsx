"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Step = "phone" | "otp";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setError("");
    if (!phone.trim()) return setError("Entrez votre numéro de téléphone.");
    setLoading(true);
    try {
      await api.post("/auth/otp/send", { phone_number: phone, type: "login" });
      setStep("otp");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]?.[0]
        : err.response?.data?.message;
      setError(msg || "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndLogin() {
    setError("");
    if (otp.length !== 6) return setError("Le code doit contenir 6 chiffres.");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { phone_number: phone, code: otp });
      await login(res.data.token);
      router.push("/");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/symbol.svg" alt="Trokly" className="mx-auto mb-4" style={{ width: 52, height: 52 }} />
          <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>
            {step === "phone" ? "Se connecter" : "Entrer le code"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>
            {step === "phone"
              ? "Entrez votre numéro pour recevoir un code"
              : `Code envoyé au ${phone}`}
          </p>
        </div>

        <div className="card p-6 space-y-4">
          {step === "phone" ? (
            <>
              <Input
                label="Numéro de téléphone"
                id="phone"
                type="tel"
                placeholder="+229 97 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                error={error}
              />
              <Button className="w-full" loading={loading} onClick={sendOtp}>
                Recevoir le code
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium block" style={{ color: "#0B1A2B" }}>
                  Code de vérification
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && verifyAndLogin()}
                  autoFocus
                />
                {error && <p className="text-xs" style={{ color: "#CC0000" }}>{error}</p>}
              </div>
              <Button className="w-full" loading={loading} onClick={verifyAndLogin}>
                Se connecter
              </Button>
              <button
                className="w-full text-sm text-center"
                style={{ color: "#8A99AA" }}
                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              >
                Modifier le numéro
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "#8A99AA" }}>
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium" style={{ color: "#0B1A2B" }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
