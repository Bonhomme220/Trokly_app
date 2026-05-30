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

    public function verifyPayment(string $invoiceToken): bool
    {
        $response = Http::withHeaders([
            'Apikey'        => config('services.payplus.api_key'),
            'Authorization' => 'Bearer ' . config('services.payplus.token'),
        ])->post('https://app.payplus.africa/pay/v01/redirect/checkout-invoice/confirm/?invoiceToken=' . $invoiceToken);

        $data = $response->json();

        Log::info('PayPlus verifyPayment', [
            'token'       => $invoiceToken,
            'http_status' => $response->status(),
            'body'        => $data,
        ]);

        if (!$response->successful() || ($data['response_code'] ?? '') !== '00') {
            return false;
        }

        // PayPlus peut retourner "completed", "Completed", "success"…
        return strtolower($data['description'] ?? '') === 'completed';
    }
}
