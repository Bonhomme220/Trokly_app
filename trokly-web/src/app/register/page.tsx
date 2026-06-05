"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Gift, Zap, ChevronRight } from "lucide-react";

type Step = "email" | "otp" | "details" | "welcome";

function RegisterForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/listings/new";
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setError("");
    if (!email.trim()) return setError("Entrez votre adresse email.");
    setLoading(true);
    try {
      await api.post("/auth/otp/send", { email, type: "registration" });
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

  async function verifyOtp() {
    setError("");
    if (otp.length !== 6) return setError("Le code doit contenir 6 chiffres.");
    setLoading(true);
    try {
      await api.post("/auth/otp/verify", { email, code: otp, type: "registration" });
      setStep("details");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    setError("");
    if (!fullName.trim()) return setError("Entrez votre nom complet.");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email,
        code: otp,
        full_name: fullName,
      });
      await login(res.data.token);
      // WhatsPAY pixel — conversion inscription
      window.wpTrackConversion?.("signup");
      setStep("welcome"); // ← afficher le modal avant de rediriger
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  const progressSteps = ["email", "otp", "details"];
  const stepIndex = progressSteps.indexOf(step);

  /* ── Modal de bienvenue ── */
  if (step === "welcome") {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Confetti-like header */}
          <div
            className="rounded-2xl p-8 text-center mb-4"
            style={{ background: "#0B1A2B" }}
          >
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#F7F5F0" }}>
              Bienvenue, {fullName.split(" ")[0]} !
            </h1>
            <p className="text-sm" style={{ color: "rgba(247,245,240,0.55)" }}>
              Votre compte Trokly est créé.
            </p>
          </div>

          {/* Crédit offert */}
          <div
            className="rounded-2xl p-5 mb-4 flex items-start gap-4"
            style={{ background: "rgba(245,158,11,0.08)", border: "1.5px solid rgba(245,158,11,0.25)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)" }}
            >
              <Gift size={20} style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <p className="font-bold text-sm mb-0.5" style={{ color: "#0B1A2B" }}>
                1 crédit de publication offert 🎁
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                Votre première annonce est <strong>gratuite</strong> — pas besoin de payer.
                Déposez votre iPhone maintenant et profitez-en.
              </p>
            </div>
          </div>

          {/* Ce que ça veut dire */}
          <div className="card p-4 mb-5 space-y-2.5">
            {[
              { icon: "📱", text: "Déposez votre iPhone en 5 minutes" },
              { icon: "✅", text: "Publication immédiate, sans paiement" },
              { icon: "💬", text: "Les acheteurs vous contactent sur WhatsApp" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <p className="text-sm" style={{ color: "#0B1A2B" }}>{text}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <Button
            className="w-full mb-3"
            onClick={() => router.push(next)}
          >
            <Zap size={15} />
            Publier mon iPhone maintenant
            <ChevronRight size={15} />
          </Button>

          <button
            className="w-full text-sm text-center py-2"
            style={{ color: "#8A99AA" }}
            onClick={() => router.push("/seller")}
          >
            Explorer mon dashboard d'abord
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/symbol.svg" alt="Trokly" className="mx-auto mb-4" style={{ width: 52, height: 52 }} />
          <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>Créer un compte</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            {progressSteps.map((s, i) => (
              <div
                key={s}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === stepIndex ? 20 : 8,
                  height: 8,
                  background: i <= stepIndex ? "#00D084" : "rgba(11,26,43,0.15)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          {step === "email" && (
            <>
              <Input
                label="Adresse email"
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                error={error}
              />
              <Button className="w-full" loading={loading} onClick={sendOtp}>
                Recevoir le code
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium block" style={{ color: "#0B1A2B" }}>
                  Code envoyé à {email}
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                  autoFocus
                />
                {error && <p className="text-xs" style={{ color: "#CC0000" }}>{error}</p>}
              </div>
              <Button className="w-full" loading={loading} onClick={verifyOtp}>
                Vérifier
              </Button>
              <button
                className="w-full text-sm text-center"
                style={{ color: "#8A99AA" }}
                onClick={() => { setStep("email"); setOtp(""); setError(""); }}
              >
                Modifier l'email
              </button>
            </>
          )}

          {step === "details" && (
            <>
              <Input
                label="Nom complet"
                id="full_name"
                name="full_name"
                placeholder="Ex: Jean Adéyèmi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && register()}
                autoFocus
                error={error}
              />
              <Button className="w-full" loading={loading} onClick={register}>
                Créer mon compte
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "#8A99AA" }}>
          Déjà un compte ?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium" style={{ color: "#0B1A2B" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
