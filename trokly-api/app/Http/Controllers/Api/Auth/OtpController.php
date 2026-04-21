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
            'phone_number' => 'required|string|min:8|max:20',
            'type' => 'required|in:registration,login,withdrawal',
        ]);

        $code = $this->otpService->generate(
            $request->phone_number,
            $request->type
        );

        $this->otpService->send($request->phone_number, $code);

        return response()->json([
            'message' => 'Code OTP envoyé avec succès.',
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => 'required|string',
            'code' => 'required|string|size:6',
            'type' => 'required|in:registration,login,withdrawal',
        ]);

        $valid = $this->otpService->verify(
            $request->phone_number,
            $request->code,
            $request->type
        );

        if (!$valid) {
            return response()->json([
                'message' => 'Code OTP invalide ou expiré.',
            ], 422);
        }

        return response()->json([
            'message' => 'Code OTP vérifié.',
            'verified' => true,
        ]);
    }
}
