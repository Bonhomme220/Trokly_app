<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    protected $fillable = [
        'user_id',
        'available_balance',
        'pending_balance',
    ];

    protected function casts(): array
    {
        return [
            'available_balance' => 'integer',
            'pending_balance' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(Withdrawal::class);
    }

    public function credit(int $amount, string $description, string $referenceId = null): void
    {
        $this->increment('available_balance', $amount);
        $this->transactions()->create([
            'type' => 'credit',
            'amount' => $amount,
            'description' => $description,
            'reference_id' => $referenceId,
        ]);
    }

    public function debit(int $amount, string $description, string $referenceId = null): void
    {
        $this->decrement('available_balance', $amount);
        $this->transactions()->create([
            'type' => 'debit',
            'amount' => $amount,
            'description' => $description,
            'reference_id' => $referenceId,
        ]);
    }

    public function holdPending(int $amount): void
    {
        $this->increment('pending_balance', $amount);
    }

    public function releasePending(int $amount): void
    {
        $this->decrement('pending_balance', $amount);
        $this->increment('available_balance', $amount);
    }
}
