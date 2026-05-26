<?php

namespace App\Services;

use App\Models\AmbassadorCode;
use App\Models\AmbassadorEarning;
use App\Models\AmbassadorWallet;
use App\Models\AmbassadorWithdrawal;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Support\Str;

class AmbassadorService
{
    const MIN_WITHDRAWAL = 1000; // FCFA

    /** Créer un code ambassadeur pour un user (admin) */
    public function createCode(User $user, int $discountPercent, int $commissionPercent = 10): AmbassadorCode
    {
        // Désactiver l'ancien code si existant
        AmbassadorCode::where('user_id', $user->id)->update(['is_active' => false]);

        // Générer un code unique basé sur le nom
        $base = strtoupper(Str::ascii(explode(' ', $user->full_name)[0]));
        $base = preg_replace('/[^A-Z]/', '', $base);
        $base = substr($base, 0, 8);
        $code = $base . $discountPercent;

        // S'assurer de l'unicité
        $attempt = $code;
        $i = 1;
        while (AmbassadorCode::where('code', $attempt)->exists()) {
            $attempt = $code . $i++;
        }

        // Créer le wallet si pas encore
        AmbassadorWallet::firstOrCreate(['user_id' => $user->id]);

        return AmbassadorCode::create([
            'user_id'            => $user->id,
            'code'               => $attempt,
            'discount_percent'   => $discountPercent,
            'commission_percent' => $commissionPercent,
        ]);
    }

    /** Vérifier un code et retourner les infos de réduction */
    public function checkCode(string $code, ?User $buyer = null): array
    {
        $ambassador = AmbassadorCode::with('user')
            ->where('code', strtoupper(trim($code)))
            ->where('is_active', true)
            ->first();

        if (!$ambassador) {
            return ['valid' => false, 'message' => 'Code invalide ou inactif.'];
        }

        // Anti-abus : l'ambassadeur ne peut pas utiliser son propre code
        if ($buyer && $buyer->id === $ambassador->user_id) {
            return ['valid' => false, 'message' => 'Vous ne pouvez pas utiliser votre propre code.'];
        }

        return [
            'valid'            => true,
            'code'             => $ambassador->code,
            'discount_percent' => $ambassador->discount_percent,
            'ambassador_name'  => $ambassador->user->full_name,
        ];
    }

    /** Enregistrer une commission après paiement confirmé */
    public function recordEarning(Listing $listing, AmbassadorCode $code): void
    {
        $wallet = AmbassadorWallet::firstOrCreate(['user_id' => $code->user_id]);

        $originalPrice = $listing->discount_amount + /* ce que l'acheteur a payé */
            ($listing->asking_price ?? 0); // on utilise amount_paid stocké sur listing

        // Récupérer les vrais montants depuis listing
        $planPrices = ['basic' => 499, 'verified_phone' => 1499, 'verified_seller' => 2999];
        $original   = ($planPrices[$listing->plan] ?? 499) + ($listing->is_boosted ? 500 : 0);
        $discount   = $listing->discount_amount;
        $paid       = $original - $discount;
        $commission = $code->calculateCommission($paid);

        AmbassadorEarning::create([
            'ambassador_code_id'   => $code->id,
            'ambassador_wallet_id' => $wallet->id,
            'listing_id'           => $listing->id,
            'plan'                 => $listing->plan,
            'amount_paid'          => $paid,
            'original_price'       => $original,
            'discount_amount'      => $discount,
            'commission_amount'    => $commission,
        ]);

        $wallet->increment('balance', $commission);
        $wallet->increment('total_earned', $commission);
        $code->increment('uses_count');
    }

    /** Demander un retrait */
    public function requestWithdrawal(User $user, int $amount, string $paymentMethod, string $paymentDetails): AmbassadorWithdrawal
    {
        $wallet = AmbassadorWallet::where('user_id', $user->id)->firstOrFail();

        if ($amount < self::MIN_WITHDRAWAL) {
            throw new \Exception("Montant minimum : " . self::MIN_WITHDRAWAL . " FCFA.");
        }

        if ($amount > $wallet->balance) {
            throw new \Exception("Solde insuffisant. Disponible : {$wallet->balance} FCFA.");
        }

        if (!$wallet->canWithdrawThisMonth()) {
            throw new \Exception("Vous avez déjà effectué un retrait ce mois-ci.");
        }

        // Retrait en attente → on ne déduit pas encore le solde
        return AmbassadorWithdrawal::create([
            'user_id'              => $user->id,
            'ambassador_wallet_id' => $wallet->id,
            'amount'               => $amount,
            'payment_method'       => $paymentMethod,
            'payment_details'      => $paymentDetails,
        ]);
    }

    /** Admin approuve un retrait */
    public function approveWithdrawal(AmbassadorWithdrawal $withdrawal, string $note = ''): void
    {
        $wallet = $withdrawal->wallet;

        $wallet->decrement('balance', $withdrawal->amount);
        $wallet->increment('total_withdrawn', $withdrawal->amount);
        $wallet->update(['last_withdrawal_at' => now()]);

        $withdrawal->update([
            'status'     => 'paid',
            'admin_note' => $note,
            'paid_at'    => now(),
        ]);
    }

    /** Admin rejette un retrait */
    public function rejectWithdrawal(AmbassadorWithdrawal $withdrawal, string $note = ''): void
    {
        $withdrawal->update([
            'status'     => 'rejected',
            'admin_note' => $note,
        ]);
    }
}
