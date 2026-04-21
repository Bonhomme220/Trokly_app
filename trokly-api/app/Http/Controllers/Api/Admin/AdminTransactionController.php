<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with([
            'buyer:id,full_name,phone_number',
            'seller:id,full_name,phone_number',
            'listing:id,iphone_model,capacity',
        ]);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json(
            $transaction->load(['buyer', 'seller', 'listing.photos', 'delivery', 'litigation', 'trade'])
        );
    }

    public function release(Request $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->status !== 'in_escrow') {
            return response()->json(['message' => 'Cette transaction ne peut pas être libérée.'], 422);
        }

        $sellerAmount = $transaction->total_amount - $transaction->commission_amount;

        $transaction->seller->wallet->releasePending($sellerAmount);
        $transaction->seller->wallet->credit(
            0,
            "Vente confirmée - {$transaction->listing->iphone_model}",
            (string) $transaction->id
        );

        $transaction->update([
            'status' => 'completed',
            'escrow_released_at' => now(),
        ]);

        $transaction->listing->update(['status' => 'sold']);

        return response()->json(['message' => 'Paiement libéré au vendeur.']);
    }
}
