<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AmbassadorWithdrawal extends Model
{
    protected $fillable = [
        'user_id', 'ambassador_wallet_id', 'amount',
        'status', 'payment_method', 'payment_details', 'admin_note', 'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(AmbassadorWallet::class, 'ambassador_wallet_id');
    }
}
