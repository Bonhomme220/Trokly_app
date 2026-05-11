<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpertProfile;
use App\Models\Listing;
use App\Models\Trade;
use App\Models\TradeOffer;
use App\Models\TradePhoto;
use App\Services\AiService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TradeController extends Controller
{
    public function __construct(private AiService $aiService) {}
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'listing_id' => 'required|exists:listings,id',
            'initiator_iphone_model' => 'required|string',
            'initiator_capacity' => 'required|in:64,128,256,512,1024',
            'initiator_color' => 'required|string',
            'initiator_condition' => 'required|in:new,like_new,good,fair',
            'initiator_imei' => 'required|string',
            'initiator_asking_soulte' => 'nullable|integer',
            'photos' => 'required|array|min:4',
            'photos.*' => 'url',
        ]);

        $listing = Listing::findOrFail($request->listing_id);

        if (!$listing->accepts_trade || $listing->status !== 'published') {
            return response()->json(['message' => 'Cette annonce n\'accepte pas les trocs.'], 422);
        }

        if ($listing->seller_id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas troquer avec votre propre annonce.'], 422);
        }

        $aiResult = $this->aiService->suggestSoulte(
            initiatorModel: $request->initiator_iphone_model,
            initiatorCondition: $request->initiator_condition,
            initiatorCapacity: (int) $request->initiator_capacity,
            initiatorGrade: 'B',
            targetModel: $listing->iphone_model,
            targetCondition: $listing->condition,
            targetCapacity: (int) $listing->capacity,
            targetGrade: $listing->quality_grade ?? 'B',
        );

        $trade = Trade::create([
            ...$request->only([
                'listing_id', 'initiator_iphone_model', 'initiator_capacity',
                'initiator_color', 'initiator_condition', 'initiator_imei',
                'initiator_asking_soulte',
            ]),
            'initiator_id' => $request->user()->id,
            'platform_estimated_value' => $aiResult['initiator_estimated_value'] ?? null,
            'ai_suggested_soulte' => $aiResult['suggested_soulte'] ?? null,
            'status' => 'estimation_done',
        ]);

        foreach ($request->photos as $index => $url) {
            TradePhoto::create([
                'trade_id' => $trade->id,
                'url' => $url,
                'order' => $index,
            ]);
        }

        $appUrl = config('app.url', 'https://trokly-web.onrender.com');
        app(NotificationService::class)->tradeProposalReceived(
            $listing->seller,
            $request->user()->full_name,
            "{$listing->iphone_model} {$listing->capacity}Go",
            "{$request->initiator_iphone_model} {$request->initiator_capacity}Go",
            "{$appUrl}/trades/{$trade->id}"
        );

        return response()->json([
            'message' => 'Proposition de troc soumise.',
            'trade' => $trade->load('photos'),
            'ai_suggestion' => $aiResult ? [
                'suggested_soulte' => $aiResult['suggested_soulte'],
                'initiator_estimated_value' => $aiResult['initiator_estimated_value'],
                'target_estimated_value' => $aiResult['target_estimated_value'],
                'direction' => $aiResult['direction'],
            ] : null,
        ], 201);
    }

    public function myTrades(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $trades = Trade::with(['listing:id,iphone_model,capacity,condition,asking_price', 'photos'])
            ->where(function ($q) use ($userId) {
                $q->where('initiator_id', $userId)
                  ->orWhereHas('listing', fn($lq) => $lq->where('seller_id', $userId));
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($trades);
    }

    public function show(Trade $trade): JsonResponse
    {
        $this->authorizeTradeAccess($trade, request()->user()->id);

        return response()->json(
            $trade->load(['listing.seller', 'listing.photos', 'initiator', 'photos', 'offers.offeredBy'])
        );
    }

    public function makeOffer(Request $request, Trade $trade): JsonResponse
    {
        $user = $request->user();
        $this->authorizeTradeAccess($trade, $user->id);

        if (!in_array($trade->status, ['estimation_done', 'in_negotiation'])) {
            return response()->json(['message' => 'Le troc n\'est pas en phase de négociation.'], 422);
        }

        if ($trade->hasReachedMaxRounds()) {
            return response()->json(['message' => 'Nombre maximum d\'offres atteint.'], 422);
        }

        $lastOffer = $trade->offers()->latest()->first();
        if ($lastOffer && $lastOffer->offered_by === $user->id && $lastOffer->status === 'pending') {
            return response()->json(['message' => 'Vous avez déjà une offre en attente.'], 422);
        }

        $request->validate([
            'soulte_amount' => 'required|integer',
        ]);

        $currentRound = $trade->currentRound();

        if ($lastOffer) {
            $lastOffer->update(['status' => 'countered']);
        }

        TradeOffer::create([
            'trade_id' => $trade->id,
            'offered_by' => $user->id,
            'soulte_amount' => $request->soulte_amount,
            'round_number' => $currentRound + 1,
            'status' => 'pending',
        ]);

        $trade->update(['status' => 'in_negotiation']);

        // Notifier l'autre partie
        $recipient = $user->id === $trade->initiator_id ? $trade->listing->seller : $trade->initiator;
        $appUrl    = config('app.url', 'https://trokly-web.onrender.com');
        app(NotificationService::class)->tradeOfferReceived(
            $recipient,
            $user->full_name,
            $request->soulte_amount,
            "{$appUrl}/trades/{$trade->id}"
        );

        return response()->json(['message' => 'Offre soumise.']);
    }

    public function acceptOffer(Request $request, Trade $trade, TradeOffer $offer): JsonResponse
    {
        $user = $request->user();
        $this->authorizeTradeAccess($trade, $user->id);

        if ($offer->offered_by === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas accepter votre propre offre.'], 422);
        }

        $offer->update(['status' => 'accepted']);
        $trade->update(['status' => 'agreed']);

        // Notifier les deux parties avec les infos de l'expert partenaire
        $expertProfile = ExpertProfile::where('is_active', true)->inRandomOrder()->first();
        $appUrl        = config('app.url', 'https://trokly-web.onrender.com');
        $tradeUrl      = "{$appUrl}/trades/{$trade->id}";

        $initiator = $trade->initiator;
        $seller    = $trade->listing->seller;
        $notif     = app(NotificationService::class);

        $notif->tradeAgreed($initiator, $seller->full_name, $expertProfile?->partner_name, $expertProfile?->address ?? '', $tradeUrl);
        $notif->tradeAgreed($seller, $initiator->full_name, $expertProfile?->partner_name, $expertProfile?->address ?? '', $tradeUrl);

        return response()->json(['message' => 'Offre acceptée. Amenez votre iPhone chez l\'expert pour expertise.']);
    }

    public function refuseOffer(Request $request, Trade $trade, TradeOffer $offer): JsonResponse
    {
        $user = $request->user();
        $this->authorizeTradeAccess($trade, $user->id);

        if ($offer->offered_by === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas refuser votre propre offre.'], 422);
        }

        $offer->update(['status' => 'refused']);

        if ($trade->hasReachedMaxRounds()) {
            $trade->update(['status' => 'expired']);
            return response()->json(['message' => 'Nombre maximum d\'offres atteint. Troc terminé.']);
        }

        return response()->json(['message' => 'Offre refusée. Vous pouvez faire une contre-offre.']);
    }

    public function withdraw(Request $request, Trade $trade): JsonResponse
    {
        if ($trade->initiator_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (in_array($trade->status, ['completed', 'cancelled'])) {
            return response()->json(['message' => 'Ce troc ne peut plus être annulé.'], 422);
        }

        $trade->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Proposition de troc annulée.']);
    }

    private function authorizeTradeAccess(Trade $trade, int $userId): void
    {
        $isParticipant = $trade->initiator_id === $userId
            || $trade->listing->seller_id === $userId;

        if (!$isParticipant) {
            abort(403, 'Non autorisé.');
        }
    }
}
