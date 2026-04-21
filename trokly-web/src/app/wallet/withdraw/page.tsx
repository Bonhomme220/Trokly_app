"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { Wallet, ArrowDownLeft, Phone } from "lucide-react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Step = "amount" | "otp" | "done";

export default function WithdrawPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/wallet/balance")
      .then(res => setBalance(res.data.balance ?? res.data.wallet?.balance ?? null))
      .catch(() => {});
  }, [isAuthenticated]);

  async function requestOtp() {
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Entrez un montant valide.");
    if (balance !== null && amt > balance) return setError("Solde insuffisant.");
    setSubmitting(true);
    try {
      await api.post("/auth/otp/send", {
        phone_number: user?.phone_number,
        type: "withdrawal",
      });
      setStep("otp");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur lors de l'envoi du code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmWithdraw() {
    setError("");
    if (!code.trim()) return setError("Entrez le code reçu par SMS.");
    setSubmitting(true);
    try {
      await api.post("/wallet/withdraw", {
        phone_number: user?.phone_number,
        code,
        amount: parseFloat(amount),
      });
      setStep("done");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Erreur lors du retrait.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Link href="/seller" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "#8A99AA" }}>
        <ChevronLeft size={16} /> Portefeuille
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,208,132,0.1)" }}>
          <Wallet size={20} style={{ color: "#00D084" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>Retrait MoMo</h1>
          {balance !== null && (
            <p className="text-sm" style={{ color: "#8A99AA" }}>
              Disponible : <span className="font-mono font-semibold" style={{ color: "#0B1A2B" }}>{balance.toLocaleString("fr-FR")} FCFA</span>
            </p>
          )}
        </div>
      </div>

      {step === "done" ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(0,208,132,0.1)" }}>
            <ArrowDownLeft size={28} style={{ color: "#00D084" }} />
          </div>
          <p className="text-xl font-bold mb-2" style={{ color: "#0B1A2B" }}>Retrait initié !</p>
          <p className="text-sm mb-6" style={{ color: "#8A99AA" }}>
            <span className="font-mono font-semibold" style={{ color: "#0B1A2B" }}>{parseFloat(amount).toLocaleString("fr-FR")} FCFA</span> seront envoyés sur votre numéro MoMo dans quelques minutes.
          </p>
          <Button className="w-full" onClick={() => router.push("/seller")}>
            Retour au dashboard
          </Button>
        </div>
      ) : step === "amount" ? (
        <div className="card p-6 space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Montant à retirer (FCFA)</label>
            <input
              type="number"
              className="input font-mono text-lg"
              placeholder="Ex: 25000"
              min="500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>Minimum : 500 FCFA</p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(11,26,43,0.04)" }}>
            <Phone size={14} style={{ color: "#8A99AA" }} />
            <span className="text-sm" style={{ color: "#8A99AA" }}>
              Envoyé sur <span className="font-semibold" style={{ color: "#0B1A2B" }}>{user?.phone_number}</span>
            </span>
          </div>

          {error && <p className="text-sm" style={{ color: "#CC0000" }}>{error}</p>}

          <Button className="w-full" loading={submitting} onClick={requestOtp}>
            <ArrowDownLeft size={15} />
            Continuer
          </Button>
        </div>
      ) : (
        <div className="card p-6 space-y-5">
          <div className="p-3 rounded-xl text-center" style={{ background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)" }}>
            <p className="text-sm" style={{ color: "#0B1A2B" }}>
              Code envoyé au <span className="font-semibold">{user?.phone_number}</span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Code de confirmation</label>
            <input
              type="text"
              className="input text-center text-xl tracking-[0.5em] font-mono"
              placeholder="------"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </div>

          {error && <p className="text-sm" style={{ color: "#CC0000" }}>{error}</p>}

          <Button className="w-full" loading={submitting} onClick={confirmWithdraw}>
            Confirmer le retrait de {parseFloat(amount || "0").toLocaleString("fr-FR")} FCFA
          </Button>

          <button className="w-full text-sm text-center" style={{ color: "#8A99AA" }} onClick={() => setStep("amount")}>
            ← Modifier le montant
          </button>
        </div>
      )}
    </main>
  );
}
