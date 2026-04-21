<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expertise;
use App\Models\Listing;
use App\Models\PriceHistory;
use App\Models\QuickSaleDecision;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminExpertiseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expertise::with(['listing.seller:id,full_name,phone_number', 'expert:id,full_name']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function show(Expertise $expertise): JsonResponse
    {
        return response()->json(
            $expertise->load(['listing.photos', 'listing.seller', 'expert'])
        );
    }

    public function queue(): JsonResponse
    {
        $listings = Listing::with(['seller:id,full_name,phone_number', 'photos' => fn($q) => $q->limit(1)])
            ->where('status', 'pending_expertise')
            ->whereDoesntHave('expertise')
            ->orderBy('created_at')
            ->paginate(20);

        return response()->json($listings);
    }

    public function assign(Request $request, Listing $listing): JsonResponse
    {
        $request->validate([
            'expert_id' => 'required|exists:users,id',
        ]);

        if ($listing->expertise) {
            return response()->json(['message' => 'Une expertise est déjà en cours.'], 422);
        }

        $expertise = Expertise::create([
            'listing_id' => $listing->id,
            'expert_id' => $request->expert_id,
            'checklist' => [],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Expert assigné.',
            'expertise' => $expertise,
        ], 201);
    }

    public function start(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->expertise && $listing->expertise->expert_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (!$listing->expertise) {
            $expertise = Expertise::create([
                'listing_id' => $listing->id,
                'expert_id' => $request->user()->id,
                'checklist' => [],
                'status' => 'pending',
            ]);
        } else {
            $expertise = $listing->expertise;
        }

        return response()->json(['expertise' => $expertise->load('listing.photos')]);
    }

    public function update(Request $request, Expertise $expertise): JsonResponse
    {
        if ($expertise->expert_id !== $request->user()->id && !$request->user()->hasRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $request->validate([
            'checklist' => 'required|array',
            'quality_grade' => 'required|in:A,B,C',
            'notes' => 'nullable|string',
        ]);

        $expertise->update([
            'checklist' => $request->checklist,
            'quality_grade' => $request->quality_grade,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Expertise mise à jour.',
            'expertise' => $expertise,
        ]);
    }

    public function validate(Request $request, Expertise $expertise): JsonResponse
    {
        if (empty($expertise->checklist) || !$expertise->quality_grade) {
            return response()->json(['message' => 'La checklist et la note sont requises avant validation.'], 422);
        }

        $expertise->update([
            'status' => 'validated',
            'completed_at' => now(),
        ]);

        $expertise->listing->update([
            'quality_grade' => $expertise->quality_grade,
            'status' => $expertise->listing->sale_type === 'quick_sale' ? 'pending_expertise' : 'published',
        ]);

        if ($expertise->listing->sale_type === 'marketplace') {
            PriceHistory::create([
                'iphone_model' => $expertise->listing->iphone_model,
                'capacity' => $expertise->listing->capacity,
                'color' => $expertise->listing->color,
                'condition' => $expertise->listing->condition,
                'quality_grade' => $expertise->quality_grade,
                'sale_price' => $expertise->listing->asking_price,
                'transaction_type' => 'marketplace',
                'sale_date' => today(),
            ]);
        }

        return response()->json(['message' => 'Expertise validée. Annonce publiée.']);
    }

    public function reject(Request $request, Expertise $expertise): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);

        $expertise->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
            'completed_at' => now(),
        ]);

        $expertise->listing->update(['status' => 'rejected']);

        return response()->json(['message' => 'Expertise rejetée. Vendeur notifié.']);
    }

    public function quickSaleDecide(Request $request, Listing $listing): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:accept,refuse',
            'offered_price' => 'required_if:action,accept|integer|min:1000',
            'refusal_reason' => 'required_if:action,refuse|string',
        ]);

        if (!$listing->expertise || $listing->expertise->status !== 'validated') {
            return response()->json(['message' => 'Le téléphone doit être expertisé avant cette action.'], 422);
        }

        $decision = QuickSaleDecision::updateOrCreate(
            ['listing_id' => $listing->id],
            [
                'expertise_id' => $listing->expertise->id,
                'admin_id' => $request->user()->id,
                'offered_price' => $request->offered_price ?? 0,
                'status' => $request->action === 'accept' ? 'accepted' : 'refused',
                'refusal_reason' => $request->refusal_reason,
                'decided_at' => now(),
            ]
        );

        if ($request->action === 'accept') {
            $listing->seller->wallet->credit(
                $request->offered_price,
                "Rachat direct - {$listing->iphone_model} {$listing->capacity}Go",
                (string) $listing->id
            );

            $listing->update(['status' => 'sold']);

            return response()->json([
                'message' => "Rachat accepté. {$request->offered_price} FCFA versés au vendeur.",
                'decision' => $decision,
            ]);
        }

        return response()->json([
            'message' => 'Rachat refusé. Vendeur notifié.',
            'decision' => $decision,
        ]);
    }
}
