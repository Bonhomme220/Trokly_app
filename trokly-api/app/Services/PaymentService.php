<?php

namespace App\Services;

use App\Models\Listing;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
        $amount    = self::totalPrice($listing->plan, $listing->is_boosted);
        $transId   = 'TRK-' . $listing->id . '-' . Str::random(8);
        $callbackUrl = config('app.url') . '/api/payments/webhook';

        $description = match ($listing->plan) {
            'basic'           => 'Annonce simple Trokly',
            'verified_phone'  => 'Annonce vérifiée Trokly',
            'verified_seller' => 'Annonce vendeur vérifié Trokly',
        };

        if ($listing->is_boosted) {
            $description .= ' + TOP annonces';
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.payplus.token'),
            'Content-Type'  => 'application/json',
        ])->post(config('services.payplus.base_url') . '/api/v1.1/Transaction/GetPaymentLink', [
            'apiKey'      => config('services.payplus.api_key'),
            'transId'     => $transId,
            'requestId'   => $transId,
            'amount'      => $amount,
            'currency'    => 'XOF',
            'description' => $description,
            'returnUrl'   => $returnUrl,
            'cancelUrl'   => $cancelUrl,
            'callbackUrl' => $callbackUrl,
            'data'        => ['listing_id' => $listing->id],
        ]);

        if (!$response->successful()) {
            Log::error('PayPlus payment link failed: ' . $response->body());
            throw new \RuntimeException('Impossible d\'initier le paiement.');
        }

        $data = $response->json();

        $listing->update(['payment_reference' => $transId]);

        return [
            'payment_url'   => $data['data']['payment_url'] ?? $data['payment_url'],
            'reference'     => $transId,
            'amount'        => $amount,
        ];
    }

    public function verifyPayment(string $reference): bool
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.payplus.token'),
            'Content-Type'  => 'application/json',
        ])->post(config('services.payplus.base_url') . '/api/v1.1/Transaction/Check', [
            'apiKey'  => config('services.payplus.api_key'),
            'transId' => $reference,
        ]);

        if (!$response->successful()) {
            return false;
        }

        $data = $response->json();
        return ($data['data']['status'] ?? '') === 'COMPLETED';
    }
}
