<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuickSaleDecision extends Model
{
    protected $fillable = [
        'listing_id',
        'expertise_id',
        'admin_id',
        'offered_price',
        'status',
        'refusal_reason',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'offered_price' => 'integer',
            'decided_at' => 'datetime',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function expertise(): BelongsTo
    {
        return $this->belongsTo(Expertise::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
