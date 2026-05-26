"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import {
  Copy, Check, TrendingUp, Wallet, ArrowDownCircle,
  Clock, CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";

interface AmbassadorData {
  is_ambassador: boolean;
  code?: string;
  discount_percent?: number;
  commission_percent?: number;
  uses_count?: number;
  wallet?: {
    balance: number;
    total_earned: number;
    total_withdrawn: number;
    can_withdraw: boolean;
    min_withdrawal: number;
    pending_withdrawal: boolean;
  };
}

interface Earning {
  id: number;
  plan: string;
  amount_paid: number;
  original_price: number;
  discount_amount: number;
  commission_amount: number;
  created_at: string;
  listing?: { id: number; iphone_model: string };
}

const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  verified_phone: "iPhone vérifié",
  verified_seller: "Vendeur vérifié",
};

const PAYMENT_METHODS = [
  { id: "mtn", label: "MTN Mobile Money" },
  { id: "moov", label: "Moov Money" },
  { id: "celtis", label: "Celtis Pay" },
];

export default function AmbassadorPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<AmbassadorData | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);

  // Withdrawal form
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("mtn");
  const [withdrawDetails, setWithdrawDetails] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login?next=/ambassador");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const [meRes, earningsRes] = await Promise.all([
          api.get("/ambassador/me"),
          api.get("/ambassador/earnings"),
        ]);
        setData(meRes.data);
        setEarnings(earningsRes.data?.data ?? []);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [isAuthenticated]);

  function copyCode() {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submitWithdrawal() {
    setWithdrawError("");
    setWithdrawSuccess("");
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < (data?.wallet?.min_withdrawal ?? 1000)) {
      return setWithdrawError(`Montant minimum : ${data?.wallet?.min_withdrawal ?? 1000} FCFA`);
    }
    if (!withdrawDetails.trim()) return setWithdrawError("Entrez votre numéro de paiement.");
    setWithdrawLoading(true);
    try {
      const res = await api.post("/ambassador/withdraw", {
        amount,
        payment_method: withdrawMethod,
        payment_details: withdrawDetails.trim(),
      });
      setWithdrawSuccess(res.data.message);
      setShowWithdraw(false);
      setWithdrawAmount("");
      setWithdrawDetails("");
      // Refresh data
      const meRes = await api.get("/ambassador/me");
      setData(meRes.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setWithdrawError(err.response?.data?.message || "Erreur lors de la demande.");
    } finally {
      setWithdrawLoading(false);
    }
  }

  if (loading || fetching) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto"
          style={{ borderColor: "#0B1A2B", borderTopColor: "transparent" }} />
      </main>
    );
  }

  if (!data?.is_ambassador) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🤝</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#0B1A2B" }}>
          Vous n'êtes pas encore ambassadeur
        </h1>
        <p className="text-sm mb-6" style={{ color: "#8A99AA" }}>
          Le programme ambassadeur est sur invitation. Contactez-nous pour en savoir plus.
        </p>
        <Button onClick={() => router.push("/")} variant="secondary">
          Retour à l'accueil
        </Button>
      </main>
    );
  }

  const wallet = data.wallet!;

  return (
    <main className="max-w-xl mx-auto px-4 py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>Mon espace ambassadeur</h1>
        <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>
          Partagez votre code, gagnez des commissions.
        </p>
      </div>

      {/* Code card */}
      <div className="card p-5" style={{ background: "#0B1A2B" }}>
        <p className="text-xs font-medium mb-1" style={{ color: "rgba(247,245,240,0.5)" }}>Votre code ambassadeur</p>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-black tracking-widest" style={{ color: "#00D084" }}>{data.code}</span>
          <button onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
            {copied ? <Check size={14} style={{ color: "#00D084" }} /> : <Copy size={14} />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-xs" style={{ color: "rgba(247,245,240,0.5)" }}>Réduction offerte</p>
            <p className="text-lg font-bold" style={{ color: "white" }}>{data.discount_percent}%</p>
          </div>
          <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div>
            <p className="text-xs" style={{ color: "rgba(247,245,240,0.5)" }}>Votre commission</p>
            <p className="text-lg font-bold" style={{ color: "white" }}>{data.commission_percent}%</p>
          </div>
          <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div>
            <p className="text-xs" style={{ color: "rgba(247,245,240,0.5)" }}>Utilisations</p>
            <p className="text-lg font-bold" style={{ color: "white" }}>{data.uses_count}</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(247,245,240,0.6)" }}>
          💡 Partagez ce code à vos contacts. Ils obtiennent <strong className="text-white">{data.discount_percent}% de réduction</strong> sur leur publication, et vous gagnez <strong className="text-white">{data.commission_percent}% de commission</strong>.
        </div>
      </div>

      {/* Wallet */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={16} style={{ color: "#0B1A2B" }} />
          <h2 className="font-semibold" style={{ color: "#0B1A2B" }}>Mon wallet</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl text-center" style={{ background: "rgba(0,208,132,0.08)" }}>
            <p className="text-xs mb-1" style={{ color: "#8A99AA" }}>Solde</p>
            <p className="text-lg font-black" style={{ color: "#00B070" }}>
              {wallet.balance.toLocaleString("fr-FR")}
            </p>
            <p className="text-xs" style={{ color: "#8A99AA" }}>FCFA</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "rgba(11,26,43,0.04)" }}>
            <p className="text-xs mb-1" style={{ color: "#8A99AA" }}>Total gagné</p>
            <p className="text-lg font-bold" style={{ color: "#0B1A2B" }}>
              {wallet.total_earned.toLocaleString("fr-FR")}
            </p>
            <p className="text-xs" style={{ color: "#8A99AA" }}>FCFA</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "rgba(11,26,43,0.04)" }}>
            <p className="text-xs mb-1" style={{ color: "#8A99AA" }}>Retiré</p>
            <p className="text-lg font-bold" style={{ color: "#0B1A2B" }}>
              {wallet.total_withdrawn.toLocaleString("fr-FR")}
            </p>
            <p className="text-xs" style={{ color: "#8A99AA" }}>FCFA</p>
          </div>
        </div>

        {withdrawSuccess && (
          <div className="mb-3 p-3 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}>
            <CheckCircle2 size={14} /> {withdrawSuccess}
          </div>
        )}

        {wallet.pending_withdrawal && (
          <div className="p-3 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: "rgba(245,158,11,0.1)", color: "#B8860B" }}>
            <Clock size={14} className="flex-shrink-0" />
            Une demande de retrait est en cours de traitement.
          </div>
        )}

        {!wallet.can_withdraw && !wallet.pending_withdrawal && (
          <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(11,26,43,0.05)", color: "#8A99AA" }}>
            Vous avez déjà effectué un retrait ce mois-ci. Prochain retrait disponible le mois prochain.
          </div>
        )}

        {wallet.can_withdraw && !wallet.pending_withdrawal && !showWithdraw && (
          <button
            onClick={() => setShowWithdraw(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all"
            style={{ borderColor: "rgba(11,26,43,0.12)", background: "white" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,208,132,0.1)" }}>
                <ArrowDownCircle size={16} style={{ color: "#00B070" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0B1A2B" }}>Demander un retrait</p>
                <p className="text-xs" style={{ color: "#8A99AA" }}>Min. {wallet.min_withdrawal.toLocaleString("fr-FR")} FCFA</p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "#8A99AA" }} />
          </button>
        )}

        {showWithdraw && (
          <div className="space-y-4 p-4 rounded-xl" style={{ background: "rgba(11,26,43,0.03)", border: "1px solid rgba(11,26,43,0.08)" }}>
            <h3 className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>Nouvelle demande de retrait</h3>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                Montant (FCFA)
              </label>
              <input
                className="input"
                type="number"
                placeholder={`Min. ${wallet.min_withdrawal}`}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
              />
              {wallet.balance > 0 && (
                <button className="text-xs mt-1" style={{ color: "#00B070" }}
                  onClick={() => setWithdrawAmount(String(wallet.balance))}>
                  Tout retirer ({wallet.balance.toLocaleString("fr-FR")} FCFA)
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>Mode de paiement</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id}
                    onClick={() => setWithdrawMethod(m.id)}
                    className="p-2.5 rounded-xl border-2 text-xs font-medium transition-all"
                    style={{
                      borderColor: withdrawMethod === m.id ? "#0B1A2B" : "rgba(11,26,43,0.12)",
                      background: withdrawMethod === m.id ? "#0B1A2B" : "white",
                      color: withdrawMethod === m.id ? "white" : "#0B1A2B",
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#0B1A2B" }}>
                Numéro de paiement
              </label>
              <input
                className="input"
                type="tel"
                placeholder="+229 01 XX XX XX XX"
                value={withdrawDetails}
                onChange={e => setWithdrawDetails(e.target.value)}
              />
            </div>

            {withdrawError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl text-xs"
                style={{ background: "rgba(204,0,0,0.08)", color: "#CC0000" }}>
                <XCircle size={13} /> {withdrawError}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setShowWithdraw(false); setWithdrawError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(11,26,43,0.08)", color: "#0B1A2B" }}>
                Annuler
              </button>
              <Button className="flex-1" loading={withdrawLoading} onClick={submitWithdrawal}>
                Envoyer la demande
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Earnings history */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: "#0B1A2B" }} />
          <h2 className="font-semibold" style={{ color: "#0B1A2B" }}>Historique des commissions</h2>
        </div>

        {earnings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm" style={{ color: "#8A99AA" }}>Aucune commission pour l'instant.</p>
            <p className="text-xs mt-1" style={{ color: "#8A99AA" }}>
              Partagez votre code pour commencer à gagner.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {earnings.map(e => (
              <div key={e.id} className="flex items-center justify-between py-3"
                style={{ borderBottom: "1px solid rgba(11,26,43,0.06)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0B1A2B" }}>
                    {e.listing?.iphone_model ?? "iPhone"} — {PLAN_LABELS[e.plan] ?? e.plan}
                  </p>
                  <p className="text-xs" style={{ color: "#8A99AA" }}>
                    Payé : {e.amount_paid.toLocaleString("fr-FR")} FCFA
                    {e.discount_amount > 0 && ` (−${e.discount_amount.toLocaleString("fr-FR")} remise)`}
                  </p>
                  <p className="text-xs" style={{ color: "#8A99AA" }}>
                    {new Date(e.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold" style={{ color: "#00B070" }}>
                    +{e.commission_amount.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs" style={{ color: "#8A99AA" }}>FCFA</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
