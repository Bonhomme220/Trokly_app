<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private OtpService $otpService) {}

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => 'required|string|unique:users,phone_number',
            'code' => 'required|string|size:6',
            'full_name' => 'required|string|max:100',
        ]);

        $verified = $this->otpService->verify(
            $request->phone_number,
            $request->code,
            'registration'
        );

        if (!$verified) {
            return response()->json([
                'message' => 'Code OTP invalide ou expiré.',
            ], 422);
        }

        $user = User::create([
            'phone_number' => $request->phone_number,
            'full_name' => $request->full_name,
            'phone_verified' => true,
        ]);

        $user->assignRole('buyer_seller');

        Wallet::create(['user_id' => $user->id]);

        $token = $user->createToken('trokly-app')->plainTextToken;

        $userData = $user->toArray();
        $userData['roles'] = $user->getRoleNames()->values();

        return response()->json([
            'message' => 'Compte créé avec succès.',
            'user' => $userData,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('phone_number', $request->phone_number)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Aucun compte trouvé avec ce numéro.',
            ], 404);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Votre compte est désactivé.',
            ], 403);
        }

        $verified = $this->otpService->verify(
            $request->phone_number,
            $request->code,
            'login'
        );

        if (!$verified) {
            return response()->json([
                'message' => 'Code OTP invalide ou expiré.',
            ], 422);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('trokly-app')->plainTextToken;

        $user->load('kyc', 'wallet');
        $userData = $user->toArray();
        $userData['roles'] = $user->getRoleNames()->values();

        return response()->json([
            'message' => 'Connexion réussie.',
            'user' => $userData,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('kyc', 'wallet');
        $userData = $user->toArray();
        $userData['roles'] = $user->getRoleNames()->values();

        return response()->json([
            'user' => $userData,
        ]);
    }
}
