<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\ListingPhoto;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ListingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Listing::with([
            'seller:id,full_name,listing_credits,created_at',
            'photos' => fn($q) => $q->where('type', 'seller')->orderBy('order')->limit(1),
        ])
            ->where('status', 'published')
            ->where('payment_status', 'paid')
            ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));

        if ($request->model)     $query->where('iphone_model', $request->model);
        if ($request->condition) $query->where('condition', $request->condition);
        if ($request->capacity)  $query->where('capacity', $request->capacity);
        if ($request->min_price) $query->where('asking_price', '>=', $request->min_price);
        if ($request->max_price) $query->where('asking_price', '<=', $request->max_price);

        if ($request->plan) $query->where('plan', $request->plan);

        if ($request->boosted) $query->where('is_boosted', true);

        // Top (boostées) en premier, puis vendeur vérifié, puis vérifiées, puis basic
        $query->orderByRaw("is_boosted DESC")
              ->orderByRaw("CASE plan WHEN 'verified_seller' THEN 0 WHEN 'verified_phone' THEN 1 ELSE 2 END")
              ->orderBy('created_at', 'desc');

        return response()->json($query->paginate(20));
    }

    public function show(Listing $listing): JsonResponse
    {
        if ($listing->status !== 'published' || $listing->payment_status !== 'paid') {
            return response()->json(['message' => 'Annonce non disponible.'], 404);
        }

        $listing->increment('views_count');

        $listing->load([
            'seller:id,full_name,listing_credits,created_at',
            'photos',
            'expertise:id,listing_id,expert_id,quality_grade,checklist,notes,status,completed_at',
        ]);

        // Nombre de ventes sur 6 mois pour ce vendeur
        $salesCount = Listing::where('seller_id', $listing->seller_id)
            ->where('status', 'sold')
            ->where('sold_at', '>=', now()->subMonths(6))
            ->count();

        $data = $listing->toArray();
        $data['seller']['sales_last_6_months'] = $salesCount;

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'iphone_model'    => 'required|string|max:100',
            'capacity'        => 'required|in:64,128,256,512,1024',
            'color'           => 'required|string|max:50',
            'condition'       => 'required|in:new,like_new,good,fair',
            'imei'            => 'nullable|string|unique:listings,imei',
            'description'     => 'nullable|string|max:1000',
            'asking_price'    => 'required|integer|min:1000',
            'whatsapp_number' => ['required', 'string', 'max:20', 'regex:/^\+\d{6,15}$/'],
            'plan'            => 'required|in:basic,verified_phone,verified_seller',
            'is_boosted'      => 'boolean',
            'photos'          => 'required|array|min:1',
            'photos.*'        => 'url',
        ]);

        // Pour vendeur vérifié, KYC obligatoire
        if ($request->plan === 'verified_seller') {
            $kyc = $request->user()->kyc;
            if (!$kyc || $kyc->status !== 'approved') {
                return response()->json([
                    'message' => 'Le badge "Vendeur vérifié" nécessite un KYC approuvé. Vérifiez votre identité d\'abord.',
                ], 422);
            }
        }

        $seller = $request->user();

        return DB::transaction(function () use ($request, $seller) {
            // Utiliser un crédit uniquement pour le plan basic (499 FCFA)
            $usedCredit = false;
            if ($seller->listing_credits > 0 && $request->plan === 'basic') {
                $seller->decrement('listing_credits');
                $usedCredit = true;
            }

            $listing = Listing::create([
                'seller_id'       => $seller->id,
                'iphone_model'    => $request->iphone_model,
                'capacity'        => $request->capacity,
                'color'           => $request->color,
                'condition'       => $request->condition,
                'imei'            => $request->imei ?: null,
                'description'     => $request->description,
                'asking_price'    => $request->asking_price,
                'whatsapp_number' => $request->whatsapp_number,
                'plan'            => $request->plan,
                'is_boosted'      => $request->boolean('is_boosted'),
                'sale_type'       => 'marketplace',
                'accepts_trade'   => false,
                'payment_status'  => $usedCredit ? 'paid' : 'pending_payment',
                'paid_via_credit' => $usedCredit,
                'status'          => $usedCredit ? ($request->plan === 'basic' ? 'published' : 'pending_expertise') : 'draft',
                'expires_at'      => $usedCredit ? now()->addDays(30) : null,
                'ambassador_code' => $request->ambassador_code ?: null,
                'discount_amount' => $request->integer('discount_amount', 0),
            ]);

            foreach ($request->photos as $index => $url) {
                ListingPhoto::create([
                    'listing_id' => $listing->id,
                    'url'        => $url,
                    'type'       => 'seller',
                    'order'      => $index,
                ]);
            }

            if ($usedCredit) {
                return response()->json([
                    'message'     => 'Annonce publiée avec votre crédit.',
                    'listing'     => $listing->load('photos'),
                    'used_credit' => true,
                ], 201);
            }

            // Générer le lien de paiement
            $frontUrl  = config('app.frontend_url', 'https://trokly.bj');
            $returnUrl = "{$frontUrl}/listings/payment/success?listing_id={$listing->id}";
            $cancelUrl = "{$frontUrl}/listings/payment/cancel?listing_id={$listing->id}";

            $paymentData = app(PaymentService::class)->createPaymentLink($listing, $returnUrl, $cancelUrl);

            return response()->json([
                'message'     => 'Annonce créée. Procédez au paiement.',
                'listing'     => $listing->load('photos'),
                'payment_url' => $paymentData['payment_url'],
                'amount'      => $paymentData['amount'],
                'used_credit' => false,
            ], 201);
        });
    }

    public function markSold(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($listing->status !== 'published') {
            return response()->json(['message' => 'Seules les annonces publiées peuvent être marquées vendues.'], 422);
        }

        $listing->update(['status' => 'sold', 'sold_at' => now()]);

        return response()->json(['message' => 'Annonce marquée comme vendue.']);
    }

    public function update(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (!in_array($listing->status, ['draft', 'rejected', 'published', 'unpublished'])) {
            return response()->json(['message' => 'Cette annonce ne peut pas être modifiée.'], 422);
        }

        $request->validate([
            'description'     => 'nullable|string|max:1000',
            'asking_price'    => 'sometimes|integer|min:1000',
            'whatsapp_number' => ['sometimes', 'string', 'max:20', 'regex:/^\+\d{6,15}$/'],
        ]);

        $listing->update($request->only(['description', 'asking_price', 'whatsapp_number']));

        return response()->json(['message' => 'Annonce mise à jour.', 'listing' => $listing]);
    }

    public function showMine(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        return response()->json($listing->load(['photos', 'expertise']));
    }

    public function republish(Request $request, Listing $listing): JsonResponse
    {
        if ($listing->seller_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($listing->status !== 'unpublished') {
            return response()->json(['message' => 'Seules les annonces dépubliées peuvent être republiées.'], 422);
        }

        if ($listing->payment_status !== 'paid') {
            return response()->json(['message' => 'Paiement requis pour republier.'], 422);
        }

        $listing->update([
            'status'     => 'published',
            'expires_at' => now()->addDays(30),
        ]);

        return response()->json(['message' => 'Annonce republiée pour 30 jours.', 'listing' => $listing]);
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

    public function sellerProfile(Request $request, int $sellerId): JsonResponse
    {
        $seller = \App\Models\User::findOrFail($sellerId);

        $listings = Listing::with(['photos' => fn($q) => $q->where('type', 'seller')->limit(1)])
            ->where('seller_id', $sellerId)
            ->where('status', 'published')
            ->where('payment_status', 'paid')
            ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderBy('is_boosted', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $salesTotal = Listing::where('seller_id', $sellerId)->where('status', 'sold')->count();
        $sales6m    = Listing::where('seller_id', $sellerId)->where('status', 'sold')
            ->where('sold_at', '>=', now()->subMonths(6))->count();

        $kyc = $seller->kyc;

        return response()->json([
            'seller' => [
                'id'              => $seller->id,
                'full_name'       => $seller->full_name,
                'member_since'    => $seller->created_at,
                'is_kyc_verified' => $kyc && $kyc->status === 'approved',
                'listing_credits' => $seller->listing_credits,
            ],
            'stats' => [
                'active_listings'    => $listings->count(),
                'total_sales'        => $salesTotal,
                'sales_last_6months' => $sales6m,
            ],
            'listings' => $listings,
        ]);
    }
}
