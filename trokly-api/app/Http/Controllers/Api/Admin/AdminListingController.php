<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminListingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Listing::with(['seller:id,full_name,email,phone_number', 'photos']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->sale_type) {
            $query->where('sale_type', $request->sale_type);
        }

        if ($request->seller_id) {
            $query->where('seller_id', $request->seller_id);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('iphone_model', 'ilike', "%{$request->search}%")
                  ->orWhere('imei', 'like', "%{$request->search}%");
            });
        }

        $perPage = min((int)($request->per_page ?? 20), 200);
        return response()->json($query->orderBy('created_at', 'desc')->paginate($perPage));
    }

    public function payments(Request $request): JsonResponse
    {
        $perPage = min((int)($request->per_page ?? 50), 200);

        $query = Listing::with(['seller:id,full_name,email,phone_number'])
            ->where('payment_status', 'paid')
            ->orderBy('updated_at', 'desc');

        if ($request->plan) {
            $query->where('plan', $request->plan);
        }

        $listings = $query->paginate($perPage);

        // Mapper au format attendu par le frontend
        $data = $listings->getCollection()->map(fn($l) => [
            'id'                => $l->id,
            'created_at'        => $l->updated_at, // date de paiement ≈ dernière mise à jour
            'status'            => 'completed',
            'amount'            => $this->planAmount($l),
            'plan'              => $l->plan,
            'is_boosted'        => $l->is_boosted,
            'ambassador_code'   => $l->ambassador_code,
            'discount_amount'   => $l->discount_amount ?? 0,
            'paid_via_credit'   => $l->paid_via_credit,
            'payment_reference' => $l->payment_reference,
            'listing'           => [
                'id'           => $l->id,
                'iphone_model' => $l->iphone_model,
                'capacity'     => $l->capacity,
                'status'       => $l->status,
            ],
            'seller' => $l->seller ? [
                'id'        => $l->seller->id,
                'full_name' => $l->seller->full_name,
                'email'     => $l->seller->email,
            ] : null,
        ]);

        return response()->json([
            'data'         => $data,
            'current_page' => $listings->currentPage(),
            'last_page'    => $listings->lastPage(),
            'total'        => $listings->total(),
        ]);
    }

    private function planAmount(Listing $listing): int
    {
        $prices = ['basic' => 499, 'verified_phone' => 1499, 'verified_seller' => 2999];
        $base   = $prices[$listing->plan] ?? 0;
        $boost  = $listing->is_boosted ? 500 : 0;
        return max(0, $base + $boost - ($listing->discount_amount ?? 0));
    }

    public function publish(Listing $listing): JsonResponse
    {
        $allowed = ['pending_expertise', 'under_expertise', 'draft', 'unpublished', 'rejected'];

        if (!in_array($listing->status, $allowed)) {
            return response()->json(['message' => 'Statut invalide pour cette action.'], 422);
        }

        $listing->update([
            'status'         => 'published',
            'payment_status' => 'paid',
            'expires_at'     => $listing->expires_at ?? now()->addDays(30),
        ]);

        return response()->json(['message' => 'Annonce publiée.']);
    }

    public function unpublish(Listing $listing): JsonResponse
    {
        if ($listing->status !== 'published') {
            return response()->json(['message' => 'Seules les annonces publiées peuvent être dépubliées.'], 422);
        }

        $listing->update(['status' => 'unpublished']);

        return response()->json(['message' => 'Annonce dépubliée.']);
    }

    public function reject(Request $request, Listing $listing): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string']);

        $listing->update(['status' => 'rejected']);

        return response()->json(['message' => 'Annonce rejetée.']);
    }

    public function destroy(Listing $listing): JsonResponse
    {
        if ($listing->status === 'sold') {
            return response()->json(['message' => 'Impossible de supprimer une annonce vendue.'], 422);
        }

        $listing->delete();

        return response()->json(['message' => 'Annonce supprimée.']);
    }
}
