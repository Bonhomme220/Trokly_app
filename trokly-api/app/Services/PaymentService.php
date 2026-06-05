<?php

namespace App\Services;

use App\Models\Listing;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    const PRICES = [
        'basic'           => 499,
        'verified_phone'  => 1499,
        'verified_seller' => 2999,
    ];

    const BOOST_PRICE = 500;

    public static function totalPrice(string $plan, bool $boosted): int
    {
        return self::PRICES[$plan] + ($boosted ? self::BOOST_PRICE : 0);
    }

    public function createPaymentLink(Listing $listing, string $returnUrl, string $cancelUrl): array
    {
        $baseAmount  = self::totalPrice($listing->plan, $listing->is_boosted);
        $discount    = (int) ($listing->discount_amount ?? 0);
        $amount      = max(1, $baseAmount - $discount); // jamais < 1 FCFA
        $callbackUrl = rtrim(config('app.url'), '/') . '/api/payments/webhook';
        $frontUrl    = rtrim(config('app.frontend_url', 'https://trokly.bj'), '/');

        $planLabel = match ($listing->plan) {
            'basic'           => 'Annonce simple',
            'verified_phone'  => 'Annonce vérifiée',
            'verified_seller' => 'Annonce vendeur vérifié',
        };

        $description = $planLabel
            . ($listing->is_boosted ? ' + TOP annonces' : '')
            . ($discount > 0 ? " (code {$listing->ambassador_code})" : '');

        $payload = [
            'commande' => [
                'invoice' => [
                    'items' => [
                        [
                            'name'        => $description,
                            'description' => "{$listing->iphone_model} {$listing->capacity}Go",
                            'quantity'    => 1,
                            'unit_price'  => $amount,
                            'total_price' => $amount,
                        ],
                    ],
                    'total_amount' => $amount,
                    'devise'       => 'xof',
                    'description'  => "Trokly — {$description}",
                ],
                'store' => [
                    'name'        => 'Trokly',
                    'website_url' => $frontUrl,
                ],
                'actions' => [
                    'cancel_url'   => $cancelUrl,
                    'return_url'   => $returnUrl,
                    'callback_url' => $callbackUrl,
                ],
                'custom_data' => [
                    'listing_id' => (string) $listing->id,
                ],
            ],
        ];

        $response = Http::withHeaders([
            'Apikey'        => config('services.payplus.api_key'),
            'Authorization' => 'Bearer ' . config('services.payplus.token'),
            'Accept'        => 'application/json',
            'Content-Type'  => 'application/json',
        ])->post('https://app.payplus.africa/pay/v01/redirect/checkout-invoice/create', $payload);

        $data = $response->json();

        if (!$response->successful() || ($data['response_code'] ?? '') !== '00') {
            Log::error('PayPlus createPaymentLink failed', ['body' => $data]);
            throw new \RuntimeException($data['description'] ?? 'Impossible d\'initier le paiement.');
        }

        $invoiceToken = $data['token'];

        $listing->update(['payment_reference' => $invoiceToken]);

        return [
            'payment_url' => $data['response_text'],
            'token'       => $invoiceToken,
            'amount'      => $amount,
        ];
    }

    /**
     * Crée une facture PayPlus pour les options d'un abonnement Pro.
     * Le plan de base est couvert par l'abonnement ; on facture iPhone vérifié (+1499) et/ou boost (+500).
     */
    public function createSubscriptionOptionsLink(
        Listing $listing,
        int $amount,
        string $returnUrl,
        string $cancelUrl
    ): array {
        $callbackUrl = rtrim(config('app.url'), '/') . '/api/payments/webhook';
        $frontUrl    = rtrim(config('app.frontend_url', 'https://trokly.bj'), '/');

        $parts = [];
        if ($listing->plan === 'verified_phone') $parts[] = 'iPhone vérifié';
        if ($amount === 500 || $amount === 1999)  $parts[] = 'TOP boost';
        $desc = implode(' + ', $parts) ?: 'Options Pro';

        $payload = [
            'commande' => [
                'invoice' => [
                    'items' => [[
                        'name'        => "Trokly Pro — {$desc}",
                        'description' => "{$listing->iphone_model} {$listing->capacity}Go",
                        'quantity'    => 1,
                        'unit_price'  => $amount,
                        'total_price' => $amount,
                    ]],
                    'total_amount' => $amount,
                    'devise'       => 'xof',
                    'description'  => "Trokly Pro — {$desc}",
                ],
                'store'   => ['name' => 'Trokly', 'website_url' => $frontUrl],
                'actions' => [
                    'cancel_url'   => $cancelUrl,
                    'return_url'   => $returnUrl,
                    'callback_url' => $callbackUrl,
                ],
                'custom_data' => [
                    'listing_id'          => (string) $listing->id,
                    'type'                => 'subscription_options',
                    'sub_iphone'          => $listing->plan === 'verified_phone' ? 'true' : 'false',
                    'sub_boost'           => ($amount === 500 || $amount === 1999) ? 'true' : 'false',
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
            Log::error('PayPlus createSubscriptionOptionsLink failed', ['body' => $data]);
            throw new \RuntimeException('Impossible d\'initier le paiement des options.');
        }

        $listing->update(['payment_reference' => $data['token']]);

        return ['payment_url' => $data['response_text'], 'token' => $data['token'], 'amount' => $amount];
    }

    /**
     * Crée une facture PayPlus pour le boost TOP uniquement (500 FCFA).
     * Utilisé quand la publication est couverte par un crédit mais le boost reste payant.
     */
    public function createBoostPaymentLink(Listing $listing, string $returnUrl, string $cancelUrl): array
    {
        $amount      = self::BOOST_PRICE; // 500 FCFA
        $callbackUrl = rtrim(config('app.url'), '/') . '/api/payments/webhook';
        $frontUrl    = rtrim(config('app.frontend_url', 'https://trokly.bj'), '/');

        $payload = [
            'commande' => [
                'invoice' => [
                    'items' => [[
                        'name'        => 'Option TOP — annonce en tête des résultats',
                        'description' => "{$listing->iphone_model} {$listing->capacity}Go",
                        'quantity'    => 1,
                        'unit_price'  => $amount,
                        'total_price' => $amount,
                    ]],
                    'total_amount' => $amount,
                    'devise'       => 'xof',
                    'description'  => 'Trokly — Option TOP boost',
                ],
                'store' => [
                    'name'        => 'Trokly',
                    'website_url' => $frontUrl,
                ],
                'actions' => [
                    'cancel_url'   => $cancelUrl,
                    'return_url'   => $returnUrl,
                    'callback_url' => $callbackUrl,
                ],
                'custom_data' => [
                    'listing_id' => (string) $listing->id,
                    'boost_only' => 'true',
                ],
            ],
        ];

        $response = Http::withHeaders([
            'Apikey'        => config('services.payplus.api_key'),
            'Authorization' => 'Bearer ' . config('services.payplus.token'),
            'Accept'        => 'application/json',
            'Content-Type'  => 'application/json',
        ])->post('https://app.payplus.africa/pay/v01/redirect/checkout-invoice/create', $payload);

        $data = $response->json();

        if (!$response->successful() || ($data['response_code'] ?? '') !== '00') {
            Log::error('PayPlus createBoostPaymentLink failed', ['body' => $data]);
            throw new \RuntimeException($data['description'] ?? 'Impossible d\'initier le paiement du boost.');
        }

        $invoiceToken = $data['token'];

        // On réutilise payment_reference pour stocker le token du boost
        $listing->update(['payment_reference' => $invoiceToken]);

        return [
            'payment_url' => $data['response_text'],
            'token'       => $invoiceToken,
            'amount'      => $amount,
        ];
    }

    public function verifyPayment(string $invoiceToken): bool
    {
        $response = Http::withHeaders([
            'Apikey'        => config('services.payplus.api_key'),
            'Authorization' => 'Bearer ' . config('services.payplus.token'),
        ])->get('https://app.payplus.africa/pay/v01/redirect/checkout-invoice/confirm/?invoiceToken=' . $invoiceToken);

        $data = $response->json();

        Log::info('PayPlus verifyPayment', [
            'token'         => $invoiceToken,
            'http_status'   => $response->status(),
            'response_code' => $data['response_code'] ?? null,
            'description'   => $data['description'] ?? null,
            'body'          => $data,
        ]);

        if (!$response->successful()) {
            Log::warning('PayPlus verifyPayment HTTP error', ['status' => $response->status()]);
            return false;
        }

        // PayPlus retourne le statut dans le champ "status" (et non "description" qui est vide).
        // On accepte aussi "description" en fallback au cas où le format changerait.
        $status = strtolower($data['status'] ?? $data['description'] ?? '');
        return in_array($status, ['completed', 'success']);
    }
}
