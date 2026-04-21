<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trade extends Model
{
    protected $fillable = [
        'listing_id',
        'initiator_id',
        'initiator_iphone_model',
        'initiator_capacity',
        'initiator_color',
        'initiator_condition',
        'initiator_imei',
        'initiator_asking_soulte',
        'platform_estimated_value',
        'ai_suggested_soulte',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'initiator_asking_soulte' => 'integer',
            'platform_estimated_value' => 'integer',
            'ai_suggested_soulte' => 'integer',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiator_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(TradePhoto::class)->orderBy('order');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(TradeOffer::class)->orderBy('round_number');
    }

    public function latestOffer()
    {
        return $this->hasOne(TradeOffer::class)->latestOfCreation();
    }

    public function currentRound(): int
    {
        return $this->offers()->max('round_number') ?? 0;
    }

    public function hasReachedMaxRounds(): bool
    {
        return $this->currentRound() >= 3;
    }
}
