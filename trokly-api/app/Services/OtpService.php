<?php

namespace App\Services;

use App\Models\OtpCode;
use Illuminate\Support\Facades\Log;

class OtpService
{
    public function generate(string $phoneNumber, string $type): string
    {
        OtpCode::where('phone_number', $phoneNumber)
            ->where('type', $type)
            ->where('used', false)
            ->delete();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpCode::create([
            'phone_number' => $phoneNumber,
            'code' => $code,
            'type' => $type,
            'expires_at' => now()->addMinutes(10),
        ]);

        return $code;
    }

    public function verify(string $phoneNumber, string $code, string $type, bool $consume = true): bool
    {
        $otp = OtpCode::where('phone_number', $phoneNumber)
            ->where('type', $type)
            ->where('used', false)
            ->latest()
            ->first();

        if (!$otp || !$otp->isValid($code)) {
            return false;
        }

        if ($consume) {
            $otp->update(['used' => true]);
        }

        return true;
    }

    public function send(string $phoneNumber, string $code): void
    {
        // En développement, on log le code
        // En production, intégrer Twilio SMS ici
        Log::info("OTP pour {$phoneNumber}: {$code}");
    }
}
