<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles;

    protected $fillable = [
        'full_name',
        'phone_number',
        'email',
        'password',
        'phone_verified',
        'email_verified',
        'is_active',
        'last_login_at',
        'listing_credits',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'phone_verified' => 'boolean',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function kyc(): HasOne
    {
        return $this->hasOne(Kyc::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /** Abonnement actif le plus récent */
    public function activeSubscription(): ?Subscription
    {
        return $this->subscriptions()
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->latest('expires_at')
            ->first();
    }

    public function hasActiveSubscription(): bool
    {
        return $this->activeSubscription() !== null;
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class, 'seller_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Transaction::class, 'buyer_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Transaction::class, 'seller_id');
    }

    public function trades(): HasMany
    {
        return $this->hasMany(Trade::class, 'initiator_id');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'agent_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(TroklyNotification::class);
    }
}
