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
        $query = Listing::with(['seller:id,full_name,phone_number', 'photos' => fn($q) => $q->limit(1)]);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->sale_type) {
            $query->where('sale_type', $request->sale_type);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('iphone_model', 'ilike', "%{$request->search}%")
                  ->orWhere('imei', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function publish(Listing $listing): JsonResponse
    {
        if ($listing->status !== 'pending_expertise') {
            return response()->json(['message' => 'Statut invalide pour cette action.'], 422);
        }

        $listing->update(['status' => 'published']);

        return response()->json(['message' => 'Annonce publiée.']);
    }

    public function reject(Request $request, Listing $listing): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);

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
