<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    protected $fillable = [
        'listing_id',
        'buyer_id',
        'seller_id',
        'trade_id',
        'type',
        'total_amount',
        'commission_rate',
        'commission_amount',
        'soulte_amount',
        'payment_method',
        'payment_reference',
        'status',
        'retraction_deadline',
        'escrow_released_at',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'integer',
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'integer',
            'soulte_amount' => 'integer',
            'retraction_deadline' => 'datetime',
            'escrow_released_at' => 'datetime',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function trade(): BelongsTo
    {
        return $this->belongsTo(Trade::class);
    }

    public function delivery(): HasOne
    {
        return $this->hasOne(Delivery::class);
    }

    public function litigation(): HasOne
    {
        return $this->hasOne(Litigation::class);
    }

    public function isRetractionPeriodOver(): bool
    {
        return $this->retraction_deadline && $this->retraction_deadline->isPast();
    }
}
