<?php

namespace App\Services;

use App\Models\OtpCode;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpService
{
    public function generate(string $email, string $type): string
    {
        OtpCode::where('email', $email)
            ->where('type', $type)
            ->where('used', false)
            ->delete();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpCode::create([
            'email'      => $email,
            'code'       => $code,
            'type'       => $type,
            'expires_at' => now()->addMinutes(10),
        ]);

        return $code;
    }

    public function verify(string $email, string $code, string $type, bool $consume = true): bool
    {
        $otp = OtpCode::where('email', $email)
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

    public function send(string $email, string $code): void
    {
        $apiKey = config('services.resend.key');

        if (!$apiKey) {
            Log::info("OTP pour {$email}: {$code}");
            return;
        }

        $html = "<!DOCTYPE html>
        <html><body style='font-family:sans-serif;background:#F7F5F0;padding:20px'>
          <div style='max-width:400px;margin:0 auto;background:white;border-radius:16px;overflow:hidden'>
            <div style='background:#0B1A2B;padding:20px;text-align:center'>
              <span style='color:#00D084;font-size:20px;font-weight:900'>Trokly</span>
            </div>
            <div style='padding:32px;text-align:center'>
              <p style='color:#4A5568;margin:0 0 20px'>Votre code de vérification :</p>
              <div style='font-size:40px;font-weight:900;letter-spacing:12px;color:#0B1A2B;font-family:monospace'>
                {$code}
              </div>
              <p style='color:#8A99AA;font-size:13px;margin:20px 0 0'>
                Ce code expire dans 10 minutes.
              </p>
            </div>
          </div>
        </body></html>";

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type'  => 'application/json',
        ])->post('https://api.resend.com/emails', [
            'from'    => 'Trokly <noreply@trokly.bj>',
            'to'      => [$email],
            'subject' => "Votre code Trokly : {$code}",
            'html'    => $html,
        ]);

        if (!$response->successful()) {
            Log::error("Resend OTP failed for {$email}: " . $response->body());
        }
    }
}
