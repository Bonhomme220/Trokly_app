<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradeOffer extends Model
{
    protected $fillable = [
        'trade_id',
        'offered_by',
        'soulte_amount',
        'round_number',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'soulte_amount' => 'integer',
            'round_number' => 'integer',
        ];
    }

    public function trade(): BelongsTo
    {
        return $this->belongsTo(Trade::class);
    }

    public function offeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'offered_by');
    }
}
