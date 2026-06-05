<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    const PRICE = 4999;
    const DURATION_DAYS = 30;

    public function __construct(private PaymentService $paymentService) {}

    /** Retourne l'abonnement actif du vendeur */
    public function me(Request $request): JsonResponse
    {
        $sub = $request->user()->activeSubscription();
        return response()->json(['subscription' => $sub]);
    }

    /** Crée une facture PayPlus pour l'abonnement Pro */
    public function initiate(Request $request): JsonResponse
    {
        $user = $request->user();

        $frontUrl    = config('app.frontend_url', 'https://trokly.bj');
        $returnUrl   = "{$frontUrl}/abonnement/success";
        $cancelUrl   = "{$frontUrl}/abonnement";
        $callbackUrl = rtrim(config('app.url'), '/') . '/api/payments/webhook';

        $payload = [
            'commande' => [
                'invoice' => [
                    'items' => [[
                        'name'        => 'Abonnement Pro Trokly',
                        'description' => 'Annonces illimitées + badge Vendeur vérifié — 30 jours',
                        'quantity'    => 1,
                        'unit_price'  => self::PRICE,
                        'total_price' => self::PRICE,
                    ]],
                    'total_amount' => self::PRICE,
                    'devise'       => 'xof',
                    'description'  => 'Trokly — Abonnement Pro 30 jours',
                ],
                'store' => [
                    'name'        => 'Trokly',
                    'website_url' => rtrim($frontUrl, '/'),
                ],
                'actions' => [
                    'cancel_url'   => $cancelUrl,
                    'return_url'   => $returnUrl,
                    'callback_url' => $callbackUrl,
                ],
                'custom_data' => [
                    'type'    => 'subscription',
                    'user_id' => (string) $user->id,
                ],
            ],
        ];

        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Apikey'        => config('services.payplus.api_key'),
            'Authorization' => 'Bearer ' . config('services.payplus.token'),
            'Accept'        => 'application/json',
            'Content-Type'  => 'application/json',
        ])->post('https://app.payplus.africa/pay/v01/redirect/checkout-invoice/create', $payload);

        $data = $response->json();

        if (!$response->successful() || ($data['response_code'] ?? '') !== '00') {
            Log::error('PayPlus subscription initiate failed', ['body' => $data]);
            return response()->json(['message' => 'Impossible d\'initier le paiement.'], 500);
        }

        return response()->json([
            'payment_url' => $data['response_text'],
            'token'       => $data['token'],
            'amount'      => self::PRICE,
        ]);
    }

    /** Vérifie et active l'abonnement (appelé depuis la return URL) */
    public function verify(Request $request): JsonResponse
    {
        $request->validate(['token' => 'required|string']);

        $user = $request->user();
        $token = $request->token;

        // Vérifier auprès de PayPlus
        $paid = $this->paymentService->verifyPayment($token);

        if (!$paid) {
            return response()->json(['message' => 'Paiement non confirmé.'], 422);
        }

        // Éviter les doublons
        if (Subscription::where('payment_reference', $token)->exists()) {
            $sub = Subscription::where('payment_reference', $token)->first();
            return response()->json(['message' => 'Déjà activé.', 'subscription' => $sub]);
        }

        $sub = $this->activateSubscription($user->id, $token);

        return response()->json(['message' => 'Abonnement Pro activé !', 'subscription' => $sub]);
    }

    /** Activation (utilisé aussi par le webhook) */
    public static function activateSubscription(int $userId, string $token): Subscription
    {
        return DB::transaction(function () use ($userId, $token) {
            $now = now();
            $expiresAt = $now->copy()->addDays(self::DURATION_DAYS);

            // Expirer l'ancien abo actif s'il reste du temps (on prolonge plutôt que d'écraser)
            $existing = Subscription::where('user_id', $userId)
                ->where('status', 'active')
                ->where('expires_at', '>', $now)
                ->latest('expires_at')
                ->first();

            if ($existing) {
                // Prolonger de 30 jours à partir de l'expiration actuelle
                $existing->update(['expires_at' => $existing->expires_at->addDays(self::DURATION_DAYS)]);

                // Mettre à jour les annonces liées
                $existing->listings()
                    ->where('status', 'published')
                    ->each(function ($listing) use ($existing) {
                        $maxExpiry = $listing->created_at->copy()->addDays(30);
                        $listing->update([
                            'expires_at' => min($existing->expires_at, $maxExpiry),
                        ]);
                    });

                return $existing->fresh();
            }

            // Nouveau abonnement
            $sub = Subscription::create([
                'user_id'           => $userId,
                'status'            => 'active',
                'started_at'        => $now,
                'expires_at'        => $expiresAt,
                'payment_reference' => $token,
                'amount'            => self::PRICE,
            ]);

            // Réactiver les annonces de l'ancien abo si elles ont < 30 jours
            $lastExpired = Subscription::where('user_id', $userId)
                ->where('status', 'expired')
                ->latest('expires_at')
                ->first();

            if ($lastExpired) {
                $lastExpired->listings()
                    ->where('status', 'unpublished')
                    ->where('paid_via_subscription', true)
                    ->where('created_at', '>', now()->subDays(30))
                    ->each(function ($listing) use ($sub) {
                        $maxExpiry = $listing->created_at->copy()->addDays(30);
                        $listing->update([
                            'subscription_id' => $sub->id,
                            'status'          => 'published',
                            'expires_at'      => min($sub->expires_at, $maxExpiry),
                        ]);
                    });
            }

            return $sub;
        });
    }
}
