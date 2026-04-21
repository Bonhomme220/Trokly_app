<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.ai.url', 'http://localhost:8001');
    }

    public function suggestPrice(
        string $iphoneModel,
        string $condition,
        int $capacity,
        string $qualityGrade = 'B'
    ): ?array {
        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/predict/price", [
                'iphone_model' => $iphoneModel,
                'condition' => $condition,
                'capacity' => $capacity,
                'quality_grade' => $qualityGrade,
            ]);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::warning("AI price service unavailable: {$e->getMessage()}");
        }

        return null;
    }

    public function suggestSoulte(
        string $initiatorModel,
        string $initiatorCondition,
        int $initiatorCapacity,
        string $initiatorGrade,
        string $targetModel,
        string $targetCondition,
        int $targetCapacity,
        string $targetGrade
    ): ?array {
        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/predict/soulte", [
                'initiator_model' => $initiatorModel,
                'initiator_condition' => $initiatorCondition,
                'initiator_capacity' => $initiatorCapacity,
                'initiator_grade' => $initiatorGrade,
                'target_model' => $targetModel,
                'target_condition' => $targetCondition,
                'target_capacity' => $targetCapacity,
                'target_grade' => $targetGrade,
            ]);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::warning("AI soulte service unavailable: {$e->getMessage()}");
        }

        return null;
    }
}
