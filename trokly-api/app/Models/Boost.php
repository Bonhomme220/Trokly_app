<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Boost extends Model
{
    protected $fillable = [
        'listing_id',
        'seller_id',
        'days_count',
        'amount_paid',
        'start_date',
        'end_date',
        'status',
        'payment_reference',
    ];

    protected function casts(): array
    {
        return [
            'days_count' => 'integer',
            'amount_paid' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
