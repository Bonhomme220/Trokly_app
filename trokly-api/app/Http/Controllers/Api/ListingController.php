<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpertProfile;
use App\Models\Listing;
use App\Models\ListingPhoto;
use App\Services\AiService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function __construct(private AiService $aiService) {}
    public function index(Request $request): JsonResponse
    {
        $query = Listing::with(['seller:id,full_name', 'photos' => fn($q) => $q->where('type', 'seller')->limit(1)])
            ->where('status', 'published');

        if ($request->model) {
            $query->where('iphone_model', $request->model);
        }

        if ($request->condition) {
            $query->where('condition', $request->condition);
        }

        if ($request->capacity) {
            $query->where('capacity', $request->capacity);
        }

        if ($request->min_price) {
            $query->where('asking_price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('asking_price', '<=', $request->max_price);
        }

        if ($request->accepts_trade) {
            $query->where('accepts_trade', true);
        }

        // Boostés en premier
        $query->orderByRaw("EXISTS(SELECT 1 FROM boosts WHERE boosts.listing_id = listings.id AND boosts.status = 'active') DESC")
              ->orderBy('created_at', 'desc');

        $listings = $query->paginate(20);

        return response()->json($listings);
    }

    public function show(Listing $listing): JsonResponse
    {
        if ($listing->status !== 'published') {
            return response()->json(['message' => 'Annonce non disponible.'], 404);
        }

        $listing->increment('views_count');

        $listing->load([
            'seller:id,full_name',
            'photos',
            'expertise:id,listing_id,quality_grade,checklist,completed_at',
        ]);

        return response()->json($listing);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'iphone_model' => 'required|string|max:100',
            'capacity' => 'required|in:64,128,256,512,1024',
            'color' => 'required|string|max:50',
            'condition' => 'required|in:new,like_new,good,fair',
            'imei' => 'required|string|unique:listings,imei',
            'description' => 'nullable|string|max:1000',
            'asking_price' => 'required|integer|min:1000',
            'retail_price' => 'nullable|integer',
            'accepts_trade' => 'boolean',
            'sale_type' => 'required|in:marketplace,quick_sale',
            'photos' => 'required|array|min:6',
            'photos.*' => 'url',
        ]);

        $aiResult = $this->aiService->suggestPrice(
            $request->iphone_model,
            $request->condition,
            (int) $request->capacity,
        );

        $listing = Listing::create([
            ...$request->only([
                'iphone_model', 'capacity', 'color', 'condition',
                'imei', 'description', 'asking_price', 'retail_price',
                'accepts_trade', 'sale_type',
            ]),
            'seller_id' => $request->user()->id,
            'ai_suggested_price' => $aiResult['suggested_price'] ?? null,
            'retail_price' => $request->retail_price ?? ($aiResult['retail_price'] ?? null),
            'status' => 'pending_expertise',
        ]);

        foreach ($request->photos as $index => $url) {
            ListingPhoto::create([
                'listing_id' => $listing->id,
                'url' => $url,
                'type' => 'seller',
                'order' => $index,
            ]);
        }

        // Notifier le vendeur avec les infos de l'expert partenaire disponible
        $expertProfile = ExpertProfile::where('is_active', true)->inRandomOrder()->first();
        app(NotificationService::class)->listingSubmitted(
            $request->user(),
            "{$listing->iphone_model} {$listing->capacity}Go",
            $expertProfile?->partner_name,
            $expertProfile ? "{$expertProfile->address}, {$expertProfile->city}" : null,
            $expertProfile?->appointment_info
        );

        return response()->json([
            'message' => 'Annonce soumise pour expertise.',
            'listing' => $listing->load('photos'),
            'ai_suggestion' => $aiResult ? [
                'suggested_price' => $aiResult['suggested_price'],
                'price_range' => $aiResult['price_range'],
            ] : null,
        ], 201);
    }

    public function update(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (!in_array($listing->status, ['draft', 'rejected'])) {
            return response()->json(['message' => 'Cette annonce ne peut pas être modifiée.'], 422);
        }

        $request->validate([
            'description' => 'nullable|string|max:1000',
            'asking_price' => 'sometimes|integer|min:1000',
            'accepts_trade' => 'sometimes|boolean',
        ]);

        $listing->update($request->only(['description', 'asking_price', 'accepts_trade']));

        return response()->json([
            'message' => 'Annonce mise à jour.',
            'listing' => $listing,
        ]);
    }

    public function destroy(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($listing->status === 'sold') {
            return response()->json(['message' => 'Impossible de supprimer une annonce vendue.'], 422);
        }

        $listing->update(['status' => 'unpublished']);

        return response()->json(['message' => 'Annonce dépubliée.']);
    }

    public function myListings(Request $request): JsonResponse
    {
        $listings = Listing::with(['photos' => fn($q) => $q->limit(1)])
            ->where('seller_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($listings);
    }
}
