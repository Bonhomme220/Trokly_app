<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $wallet = $request->user()->wallet;

        return response()->json([
            'wallet' => $wallet,
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $transactions = $request->user()->wallet
            ->transactions()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    public function withdraw(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|integer|min:500',
            'mobile_money_number' => 'required|string',
            'operator' => 'required|in:mtn,moov',
            'otp_code' => 'required|string|size:6',
        ]);

        $wallet = $request->user()->wallet;

        if ($wallet->available_balance < $request->amount) {
            return response()->json([
                'message' => 'Solde insuffisant.',
            ], 422);
        }

        // Vérification OTP retrait
        $otpService = app(\App\Services\OtpService::class);
        $verified = $otpService->verify(
            $request->user()->phone_number,
            $request->otp_code,
            'withdrawal'
        );

        if (!$verified) {
            return response()->json([
                'message' => 'Code OTP invalide ou expiré.',
            ], 422);
        }

        $withdrawal = Withdrawal::create([
            'wallet_id' => $wallet->id,
            'amount' => $request->amount,
            'mobile_money_number' => $request->mobile_money_number,
            'operator' => $request->operator,
            'status' => 'pending',
        ]);

        $wallet->debit(
            $request->amount,
            "Retrait vers {$request->operator} {$request->mobile_money_number}",
            (string) $withdrawal->id
        );

        return response()->json([
            'message' => 'Demande de retrait soumise.',
            'withdrawal' => $withdrawal,
        ], 201);
    }
}
