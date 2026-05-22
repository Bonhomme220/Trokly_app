<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\NotificationService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $frontUrl  = config('app.frontend_url', 'https://trokly-web.onrender.com');
        $returnUrl = "{$frontUrl}/listings/payment/success?listing_id={$listing->id}";
        $cancelUrl = "{$frontUrl}/listings/payment/cancel?listing_id={$listing->id}";

        $data = $this->paymentService->createPaymentLink($listing, $returnUrl, $cancelUrl);

        return response()->json($data);
    }

    // Webhook appelé par PayPlus après paiement
    public function webhook(Request $request): JsonResponse
    {
        // PayPlus envoie le token de la facture
        $invoiceToken = $request->input('token');

        if (!$invoiceToken) {
            return response()->json(['message' => 'Missing token.'], 400);
        }

        $listing = Listing::where('payment_reference', $invoiceToken)->first();

        if (!$listing) {
            // Chercher via custom_data listing_id si disponible
            $listingId = $request->input('customdata.listing_id') ?? $request->input('custom_data.listing_id');
            if ($listingId) {
                $listing = Listing::find($listingId);
            }
        }

        if (!$listing) {
            return response()->json(['message' => 'Listing not found.'], 404);
        }

        if ($listing->payment_status === 'paid') {
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

        if ($listing->payment_status === 'paid') {
            return response()->json(['message' => 'Déjà payé.', 'listing' => $listing]);
        }

        if (!$listing->payment_reference) {
            return response()->json(['message' => 'Aucune référence de paiement.'], 422);
        }

        $paid = $this->paymentService->verifyPayment($listing->payment_reference);

        if (!$paid) {
            return response()->json(['message' => 'Paiement non confirmé.'], 422);
        }

        $this->confirmPayment($listing);

        return response()->json(['message' => 'Paiement confirmé.', 'listing' => $listing->fresh()]);
    }

    private function confirmPayment(Listing $listing): void
    {
        $newStatus = match ($listing->plan) {
            'basic'           => 'published',
            'verified_phone'  => 'pending_expertise',
            'verified_seller' => 'pending_expertise',
        };

        $listing->update([
            'payment_status' => 'paid',
            'status'         => $newStatus,
            'expires_at'     => now()->addDays(30),
        ]);

        $notif = app(NotificationService::class);

        if ($listing->plan === 'basic') {
            $notif->listingPublished(
                $listing->seller,
                "{$listing->iphone_model} {$listing->capacity}Go",
                $listing->asking_price,
                config('app.frontend_url', 'https://trokly-web.onrender.com') . "/listings/{$listing->id}"
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
