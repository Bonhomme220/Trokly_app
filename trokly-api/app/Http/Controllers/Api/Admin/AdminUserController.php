<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function createStaff(Request $request): JsonResponse
    {
        $request->validate([
            'full_name'    => 'required|string|max:100',
            'phone_number' => 'required|string|unique:users,phone_number',
            'role'         => 'required|in:expert,delivery_agent,admin',
        ]);

        $user = User::create([
            'full_name'      => $request->full_name,
            'phone_number'   => $request->phone_number,
            'phone_verified' => true,
            'is_active'      => true,
        ]);

        Wallet::create(['user_id' => $user->id]);
        $user->assignRole($request->role);

        $userData          = $user->toArray();
        $userData['roles'] = $user->getRoleNames()->values();

        return response()->json([
            'message' => 'Compte staff créé avec succès.',
            'user'    => $userData,
        ], 201);
    }

    public function staff(Request $request): JsonResponse
    {
        $users = User::with('kyc')
            ->whereHas('roles', fn($q) => $q->whereIn('name', ['expert', 'delivery_agent', 'admin', 'super_admin']))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($u) {
                $data          = $u->toArray();
                $data['roles'] = $u->getRoleNames()->values();
                return $data;
            });

        return response()->json(['data' => $users]);
    }

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
