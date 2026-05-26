<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AmbassadorCode extends Model
{
    protected $fillable = [
        'user_id', 'code', 'discount_percent', 'commission_percent',
        'uses_count', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(AmbassadorEarning::class);
    }

    /** Calcule le prix après réduction */
    public function applyDiscount(int $originalPrice): int
    {
        return (int) round($originalPrice * (1 - $this->discount_percent / 100));
    }

    /** Calcule la commission sur le montant payé */
    public function calculateCommission(int $amountPaid): int
    {
        return (int) round($amountPaid * $this->commission_percent / 100);
    }
}
