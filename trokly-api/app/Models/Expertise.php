<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Expertise extends Model
{
    protected $fillable = [
        'listing_id',
        'expert_id',
        'checklist',
        'quality_grade',
        'notes',
        'status',
        'rejection_reason',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'checklist' => 'array',
            'completed_at' => 'datetime',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function expert(): BelongsTo
    {
        return $this->belongsTo(User::class, 'expert_id');
    }

    public function quickSaleDecision(): HasOne
    {
        return $this->hasOne(QuickSaleDecision::class);
    }
}
