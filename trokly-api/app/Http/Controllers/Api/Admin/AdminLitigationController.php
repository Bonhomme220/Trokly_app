<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Litigation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLitigationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Litigation::with([
            'transaction.listing:id,iphone_model,capacity',
            'openedBy:id,full_name,phone_number',
        ]);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function show(Litigation $litigation): JsonResponse
    {
        return response()->json(
            $litigation->load(['transaction.buyer', 'transaction.seller', 'transaction.listing', 'openedBy', 'resolvedBy'])
        );
    }

    public function resolve(Request $request, Litigation $litigation): JsonResponse
    {
        $request->validate([
            'resolution' => 'required|string',
            'action' => 'required|in:refund_buyer,release_seller',
        ]);

        $transaction = $litigation->transaction;

        if ($request->action === 'refund_buyer') {
            $transaction->buyer->wallet->credit(
                $transaction->total_amount,
                "Remboursement litige #{$litigation->id}",
                (string) $litigation->id
            );
            $transaction->update(['status' => 'refunded']);
        } else {
            $sellerAmount = $transaction->total_amount - $transaction->commission_amount;
            $transaction->seller->wallet->releasePending($sellerAmount);
            $transaction->update(['status' => 'completed', 'escrow_released_at' => now()]);
        }

        $litigation->update([
            'status' => 'resolved',
            'resolution' => $request->resolution,
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        return response()->json(['message' => 'Litige résolu.']);
    }
}
