<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AmbassadorWallet extends Model
{
    protected $fillable = [
        'user_id', 'balance', 'total_earned', 'total_withdrawn', 'last_withdrawal_at',
    ];

    protected $casts = [
        'last_withdrawal_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(AmbassadorEarning::class);
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(AmbassadorWithdrawal::class);
    }

    /** Peut-il retirer ce mois-ci ? */
    public function canWithdrawThisMonth(): bool
    {
        if (!$this->last_withdrawal_at) return true;
        return $this->last_withdrawal_at->month !== now()->month
            || $this->last_withdrawal_at->year !== now()->year;
    }
}
