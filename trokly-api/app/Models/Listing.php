<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Listing extends Model
{
    protected $fillable = [
        'seller_id',
        'iphone_model',
        'capacity',
        'color',
        'condition',
        'imei',
        'description',
        'asking_price',
        'ai_suggested_price',
        'retail_price',
        'accepts_trade',
        'sale_type',
        'plan',
        'is_boosted',
        'whatsapp_number',
        'expires_at',
        'payment_status',
        'paid_via_credit',
        'payment_reference',
        'sold_at',
        'quality_grade',
        'status',
        'views_count',
        'ambassador_code',
        'discount_amount',
    ];

    protected function casts(): array
    {
        return [
            'accepts_trade'   => 'boolean',
            'is_boosted'      => 'boolean',
            'paid_via_credit' => 'boolean',
            'asking_price'    => 'integer',
            'discount_amount' => 'integer',
            'ai_suggested_price' => 'integer',
            'retail_price'   => 'integer',
            'views_count'    => 'integer',
            'expires_at'     => 'datetime',
            'sold_at'        => 'datetime',
        ];
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ListingPhoto::class)->orderBy('order');
    }

    public function expertise(): HasOne
    {
        return $this->hasOne(Expertise::class);
    }

    public function quickSaleDecision(): HasOne
    {
        return $this->hasOne(QuickSaleDecision::class);
    }

    public function trades(): HasMany
    {
        return $this->hasMany(Trade::class);
    }

    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class);
    }

    public function boost(): HasOne
    {
        return $this->hasOne(Boost::class)->where('status', 'active');
    }

    public function isBoosted(): bool
    {
        return $this->boost()->exists();
    }
}
