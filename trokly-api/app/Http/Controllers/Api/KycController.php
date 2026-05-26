<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kyc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KycController extends Controller
{
    public function submit(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->kyc && $user->kyc->status === 'approved') {
            return response()->json(['message' => 'Votre KYC est déjà validé.'], 422);
        }

        $request->validate([
            'document_url' => 'nullable|url',
            'id_card_url'  => 'nullable|url',
            'selfie_url'   => 'nullable|url',
        ]);

        // Accepter document_url ou id_card_url
        $idCardUrl = $request->id_card_url ?? $request->document_url;

        if (!$idCardUrl) {
            return response()->json(['message' => 'Veuillez fournir l\'URL du document.'], 422);
        }

        $kyc = Kyc::updateOrCreate(
            ['user_id' => $user->id],
            [
                'id_card_url' => $idCardUrl,
                'selfie_url'  => $request->selfie_url ?? $idCardUrl,
                'status'      => 'pending',
                'rejection_reason' => null,
            ]
        );

        return response()->json([
            'message' => 'Documents soumis. Vérification en cours.',
            'kyc' => $kyc,
        ], 201);
    }

    public function status(Request $request): JsonResponse
    {
        $kyc = $request->user()->kyc;

        if (!$kyc) {
            return response()->json(['status' => 'not_submitted']);
        }

        return response()->json([
            'status' => $kyc->status,
            'rejection_reason' => $kyc->rejection_reason,
            'verified_at' => $kyc->verified_at,
        ]);
    }
}
