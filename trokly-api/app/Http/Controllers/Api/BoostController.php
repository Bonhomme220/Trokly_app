<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boost;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BoostController extends Controller
{
    private const PRICE_PER_DAY = 1000;

    public function store(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($listing->status !== 'published') {
            return response()->json(['message' => 'Seules les annonces publiées peuvent être boostées.'], 422);
        }

        if ($listing->isBoosted()) {
            return response()->json(['message' => 'Cette annonce est déjà boostée.'], 422);
        }

        $request->validate([
            'days_count' => 'required|integer|min:1|max:30',
            'payment_reference' => 'required|string',
        ]);

        $amountPaid = $request->days_count * self::PRICE_PER_DAY;

        $boost = Boost::create([
            'listing_id' => $listing->id,
            'seller_id' => $request->user()->id,
            'days_count' => $request->days_count,
            'amount_paid' => $amountPaid,
            'start_date' => today(),
            'end_date' => today()->addDays($request->days_count),
            'status' => 'active',
            'payment_reference' => $request->payment_reference,
        ]);

        return response()->json([
            'message' => "Annonce boostée pour {$request->days_count} jour(s).",
            'boost' => $boost,
        ], 201);
    }
}
