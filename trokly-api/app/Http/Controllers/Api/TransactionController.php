<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Litigation;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    private const COMMISSION_RATE = 15.00;

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'listing_id' => 'required|exists:listings,id',
            'payment_method' => 'required|in:mtn_momo,moov_money,card',
            'payment_reference' => 'required|string',
        ]);

        $listing = Listing::findOrFail($request->listing_id);

        if ($listing->status !== 'published') {
            return response()->json(['message' => 'Cette annonce n\'est plus disponible.'], 422);
        }

        if ($listing->seller_id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas acheter votre propre annonce.'], 422);
        }

        $commissionAmount = (int) round($listing->asking_price * self::COMMISSION_RATE / 100);

        $transaction = Transaction::create([
            'listing_id' => $listing->id,
            'buyer_id' => $request->user()->id,
            'seller_id' => $listing->seller_id,
            'type' => 'sale',
            'total_amount' => $listing->asking_price,
            'commission_rate' => self::COMMISSION_RATE,
            'commission_amount' => $commissionAmount,
            'payment_method' => $request->payment_method,
            'payment_reference' => $request->payment_reference,
            'status' => 'in_escrow',
        ]);

        $sellerAmount = $listing->asking_price - $commissionAmount;
        $listing->seller->wallet->holdPending($sellerAmount);

        $listing->update(['status' => 'sold']);

        return response()->json([
            'message' => 'Paiement reçu. Livraison en cours de préparation.',
            'transaction' => $transaction->load('listing:id,iphone_model,capacity'),
        ], 201);
    }

    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        $isParticipant = $transaction->buyer_id === $request->user()->id
            || $transaction->seller_id === $request->user()->id;

        if (!$isParticipant) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        return response()->json(
            $transaction->load(['listing.photos', 'buyer', 'seller', 'delivery', 'litigation'])
        );
    }

    public function retract(Request $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->buyer_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($transaction->status !== 'in_escrow') {
            return response()->json(['message' => 'Cette transaction ne peut pas être rétractée.'], 422);
        }

        if ($transaction->isRetractionPeriodOver()) {
            return response()->json(['message' => 'La période de rétractation est expirée.'], 422);
        }

        $request->validate(['reason' => 'required|string']);

        Litigation::create([
            'transaction_id' => $transaction->id,
            'opened_by' => $request->user()->id,
            'reason' => $request->reason,
            'status' => 'open',
        ]);

        $transaction->update(['status' => 'disputed']);

        return response()->json(['message' => 'Rétractation enregistrée. L\'équipe Trokly va traiter votre demande.']);
    }

    public function myPurchases(Request $request): JsonResponse
    {
        $purchases = Transaction::with(['listing:id,iphone_model,capacity,quality_grade'])
            ->where('buyer_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($purchases);
    }

    public function mySales(Request $request): JsonResponse
    {
        $sales = Transaction::with(['listing:id,iphone_model,capacity,quality_grade'])
            ->where('seller_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($sales);
    }
}
