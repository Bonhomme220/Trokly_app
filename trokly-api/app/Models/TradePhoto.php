<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradePhoto extends Model
{
    protected $fillable = ['trade_id', 'url', 'order'];

    public function trade(): BelongsTo
    {
        return $this->belongsTo(Trade::class);
    }
}
