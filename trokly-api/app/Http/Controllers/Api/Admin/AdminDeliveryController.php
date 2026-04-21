<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDeliveryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Delivery::with([
            'transaction.listing:id,iphone_model,capacity',
            'agent:id,full_name,phone_number',
        ]);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function assign(Request $request, Transaction $transaction): JsonResponse
    {
        $request->validate([
            'agent_id' => 'required|exists:users,id',
            'pickup_address' => 'required|string',
            'delivery_address' => 'required|string',
            'recipient_name' => 'required|string',
            'recipient_phone' => 'required|string',
            'type' => 'required|in:to_buyer,return,trade_exchange',
        ]);

        $delivery = Delivery::create([
            'transaction_id' => $transaction->id,
            'agent_id' => $request->agent_id,
            'type' => $request->type,
            'pickup_address' => $request->pickup_address,
            'delivery_address' => $request->delivery_address,
            'recipient_name' => $request->recipient_name,
            'recipient_phone' => $request->recipient_phone,
            'status' => 'assigned',
        ]);

        return response()->json([
            'message' => 'Livreur assigné.',
            'delivery' => $delivery,
        ], 201);
    }

    public function updateStatus(Request $request, Delivery $delivery): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:picked_up,in_transit,delivered,failed',
            'proof_url' => 'required_if:status,delivered|nullable|url',
        ]);

        $delivery->update([
            'status' => $request->status,
            'proof_url' => $request->proof_url,
            'delivered_at' => $request->status === 'delivered' ? now() : null,
        ]);

        return response()->json([
            'message' => 'Statut mis à jour.',
            'delivery' => $delivery,
        ]);
    }

    public function myDeliveries(Request $request): JsonResponse
    {
        $deliveries = Delivery::with(['transaction.listing:id,iphone_model,capacity'])
            ->where('agent_id', $request->user()->id)
            ->whereNotIn('status', ['delivered', 'failed'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($deliveries);
    }

    public function confirmPickup(Request $request, Delivery $delivery): JsonResponse
    {
        if ($delivery->agent_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $delivery->update(['status' => 'picked_up']);

        return response()->json(['message' => 'Prise en charge confirmée.']);
    }

    public function confirmDelivery(Request $request, Delivery $delivery): JsonResponse
    {
        if ($delivery->agent_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $request->validate(['proof_url' => 'required|url']);

        $delivery->update([
            'status' => 'delivered',
            'proof_url' => $request->proof_url,
            'delivered_at' => now(),
        ]);

        $transaction = $delivery->transaction;
        $transaction->update([
            'retraction_deadline' => now()->addHours(72),
        ]);

        return response()->json(['message' => 'Livraison confirmée. Période de rétractation démarrée (72h).']);
    }
}
