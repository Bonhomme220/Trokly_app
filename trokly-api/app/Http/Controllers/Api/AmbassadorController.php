<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AmbassadorCode;
use App\Models\AmbassadorWallet;
use App\Models\AmbassadorWithdrawal;
use App\Services\AmbassadorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmbassadorController extends Controller
{
    public function __construct(private AmbassadorService $service) {}

    /** GET /api/ambassador/me — dashboard ambassadeur */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $code = AmbassadorCode::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$code) {
            return response()->json(['is_ambassador' => false]);
        }

        $wallet = AmbassadorWallet::firstOrCreate(['user_id' => $user->id]);

        $pendingWithdrawal = AmbassadorWithdrawal::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        return response()->json([
            'is_ambassador'      => true,
            'code'               => $code->code,
            'discount_percent'   => $code->discount_percent,
            'commission_percent' => $code->commission_percent,
            'uses_count'         => $code->uses_count,
            'wallet' => [
                'balance'           => $wallet->balance,
                'total_earned'      => $wallet->total_earned,
                'total_withdrawn'   => $wallet->total_withdrawn,
                'can_withdraw'      => $wallet->canWithdrawThisMonth() && !$pendingWithdrawal,
                'min_withdrawal'    => AmbassadorService::MIN_WITHDRAWAL,
                'pending_withdrawal'=> $pendingWithdrawal,
            ],
        ]);
    }

    /** GET /api/ambassador/earnings — historique des commissions */
    public function earnings(Request $request): JsonResponse
    {
        $user   = $request->user();
        $code   = AmbassadorCode::where('user_id', $user->id)->first();
        $wallet = AmbassadorWallet::where('user_id', $user->id)->first();

        if (!$code || !$wallet) {
            return response()->json(['data' => []]);
        }

        $earnings = $wallet->earnings()
            ->with('listing:id,iphone_model,plan')
            ->latest()
            ->paginate(20);

        return response()->json($earnings);
    }

    /** POST /api/ambassador/withdraw — demander un retrait */
    public function withdraw(Request $request): JsonResponse
    {
        $request->validate([
            'amount'          => 'required|integer|min:' . AmbassadorService::MIN_WITHDRAWAL,
            'payment_method'  => 'required|string|in:mtn,moov,celtis',
            'payment_details' => 'required|string|max:20',
        ]);

        try {
            $withdrawal = $this->service->requestWithdrawal(
                $request->user(),
                $request->amount,
                $request->payment_method,
                $request->payment_details,
            );

            return response()->json([
                'message'    => "Demande de retrait de {$withdrawal->amount} FCFA envoyée.",
                'withdrawal' => $withdrawal,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /** GET /api/ambassador/codes/{code}/check — vérifier un code (public) */
    public function checkCode(Request $request, string $code): JsonResponse
    {
        $result = $this->service->checkCode($code, $request->user());

        if (!$result['valid']) {
            return response()->json(['valid' => false, 'message' => $result['message']], 422);
        }

        return response()->json($result);
    }
}
