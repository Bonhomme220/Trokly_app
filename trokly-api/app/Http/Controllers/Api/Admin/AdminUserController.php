<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('kyc')->role('buyer_seller');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('full_name', 'ilike', "%{$request->search}%")
                  ->orWhere('phone_number', 'like', "%{$request->search}%");
            });
        }

        if ($request->kyc_status) {
            $query->whereHas('kyc', fn($q) => $q->where('status', $request->kyc_status));
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(
            $user->load(['kyc', 'wallet', 'listings'])
        );
    }

    public function toggleActive(User $user): JsonResponse
    {
        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'message' => $user->is_active ? 'Compte activé.' : 'Compte désactivé.',
            'is_active' => $user->is_active,
        ]);
    }

    public function approveKyc(Request $request, User $user): JsonResponse
    {
        if (!$user->kyc) {
            return response()->json(['message' => 'Aucun KYC soumis.'], 404);
        }

        $user->kyc->update([
            'status' => 'approved',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return response()->json(['message' => 'KYC approuvé.']);
    }

    public function rejectKyc(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string',
        ]);

        if (!$user->kyc) {
            return response()->json(['message' => 'Aucun KYC soumis.'], 404);
        }

        $user->kyc->update([
            'status' => 'rejected',
            'verified_by' => $request->user()->id,
            'rejection_reason' => $request->reason,
            'verified_at' => now(),
        ]);

        return response()->json(['message' => 'KYC rejeté.']);
    }
}
