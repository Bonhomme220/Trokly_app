<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    public function __construct(private OtpService $otpService) {}

    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'type'  => 'required|in:registration,login,withdrawal',
        ]);

        $code = $this->otpService->generate($request->email, $request->type);
        $this->otpService->send($request->email, $code);

        return response()->json(['message' => 'Code OTP envoyé par email.']);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
            'type'  => 'required|in:registration,login,withdrawal',
        ]);

        $valid = $this->otpService->verify($request->email, $request->code, $request->type, false);

        if (!$valid) {
            return response()->json(['message' => 'Code OTP invalide ou expiré.'], 422);
        }

        return response()->json(['message' => 'Code OTP vérifié.', 'verified' => true]);
    }
}
