<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AmbassadorCode;
use App\Models\AmbassadorWallet;
use App\Models\AmbassadorWithdrawal;
use App\Models\User;
use App\Services\AmbassadorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAmbassadorController extends Controller
{
    public function __construct(private AmbassadorService $service) {}

    /** GET /api/admin/ambassadors — liste des ambassadeurs */
    public function index(): JsonResponse
    {
        $ambassadors = AmbassadorCode::with(['user:id,full_name,email', 'earnings'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($code) {
                $wallet = AmbassadorWallet::where('user_id', $code->user_id)->first();
                return [
                    'id'                 => $code->id,
                    'user'               => $code->user,
                    'code'               => $code->code,
                    'discount_percent'   => $code->discount_percent,
                    'commission_percent' => $code->commission_percent,
                    'uses_count'         => $code->uses_count,
                    'is_active'          => $code->is_active,
                    'total_commissions'  => $code->earnings->sum('commission_amount'),
                    'wallet_balance'     => $wallet?->balance ?? 0,
                    'created_at'         => $code->created_at,
                ];
            });

        return response()->json(['data' => $ambassadors]);
    }

    /** POST /api/admin/ambassadors — créer un code pour un user */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id'          => 'required|exists:users,id',
            'discount_percent' => 'required|integer|min:1|max:50',
            'commission_percent' => 'sometimes|integer|min:1|max:30',
        ]);

        $user = User::findOrFail($request->user_id);
        $commission = $request->input('commission_percent', 10);

        $code = $this->service->createCode($user, $request->discount_percent, $commission);

        return response()->json([
            'message' => "Code ambassadeur {$code->code} créé pour {$user->full_name}.",
            'code'    => $code,
        ], 201);
    }

    /** PUT /api/admin/ambassadors/{code}/toggle — activer/désactiver */
    public function toggle(AmbassadorCode $code): JsonResponse
    {
        $code->update(['is_active' => !$code->is_active]);

        return response()->json([
            'message'   => $code->is_active ? "Code {$code->code} activé." : "Code {$code->code} désactivé.",
            'is_active' => $code->is_active,
        ]);
    }

    /** GET /api/admin/withdrawals — demandes de retrait */
    public function withdrawals(Request $request): JsonResponse
    {
        $status = $request->query('status', 'pending');

        $withdrawals = AmbassadorWithdrawal::with('user:id,full_name,email')
            ->when($status !== 'all', fn($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $withdrawals]);
    }

    /** POST /api/admin/withdrawals/{withdrawal}/approve */
    public function approveWithdrawal(Request $request, AmbassadorWithdrawal $withdrawal): JsonResponse
    {
        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $request->validate(['note' => 'sometimes|string|max:255']);

        $this->service->approveWithdrawal($withdrawal, $request->input('note', ''));

        return response()->json([
            'message' => "Retrait de {$withdrawal->amount} FCFA approuvé et marqué comme payé.",
        ]);
    }

    /** POST /api/admin/withdrawals/{withdrawal}/reject */
    public function rejectWithdrawal(Request $request, AmbassadorWithdrawal $withdrawal): JsonResponse
    {
        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $request->validate(['note' => 'required|string|max:255']);

        $this->service->rejectWithdrawal($withdrawal, $request->note);

        return response()->json(['message' => "Demande rejetée."]);
    }
}
