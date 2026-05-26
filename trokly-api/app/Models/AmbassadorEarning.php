<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AmbassadorEarning extends Model
{
    protected $fillable = [
        'ambassador_code_id', 'ambassador_wallet_id', 'listing_id',
        'plan', 'amount_paid', 'original_price', 'discount_amount', 'commission_amount',
    ];

    public function code(): BelongsTo
    {
        return $this->belongsTo(AmbassadorCode::class, 'ambassador_code_id');
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(AmbassadorWallet::class, 'ambassador_wallet_id');
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }
}
