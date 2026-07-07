<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\SubscriptionController;
use App\Models\AmbassadorCode;
use App\Models\Listing;
use App\Services\AmbassadorService;
use App\Services\NotificationService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function initiate(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($listing->payment_status === 'paid') {
            return response()->json(['message' => 'Cette annonce est déjà payée.'], 422);
        }

        // Le crédit gratuit ne finance jamais une publication : la remise éventuelle
        // (499 FCFA sur un plan supérieur) a déjà été appliquée à la création de
        // l'annonce. On régénère simplement le lien de paiement (le montant tient
        // compte de discount_amount déjà enregistré).
        $frontUrl  = config('app.frontend_url', 'https://trokly.bj');
        $returnUrl = "{$frontUrl}/listings/payment/success?listing_id={$listing->id}";
        $cancelUrl = "{$frontUrl}/listings/payment/cancel?listing_id={$listing->id}";

        $data = $this->paymentService->createPaymentLink($listing, $returnUrl, $cancelUrl);

        return response()->json($data);
    }

    // Republication via crédit (listing déjà existant)

    public function webhook(Request $request): JsonResponse
    {
        // Logger tout le payload pour debug
        \Illuminate\Support\Facades\Log::info('PayPlus webhook received', [
            'method'  => $request->method(),
            'all'     => $request->all(),
            'headers' => $request->headers->all(),
            'raw'     => $request->getContent(),
        ]);

        // PayPlus envoie le token de la facture — essayer plusieurs champs possibles
        $invoiceToken = $request->input('token')
            ?? $request->input('invoice_token')
            ?? $request->query('token')
            ?? $request->query('invoice_token');

        if (!$invoiceToken) {
            return response()->json(['message' => 'Missing token.'], 400);
        }

        // ── Paiement abonnement Pro ───────────────────────────────────────────
        $customType = $request->input('customdata.type')
            ?? $request->input('custom_data.type')
            ?? $request->input('type');

        if ($customType === 'subscription') {
            $userId = (int) ($request->input('customdata.user_id')
                ?? $request->input('custom_data.user_id')
                ?? $request->input('user_id'));

            if (!$userId) {
                return response()->json(['message' => 'Missing user_id.'], 400);
            }

            $paid = $this->paymentService->verifyPayment($invoiceToken);

            if (!$paid) {
                return response()->json(['message' => 'Payment not confirmed.'], 422);
            }

            SubscriptionController::activateSubscription($userId, $invoiceToken);
            return response()->json(['message' => 'OK']);
        }

        // ── Options abonnement Pro ────────────────────────────────────────────
        if ($customType === 'subscription_options') {
            $listingId = $request->input('customdata.listing_id')
                ?? $request->input('custom_data.listing_id')
                ?? $request->input('listing_id');

            $listing = $listingId ? Listing::find($listingId) : null;

            if (!$listing) {
                return response()->json(['message' => 'Listing not found.'], 404);
            }

            $paid = $this->paymentService->verifyPayment($invoiceToken);
            if (!$paid) {
                return response()->json(['message' => 'Payment not confirmed.'], 422);
            }

            $this->confirmSubscriptionOptions($listing, $request, $invoiceToken);
            return response()->json(['message' => 'OK']);
        }
        // ─────────────────────────────────────────────────────────────────────

        $listing = Listing::where('payment_reference', $invoiceToken)->first();

        if (!$listing) {
            // Chercher via custom_data listing_id si disponible
            $listingId = $request->input('customdata.listing_id')
                ?? $request->input('custom_data.listing_id')
                ?? $request->input('listing_id');
            if ($listingId) {
                $listing = Listing::find($listingId);
            }
        }

        if (!$listing) {
            return response()->json(['message' => 'Listing not found.'], 404);
        }

        if ($listing->payment_status === 'paid') {
            // Cas boost-only : annonce déjà publiée via crédit, boost en attente de paiement
            if (!$listing->is_boosted && $listing->payment_reference) {
                $paid = $this->paymentService->verifyPayment($listing->payment_reference);
                if ($paid) {
                    $listing->update(['is_boosted' => true]);
                }
            }
            return response()->json(['message' => 'Already processed.']);
        }

        // ⚠️ Ne jamais faire confiance au corps de la requête POST pour confirmer un paiement.
        // On vérifie toujours auprès de l'API PayPlus (source de vérité).
        $token = $listing->payment_reference ?? $invoiceToken;
        $paid  = $this->paymentService->verifyPayment($token);

        if (!$paid) {
            return response()->json(['message' => 'Payment not confirmed by PayPlus.'], 422);
        }

        $this->confirmPayment($listing);

        return response()->json(['message' => 'OK']);
    }

    // Appelé depuis le return URL (vérification côté serveur)
    public function verify(Request $request): JsonResponse
    {
        $listing = Listing::findOrFail($request->listing_id);

        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (!$listing->payment_reference) {
            return response()->json(['message' => 'Aucune référence de paiement.'], 422);
        }

        $paid = $this->paymentService->verifyPayment($listing->payment_reference);

        if (!$paid) {
            return response()->json(['message' => 'Paiement non confirmé.'], 422);
        }

        // ── Options abonnement Pro ────────────────────────────────────────
        if ($listing->paid_via_subscription) {
            $this->confirmSubscriptionOptions($listing, $request, $listing->payment_reference);
            return response()->json(['message' => 'Options confirmées.', 'listing' => $listing->fresh()]);
        }
        // ─────────────────────────────────────────────────────────────────

        if ($listing->payment_status === 'paid') {
            // Cas boost-only : annonce publiée via crédit, boost en attente de paiement
            if (!$listing->is_boosted) {
                $listing->update(['is_boosted' => true]);
                return response()->json(['message' => 'Boost confirmé.', 'listing' => $listing->fresh()]);
            }
            return response()->json(['message' => 'Déjà payé.', 'listing' => $listing]);
        }

        $this->confirmPayment($listing);

        return response()->json(['message' => 'Paiement confirmé.', 'listing' => $listing->fresh()]);
    }

    /**
     * Confirme les options payantes d'un abonnement Pro (iPhone vérifié et/ou boost TOP).
     * Appelé depuis webhook() et verify() quand paid_via_subscription = true.
     */
    private function confirmSubscriptionOptions(Listing $listing, Request $request, string $invoiceToken): void
    {
        // Récupérer sub_iphone / sub_boost depuis custom_data (webhook) ou depuis le listing (verify)
        $subIphone = $request->input('customdata.sub_iphone')
            ?? $request->input('custom_data.sub_iphone');
        $subBoost  = $request->input('customdata.sub_boost')
            ?? $request->input('custom_data.sub_boost');

        // Fallback : déduire depuis le plan et le montant stockés si on n'a pas les custom_data
        if ($subIphone === null) {
            $subIphone = $listing->plan === 'verified_phone' ? 'true' : 'false';
        }
        if ($subBoost === null) {
            $subBoost = 'false'; // on ne peut pas deviner sans custom_data
        }

        $needsExpertise = ($subIphone === 'true');
        $applyBoost     = ($subBoost === 'true');

        // expires_at = min(subscription.expires_at, now() + 30 jours)
        $sub = $listing->subscription;
        $thirtyDays = now()->addDays(30);
        $expiresAt  = $sub ? $sub->expires_at->min($thirtyDays) : $thirtyDays;

        $listing->update([
            'status'     => $needsExpertise ? 'pending_expertise' : 'published',
            'is_boosted' => $applyBoost,
            'expires_at' => $expiresAt,
        ]);
    }

    private function confirmPayment(Listing $listing, bool $paidViaCredit = false): void
    {
        $newStatus = match ($listing->plan) {
            'basic'           => 'published',
            'verified_phone'  => 'pending_expertise',
            'verified_seller' => 'pending_expertise',
        };

        // Publication gratuite via crédit = 10 jours ; paiement réel = 30 jours
        $durationDays = $paidViaCredit ? 10 : 30;

        $listing->update([
            'payment_status' => 'paid',
            'paid_via_credit' => $paidViaCredit,
            'status'         => $newStatus,
            'expires_at'     => now()->addDays($durationDays),
        ]);

        // ── Commission ambassadeur si code utilisé ──────────────────────
        if ($listing->ambassador_code) {
            $code = AmbassadorCode::where('code', $listing->ambassador_code)
                ->where('is_active', true)
                ->first();
            if ($code) {
                app(AmbassadorService::class)->recordEarning($listing, $code);
            }
        }

        $notif = app(NotificationService::class);

        if ($listing->plan === 'basic') {
            $notif->listingPublished(
                $listing->seller,
                "{$listing->iphone_model} {$listing->capacity}Go",
                $listing->asking_price,
                config('app.frontend_url', 'https://trokly.bj') . "/listings/{$listing->id}"
            );
        } else {
            $notif->listingSubmitted(
                $listing->seller,
                "{$listing->iphone_model} {$listing->capacity}Go",
                $listing->whatsapp_number
            );
        }
    }
}
