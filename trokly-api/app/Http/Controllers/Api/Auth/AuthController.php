<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private OtpService $otpService) {}

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'email'     => 'required|email|unique:users,email',
            'code'      => 'required|string|size:6',
            'full_name' => 'required|string|max:100',
        ]);

        $verified = $this->otpService->verify($request->email, $request->code, 'registration');

        if (!$verified) {
            return response()->json(['message' => 'Code OTP invalide ou expiré.'], 422);
        }

        $user = User::create([
            'email'           => $request->email,
            'full_name'       => $request->full_name,
            'email_verified'  => true,
            'listing_credits' => 1,   // 1 crédit offert à l'inscription
        ]);

        $user->assignRole('buyer_seller');
        Wallet::create(['user_id' => $user->id]);

        $token    = $user->createToken('trokly-app')->plainTextToken;
        $userData = $user->toArray();
        $userData['roles'] = $user->getRoleNames()->values();

        return response()->json([
            'message' => 'Compte créé avec succès.',
            'user'    => $userData,
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Aucun compte trouvé avec cet email.'], 404);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Votre compte est désactivé.'], 403);
        }

        $verified = $this->otpService->verify($request->email, $request->code, 'login');

        if (!$verified) {
            return response()->json(['message' => 'Code OTP invalide ou expiré.'], 422);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('trokly-app')->plainTextToken;

        $user->load('kyc', 'wallet');
        $userData = $user->toArray();
        $userData['roles'] = $user->getRoleNames()->values();

        return response()->json([
            'message' => 'Connexion réussie.',
            'user'    => $userData,
            'token'   => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user     = $request->user()->load('kyc', 'wallet');
        $userData = $user->toArray();
        $userData['roles'] = $user->getRoleNames()->values();

        return response()->json(['user' => $userData]);
    }
}
